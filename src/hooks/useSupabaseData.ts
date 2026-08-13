import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  User, Quest, Group, GroupMember, Comment, GroupInvitation,
  FriendRequest, TransferRequest, AppNotification, QuestVolunteer,
  QuestLogistics, placeholderUser
} from "@/data/mockData";

// ---- Profile cache ----
const profileCache = new Map<string, User>();

function dbProfileToUser(row: any): User {
  const u: User = {
    id: row.user_id,
    name: row.display_name || "Anonymous",
    username: row.username || undefined,
    avatar: "👤",
    bio: row.bio || "",
    profilePicture: row.avatar_url || undefined,
  };
  profileCache.set(u.id, u);
  return u;
}

async function ensureCurrentProfile(): Promise<User | null> {
  const { data, error } = await (supabase as any).rpc("ensure_current_user_profile");
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? dbProfileToUser(row) : null;
}

function getCachedUser(userId: string): User {
  return profileCache.get(userId) || placeholderUser(userId);
}

// ---- Profiles ----
export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      const users = (data || []).map(dbProfileToUser);
      return users;
    },
    staleTime: 60000,
  });
}

export function useCurrentProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) return dbProfileToUser(data);
      return ensureCurrentProfile();
    },
    enabled: !!user,
  });
}

// ---- Friends ----
export function useFriends() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["friends", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("friendships")
        .select("*")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
      if (error) throw error;
      const friendIds = (data || []).map((f) =>
        f.user_id === user.id ? f.friend_id : f.user_id
      );
      // Fetch profiles
      if (friendIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", friendIds);
      return (profiles || []).map(dbProfileToUser);
    },
    enabled: !!user,
  });
}

// ---- Friend Requests ----
export function useFriendRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["friend_requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("friend_requests")
        .select("*")
        .eq("to_user_id", user.id)
        .eq("status", "pending");
      if (error) throw error;
      // Get sender profiles
      const senderIds = (data || []).map((r) => r.from_user_id);
      if (senderIds.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", senderIds);
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, dbProfileToUser(p)]));
      return (data || []).map((r): FriendRequest => ({
        id: r.id,
        from: profileMap.get(r.from_user_id) || placeholderUser(r.from_user_id),
        status: r.status as "pending",
      }));
    },
    enabled: !!user,
  });
}

// ---- Groups ----
// Groups are now private launch lists owned by a single user. RLS restricts
// SELECT on `groups` to rows where owner_id = auth.uid(), so we just fetch
// every visible group and treat them all as owned by the current user.
export function useGroups() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["groups", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: groups } = await supabase
        .from("groups")
        .select("*")
        .eq("owner_id", user.id);
      if (!groups || groups.length === 0) return [];
      const groupIds = groups.map((g) => g.id);
      const { data: allMembers } = await supabase
        .from("group_members")
        .select("*")
        .in("group_id", groupIds);
      // The owner is implicit and is not shown in the members list. Old data
      // may have an owner row with role='owner' — filter that out here.
      const memberRows = (allMembers || []).filter((m) => m.user_id !== user.id);
      const memberUserIds = [...new Set(memberRows.map((m) => m.user_id))];
      const { data: profiles } = memberUserIds.length
        ? await supabase.from("profiles").select("*").in("user_id", memberUserIds)
        : { data: [] as any[] };
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, dbProfileToUser(p)]));

      return groups.map((g): Group => {
        const gMembers = memberRows.filter((m) => m.group_id === g.id);
        const members = gMembers.map((m) => profileMap.get(m.user_id) || placeholderUser(m.user_id));
        const memberRoles: GroupMember[] = gMembers.map((m) => ({
          user: profileMap.get(m.user_id) || placeholderUser(m.user_id),
          role: "member" as const,
        }));
        return {
          id: g.id,
          name: g.name,
          emoji: g.emoji,
          color: g.color || "sky",
          iconColor: (g as { icon_color?: string }).icon_color || "slate",
          description: g.description || undefined,
          members,
          memberRoles,
          ownerId: g.owner_id,
          activeQuests: 0,
          createdAt: g.created_at.split("T")[0],
        };
      });
    },
    enabled: !!user,
  });
}


