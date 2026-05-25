
CREATE TABLE public.quest_nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sidequest_id uuid NOT NULL,
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_quest_nudges_recent
  ON public.quest_nudges (sidequest_id, to_user_id, created_at DESC);

ALTER TABLE public.quest_nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner sends nudge"
  ON public.quest_nudges
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = from_user_id
    AND public.is_sidequest_owner(sidequest_id, auth.uid())
    AND NOT public.is_blocked(from_user_id, to_user_id)
    AND public.user_can_act(auth.uid())
  );

CREATE POLICY "View own nudges"
  ON public.quest_nudges
  FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
