ALTER TABLE public.user_reports DROP CONSTRAINT user_reports_target_type_check;
ALTER TABLE public.user_reports ADD CONSTRAINT user_reports_target_type_check CHECK (target_type = ANY (ARRAY['user'::text,'sidequest'::text,'comment'::text,'media'::text]));
ALTER TABLE public.user_reports ADD COLUMN IF NOT EXISTS target_path text;