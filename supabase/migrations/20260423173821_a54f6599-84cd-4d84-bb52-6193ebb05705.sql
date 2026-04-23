-- Track which quest reminders have already been sent to avoid duplicates
CREATE TABLE public.quest_reminders_sent (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sidequest_id UUID NOT NULL REFERENCES public.sidequests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('24h', '1h')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (sidequest_id, user_id, kind)
);

CREATE INDEX idx_quest_reminders_sent_lookup
  ON public.quest_reminders_sent (sidequest_id, user_id, kind);

ALTER TABLE public.quest_reminders_sent ENABLE ROW LEVEL SECURITY;

-- Users can see their own reminder log (mostly internal; useful for debugging)
CREATE POLICY "View own reminder log"
  ON public.quest_reminders_sent
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only the service role (edge function) writes to this table; no public insert policy.

-- Enable cron + net for scheduling the reminder scanner
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;