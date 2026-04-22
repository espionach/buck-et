CREATE OR REPLACE FUNCTION public.handle_friendship_deleted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove pending group invitations in either direction
  DELETE FROM public.group_invitations
  WHERE status = 'pending'
    AND (
      (invited_by = OLD.user_id AND invited_user_id = OLD.friend_id)
      OR
      (invited_by = OLD.friend_id AND invited_user_id = OLD.user_id)
    );

  -- Remove OLD.user_id from friends-only sidequests created by OLD.friend_id
  DELETE FROM public.sidequest_participants sp
  USING public.sidequests s
  WHERE sp.sidequest_id = s.id
    AND sp.user_id = OLD.user_id
    AND s.created_by = OLD.friend_id
    AND s.is_friends_only = true;

  -- Remove OLD.friend_id from friends-only sidequests created by OLD.user_id
  DELETE FROM public.sidequest_participants sp
  USING public.sidequests s
  WHERE sp.sidequest_id = s.id
    AND sp.user_id = OLD.friend_id
    AND s.created_by = OLD.user_id
    AND s.is_friends_only = true;

  -- Remove OLD.user_id from sidequests inside groups owned by OLD.friend_id
  DELETE FROM public.sidequest_participants sp
  USING public.sidequests s, public.groups g
  WHERE sp.sidequest_id = s.id
    AND s.group_id = g.id
    AND sp.user_id = OLD.user_id
    AND g.owner_id = OLD.friend_id;

  -- Remove OLD.friend_id from sidequests inside groups owned by OLD.user_id
  DELETE FROM public.sidequest_participants sp
  USING public.sidequests s, public.groups g
  WHERE sp.sidequest_id = s.id
    AND s.group_id = g.id
    AND sp.user_id = OLD.friend_id
    AND g.owner_id = OLD.user_id;

  -- Remove users from groups owned by the other user
  DELETE FROM public.group_members
  WHERE (group_id IN (SELECT id FROM public.groups WHERE owner_id = OLD.friend_id) AND user_id = OLD.user_id)
     OR (group_id IN (SELECT id FROM public.groups WHERE owner_id = OLD.user_id) AND user_id = OLD.friend_id);

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_friendship_deleted_cleanup ON public.friendships;

CREATE TRIGGER on_friendship_deleted_cleanup
AFTER DELETE ON public.friendships
FOR EACH ROW
EXECUTE FUNCTION public.handle_friendship_deleted();