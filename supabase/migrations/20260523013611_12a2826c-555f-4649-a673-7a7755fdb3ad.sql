
-- Clear out pending group invitations (no longer used)
DELETE FROM public.group_invitations;

-- Tighten groups SELECT: only owner can see their groups
DROP POLICY IF EXISTS "Groups viewable by members or invitees" ON public.groups;
CREATE POLICY "Owner can view own groups"
ON public.groups
FOR SELECT
USING (owner_id = auth.uid());

-- Tighten group_members: only the group owner can manage and view members
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;

CREATE POLICY "Owner can view members"
ON public.group_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id AND g.owner_id = auth.uid()
  )
);
-- "Owner can manage members" ALL policy already exists and covers insert/delete.
