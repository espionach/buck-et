
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarded_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS onboarding_step text;

-- Backfill: existing users shouldn't be forced through onboarding
UPDATE public.profiles
SET onboarded_at = COALESCE(onboarded_at, now())
WHERE onboarded_at IS NULL;
