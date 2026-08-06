-- 1. Profiles: relationship-scoped visibility
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;

CREATE POLICY "Profiles viewable by related users"
ON public.profiles FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.blocked_users bu
    WHERE bu.blocker_id = auth.uid() AND bu.blocked_id = profiles.user_id
  )
  OR (
    NOT public.is_blocked(auth.uid(), user_id)
    AND (
      EXISTS (
        SELECT 1 FROM public.friendships f
        WHERE (f.user_id = auth.uid() AND f.friend_id = profiles.user_id)
           OR (f.friend_id = auth.uid() AND f.user_id = profiles.user_id)
      )
      OR EXISTS (
        SELECT 1 FROM public.friend_requests fr
        WHERE (fr.from_user_id = auth.uid() AND fr.to_user_id = profiles.user_id)
           OR (fr.to_user_id = auth.uid() AND fr.from_user_id = profiles.user_id)
      )
      OR EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.user_id = profiles.user_id
          AND public.is_group_member(gm.group_id, auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.groups g
        JOIN public.group_members gm2 ON gm2.group_id = g.id
        WHERE g.owner_id = profiles.user_id AND gm2.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.sidequest_participants sp
        WHERE sp.user_id = profiles.user_id
          AND public.can_view_sidequest(sp.sidequest_id, auth.uid())
      )
      OR EXISTS (
        SELECT 1 FROM public.sidequests s
        WHERE s.created_by = profiles.user_id
          AND public.can_view_sidequest(s.id, auth.uid())
      )
    )
  )
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'moderator')
);

-- 2. Safe people search (limited columns only)
CREATE OR REPLACE FUNCTION public.search_profiles(_q text)
RETURNS TABLE(user_id uuid, display_name text, username text, avatar_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.username, p.avatar_url
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.user_id <> auth.uid()
    AND NOT public.is_blocked(auth.uid(), p.user_id)
    AND length(coalesce(trim(_q), '')) >= 2
    AND (p.username ILIKE '%' || trim(_q) || '%' OR p.display_name ILIKE '%' || trim(_q) || '%')
  ORDER BY p.username
  LIMIT 25
$$;

REVOKE ALL ON FUNCTION public.search_profiles(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_profiles(text) TO authenticated;

-- 3. sidequest_completions: relationship + visibility aware
DROP POLICY IF EXISTS "View completions" ON public.sidequest_completions;

CREATE POLICY "View completions"
ON public.sidequest_completions FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_sidequest_owner(sidequest_id, auth.uid())
  OR (
    visibility <> 'private'
    AND public.can_view_sidequest(sidequest_id, auth.uid())
    AND NOT public.is_blocked(auth.uid(), user_id)
  )
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'moderator')
);

-- 4. Avatars: stop public enumeration/listing of the bucket
DROP POLICY IF EXISTS "Public can fetch individual avatars" ON storage.objects;

-- 5. Lock down SECURITY DEFINER functions that should not be API-callable
REVOKE ALL ON FUNCTION public.auto_flag_on_reports() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_block_created() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_friendship_deleted() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_group_member_removed() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_email_contact_hash() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

-- Auth-only helpers: no anonymous access
REVOKE ALL ON FUNCTION public.ensure_current_user_profile() FROM anon;
REVOKE ALL ON FUNCTION public.get_friend_activity(timestamptz, integer) FROM anon;
REVOKE ALL ON FUNCTION public.get_user_friend_ids(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.user_can_act(uuid) FROM anon;