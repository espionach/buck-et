ALTER TABLE public.sidequest_volunteers
  DROP CONSTRAINT IF EXISTS sidequest_volunteers_sidequest_id_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS sidequest_volunteers_quest_user_role_key
  ON public.sidequest_volunteers (sidequest_id, user_id, role);

CREATE OR REPLACE FUNCTION public.handle_participant_removed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.sidequest_volunteers
  WHERE sidequest_id = OLD.sidequest_id
    AND user_id = OLD.user_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_participant_removed ON public.sidequest_participants;
CREATE TRIGGER on_participant_removed
AFTER DELETE ON public.sidequest_participants
FOR EACH ROW EXECUTE FUNCTION public.handle_participant_removed();