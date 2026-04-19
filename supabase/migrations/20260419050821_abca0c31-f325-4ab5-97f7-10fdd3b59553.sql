-- Helper: check group membership without recursing into group_members policies
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = _user_id
  )
$$;

-- Fix sidequests SELECT policy (sp.sidequest_id = sp.id was wrong)
DROP POLICY IF EXISTS "View accessible sidequests" ON public.sidequests;
CREATE POLICY "View accessible sidequests"
ON public.sidequests
FOR SELECT
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.sidequest_participants sp
    WHERE sp.sidequest_id = sidequests.id AND sp.user_id = auth.uid()
  )
  OR (
    group_id IS NOT NULL
    AND public.is_group_member(group_id, auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE (f.user_id = auth.uid() AND f.friend_id = sidequests.created_by)
       OR (f.friend_id = auth.uid() AND f.user_id = sidequests.created_by)
  )
);

-- Fix groups SELECT policy (gm.group_id = gm.id was wrong)
DROP POLICY IF EXISTS "Groups viewable by members" ON public.groups;
CREATE POLICY "Groups viewable by members"
ON public.groups
FOR SELECT
USING (
  owner_id = auth.uid()
  OR public.is_group_member(id, auth.uid())
);

-- Fix group_members SELECT policy (was recursive)
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
CREATE POLICY "Members can view group members"
ON public.group_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_group_member(group_id, auth.uid())
);