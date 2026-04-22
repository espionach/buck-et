-- Allow sidequest owners to mark all participants as completed in one shot,
-- so finishing a sidequest snapshots everyone who was joined at that moment.
DROP POLICY IF EXISTS "Mark done" ON public.sidequest_completions;

CREATE POLICY "Mark done"
ON public.sidequest_completions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR public.is_sidequest_owner(sidequest_id, auth.uid())
);

-- Allow sidequest owners to clear all completions when moving a quest
-- back to active, while still letting users delete their own row.
DROP POLICY IF EXISTS "Unmark done" ON public.sidequest_completions;

CREATE POLICY "Unmark done"
ON public.sidequest_completions
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_sidequest_owner(sidequest_id, auth.uid())
);