ALTER TABLE public.sidequests
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid;

CREATE INDEX IF NOT EXISTS sidequests_archived_at_idx ON public.sidequests (archived_at);

-- Only allow hard deletes of sidequests that were never completed by their owner.
DROP POLICY IF EXISTS "Creator can delete" ON public.sidequests;
CREATE POLICY "Creator can delete active sidequests"
ON public.sidequests
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM public.sidequest_completions sc
    WHERE sc.sidequest_id = sidequests.id AND sc.user_id = sidequests.created_by
  )
);

-- Visibility: archived sidequests remain visible only to users who completed them.
DROP POLICY IF EXISTS "View accessible sidequests" ON public.sidequests;
CREATE POLICY "View accessible sidequests"
ON public.sidequests
FOR SELECT
USING (
  (NOT is_blocked(auth.uid(), created_by))
  AND ((NOT is_hidden) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  AND (
    CASE WHEN archived_at IS NULL THEN
      (
        (created_by = auth.uid())
        OR EXISTS (SELECT 1 FROM sidequest_participants sp WHERE sp.sidequest_id = sidequests.id AND sp.user_id = auth.uid())
        OR ((group_id IS NOT NULL) AND is_group_member(group_id, auth.uid()))
        OR EXISTS (
          SELECT 1 FROM friendships f
          WHERE ((f.user_id = auth.uid() AND f.friend_id = sidequests.created_by)
             OR (f.friend_id = auth.uid() AND f.user_id = sidequests.created_by))
        )
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'moderator'::app_role)
      )
    ELSE
      (
        (
          auth.uid() IS DISTINCT FROM archived_by
          AND EXISTS (
            SELECT 1 FROM sidequest_completions sc
            WHERE sc.sidequest_id = sidequests.id AND sc.user_id = auth.uid()
          )
        )
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'moderator'::app_role)
      )
    END
  )
);

-- Keep helper in sync with the archive rules.
CREATE OR REPLACE FUNCTION public.can_view_sidequest(_sidequest_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.sidequests s
    WHERE s.id = _sidequest_id
      AND NOT public.is_blocked(_user_id, s.created_by)
      AND (
        CASE WHEN s.archived_at IS NULL THEN
          (
            s.created_by = _user_id
            OR EXISTS (
              SELECT 1 FROM public.sidequest_participants sp
              WHERE sp.sidequest_id = s.id AND sp.user_id = _user_id
            )
            OR (s.group_id IS NOT NULL AND public.is_group_member(s.group_id, _user_id))
            OR EXISTS (
              SELECT 1 FROM public.friendships f
              WHERE (f.user_id = _user_id AND f.friend_id = s.created_by)
                 OR (f.friend_id = _user_id AND f.user_id = s.created_by)
            )
          )
        ELSE
          (
            s.archived_by IS DISTINCT FROM _user_id
            AND EXISTS (
              SELECT 1 FROM public.sidequest_completions sc
              WHERE sc.sidequest_id = s.id AND sc.user_id = _user_id
            )
          )
        END
      )
  )
$function$;