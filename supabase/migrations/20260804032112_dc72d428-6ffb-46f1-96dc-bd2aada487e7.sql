ALTER TABLE public.sidequests ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

ALTER TABLE public.sidequest_completions ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'all_friends';
ALTER TABLE public.sidequest_completions ADD COLUMN IF NOT EXISTS celebration_seen_at timestamptz;

ALTER TABLE public.sidequest_completions DROP CONSTRAINT IF EXISTS sidequest_completions_visibility_check;
ALTER TABLE public.sidequest_completions ADD CONSTRAINT sidequest_completions_visibility_check CHECK (visibility IN ('private','all_friends'));

DROP POLICY IF EXISTS "Users can update their own completion" ON public.sidequest_completions;
CREATE POLICY "Users can update their own completion"
ON public.sidequest_completions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());