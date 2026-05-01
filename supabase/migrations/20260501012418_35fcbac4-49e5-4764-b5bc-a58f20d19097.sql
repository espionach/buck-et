
-- ============ user_flags ============
CREATE TABLE public.user_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  strike_count INTEGER NOT NULL DEFAULT 0,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  suspended_until TIMESTAMPTZ,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/mods view flags" ON public.user_flags
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role) OR user_id = auth.uid());

CREATE POLICY "Admins manage flags" ON public.user_flags
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_user_flags_updated_at
  BEFORE UPDATE ON public.user_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ admin_actions (audit log) ============
CREATE TABLE public.admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- warn, suspend, ban, unban, hide_quest, delete_quest, delete_comment, resolve_report, dismiss_report, promote, demote, strike
  target_type TEXT NOT NULL, -- user, sidequest, comment, report
  target_id UUID,
  target_user_id UUID,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/mods view audit log" ON public.admin_actions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins/mods write audit log" ON public.admin_actions
  FOR INSERT TO authenticated
  WITH CHECK (
    admin_id = auth.uid()
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role))
  );

CREATE INDEX idx_admin_actions_target_user ON public.admin_actions(target_user_id);
CREATE INDEX idx_admin_actions_created ON public.admin_actions(created_at DESC);

-- ============ is_hidden on sidequests ============
ALTER TABLE public.sidequests ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Update the view policy to hide from non-admins, non-creators
DROP POLICY IF EXISTS "View accessible sidequests" ON public.sidequests;
CREATE POLICY "View accessible sidequests" ON public.sidequests
  FOR SELECT TO authenticated
  USING (
    (NOT is_blocked(auth.uid(), created_by))
    AND (
      (NOT is_hidden) OR created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role)
    )
    AND (
      created_by = auth.uid()
      OR EXISTS (SELECT 1 FROM sidequest_participants sp WHERE sp.sidequest_id = sidequests.id AND sp.user_id = auth.uid())
      OR (group_id IS NOT NULL AND is_group_member(group_id, auth.uid()))
      OR EXISTS (SELECT 1 FROM friendships f WHERE (f.user_id = auth.uid() AND f.friend_id = sidequests.created_by) OR (f.friend_id = auth.uid() AND f.user_id = sidequests.created_by))
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'moderator'::app_role)
    )
  );

-- Allow admins to update and delete sidequests
CREATE POLICY "Admins update sidequests" ON public.sidequests
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete sidequests" ON public.sidequests
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete comments
CREATE POLICY "Admins delete comments" ON public.comments
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Allow admins/mods to view all comments (for moderation)
DROP POLICY IF EXISTS "View comments" ON public.comments;
CREATE POLICY "View comments" ON public.comments
  FOR SELECT TO authenticated
  USING (
    (NOT is_blocked(auth.uid(), user_id))
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'moderator'::app_role)
  );

-- ============ Helper: check user can act (not banned/suspended) ============
CREATE OR REPLACE FUNCTION public.user_can_act(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_flags
    WHERE user_id = _user_id
      AND (
        is_banned = true
        OR (is_suspended = true AND (suspended_until IS NULL OR suspended_until > now()))
      )
  );
$$;

-- Block sidequest creation by banned/suspended users
DROP POLICY IF EXISTS "Users can create sidequests" ON public.sidequests;
CREATE POLICY "Users can create sidequests" ON public.sidequests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by AND user_can_act(auth.uid()));

-- Block comments by banned/suspended users
DROP POLICY IF EXISTS "Create comments" ON public.comments;
CREATE POLICY "Create comments" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND user_can_act(auth.uid()));

-- ============ Auto-flag trigger: 3+ pending reports => strike ============
CREATE OR REPLACE FUNCTION public.auto_flag_on_reports()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending_count INT;
BEGIN
  IF NEW.reported_user_id IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO pending_count
  FROM public.user_reports
  WHERE reported_user_id = NEW.reported_user_id
    AND status = 'pending';

  IF pending_count >= 3 THEN
    INSERT INTO public.user_flags (user_id, strike_count)
    VALUES (NEW.reported_user_id, 1)
    ON CONFLICT (user_id) DO UPDATE
      SET strike_count = public.user_flags.strike_count + 1,
          updated_at = now()
      WHERE public.user_flags.updated_at < now() - INTERVAL '1 hour';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_flag_on_reports
  AFTER INSERT ON public.user_reports
  FOR EACH ROW EXECUTE FUNCTION public.auto_flag_on_reports();
