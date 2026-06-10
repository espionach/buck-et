
-- 1. Profile flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS activity_sharing_enabled boolean NOT NULL DEFAULT true;

-- 2. Photo events log
CREATE TABLE IF NOT EXISTS public.sidequest_photo_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sidequest_id uuid NOT NULL REFERENCES public.sidequests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sidequest_photo_events_sq ON public.sidequest_photo_events(sidequest_id);
CREATE INDEX IF NOT EXISTS idx_sidequest_photo_events_user_created ON public.sidequest_photo_events(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.sidequest_photo_events TO authenticated;
GRANT ALL ON public.sidequest_photo_events TO service_role;

ALTER TABLE public.sidequest_photo_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Log own photo events"
  ON public.sidequest_photo_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "View photo events for visible sidequests"
  ON public.sidequest_photo_events
  FOR SELECT TO authenticated
  USING (public.can_view_sidequest(sidequest_id, auth.uid()));

-- 3. Friend activity RPC
CREATE OR REPLACE FUNCTION public.get_friend_activity(
  _before timestamptz DEFAULT NULL,
  _limit int DEFAULT 10
)
RETURNS TABLE (
  activity_type text,
  actor_id uuid,
  sidequest_id uuid,
  target_user_id uuid,
  metadata jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_viewer uuid := auth.uid();
  v_cutoff timestamptz := now() - INTERVAL '30 days';
  v_before timestamptz := COALESCE(_before, now() + INTERVAL '1 second');
  v_limit int := LEAST(GREATEST(COALESCE(_limit, 10), 1), 50);
  v_sharing_on boolean;
BEGIN
  IF v_viewer IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(activity_sharing_enabled, true) INTO v_sharing_on
  FROM public.profiles WHERE user_id = v_viewer;
  IF v_sharing_on IS DISTINCT FROM true THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH friends AS (
    SELECT unnest(public.get_user_friend_ids(v_viewer)) AS fid
  ),
  sharing_friends AS (
    SELECT f.fid
    FROM friends f
    JOIN public.profiles p ON p.user_id = f.fid
    WHERE COALESCE(p.activity_sharing_enabled, true) = true
      AND NOT public.is_blocked(v_viewer, f.fid)
  ),
  joined AS (
    SELECT 'joined_quest'::text AS activity_type,
           sp.user_id AS actor_id,
           sp.sidequest_id,
           NULL::uuid AS target_user_id,
           jsonb_build_object('quest_title', s.title) AS metadata,
           sp.created_at
    FROM public.sidequest_participants sp
    JOIN sharing_friends sf ON sf.fid = sp.user_id
    JOIN public.sidequests s ON s.id = sp.sidequest_id
    WHERE sp.created_at > v_cutoff
      AND sp.created_at < v_before
      AND s.created_by <> sp.user_id
      AND public.can_view_sidequest(sp.sidequest_id, v_viewer)
  ),
  completed AS (
    SELECT 'completed_quest'::text,
           sc.user_id,
           sc.sidequest_id,
           NULL::uuid,
           jsonb_build_object('quest_title', s.title),
           sc.completed_at
    FROM public.sidequest_completions sc
    JOIN sharing_friends sf ON sf.fid = sc.user_id
    JOIN public.sidequests s ON s.id = sc.sidequest_id
    WHERE sc.completed_at > v_cutoff
      AND sc.completed_at < v_before
      AND public.can_view_sidequest(sc.sidequest_id, v_viewer)
  ),
  commented AS (
    SELECT 'commented_quest'::text,
           c.user_id,
           c.sidequest_id,
           NULL::uuid,
           jsonb_build_object('quest_title', s.title, 'preview', LEFT(c.text, 140)),
           c.created_at
    FROM public.comments c
    JOIN sharing_friends sf ON sf.fid = c.user_id
    JOIN public.sidequests s ON s.id = c.sidequest_id
    WHERE c.created_at > v_cutoff
      AND c.created_at < v_before
      AND public.can_view_sidequest(c.sidequest_id, v_viewer)
  ),
  photos AS (
    SELECT 'added_photo'::text,
           pe.user_id,
           pe.sidequest_id,
           NULL::uuid,
           jsonb_build_object('quest_title', s.title, 'photo_url', pe.photo_url),
           pe.created_at
    FROM public.sidequest_photo_events pe
    JOIN sharing_friends sf ON sf.fid = pe.user_id
    JOIN public.sidequests s ON s.id = pe.sidequest_id
    WHERE pe.created_at > v_cutoff
      AND pe.created_at < v_before
      AND public.can_view_sidequest(pe.sidequest_id, v_viewer)
  ),
  friendships_made AS (
    -- Show new friendships when BOTH parties are friends of the viewer (or one is the viewer).
    SELECT 'friendship_created'::text,
           f.user_id AS actor_id,
           NULL::uuid AS sidequest_id,
           f.friend_id AS target_user_id,
           '{}'::jsonb,
           f.created_at
    FROM public.friendships f
    JOIN sharing_friends sa ON sa.fid = f.user_id
    WHERE f.created_at > v_cutoff
      AND f.created_at < v_before
      AND f.user_id < f.friend_id  -- dedupe (each friendship has 2 rows)
      AND (
        f.friend_id = v_viewer
        OR EXISTS (SELECT 1 FROM sharing_friends sb WHERE sb.fid = f.friend_id)
      )
      AND NOT public.is_blocked(v_viewer, f.friend_id)
  )
  SELECT * FROM joined
  UNION ALL SELECT * FROM completed
  UNION ALL SELECT * FROM commented
  UNION ALL SELECT * FROM photos
  UNION ALL SELECT * FROM friendships_made
  ORDER BY created_at DESC
  LIMIT v_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_friend_activity(timestamptz, int) TO authenticated;
