-- 1. Lock down SECURITY DEFINER helpers so only authenticated users can call them
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.can_view_sidequest(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_view_sidequest(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_view_sidequest(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_sidequest_owner(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_sidequest_owner(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_sidequest_owner(uuid, uuid) TO authenticated;

-- 2. Restrict profiles SELECT to authenticated users only (no anon scraping)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 3. Clear out any legacy base64-encoded avatars stored directly in the column
UPDATE public.profiles
SET avatar_url = NULL
WHERE avatar_url LIKE 'data:%';

-- 4. Scope sidequest_participants SELECT to people who can view the sidequest
DROP POLICY IF EXISTS "View participants" ON public.sidequest_participants;
CREATE POLICY "View participants"
ON public.sidequest_participants
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.can_view_sidequest(sidequest_id, auth.uid())
);

-- 5. Tighten notifications INSERT so the recipient must be related to the sender
DROP POLICY IF EXISTS "Create notifications" ON public.notifications;
CREATE POLICY "Create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = from_user_id
  AND (
    -- Self-notifications are allowed (e.g. system-style local triggers)
    user_id = auth.uid()
    -- Sender and recipient are friends
    OR EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE (f.user_id = auth.uid() AND f.friend_id = notifications.user_id)
         OR (f.friend_id = auth.uid() AND f.user_id = notifications.user_id)
    )
    -- Sender and recipient share a group
    OR EXISTS (
      SELECT 1
      FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
        AND gm2.user_id = notifications.user_id
    )
    -- Recipient is the owner of the referenced group (e.g. join request, invite response)
    OR (
      notifications.group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = notifications.group_id
          AND g.owner_id = notifications.user_id
      )
    )
    -- Recipient is the creator of the referenced sidequest
    OR (
      notifications.entity_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.sidequests s
        WHERE s.id = notifications.entity_id
          AND s.created_by = notifications.user_id
      )
    )
  )
);