// ---- Quests ----
export function useQuests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["quests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Fetch all accessible sidequests
      const { data: quests, error } = await supabase
        .from("sidequests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!quests || quests.length === 0) return [];
      const questIds = quests.map((q) => q.id);
      // Fetch participants, completions, volunteers, comments in parallel
      const [participantsRes, completionsRes, volunteersRes, commentsRes] = await Promise.all([
        supabase.from("sidequest_participants").select("*").in("sidequest_id", questIds),
        supabase.from("sidequest_completions").select("*").in("sidequest_id", questIds),
        supabase.from("sidequest_volunteers").select("*").in("sidequest_id", questIds),
        supabase.from("comments").select("*").in("sidequest_id", questIds).order("created_at", { ascending: true }),
      ]);
      // Fetch comment likes for the comments we just loaded
      const commentIds = (commentsRes.data || []).map((c) => c.id);
      const { data: likesData } = commentIds.length
        ? await supabase.from("comment_likes").select("comment_id, user_id").in("comment_id", commentIds)
        : { data: [] as { comment_id: string; user_id: string }[] };
      const likeCountByComment = new Map<string, number>();
      const likedByMe = new Set<string>();
      (likesData || []).forEach((l) => {
        likeCountByComment.set(l.comment_id, (likeCountByComment.get(l.comment_id) || 0) + 1);
        if (l.user_id === user.id) likedByMe.add(l.comment_id);
      });
      // Collect all user IDs
      const allUserIds = new Set<string>();
      quests.forEach((q) => allUserIds.add(q.created_by));
      (participantsRes.data || []).forEach((p) => allUserIds.add(p.user_id));
      (completionsRes.data || []).forEach((c) => allUserIds.add(c.user_id));
      (volunteersRes.data || []).forEach((v) => allUserIds.add(v.user_id));
      (commentsRes.data || []).forEach((c) => allUserIds.add(c.user_id));
      // Fetch all profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", Array.from(allUserIds));
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, dbProfileToUser(p)]));
      const getUser = (id: string) => profileMap.get(id) || placeholderUser(id);

      return quests.map((q): Quest => {
        const participants = (participantsRes.data || [])
          .filter((p) => p.sidequest_id === q.id)
          .map((p) => getUser(p.user_id));
        const questCompletions = (completionsRes.data || []).filter((c) => c.sidequest_id === q.id);
        const completedByUserIds = questCompletions.map((c) => c.user_id);
        // Completion is owner-driven: a quest is "finished" when its owner
        // marks it done. Use the owner's completion timestamp so every viewer
        // (friend, group member, participant) sees the same finished date.
        const ownerCompletion = questCompletions.find((c) => c.user_id === q.created_by);
        const finishedAt = ownerCompletion?.completed_at || q.completed_at || null;
        const volunteers: QuestVolunteer[] = (volunteersRes.data || [])
          .filter((v) => v.sidequest_id === q.id)
          .map((v) => ({ userId: v.user_id, user: getUser(v.user_id), role: v.role }));
        // Build threaded comments: top-level entries with `replies` nested.
        const flat: Comment[] = (commentsRes.data || [])
          .filter((c) => c.sidequest_id === q.id)
          .map((c) => ({
            id: c.id,
            userId: c.user_id,
            user: getUser(c.user_id),
            text: c.text,
            createdAt: c.created_at.split("T")[0],
            parentId: (c as any).parent_comment_id || undefined,
            replies: [],
            likeCount: likeCountByComment.get(c.id) || 0,
            likedByMe: likedByMe.has(c.id),
          }));
        const byId = new Map(flat.map((c) => [c.id, c]));
        const comments: Comment[] = [];
        for (const c of flat) {
          if (c.parentId && byId.has(c.parentId)) {
            byId.get(c.parentId)!.replies!.push(c);
          } else {
            comments.push(c);
          }
        }

        const contributionRoles = (q as any).contribution_roles as string[] | null;
        const hasLogistics = q.logistics_date || q.logistics_time || q.logistics_location ||
          q.logistics_meetup_spot || q.logistics_transportation || q.logistics_custom_notes ||
          (contributionRoles && contributionRoles.length > 0);
        const logistics: QuestLogistics | undefined = hasLogistics || volunteers.length > 0
          ? {
              date: q.logistics_date || undefined,
              time: q.logistics_time || undefined,
              location: q.logistics_location || undefined,
              latitude: (q as any).logistics_latitude != null ? Number((q as any).logistics_latitude) : undefined,
              longitude: (q as any).logistics_longitude != null ? Number((q as any).logistics_longitude) : undefined,
              placeId: (q as any).logistics_place_id || undefined,
              meetupSpot: q.logistics_meetup_spot || undefined,
              transportation: q.logistics_transportation as any || undefined,
              carpoolSlots: q.logistics_carpool_slots || undefined,
              volunteers,
              customNotes: q.logistics_custom_notes || undefined,
              contributionRoles: contributionRoles || [],
            }
          : undefined;

        return {
          id: q.id,
          title: q.title,
          description: q.description || undefined,
          createdBy: getUser(q.created_by),
          groupId: q.group_id || undefined,
          isFollowerOnly: q.is_friends_only,
          isPrivate: (q as any).is_private || false,
          participants,
          completedByUserIds,
          completionVisibility: Object.fromEntries(
            questCompletions.map((c) => [c.user_id, (c as any).visibility || "all_friends"])
          ),
          createdAt: q.created_at.split("T")[0],
          completedAt: finishedAt ? finishedAt.split("T")[0] : undefined,
          photos: q.photos && q.photos.length > 0 ? q.photos : undefined,
          notes: q.notes || undefined,
          links: q.links && q.links.length > 0 ? q.links : undefined,
          comments,
          logistics,
        };
      });
    },
    enabled: !!user,
  });
}

