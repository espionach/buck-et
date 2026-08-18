DELETE FROM public.quest_nudges qn
WHERE NOT EXISTS (SELECT 1 FROM public.sidequests s WHERE s.id = qn.sidequest_id);

ALTER TABLE public.quest_nudges
  DROP CONSTRAINT IF EXISTS quest_nudges_sidequest_id_fkey;
ALTER TABLE public.quest_nudges
  ADD CONSTRAINT quest_nudges_sidequest_id_fkey
  FOREIGN KEY (sidequest_id) REFERENCES public.sidequests(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.cleanup_sidequest_dependents()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.notifications n
  WHERE n.comment_id IN (
    SELECT c.id FROM public.comments c WHERE c.sidequest_id = OLD.id
  );

  DELETE FROM public.notifications n
  WHERE n.entity_id = OLD.id
    AND n.type <> 'quest_canceled';

  DELETE FROM storage.objects
  WHERE bucket_id = 'sidequest-photos'
    AND name LIKE OLD.id::text || '/%';

  RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_sidequest_dependents() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS cleanup_sidequest_dependents_before_delete ON public.sidequests;
CREATE TRIGGER cleanup_sidequest_dependents_before_delete
BEFORE DELETE ON public.sidequests
FOR EACH ROW EXECUTE FUNCTION public.cleanup_sidequest_dependents();