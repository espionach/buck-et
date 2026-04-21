-- 1. Public bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Private bucket for sidequest photos (visible only to friends/group members/owner)
INSERT INTO storage.buckets (id, name, public)
VALUES ('sidequest-photos', 'sidequest-photos', false)
ON CONFLICT (id) DO NOTHING;

-- ============ AVATARS bucket policies ============
-- Public read
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatar (path: {auth.uid()}/...)
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============ SIDEQUEST-PHOTOS bucket policies ============
-- Path convention: {sidequest_id}/{filename}
-- Owner can upload/update/delete; viewers must be allowed to view the parent sidequest.

-- Helper function: can the current user view a given sidequest?
CREATE OR REPLACE FUNCTION public.can_view_sidequest(_sidequest_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sidequests s
    WHERE s.id = _sidequest_id
      AND (
        s.created_by = _user_id
        OR EXISTS (
          SELECT 1 FROM public.sidequest_participants sp
          WHERE sp.sidequest_id = s.id AND sp.user_id = _user_id
        )
        OR (s.group_id IS NOT NULL AND public.is_group_member(s.group_id, _user_id))
        OR EXISTS (
          SELECT 1 FROM public.friendships f
          WHERE (f.user_id = _user_id AND f.friend_id = s.created_by)
             OR (f.friend_id = _user_id AND f.user_id = s.created_by)
        )
      )
  )
$$;

-- Helper function: is the current user the owner of the sidequest?
CREATE OR REPLACE FUNCTION public.is_sidequest_owner(_sidequest_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sidequests s
    WHERE s.id = _sidequest_id AND s.created_by = _user_id
  )
$$;

CREATE POLICY "View sidequest photos if you can view the quest"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'sidequest-photos'
  AND auth.uid() IS NOT NULL
  AND public.can_view_sidequest(
    ((storage.foldername(name))[1])::uuid,
    auth.uid()
  )
);

CREATE POLICY "Owner uploads sidequest photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sidequest-photos'
  AND auth.uid() IS NOT NULL
  AND public.is_sidequest_owner(
    ((storage.foldername(name))[1])::uuid,
    auth.uid()
  )
);

CREATE POLICY "Owner updates sidequest photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'sidequest-photos'
  AND auth.uid() IS NOT NULL
  AND public.is_sidequest_owner(
    ((storage.foldername(name))[1])::uuid,
    auth.uid()
  )
);

CREATE POLICY "Owner deletes sidequest photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sidequest-photos'
  AND auth.uid() IS NOT NULL
  AND public.is_sidequest_owner(
    ((storage.foldername(name))[1])::uuid,
    auth.uid()
  )
);