// ---- Group Invitations ----
export function useGroupInvitations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["group_invitations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("group_invitations")
        .select("*")
        .eq("invited_user_id", user.id)
        .eq("status", "pending");
      if (error) throw error;
      if (!data || data.length === 0) return [];
      // Fetch groups and inviters
      const groupIds = data.map((i) => i.group_id);
      const inviterIds = data.map((i) => i.invited_by);
      const [groupsRes, profilesRes, membersRes] = await Promise.all([
        supabase.from("groups").select("*").in("id", groupIds),
        supabase.from("profiles").select("*").in("user_id", inviterIds),
        supabase.from("group_members").select("*").in("group_id", groupIds),
      ]);
      const profileMap = new Map((profilesRes.data || []).map((p) => [p.user_id, dbProfileToUser(p)]));
      // Build member profiles
      const memberUserIds = [...new Set((membersRes.data || []).map((m) => m.user_id))];
      const { data: memberProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", memberUserIds);
      const memberProfileMap = new Map((memberProfiles || []).map((p) => [p.user_id, dbProfileToUser(p)]));

      return data.map((inv): GroupInvitation => {
        const g = (groupsRes.data || []).find((g) => g.id === inv.group_id);
        const gMembers = (membersRes.data || []).filter((m) => m.group_id === inv.group_id);
        const members = gMembers.map((m) => memberProfileMap.get(m.user_id) || placeholderUser(m.user_id));
        const memberRoles: GroupMember[] = gMembers.map((m) => ({
          user: memberProfileMap.get(m.user_id) || placeholderUser(m.user_id),
          role: m.role as GroupMember["role"],
        }));
        return {
          id: inv.id,
          groupId: inv.group_id,
          group: {
            id: g?.id || inv.group_id,
            name: g?.name || "Unknown",
            emoji: g?.emoji || "star",
            description: g?.description || undefined,
            members,
            memberRoles,
            ownerId: g?.owner_id || "",
            activeQuests: 0,
            createdAt: g?.created_at?.split("T")[0] || "",
          },
          invitedBy: profileMap.get(inv.invited_by) || placeholderUser(inv.invited_by),
          status: inv.status as "pending",
        };
      });
    },
    enabled: !!user,
  });
}

