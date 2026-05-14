
CREATE TABLE public.legal_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('terms', 'privacy')),
  version integer NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  effective_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (type, version)
);

ALTER TABLE public.legal_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view legal updates"
  ON public.legal_updates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage legal updates"
  ON public.legal_updates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.user_legal_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('terms', 'privacy')),
  last_seen_version integer NOT NULL,
  seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, type)
);

ALTER TABLE public.user_legal_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own acknowledgements"
  ON public.user_legal_acknowledgements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Insert own acknowledgements"
  ON public.user_legal_acknowledgements FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Update own acknowledgements"
  ON public.user_legal_acknowledgements FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

INSERT INTO public.legal_updates (type, version, title, message, effective_date) VALUES
  ('terms',   1, 'Terms of Service Update', 'We updated our Terms of Service.', '2026-05-11'),
  ('privacy', 1, 'Privacy Policy Update',   'We updated our Privacy Policy.',   '2026-05-06');
