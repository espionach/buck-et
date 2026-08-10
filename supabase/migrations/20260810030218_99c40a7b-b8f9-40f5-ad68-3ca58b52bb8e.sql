-- 1) Unique friend list name per owner (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS groups_owner_name_unique_idx
  ON public.groups (owner_id, lower(btrim(name)));

-- 2) Max 50 friend lists per owner
CREATE OR REPLACE FUNCTION public.enforce_group_limit_per_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt integer;
BEGIN
  SELECT count(*) INTO cnt FROM public.groups WHERE owner_id = NEW.owner_id;
  IF cnt >= 50 THEN
    RAISE EXCEPTION 'GROUP_LIMIT_REACHED: You have reached the maximum of 50 friend lists.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_group_limit_per_owner_trg ON public.groups;
CREATE TRIGGER enforce_group_limit_per_owner_trg
  BEFORE INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.enforce_group_limit_per_owner();

-- 3) Max 100 members per friend list
CREATE OR REPLACE FUNCTION public.enforce_group_member_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt integer;
BEGIN
  SELECT count(*) INTO cnt FROM public.group_members WHERE group_id = NEW.group_id;
  IF cnt >= 100 THEN
    RAISE EXCEPTION 'GROUP_MEMBER_LIMIT_REACHED: This friend list has reached the maximum of 100 members.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_group_member_limit_trg ON public.group_members;
CREATE TRIGGER enforce_group_member_limit_trg
  BEFORE INSERT ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_group_member_limit();