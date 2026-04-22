-- Add optional parent reference for threaded replies
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid
    REFERENCES public.comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id
  ON public.comments(parent_comment_id);

-- Allow the sidequest owner to delete any comment on their sidequest,
-- in addition to the comment author deleting their own.
DROP POLICY IF EXISTS "Delete own comments" ON public.comments;

CREATE POLICY "Delete comments"
ON public.comments
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_sidequest_owner(sidequest_id, auth.uid())
);