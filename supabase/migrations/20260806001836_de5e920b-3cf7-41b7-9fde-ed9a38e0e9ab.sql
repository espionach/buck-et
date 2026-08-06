CREATE OR REPLACE FUNCTION public.handle_group_member_removed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove sign-up roles for ongoing sidequests in this friend list
  DELETE FROM public.sidequest_volunteers sv
  USING public.sidequests s
  WHERE sv.sidequest_id = s.id
    AND s.group_id = OLD.group_id
    AND sv.user_id = OLD.user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.sidequest_completions sc
      WHERE sc.sidequest_id = s.id AND sc.user_id = s.created_by
    );

  -- Unjoin them from ongoing sidequests in this friend list.
  -- Completed sidequests are kept so their history stays intact.
  DELETE FROM public.sidequest_participants sp
  USING public.sidequests s
  WHERE sp.sidequest_id = s.id
    AND s.group_id = OLD.group_id
    AND sp.user_id = OLD.user_id
    AND s.created_by <> OLD.user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.sidequest_completions sc
      WHERE sc.sidequest_id = s.id AND sc.user_id = s.created_by
    );

  -- Revoke any pending invitation back into this friend list
  DELETE FROM public.group_invitations
  WHERE group_id = OLD.group_id
    AND invited_user_id = OLD.user_id
    AND status = 'pending';

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_group_member_removed ON public.group_members;
CREATE TRIGGER on_group_member_removed
AFTER DELETE ON public.group_members
FOR EACH ROW EXECUTE FUNCTION public.handle_group_member_removed();

-- Refine unfriend cleanup: never remove completed sidequests from history
CREATE OR REPLACE FUNCTION public.handle_friendship_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.friend_requests
  WHERE (from_user_id = OLD.user_id AND to_user_id = OLD.friend_id)
     OR (from_user_id = OLD.friend_id AND to_user_id = OLD.user_id);

  DELETE FROM public.group_invitations
  WHERE status = 'pending'
    AND (
      (invited_by = OLD.user_id AND invited_user_id = OLD.friend_id)
      OR
      (invited_by = OLD.friend_id AND invited_user_id = OLD.user_id)
    );

  -- Friends-only sidequests: only unjoin ongoing ones
  DELETE FROM public.sidequest_participants sp
  USING public.sidequests s
  WHERE sp.sidequest_id = s.id
    AND sp.user_id = OLD.user_id
    AND s.created_by = OLD.friend_id
    AND s.is_friends_only = true
    AND NOT EXISTS (
      SELECT 1 FROM public.sidequest_completions sc
      WHERE sc.sidequest_id = s.id AND sc.user_id = s.created_by
    );

  DELETE FROM public.sidequest_participants sp
  USING public.sidequests s
  WHERE sp.sidequest_id = s.id
    AND sp.user_id = OLD.friend_id
    AND s.created_by = OLD.user_id
    AND s.is_friends_only = true
    AND NOT EXISTS (
      SELECT 1 FROM public.sidequest_completions sc
      WHERE sc.sidequest_id = s.id AND sc.user_id = s.created_by
    );

  -- Friend-list sidequests owned by the other user: only unjoin ongoing ones
  DELETE FROM public.sidequest_participants sp
  USING public.sidequests s, public.groups g
  WHERE sp.sidequest_id = s.id
    AND s.group_id = g.id
    AND sp.user_id = OLD.user_id
    AND g.owner_id = OLD.friend_id
    AND NOT EXISTS (
      SELECT 1 FROM public.sidequest_completions sc
      WHERE sc.sidequest_id = s.id AND sc.user_id = s.created_by
    );

  DELETE FROM public.sidequest_participants sp
  USING public.sidequests s, public.groups g
  WHERE sp.sidequest_id = s.id
    AND s.group_id = g.id
    AND sp.user_id = OLD.friend_id
    AND g.owner_id = OLD.user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.sidequest_completions sc
      WHERE sc.sidequest_id = s.id AND sc.user_id = s.created_by
    );

  DELETE FROM public.group_members
  WHERE (group_id IN (SELECT id FROM public.groups WHERE owner_id = OLD.friend_id) AND user_id = OLD.user_id)
     OR (group_id IN (SELECT id FROM public.groups WHERE owner_id = OLD.user_id) AND user_id = OLD.friend_id);

  RETURN OLD;
END;
$$;