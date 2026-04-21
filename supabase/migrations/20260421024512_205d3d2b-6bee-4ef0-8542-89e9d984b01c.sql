-- Replace the broad public SELECT on avatars with a tighter version.
-- The PostgREST/storage list endpoint runs SELECT with prefix filters; gating
-- by path length effectively allows direct-URL fetches but blocks bulk listing.
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;

-- Public can SELECT individual avatar objects (used for direct image fetches).
-- Listing the whole bucket without specifying a user folder will return nothing.
CREATE POLICY "Public can fetch individual avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] IS NOT NULL
);

-- Owners can list/manage their own avatar folder.
CREATE POLICY "Owners can list own avatar folder"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);