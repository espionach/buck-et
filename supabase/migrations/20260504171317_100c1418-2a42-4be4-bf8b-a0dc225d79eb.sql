
-- strike_history
CREATE TABLE public.strike_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_id uuid,
  admin_id uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_strike_history_user ON public.strike_history(user_id);
ALTER TABLE public.strike_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/mods view strike history"
  ON public.strike_history FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role) OR user_id = auth.uid());

CREATE POLICY "Admins/mods insert strike history"
  ON public.strike_history FOR INSERT TO authenticated
  WITH CHECK (admin_id = auth.uid() AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)));

CREATE POLICY "Admins delete strike history"
  ON public.strike_history FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- appeals
CREATE TABLE public.appeals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_appeals_status ON public.appeals(status);
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own appeals, admins all"
  ON public.appeals FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Users create own appeals"
  ON public.appeals FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins/mods update appeals"
  ON public.appeals FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins delete appeals"
  ON public.appeals FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
