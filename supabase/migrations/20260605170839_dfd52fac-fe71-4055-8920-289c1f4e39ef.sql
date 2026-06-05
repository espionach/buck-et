CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.sync_email_contact_hash()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_email text;
  v_hash bytea;
BEGIN
  v_email := lower(trim(COALESCE(NEW.email, '')));
  IF v_email = '' THEN
    RETURN NEW;
  END IF;

  v_hash := extensions.digest(v_email, 'sha256');

  DELETE FROM public.contact_identifiers
  WHERE user_id = NEW.id AND kind = 'email';

  INSERT INTO public.contact_identifiers (user_id, kind, hash_sha256, verified_at)
  VALUES (NEW.id, 'email', v_hash, NEW.email_confirmed_at)
  ON CONFLICT (kind, hash_sha256) DO NOTHING;

  RETURN NEW;
END;
$function$;