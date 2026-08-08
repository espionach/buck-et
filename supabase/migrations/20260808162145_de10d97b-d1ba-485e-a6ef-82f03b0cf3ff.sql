-- Helper: who may manage media on a sidequest
CREATE OR REPLACE FUNCTION public.can_manage_sidequest_media(_sidequest_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sidequests s
    WHERE s.id = _sidequest_id
      AND (
        -- Active: owner only
        (
          NOT EXISTS (
            SELECT 1 FROM public.sidequest_completions oc
            WHERE oc.sidequest_id = s.id AND oc.user_id = s.created_by
          )
          AND s.created_by = _user_id
        )
        OR
        -- Completed: owner + everyone who had joined
        (
          EXISTS (
            SELECT 1 FROM public.sidequest_completions oc
            WHERE oc.sidequest_id = s.id AND oc.user_id = s.created_by
          )
          AND (
            s.created_by = _user_id
            OR EXISTS (
              SELECT 1 FROM public.sidequest_completions c
              WHERE c.sidequest_id = s.id AND c.user_id = _user_id
            )
            OR EXISTS (
              SELECT 1 FROM public.sidequest_participants sp
              WHERE sp.sidequest_id = s.id AND sp.user_id = _user_id
            )
          )
        )
      )
  )
$$;

REVOKE ALL ON FUNCTION public.can_manage_sidequest_media(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_sidequest_media(uuid, uuid) TO authenticated, service_role;

-- Add photos to a sidequest (bypasses the creator-only UPDATE policy under strict rules)
CREATE OR REPLACE FUNCTION public.add_sidequest_media(_sidequest_id uuid, _paths text[])
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_photos text[];
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  IF NOT public.user_can_act(v_user) THEN
    RAISE EXCEPTION 'Account restricted' USING ERRCODE = '42501';
  END IF;
  IF NOT public.can_manage_sidequest_media(_sidequest_id, v_user) THEN
    RAISE EXCEPTION 'Not allowed to add media to this sidequest' USING ERRCODE = '42501';
  END IF;

  UPDATE public.sidequests
  SET photos = COALESCE(photos, ARRAY[]::text[]) || _paths
  WHERE id = _sidequest_id
  RETURNING photos INTO v_photos;

  INSERT INTO public.sidequest_photo_events (sidequest_id, user_id, photo_url)
  SELECT _sidequest_id, v_user, p FROM unnest(_paths) AS p;

  RETURN v_photos;
END;
$$;

REVOKE ALL ON FUNCTION public.add_sidequest_media(uuid, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_sidequest_media(uuid, text[]) TO authenticated, service_role;

-- Remove a photo from a sidequest
CREATE OR REPLACE FUNCTION public.remove_sidequest_media(_sidequest_id uuid, _path text)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_photos text[];
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  IF NOT public.can_manage_sidequest_media(_sidequest_id, v_user) THEN
    RAISE EXCEPTION 'Not allowed to remove media from this sidequest' USING ERRCODE = '42501';
  END IF;

  UPDATE public.sidequests
  SET photos = ARRAY(
    SELECT p FROM unnest(COALESCE(photos, ARRAY[]::text[])) AS p WHERE p <> _path
  )
  WHERE id = _sidequest_id
  RETURNING photos INTO v_photos;

  DELETE FROM public.sidequest_photo_events
  WHERE sidequest_id = _sidequest_id AND photo_url = _path;

  RETURN v_photos;
END;
$$;

REVOKE ALL ON FUNCTION public.remove_sidequest_media(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.remove_sidequest_media(uuid, text) TO authenticated, service_role;

-- Storage: align file upload/delete rights with the same rule
DROP POLICY IF EXISTS "Participants upload sidequest photos" ON storage.objects;
CREATE POLICY "Media managers upload sidequest photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'sidequest-photos'
  AND public.can_manage_sidequest_media(((storage.foldername(name))[1])::uuid, auth.uid())
);

DROP POLICY IF EXISTS "Owner deletes sidequest photos" ON storage.objects;
CREATE POLICY "Media managers delete sidequest photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'sidequest-photos'
  AND public.can_manage_sidequest_media(((storage.foldername(name))[1])::uuid, auth.uid())
);

DROP POLICY IF EXISTS "Owner updates sidequest photos" ON storage.objects;
CREATE POLICY "Media managers update sidequest photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'sidequest-photos'
  AND public.can_manage_sidequest_media(((storage.foldername(name))[1])::uuid, auth.uid())
);
