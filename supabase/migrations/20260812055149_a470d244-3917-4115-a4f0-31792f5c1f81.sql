CREATE OR REPLACE FUNCTION public.enforce_nudge_limits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_quest_owner uuid;
  v_hour_count int;
  v_day_count int;
BEGIN
  -- Self-nudges are not allowed
  IF NEW.from_user_id = NEW.to_user_id THEN
    RAISE EXCEPTION 'NUDGE_SELF_NOT_ALLOWED: You cannot nudge yourself.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Look up the quest owner (also confirms the quest exists)
  SELECT s.created_by INTO v_quest_owner
  FROM public.sidequests s
  WHERE s.id = NEW.sidequest_id;

  IF v_quest_owner IS NULL THEN
    RAISE EXCEPTION 'NUDGE_QUEST_NOT_FOUND: This sidequest no longer exists.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- No nudges once the sidequest is completed
  IF EXISTS (
    SELECT 1 FROM public.sidequest_completions sc
    WHERE sc.sidequest_id = NEW.sidequest_id AND sc.user_id = v_quest_owner
  ) THEN
    RAISE EXCEPTION 'NUDGE_QUEST_COMPLETED: This sidequest is completed, so nudges are off.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Recipients must be current participants
  IF NOT EXISTS (
    SELECT 1 FROM public.sidequest_participants sp
    WHERE sp.sidequest_id = NEW.sidequest_id AND sp.user_id = NEW.to_user_id
  ) THEN
    RAISE EXCEPTION 'NUDGE_RECIPIENT_NOT_PARTICIPANT: You can only nudge people who have joined this sidequest.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 1 nudge per participant per 24 hours (per sidequest)
  IF EXISTS (
    SELECT 1 FROM public.quest_nudges n
    WHERE n.sidequest_id = NEW.sidequest_id
      AND n.from_user_id = NEW.from_user_id
      AND n.to_user_id = NEW.to_user_id
      AND n.created_at > now() - INTERVAL '24 hours'
  ) THEN
    RAISE EXCEPTION 'NUDGE_RECIPIENT_THROTTLED: You already nudged this person about this sidequest in the last 24 hours.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 20 nudges per hour total per owner
  SELECT COUNT(*) INTO v_hour_count
  FROM public.quest_nudges n
  WHERE n.from_user_id = NEW.from_user_id
    AND n.created_at > now() - INTERVAL '1 hour';
  IF v_hour_count >= 20 THEN
    RAISE EXCEPTION 'NUDGE_HOURLY_LIMIT_REACHED: You have reached the limit of 20 nudges per hour.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- 50 nudges per 24 hours total per owner
  SELECT COUNT(*) INTO v_day_count
  FROM public.quest_nudges n
  WHERE n.from_user_id = NEW.from_user_id
    AND n.created_at > now() - INTERVAL '24 hours';
  IF v_day_count >= 50 THEN
    RAISE EXCEPTION 'NUDGE_DAILY_LIMIT_REACHED: You have reached the limit of 50 nudges per day.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER enforce_nudge_limits_trg
BEFORE INSERT ON public.quest_nudges
FOR EACH ROW EXECUTE FUNCTION public.enforce_nudge_limits();