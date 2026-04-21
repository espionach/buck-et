-- 1) Restrict sidequest_volunteers SELECT to users who can view the related sidequest
DROP POLICY IF EXISTS "View volunteers" ON public.sidequest_volunteers;

CREATE POLICY "View volunteers"
ON public.sidequest_volunteers
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.can_view_sidequest(sidequest_id, auth.uid())
);

-- 2) Tighten profiles SELECT to enforce mutual invisibility on blocks
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;

CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR NOT public.is_blocked(auth.uid(), user_id)
);