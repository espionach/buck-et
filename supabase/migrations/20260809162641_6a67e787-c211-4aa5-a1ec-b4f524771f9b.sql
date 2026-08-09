CREATE OR REPLACE FUNCTION public.can_delete_sidequest_media(_sidequest_id uuid, _user_id uuid, _path text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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
        -- Completed: owner, admins, or the uploader of this specific item
        (
          EXISTS (
            SELECT 1 FROM public.sidequest_completions oc
            WHERE oc.sidequest_id = s.id AND oc.user_id = s.created_by
          )
          AND (
            s.created_by = _user_id
            OR public.has_role(_user_id, 'admin')
            OR EXISTS (
              SELECT 1 FROM public.sidequest_photo_events pe
              WHERE pe.sidequest_id = s.id
                AND pe.photo_url = _path
                AND pe.user_id = _user_id
            )
          )
        )
      )
  )
$$;

REVOKE ALL ON FUNCTION public.can_delete_sidequest_media(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_delete_sidequest_media(uuid, uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.remove_sidequest_media(_sidequest_id uuid, _path text)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_photos text[];
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  IF NOT public.can_delete_sidequest_media(_sidequest_id, v_user, _path) THEN
    RAISE EXCEPTION 'Not allowed to remove this media' USING ERRCODE = '42501';
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

DROP POLICY IF EXISTS "Media managers delete sidequest photos" ON storage.objects;
CREATE POLICY "Media managers delete sidequest photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'sidequest-photos'
  AND public.can_delete_sidequest_media(((storage.foldername(name))[1])::uuid, auth.uid(), name)
);
