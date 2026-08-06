-- Storage policies: scope to signed-in users so helper functions are only needed there
DROP POLICY IF EXISTS "View sidequest photos if you can view the quest" ON storage.objects;
CREATE POLICY "View sidequest photos if you can view the quest"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'sidequest-photos' AND public.can_view_sidequest(((storage.foldername(name))[1])::uuid, auth.uid()));

DROP POLICY IF EXISTS "Participants upload sidequest photos" ON storage.objects;
CREATE POLICY "Participants upload sidequest photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'sidequest-photos' AND public.can_view_sidequest(((storage.foldername(name))[1])::uuid, auth.uid()));

DROP POLICY IF EXISTS "Owner updates sidequest photos" ON storage.objects;
CREATE POLICY "Owner updates sidequest photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'sidequest-photos' AND public.is_sidequest_owner(((storage.foldername(name))[1])::uuid, auth.uid()));

DROP POLICY IF EXISTS "Owner deletes sidequest photos" ON storage.objects;
CREATE POLICY "Owner deletes sidequest photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'sidequest-photos' AND public.is_sidequest_owner(((storage.foldername(name))[1])::uuid, auth.uid()));

DROP POLICY IF EXISTS "Owners can list own avatar folder" ON storage.objects;
CREATE POLICY "Owners can list own avatar folder"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger-only functions: not callable through the API at all
REVOKE ALL ON FUNCTION public.auto_flag_on_reports() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_block_created() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_friendship_deleted() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_group_member_removed() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_email_contact_hash() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Helpers used by RLS/app: signed-in users only
REVOKE ALL ON FUNCTION public.can_view_sidequest(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_sidequest(uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.is_blocked(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_blocked(uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.is_sidequest_owner(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_sidequest_owner(uuid, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.user_can_act(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_can_act(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_user_friend_ids(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_friend_ids(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_friend_activity(timestamptz, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_friend_activity(timestamptz, integer) TO authenticated;
REVOKE ALL ON FUNCTION public.ensure_current_user_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_current_user_profile() TO authenticated;
REVOKE ALL ON FUNCTION public.search_profiles(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_profiles(text) TO authenticated;