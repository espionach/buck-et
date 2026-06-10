CREATE OR REPLACE FUNCTION public.get_friend_activity(_before timestamp with time zone DEFAULT NULL::timestamp with time zone, _limit integer DEFAULT 10)
 RETURNS TABLE(activity_type text, actor_id uuid, sidequest_id uuid, target_user_id uuid, metadata jsonb, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    -- Show new friendships when AT LEAST ONE party is a (sharing) friend of
    -- the viewer. The other party can be a stranger — we only expose their
    -- name/avatar; the profile page itself still enforces the
    -- mutual-friendship requirement for any deeper data.
    SELECT 'friendship_created'::text,
           CASE WHEN sa.fid IS NOT NULL THEN f.user_id ELSE f.friend_id END AS actor_id,
           NULL::uuid AS sidequest_id,
           CASE WHEN sa.fid IS NOT NULL THEN f.friend_id ELSE f.user_id END AS target_user_id,
           '{}'::jsonb,
           f.created_at
    FROM public.friendships f
    LEFT JOIN sharing_friends sa ON sa.fid = f.user_id
    LEFT JOIN sharing_friends sb ON sb.fid = f.friend_id
    WHERE f.created_at > v_cutoff
      AND f.created_at < v_before
      AND f.user_id < f.friend_id  -- dedupe (each friendship has 2 rows)
      AND (
        sa.fid IS NOT NULL
        OR sb.fid IS NOT NULL
        OR f.user_id = v_viewer
        OR f.friend_id = v_viewer
      )
      AND NOT public.is_blocked(v_viewer, f.user_id)
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
$function$;