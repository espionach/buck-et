-- Track participants removed by the sidequest owner so they cannot rejoin
CREATE TABLE public.sidequest_removed_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sidequest_id UUID NOT NULL REFERENCES public.sidequests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  removed_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sidequest_id, user_id)
);

GRANT SELECT ON public.sidequest_removed_participants TO authenticated;
GRANT ALL ON public.sidequest_removed_participants TO service_role;

ALTER TABLE public.sidequest_removed_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View removals"
  ON public.sidequest_removed_participants
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_sidequest_owner(sidequest_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Record a removal whenever someone other than the participant deletes the
-- participant row (owner or admin removing them). Voluntary self-leaves and
-- cascade deletes from quest deletion do NOT create records.
CREATE OR REPLACE FUNCTION public.record_participant_removal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND auth.uid() <> OLD.user_id
     AND (
       public.is_sidequest_owner(OLD.sidequest_id, auth.uid())
       OR public.has_role(auth.uid(), 'admin')
     )
  THEN
    INSERT INTO public.sidequest_removed_participants (sidequest_id, user_id, removed_by)
    VALUES (OLD.sidequest_id, OLD.user_id, auth.uid())
    ON CONFLICT (sidequest_id, user_id) DO NOTHING;
  END IF;
  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.record_participant_removal() FROM public;
REVOKE ALL ON FUNCTION public.record_participant_removal() FROM anon;
REVOKE ALL ON FUNCTION public.record_participant_removal() FROM authenticated;

CREATE TRIGGER record_participant_removal_trigger
  AFTER DELETE ON public.sidequest_participants
  FOR EACH ROW EXECUTE FUNCTION public.record_participant_removal();

-- Block re-joining a sidequest you were removed from
DROP POLICY "Join sidequest" ON public.sidequest_participants;
CREATE POLICY "Join sidequest"
  ON public.sidequest_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.sidequest_removed_participants r
      WHERE r.sidequest_id = sidequest_participants.sidequest_id
        AND r.user_id = sidequest_participants.user_id
    )
  );