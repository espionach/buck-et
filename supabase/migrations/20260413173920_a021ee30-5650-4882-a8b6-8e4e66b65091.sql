
-- Step 1: Create ALL tables first (no cross-ref policies)
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT 'star',
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member', 'invited')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id),
  CHECK (user_id <> friend_id)
);
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sidequests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  is_friends_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  photos TEXT[] DEFAULT '{}',
  notes TEXT,
  links TEXT[] DEFAULT '{}',
  logistics_date DATE,
  logistics_time TEXT,
  logistics_location TEXT,
  logistics_meetup_spot TEXT,
  logistics_transportation TEXT CHECK (logistics_transportation IN ('car', 'bike', 'walk', 'transit', 'other')),
  logistics_carpool_slots INTEGER,
  logistics_custom_notes TEXT
);
ALTER TABLE public.sidequests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sidequest_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sidequest_id UUID NOT NULL REFERENCES public.sidequests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (sidequest_id, user_id)
);
ALTER TABLE public.sidequest_participants ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sidequest_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sidequest_id UUID NOT NULL REFERENCES public.sidequests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (sidequest_id, user_id)
);
ALTER TABLE public.sidequest_completions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sidequest_volunteers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sidequest_id UUID NOT NULL REFERENCES public.sidequests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (sidequest_id, user_id)
);
ALTER TABLE public.sidequest_volunteers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sidequest_id UUID NOT NULL REFERENCES public.sidequests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (from_user_id, to_user_id)
);
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.group_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (group_id, invited_user_id)
);
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.transfer_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('quest', 'group')),
  entity_id UUID NOT NULL,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.transfer_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_id UUID,
  group_id UUID,
  comment_id UUID,
  group_name TEXT,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Step 2: ALL RLS policies (now all tables exist)

-- Groups
CREATE POLICY "Groups viewable by members" ON public.groups
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = id AND gm.user_id = auth.uid())
  );
CREATE POLICY "Owner can update group" ON public.groups FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can delete group" ON public.groups FOR DELETE USING (owner_id = auth.uid());

-- Group members
CREATE POLICY "Members can view group members" ON public.group_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members gm2 WHERE gm2.group_id = group_id AND gm2.user_id = auth.uid())
  );
CREATE POLICY "Owner can manage members" ON public.group_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.owner_id = auth.uid())
  );
CREATE POLICY "Users can join groups" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.group_members FOR DELETE USING (auth.uid() = user_id);

-- Friendships
CREATE POLICY "View own friendships" ON public.friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Create friendships" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete friendships" ON public.friendships FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Sidequests
CREATE POLICY "View accessible sidequests" ON public.sidequests
  FOR SELECT USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.sidequest_participants sp WHERE sp.sidequest_id = id AND sp.user_id = auth.uid())
    OR (group_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = sidequests.group_id AND gm.user_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.friendships f WHERE (f.user_id = auth.uid() AND f.friend_id = created_by) OR (f.friend_id = auth.uid() AND f.user_id = created_by))
  );
CREATE POLICY "Creator can update" ON public.sidequests FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Users can create sidequests" ON public.sidequests FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can delete" ON public.sidequests FOR DELETE USING (created_by = auth.uid());

-- Participants
CREATE POLICY "View participants" ON public.sidequest_participants FOR SELECT USING (true);
CREATE POLICY "Join sidequest" ON public.sidequest_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leave sidequest" ON public.sidequest_participants FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Creator removes participant" ON public.sidequest_participants
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.sidequests s WHERE s.id = sidequest_id AND s.created_by = auth.uid()));

-- Completions
CREATE POLICY "View completions" ON public.sidequest_completions FOR SELECT USING (true);
CREATE POLICY "Mark done" ON public.sidequest_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Unmark done" ON public.sidequest_completions FOR DELETE USING (auth.uid() = user_id);

-- Volunteers
CREATE POLICY "View volunteers" ON public.sidequest_volunteers FOR SELECT USING (true);
CREATE POLICY "Volunteer" ON public.sidequest_volunteers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Unvolunteer" ON public.sidequest_volunteers FOR DELETE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "View comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Friend requests
CREATE POLICY "View friend requests" ON public.friend_requests FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Send friend request" ON public.friend_requests FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Respond to friend request" ON public.friend_requests FOR UPDATE USING (auth.uid() = to_user_id);
CREATE POLICY "Delete friend request" ON public.friend_requests FOR DELETE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Group invitations
CREATE POLICY "View invitations" ON public.group_invitations FOR SELECT USING (auth.uid() = invited_user_id OR auth.uid() = invited_by);
CREATE POLICY "Create invitations" ON public.group_invitations
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_invitations.group_id AND gm.user_id = auth.uid()));
CREATE POLICY "Respond to invitation" ON public.group_invitations FOR UPDATE USING (auth.uid() = invited_user_id);
CREATE POLICY "Delete invitation" ON public.group_invitations FOR DELETE USING (auth.uid() = invited_user_id OR auth.uid() = invited_by);

-- Transfer requests
CREATE POLICY "View transfers" ON public.transfer_requests FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Create transfers" ON public.transfer_requests FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Respond to transfers" ON public.transfer_requests FOR UPDATE USING (auth.uid() = to_user_id);
CREATE POLICY "Delete transfers" ON public.transfer_requests FOR DELETE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Notifications
CREATE POLICY "View own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Create notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Step 3: Indexes
CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_sidequests_created_by ON public.sidequests(created_by);
CREATE INDEX idx_sidequests_group ON public.sidequests(group_id);
CREATE INDEX idx_sidequest_participants_sidequest ON public.sidequest_participants(sidequest_id);
CREATE INDEX idx_sidequest_participants_user ON public.sidequest_participants(user_id);
CREATE INDEX idx_comments_sidequest ON public.comments(sidequest_id);
CREATE INDEX idx_friendships_user ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend ON public.friendships(friend_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
