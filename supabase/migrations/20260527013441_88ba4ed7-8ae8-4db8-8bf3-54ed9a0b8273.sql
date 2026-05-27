
-- Enable pgcrypto for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- contact_identifiers: hashes of verified identifiers
-- =========================================================
CREATE TABLE public.contact_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('email','phone')),
  hash_sha256 bytea NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, hash_sha256)
);

CREATE INDEX idx_contact_identifiers_user_id ON public.contact_identifiers(user_id);

-- No anon/authenticated SELECT: only service_role (edge function) reads it.
-- Authenticated users can delete their own rows to opt out.
GRANT SELECT, DELETE ON public.contact_identifiers TO authenticated;
GRANT ALL ON public.contact_identifiers TO service_role;

ALTER TABLE public.contact_identifiers ENABLE ROW LEVEL SECURITY;

-- Users can only see/delete their own rows (no peeking at others' hashes)
CREATE POLICY "Users view own contact hashes"
ON public.contact_identifiers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users delete own contact hashes"
ON public.contact_identifiers
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =========================================================
-- contact_discovery_consents: per-user opt-in toggle
-- =========================================================
CREATE TABLE public.contact_discovery_consents (
  user_id uuid PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.contact_discovery_consents TO authenticated;
GRANT ALL ON public.contact_discovery_consents TO service_role;

ALTER TABLE public.contact_discovery_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own consent"
ON public.contact_discovery_consents
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users insert own consent"
ON public.contact_discovery_consents
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own consent"
ON public.contact_discovery_consents
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_contact_discovery_consents_updated_at
BEFORE UPDATE ON public.contact_discovery_consents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- Sync email hash from auth.users into contact_identifiers
-- =========================================================
CREATE OR REPLACE FUNCTION public.sync_email_contact_hash()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_hash bytea;
BEGIN
  v_email := lower(trim(COALESCE(NEW.email, '')));
  IF v_email = '' THEN
    RETURN NEW;
  END IF;

  v_hash := digest(v_email, 'sha256');

  -- Remove any previous email hash rows for this user (handles email change)
  DELETE FROM public.contact_identifiers
  WHERE user_id = NEW.id AND kind = 'email';

  INSERT INTO public.contact_identifiers (user_id, kind, hash_sha256, verified_at)
  VALUES (NEW.id, 'email', v_hash, NEW.email_confirmed_at)
  ON CONFLICT (kind, hash_sha256) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_email_contact_hash ON auth.users;
CREATE TRIGGER trg_sync_email_contact_hash
AFTER INSERT OR UPDATE OF email, email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.sync_email_contact_hash();

-- Backfill existing users
INSERT INTO public.contact_identifiers (user_id, kind, hash_sha256, verified_at)
SELECT
  u.id,
  'email',
  digest(lower(trim(u.email)), 'sha256'),
  u.email_confirmed_at
FROM auth.users u
WHERE u.email IS NOT NULL AND trim(u.email) <> ''
ON CONFLICT (kind, hash_sha256) DO NOTHING;
