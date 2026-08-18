CREATE TABLE public.quest_drafts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  group_id uuid,
  logistics_date date,
  logistics_time text,
  location_text text,
  location_latitude numeric,
  location_longitude numeric,
  location_place_id text,
  meetup_spot text,
  transportation text,
  carpool_slots text,
  custom_notes text,
  links text[] NOT NULL DEFAULT '{}',
  contribution_roles text[] NOT NULL DEFAULT '{}',
  photo_placeholder_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quest_drafts TO authenticated;
GRANT ALL ON public.quest_drafts TO service_role;

ALTER TABLE public.quest_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drafts" ON public.quest_drafts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own drafts" ON public.quest_drafts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own drafts" ON public.quest_drafts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own drafts" ON public.quest_drafts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX quest_drafts_user_updated_idx ON public.quest_drafts (user_id, updated_at DESC);

CREATE OR REPLACE FUNCTION public.enforce_draft_limit_per_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  draft_count integer;
BEGIN
  SELECT count(*) INTO draft_count FROM public.quest_drafts WHERE user_id = NEW.user_id;
  IF draft_count >= 100 THEN
    RAISE EXCEPTION 'DRAFT_LIMIT_REACHED: a user can have at most 100 drafts';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_draft_limit_per_user() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER enforce_draft_limit_before_insert
  BEFORE INSERT ON public.quest_drafts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_draft_limit_per_user();

CREATE TRIGGER update_quest_drafts_updated_at
  BEFORE UPDATE ON public.quest_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();