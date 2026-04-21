-- =========================================================
-- 1. App roles (admin / moderator / user) — separate table to avoid privilege escalation
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- Users may view their own roles; admins may view all roles
CREATE POLICY "View own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Only admins can insert/update/delete roles (prevents self-promotion)
CREATE POLICY "Admins manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 2. Blocked users
-- =========================================================
CREATE TABLE public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked ON public.blocked_users(blocked_id);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Only the blocker may see / manage their own block rows.
-- The blocked user MUST NOT see they were blocked.
CREATE POLICY "View own blocks"
ON public.blocked_users
FOR SELECT
TO authenticated
USING (blocker_id = auth.uid());

CREATE POLICY "Create own blocks"
ON public.blocked_users
FOR INSERT
TO authenticated
WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Delete own blocks"
ON public.blocked_users
FOR DELETE
TO authenticated
USING (blocker_id = auth.uid());

-- =========================================================
-- 3. is_blocked helper — checks BOTH directions (symmetric block)
-- SECURITY DEFINER so RLS policies on blocked_users don't make this leaky
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_blocked(_user_a UUID, _user_b UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = _user_a AND blocked_id = _user_b)
       OR (blocker_id = _user_b AND blocked_id = _user_a)
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_blocked(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_blocked(UUID, UUID) TO authenticated;

-- =========================================================
-- 4. Trigger: when a block is created, sever friendship, friend requests, and group invitations
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_block_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove friendship in either direction
  DELETE FROM public.friendships
  WHERE (user_id = NEW.blocker_id AND friend_id = NEW.blocked_id)
     OR (user_id = NEW.blocked_id AND friend_id = NEW.blocker_id);

  -- Remove pending friend requests in either direction
  DELETE FROM public.friend_requests
  WHERE (from_user_id = NEW.blocker_id AND to_user_id = NEW.blocked_id)
     OR (from_user_id = NEW.blocked_id AND to_user_id = NEW.blocker_id);

  -- Remove group invitations between the two users (both directions)
  DELETE FROM public.group_invitations
  WHERE (invited_by = NEW.blocker_id AND invited_user_id = NEW.blocked_id)
     OR (invited_by = NEW.blocked_id AND invited_user_id = NEW.blocker_id);

  -- Remove pending transfer requests between the two users
  DELETE FROM public.transfer_requests
  WHERE status = 'pending'
    AND ((from_user_id = NEW.blocker_id AND to_user_id = NEW.blocked_id)
      OR (from_user_id = NEW.blocked_id AND to_user_id = NEW.blocker_id));

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_block_created
AFTER INSERT ON public.blocked_users
FOR EACH ROW
EXECUTE FUNCTION public.handle_block_created();

-- =========================================================
-- 5. User reports
-- =========================================================
CREATE TABLE public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (reporter_id <> reported_user_id),
  CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'other')),
  CHECK (char_length(coalesce(description, '')) <= 1000)
);

CREATE INDEX idx_user_reports_reporter ON public.user_reports(reporter_id);
CREATE INDEX idx_user_reports_reported ON public.user_reports(reported_user_id);
CREATE INDEX idx_user_reports_status ON public.user_reports(status);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Reporters see their own reports; admins/moderators see all
CREATE POLICY "View reports"
ON public.user_reports
FOR SELECT
TO authenticated
USING (
  reporter_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Create reports"
ON public.user_reports
FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

-- Only admins/moderators can update report status
CREATE POLICY "Moderators update reports"
ON public.user_reports
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'moderator')
);

CREATE POLICY "Admins delete reports"
ON public.user_reports
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 6. Update can_view_sidequest to honor blocks
-- =========================================================
CREATE OR REPLACE FUNCTION public.can_view_sidequest(_sidequest_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sidequests s
    WHERE s.id = _sidequest_id
      AND NOT public.is_blocked(_user_id, s.created_by)
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

-- =========================================================
-- 7. Profiles: hide blocked users from each other
-- =========================================================
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR NOT public.is_blocked(auth.uid(), user_id)
);

-- =========================================================
-- 8. Sidequests SELECT: exclude blocked
-- =========================================================
DROP POLICY IF EXISTS "View accessible sidequests" ON public.sidequests;
CREATE POLICY "View accessible sidequests"
ON public.sidequests
FOR SELECT
TO authenticated
USING (
  NOT public.is_blocked(auth.uid(), created_by)
  AND (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.sidequest_participants sp
      WHERE sp.sidequest_id = sidequests.id AND sp.user_id = auth.uid()
    )
    OR (group_id IS NOT NULL AND public.is_group_member(group_id, auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE (f.user_id = auth.uid() AND f.friend_id = sidequests.created_by)
         OR (f.friend_id = auth.uid() AND f.user_id = sidequests.created_by)
    )
  )
);

-- =========================================================
-- 9. Friend requests: prevent sending requests to blocked users
-- =========================================================
DROP POLICY IF EXISTS "Send friend request" ON public.friend_requests;
CREATE POLICY "Send friend request"
ON public.friend_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = from_user_id
  AND NOT public.is_blocked(from_user_id, to_user_id)
);

-- =========================================================
-- 10. Group invitations: prevent inviting blocked users
-- =========================================================
DROP POLICY IF EXISTS "Create invitations" ON public.group_invitations;
CREATE POLICY "Create invitations"
ON public.group_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_invitations.group_id
      AND gm.user_id = auth.uid()
  )
  AND NOT public.is_blocked(auth.uid(), invited_user_id)
);

-- =========================================================
-- 11. Comments: prevent commenting on quests where blocker/owner is blocked
-- =========================================================
DROP POLICY IF EXISTS "View comments" ON public.comments;
CREATE POLICY "View comments"
ON public.comments
FOR SELECT
TO authenticated
USING (
  NOT public.is_blocked(auth.uid(), user_id)
);

-- =========================================================
-- 12. Notifications: block notifications between blocked users
-- =========================================================
DROP POLICY IF EXISTS "Create notifications" ON public.notifications;
CREATE POLICY "Create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = from_user_id
  AND NOT public.is_blocked(from_user_id, user_id)
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE (f.user_id = auth.uid() AND f.friend_id = notifications.user_id)
         OR (f.friend_id = auth.uid() AND f.user_id = notifications.user_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
        AND gm2.user_id = notifications.user_id
    )
    OR (
      notifications.group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = notifications.group_id
          AND g.owner_id = notifications.user_id
      )
    )
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