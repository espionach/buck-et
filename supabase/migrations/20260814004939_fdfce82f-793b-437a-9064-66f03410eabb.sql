CREATE OR REPLACE FUNCTION public.validate_sidequest_links()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  l text;
  cnt int;
BEGIN
  IF NEW.links IS NULL THEN
    RETURN NEW;
  END IF;

  cnt := array_length(NEW.links, 1);
  IF cnt IS NOT NULL AND cnt > 5 THEN
    RAISE EXCEPTION 'LINK_LIMIT_REACHED: a sidequest can have at most 5 links';
  END IF;

  FOREACH l IN ARRAY NEW.links LOOP
    l := btrim(l);
    IF l = '' THEN
      RAISE EXCEPTION 'LINK_INVALID: empty link';
    END IF;
    IF length(l) > 2048 THEN
      RAISE EXCEPTION 'LINK_INVALID: link is too long';
    END IF;
    IF l !~* '^https?://[a-z0-9][a-z0-9._~%-]*\.[a-z]{2,}(:[0-9]{1,5})?(/[^[:space:]]*)?$'
       AND l !~* '^https?://localhost(:[0-9]{1,5})?(/[^[:space:]]*)?$' THEN
      RAISE EXCEPTION 'LINK_INVALID: % is not a valid web address', l;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_sidequest_links_trigger ON public.sidequests;
CREATE TRIGGER validate_sidequest_links_trigger
BEFORE INSERT OR UPDATE OF links ON public.sidequests
FOR EACH ROW EXECUTE FUNCTION public.validate_sidequest_links();

REVOKE ALL ON FUNCTION public.validate_sidequest_links() FROM PUBLIC, anon, authenticated;