// ---- Notifications ----
export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];
      // Fetch sender profiles
      const senderIds = [...new Set(data.filter((n) => n.from_user_id).map((n) => n.from_user_id!))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", senderIds);
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, dbProfileToUser(p)]));
      return data.map((n): AppNotification => ({
        id: n.id,
        type: n.type as AppNotification["type"],
        message: n.message,
        entityId: n.entity_id || undefined,
        groupId: n.group_id || undefined,
        commentId: n.comment_id || undefined,
        groupName: n.group_name || undefined,
        fromUser: n.from_user_id ? (profileMap.get(n.from_user_id) || placeholderUser(n.from_user_id)) : placeholderUser("system"),
        read: n.read,
        createdAt: n.created_at,
      }));
    },
    enabled: !!user,
  });
}

// ---- Transfer Requests ----
export function useTransferRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["transfer_requests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("transfer_requests")
        .select("*")
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .eq("status", "pending");
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const userIds = [...new Set(data.map((t) => t.from_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, dbProfileToUser(p)]));
      return data.map((t): TransferRequest => ({
        id: t.id,
        type: t.type as "quest" | "group",
        entityId: t.entity_id,
        fromUser: profileMap.get(t.from_user_id) || placeholderUser(t.from_user_id),
        toUserId: t.to_user_id,
      }));
    },
    enabled: !!user,
  });
}

// ---- Sent Friend Requests ----
export function useSentFriendRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sent_friend_requests", user?.id],
    queryFn: async () => {
      if (!user) return [] as string[];
      const { data } = await supabase
        .from("friend_requests")
        .select("to_user_id")
        .eq("from_user_id", user.id)
        .eq("status", "pending");
      return (data || []).map((r) => r.to_user_id);
    },
    enabled: !!user,
  });
}

// ---- Search Users (non-friends) ----
export function useSearchableUsers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["all_users", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("profiles").select("*");
      return (data || []).map(dbProfileToUser).filter((u) => u.id !== user.id);
    },
    enabled: !!user,
  });
}

// ---- People discovery search (server-side, limited fields) ----
export function useUserSearch(query: string) {
  const { user } = useAuth();
  const q = query.trim();
  return useQuery({
    queryKey: ["user_search", user?.id, q],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("search_profiles", { _q: q });
      if (error) throw error;
      return (data || [])
        .map((row: any) => dbProfileToUser(row))
        .filter((u: User) => u.id !== user?.id);
    },
    enabled: !!user && q.length >= 2,
    staleTime: 30000,
  });
}


// ---- Blocked Users (people I have blocked) ----
export function useBlockedUsers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["blocked_users", user?.id],
    queryFn: async () => {
      if (!user) return [] as { id: string; userId: string }[];
      const { data, error } = await supabase
        .from("blocked_users")
        .select("id, blocked_id")
        .eq("blocker_id", user.id);
      if (error) throw error;
      return (data || []).map((b) => ({ id: b.id, userId: b.blocked_id }));
    },
    enabled: !!user,
  });
}

// ---- Sidequests the current user was removed from (cannot rejoin) ----
export function useRemovedFromQuests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sidequest_removed_participants", user?.id],
    queryFn: async () => {
      if (!user) return [] as string[];
      const { data, error } = await supabase
        .from("sidequest_removed_participants")
        .select("sidequest_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []).map((r) => r.sidequest_id);
    },
    enabled: !!user,
  });
}

// ---- Current user roles (admin/moderator) ----
export function useCurrentUserRoles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user_roles", user?.id],
    queryFn: async () => {
      if (!user) return [] as string[];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []).map((r) => r.role as string);
    },
    enabled: !!user,
  });
}
