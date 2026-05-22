CREATE OR REPLACE FUNCTION public.ensure_current_user_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_claims jsonb := COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
  v_email text := COALESCE(v_claims->>'email', '');
  v_full_name text := COALESCE(
    v_claims #>> '{user_metadata,full_name}',
    v_claims #>> '{user_metadata,name}',
    NULLIF(split_part(v_email, '@', 1), ''),
    'User'
  );
  base_username text;
  candidate text;
  n int := 0;
  profile_row public.profiles;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;

  SELECT * INTO profile_row
  FROM public.profiles
  WHERE user_id = v_user_id;

  IF FOUND THEN
    RETURN profile_row;
  END IF;

  base_username := COALESCE(
    NULLIF(regexp_replace(lower(split_part(v_email, '@', 1)), '[^a-z0-9_]', '', 'g'), ''),
    'user_' || substr(md5(v_user_id::text), 1, 8)
  );
  candidate := base_username;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(candidate)) LOOP
    n := n + 1;
    candidate := base_username || n;
  END LOOP;

  INSERT INTO public.profiles (user_id, display_name, avatar_url, username, onboarded_at, onboarding_step)
  VALUES (
    v_user_id,
    v_full_name,
    COALESCE(v_claims #>> '{user_metadata,avatar_url}', NULL),
    candidate,
    now(),
    NULL
  )
  RETURNING * INTO profile_row;

  RETURN profile_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_current_user_profile() TO authenticated;