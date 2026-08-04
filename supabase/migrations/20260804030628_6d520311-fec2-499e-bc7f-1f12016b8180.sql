ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dismissed_spotlights text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS spotlights_skipped_all boolean NOT NULL DEFAULT false;