-- 1. Group color
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'sky';

-- 2. Username on profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT;

-- Backfill: derive from display_name slug or random
UPDATE public.profiles
SET username = COALESCE(
  NULLIF(regexp_replace(lower(display_name), '[^a-z0-9_]', '', 'g'), ''),
  'user_' || substr(md5(random()::text || user_id::text), 1, 8)
)
WHERE username IS NULL;

-- Ensure uniqueness even after backfill duplicates: append suffix where needed
DO $$
DECLARE
  r RECORD;
  base TEXT;
  candidate TEXT;
  n INT;
BEGIN
  FOR r IN
    SELECT id, username FROM public.profiles
    WHERE username IN (
      SELECT username FROM public.profiles GROUP BY username HAVING count(*) > 1
    )
  LOOP
    base := r.username;
    n := 1;
    LOOP
      candidate := base || n;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate);
      n := n + 1;
    END LOOP;
    UPDATE public.profiles SET username = candidate WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE public.profiles
ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx
ON public.profiles (lower(username));

-- 3. Update handle_new_user to set username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_username TEXT;
  candidate TEXT;
  n INT := 0;
BEGIN
  base_username := COALESCE(
    NULLIF(regexp_replace(lower(split_part(NEW.email, '@', 1)), '[^a-z0-9_]', '', 'g'), ''),
    'user_' || substr(md5(NEW.id::text), 1, 8)
  );
  candidate := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(candidate)) LOOP
    n := n + 1;
    candidate := base_username || n;
  END LOOP;

  INSERT INTO public.profiles (user_id, display_name, avatar_url, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    candidate
  );
  RETURN NEW;
END;
$function$;

-- 4. Group notification mutes (per-user)
CREATE TABLE IF NOT EXISTS public.group_notification_mutes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, group_id)
);

ALTER TABLE public.group_notification_mutes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own group mutes"
ON public.group_notification_mutes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Insert own group mutes"
ON public.group_notification_mutes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Delete own group mutes"
ON public.group_notification_mutes
FOR DELETE
USING (auth.uid() = user_id);