DROP POLICY IF EXISTS "Groups viewable by members" ON public.groups;

CREATE POLICY "Groups viewable by members or invitees"
ON public.groups
FOR SELECT
USING (
  owner_id = auth.uid()
  OR public.is_group_member(id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.group_invitations gi
    WHERE gi.group_id = groups.id
      AND gi.invited_user_id = auth.uid()
      AND gi.status = 'pending'
  )
);