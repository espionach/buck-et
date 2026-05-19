
-- Add coordinate columns to sidequests for location autocomplete
ALTER TABLE public.sidequests
  ADD COLUMN IF NOT EXISTS logistics_latitude numeric,
  ADD COLUMN IF NOT EXISTS logistics_longitude numeric,
  ADD COLUMN IF NOT EXISTS logistics_place_id text;

-- Shared cache for resolved Google Places lookups
CREATE TABLE IF NOT EXISTS public.place_cache (
  place_id text PRIMARY KEY,
  formatted_address text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  raw jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.place_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read place cache"
  ON public.place_cache FOR SELECT
  TO authenticated
  USING (true);
-- Writes are performed by the edge function using the service role key, which bypasses RLS.
