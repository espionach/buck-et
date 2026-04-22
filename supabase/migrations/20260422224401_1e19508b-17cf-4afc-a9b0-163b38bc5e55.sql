-- Function to get the friend user_ids of any user.
-- Caller must be either the user themselves OR a friend of that user.
-- Returns empty array otherwise. Used to display friend count/list on profiles.
CREATE OR REPLACE FUNCTION public.get_user_friend_ids(_user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT CASE WHEN f.user_id = _user_id THEN f.friend_id ELSE f.user_id END
      FROM public.friendships f
      WHERE (f.user_id = _user_id OR f.friend_id = _user_id)
        AND (
          _user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.friendships ff
            WHERE (ff.user_id = auth.uid() AND ff.friend_id = _user_id)
               OR (ff.friend_id = auth.uid() AND ff.user_id = _user_id)
          )
        )
    ),
    ARRAY[]::uuid[]
  );
$$;