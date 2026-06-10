DROP POLICY IF EXISTS "Owner uploads sidequest photos" ON storage.objects;
CREATE POLICY "Participants upload sidequest photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sidequest-photos'
  AND auth.uid() IS NOT NULL
  AND public.can_view_sidequest(((storage.foldername(name))[1])::uuid, auth.uid())
);