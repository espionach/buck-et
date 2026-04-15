
-- Fix group_members SELECT policy (self-referencing bug)
DROP POLICY "Members can view group members" ON public.group_members;
CREATE POLICY "Members can view group members" ON public.group_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm2
      WHERE gm2.group_id = group_members.group_id
        AND gm2.user_id = auth.uid()
    )
  );

-- Fix notifications INSERT policy (unrestricted insert)
DROP POLICY "Create notifications" ON public.notifications;
CREATE POLICY "Create notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id);
