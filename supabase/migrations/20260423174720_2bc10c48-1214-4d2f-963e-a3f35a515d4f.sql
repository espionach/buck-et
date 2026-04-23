ALTER TABLE public.user_reports
  ADD COLUMN IF NOT EXISTS target_type text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS target_id uuid;

-- Backfill target_id for existing rows where target is the reported user
UPDATE public.user_reports
SET target_id = reported_user_id
WHERE target_id IS NULL;

-- Sanity check constraint: target_type must be one of the supported values
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_reports_target_type_check'
  ) THEN
    ALTER TABLE public.user_reports
      ADD CONSTRAINT user_reports_target_type_check
      CHECK (target_type IN ('user', 'sidequest', 'comment'));
  END IF;
END $$;