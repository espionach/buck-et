DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;

CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  -- Blocker can still see the profile of users they've blocked (for the manage list)
  OR EXISTS (
    SELECT 1 FROM public.blocked_users bu
    WHERE bu.blocker_id = auth.uid() AND bu.blocked_id = profiles.user_id
  )
  -- Otherwise, must not be blocked in either direction
  OR NOT public.is_blocked(auth.uid(), user_id)
);