import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import {
  Quest,
  Group,
  User,
  Comment,
  GroupInvitation,
  FriendRequest,
  GroupMember,
  TransferRequest,
  AppNotification,
  QuestLogistics,
  QuestVolunteer,
  placeholderUser,
} from "./mockData";

interface AppState {
  // These are populated by the DataProvider from React Query
  quests: Quest[];
  groups: Group[];
  friends: User[];
  groupInvitations: GroupInvitation[];
  friendRequests: FriendRequest[];
  sentFriendRequests: string[];
  transferRequests: TransferRequest[];
  notifications: AppNotification[];
  currentUser: User;
  allUsers: User[];
  blockedUserIds: string[];
  currentUserRoles: string[];
  hideGlobalFab: boolean;
  popupCount: number;
  pinnedQuestIds: string[];
  tourActive: boolean;
  _initialized: boolean;

  // Setters for data from React Query
  setQuests: (quests: Quest[]) => void;
  setGroups: (groups: Group[]) => void;
  setFriends: (friends: User[]) => void;
  setGroupInvitations: (invitations: GroupInvitation[]) => void;
  setFriendRequests: (requests: FriendRequest[]) => void;
  setSentFriendRequests: (ids: string[]) => void;
  setTransferRequests: (requests: TransferRequest[]) => void;
  setNotifications: (notifications: AppNotification[]) => void;
  setCurrentUser: (user: User) => void;
  setAllUsers: (users: User[]) => void;
  setBlockedUserIds: (ids: string[]) => void;
  setCurrentUserRoles: (roles: string[]) => void;
  setInitialized: (v: boolean) => void;

  setHideGlobalFab: (hide: boolean) => void;
  pushPopup: () => void;
  popPopup: () => void;
  pinQuest: (questId: string) => void;
  unpinQuest: (questId: string) => void;
  startTour: () => void;
  endTour: () => void;

  // Mutations — these update local state AND persist to DB
  addQuest: (quest: Quest) => void;
  toggleImIn: (questId: string) => void;
  markUndone: (questId: string) => void;
  markDone: (questId: string) => void;
  addGroup: (group: Group) => Promise<string | null>;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  removeMemberFromGroup: (groupId: string, userId: string) => void;
  leaveGroup: (groupId: string) => void;
  inviteToGroup: (groupId: string, user: User) => void;
  acceptGroupInvitation: (invitationId: string) => void;
  declineGroupInvitation: (invitationId: string) => void;
  acceptFriendRequest: (requestId: string) => void;
  declineFriendRequest: (requestId: string) => void;
  sendFriendRequest: (toUser: User) => void;
  unfriend: (userId: string) => void;
  addComment: (questId: string, comment: Comment) => void;
  updateQuest: (questId: string, updates: Partial<Quest>) => void;
  deleteQuest: (questId: string) => void;
  updateProfile: (updates: Partial<User>) => void;
  removeParticipant: (questId: string, userId: string) => void;
  cleanupEmptyQuests: () => void;
  transferQuestOwnership: (questId: string, newOwnerId: string) => void;
  transferGroupOwnership: (groupId: string, newOwnerId: string) => void;
  deleteGroup: (groupId: string) => void;
  requestQuestTransfer: (questId: string, newOwnerId: string) => void;
  requestGroupTransfer: (groupId: string, newOwnerId: string) => void;
  acceptTransfer: (transferId: string) => void;
  declineTransfer: (transferId: string) => void;
  volunteerForQuest: (questId: string, role: string) => void;
  unvolunteerFromQuest: (questId: string) => void;
  updateQuestLogistics: (questId: string, logistics: Partial<QuestLogistics>) => void;
  addNotification: (notification: AppNotification) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  clearNotification: (notificationId: string) => void;

  // Moderation
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  reportUser: (userId: string, reason: string, description?: string) => Promise<void>;

  // invalidation callback — set by DataProvider
  _invalidate: (keys: string[]) => void;
  _setInvalidate: (fn: (keys: string[]) => void) => void;
}

const emptyUser: User = { id: "", name: "", avatar: "👤", bio: "" };

export const useAppStore = create<AppState>((set, get) => ({
  quests: [],
  groups: [],
  friends: [],
  groupInvitations: [],
  friendRequests: [],
  sentFriendRequests: [],
  transferRequests: [],
  notifications: [],
  currentUser: emptyUser,
  allUsers: [],
  blockedUserIds: [],
  currentUserRoles: [],
  hideGlobalFab: false,
  popupCount: 0,
  pinnedQuestIds: JSON.parse(localStorage.getItem("pinnedQuestIds") || "[]"),
  tourActive: false,
  _initialized: false,
  _invalidate: () => {},

  // Setters
  setQuests: (quests) => set({ quests }),
  setGroups: (groups) => set({ groups }),
  setFriends: (friends) => set({ friends }),
  setGroupInvitations: (groupInvitations) => set({ groupInvitations }),
  setFriendRequests: (friendRequests) => set({ friendRequests }),
  setSentFriendRequests: (sentFriendRequests) => set({ sentFriendRequests }),
  setTransferRequests: (transferRequests) => set({ transferRequests }),
  setNotifications: (notifications) => set({ notifications }),
  setCurrentUser: (currentUser) => set({ currentUser }),
  setAllUsers: (allUsers) => set({ allUsers }),
  setBlockedUserIds: (blockedUserIds) => set({ blockedUserIds }),
  setCurrentUserRoles: (currentUserRoles) => set({ currentUserRoles }),
  setInitialized: (v) => set({ _initialized: v }),
  _setInvalidate: (fn) => set({ _invalidate: fn }),

  setHideGlobalFab: (hide) => set({ hideGlobalFab: hide }),
  pushPopup: () => set((s) => ({ popupCount: s.popupCount + 1 })),
  popPopup: () => set((s) => ({ popupCount: Math.max(0, s.popupCount - 1) })),
  pinQuest: (questId) => set((s) => {
    if (s.pinnedQuestIds.includes(questId) || s.pinnedQuestIds.length >= 3) return s;
    const next = [...s.pinnedQuestIds, questId];
    localStorage.setItem("pinnedQuestIds", JSON.stringify(next));
    return { pinnedQuestIds: next };
  }),
  unpinQuest: (questId) => set((s) => {
    const next = s.pinnedQuestIds.filter((id) => id !== questId);
    localStorage.setItem("pinnedQuestIds", JSON.stringify(next));
    return { pinnedQuestIds: next };
  }),
  startTour: () => set({ tourActive: true }),
  endTour: () => set({ tourActive: false }),

  // ---- Mutations ----

  addQuest: (quest) => {
    set((s) => ({ quests: [quest, ...s.quests] }));
    const { currentUser, _invalidate } = get();
    (async () => {
      const { data, error } = await supabase.from("sidequests").insert({
        title: quest.title,
        description: quest.description || null,
        created_by: currentUser.id,
        group_id: quest.groupId || null,
        is_friends_only: quest.isFollowerOnly,
        photos: quest.photos || [],
        links: quest.links || [],
        notes: quest.notes || null,
        logistics_date: quest.logistics?.date || null,
        logistics_time: quest.logistics?.time || null,
        logistics_location: quest.logistics?.location || null,
        logistics_meetup_spot: quest.logistics?.meetupSpot || null,
        logistics_transportation: quest.logistics?.transportation || null,
        logistics_carpool_slots: quest.logistics?.carpoolSlots || null,
        logistics_custom_notes: quest.logistics?.customNotes || null,
        contribution_roles: quest.logistics?.contributionRoles || [],
      }).select().single();
      if (data) {
        // Add creator as participant
        await supabase.from("sidequest_participants").insert({
          sidequest_id: data.id,
          user_id: currentUser.id,
        });
        // Update local quest with real ID
        set((s) => ({
          quests: s.quests.map((q) =>
            q.id === quest.id ? { ...q, id: data.id } : q
          ),
        }));
      }
      _invalidate(["quests"]);
    })();
  },

  toggleImIn: (questId) => {
    const { currentUser, _invalidate } = get();
    set((s) => ({
      quests: s.quests.map((q) => {
        if (q.id !== questId) return q;
        const isIn = q.participants.some((p) => p.id === currentUser.id);
        return {
          ...q,
          participants: isIn
            ? q.participants.filter((p) => p.id !== currentUser.id)
            : [...q.participants, currentUser],
        };
      }),
    }));
    (async () => {
      const quest = get().quests.find((q) => q.id === questId);
      const isIn = quest?.participants.some((p) => p.id === currentUser.id);
      if (isIn) {
        // We just added — insert
        await supabase.from("sidequest_participants").insert({
          sidequest_id: questId,
          user_id: currentUser.id,
        });
      } else {
        // We just removed — delete
        await supabase.from("sidequest_participants")
          .delete()
          .eq("sidequest_id", questId)
          .eq("user_id", currentUser.id);
      }
      _invalidate(["quests"]);
    })();
  },

  markDone: (questId) => {
    const { currentUser, quests, _invalidate } = get();
    const quest = quests.find((q) => q.id === questId);
    if (!quest) return;
    // Only the owner can finish a sidequest.
    if (quest.createdBy.id !== currentUser.id) return;
    // Snapshot every current participant (plus the owner) as "was joined when finished".
    const participantIds = Array.from(
      new Set([currentUser.id, ...quest.participants.map((p) => p.id)])
    );
    const today = new Date().toISOString().split("T")[0];
    set((s) => ({
      quests: s.quests.map((q) =>
        q.id === questId
          ? {
              ...q,
              completedByUserIds: Array.from(
                new Set([...q.completedByUserIds, ...participantIds])
              ),
              completedAt: q.completedAt || today,
            }
          : q
      ),
    }));
    (async () => {
      // Insert a completion row for every participant (owner included).
      await supabase.from("sidequest_completions").insert(
        participantIds.map((uid) => ({ sidequest_id: questId, user_id: uid }))
      );
      _invalidate(["quests"]);
    })();
  },

  markUndone: (questId) => {
    const { currentUser, quests, _invalidate } = get();
    const quest = quests.find((q) => q.id === questId);
    if (!quest) return;
    // Only the owner can move a sidequest back to active.
    if (quest.createdBy.id !== currentUser.id) return;
    set((s) => ({
      quests: s.quests.map((q) =>
        q.id === questId
          ? { ...q, completedByUserIds: [], completedAt: undefined }
          : q
      ),
    }));
    (async () => {
      // Clear completion records for every user on this quest.
      await supabase
        .from("sidequest_completions")
        .delete()
        .eq("sidequest_id", questId);
      _invalidate(["quests"]);
    })();
  },

  addGroup: async (group) => {
    set((s) => ({ groups: [...s.groups, group] }));
    const { currentUser, _invalidate } = get();
    const { data } = await supabase.from("groups").insert({
      name: group.name,
      emoji: group.emoji,
      color: group.color || "sky",
      description: group.description || null,
      owner_id: currentUser.id,
    }).select().single();
    if (!data) {
      _invalidate(["groups", "group_invitations"]);
      return null;
    }
    // Add owner as member
    await supabase.from("group_members").insert({
      group_id: data.id,
      user_id: currentUser.id,
      role: "owner",
    });
    // Invite selected members
    const invitees = group.memberRoles
      .filter((mr) => mr.role === "invited" || (mr.role === "member" && mr.user.id !== currentUser.id));
    for (const mr of invitees) {
      await supabase.from("group_invitations").insert({
        group_id: data.id,
        invited_user_id: mr.user.id,
        invited_by: currentUser.id,
      });
    }
    set((s) => ({
      groups: s.groups.map((g) => g.id === group.id ? { ...g, id: data.id } : g),
    }));
    _invalidate(["groups", "group_invitations"]);
    return data.id as string;
  },

  updateGroup: (groupId, updates) => {
    set((s) => ({
      groups: s.groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)),
    }));
    const { _invalidate } = get();
    (async () => {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.emoji) dbUpdates.emoji = updates.emoji;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.description !== undefined) dbUpdates.description = updates.description || null;
      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from("groups").update(dbUpdates).eq("id", groupId);
      }
      _invalidate(["groups"]);
    })();
  },

  removeMemberFromGroup: (groupId, userId) => {
    set((s) => ({
      groups: s.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              members: g.members.filter((m) => m.id !== userId),
              memberRoles: g.memberRoles.filter((mr) => mr.user.id !== userId),
            }
          : g
      ),
    }));
    const { _invalidate } = get();
    (async () => {
      await supabase.from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);
      // Also revoke any pending invitation for this user in this group
      await supabase.from("group_invitations")
        .delete()
        .eq("group_id", groupId)
        .eq("invited_user_id", userId)
        .eq("status", "pending");
      _invalidate(["groups"]);
    })();
  },

  leaveGroup: (groupId) => {
    const { currentUser, _invalidate } = get();
    set((s) => ({ groups: s.groups.filter((g) => g.id !== groupId) }));
    (async () => {
      await supabase.from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", currentUser.id);
      _invalidate(["groups"]);
    })();
  },

  inviteToGroup: (groupId, user) => {
    set((s) => ({
      groups: s.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              memberRoles: [...g.memberRoles, { user, role: "invited" as const }],
            }
          : g
      ),
    }));
    const { currentUser, _invalidate } = get();
    (async () => {
      await supabase.from("group_invitations").insert({
        group_id: groupId,
        invited_user_id: user.id,
        invited_by: currentUser.id,
      });
      _invalidate(["groups", "group_invitations"]);
    })();
  },

  acceptGroupInvitation: (invitationId) => {
    const { currentUser, _invalidate } = get();
    set((s) => {
      const invitation = s.groupInvitations.find((i) => i.id === invitationId);
      if (!invitation) return s;
      return {
        groupInvitations: s.groupInvitations.filter((i) => i.id !== invitationId),
        groups: [...s.groups, { ...invitation.group, members: [...invitation.group.members, currentUser] }],
        notifications: s.notifications.filter((n) => !(n.type === "board_invitation" && n.entityId === invitationId)),
      };
    });
    (async () => {
      // Update invitation status
      await supabase.from("group_invitations")
        .update({ status: "accepted" })
        .eq("id", invitationId);
      // Get the group_id from the invitation
      const { data: inv } = await supabase.from("group_invitations")
        .select("group_id")
        .eq("id", invitationId)
        .maybeSingle();
      if (inv) {
        await supabase.from("group_members").insert({
          group_id: inv.group_id,
          user_id: currentUser.id,
          role: "member",
        });
      }
      _invalidate(["groups", "group_invitations", "notifications"]);
    })();
  },

  declineGroupInvitation: (invitationId) => {
    set((s) => ({
      groupInvitations: s.groupInvitations.filter((i) => i.id !== invitationId),
      notifications: s.notifications.filter((n) => !(n.type === "board_invitation" && n.entityId === invitationId)),
    }));
    const { _invalidate } = get();
    (async () => {
      await supabase.from("group_invitations")
        .update({ status: "declined" })
        .eq("id", invitationId);
      _invalidate(["group_invitations", "notifications"]);
    })();
  },

  acceptFriendRequest: (requestId) => {
    const { currentUser, _invalidate } = get();
    set((s) => {
      const req = s.friendRequests.find((r) => r.id === requestId);
      if (!req) return s;
      const alreadyFriend = s.friends.some((f) => f.id === req.from.id);
      return {
        friendRequests: s.friendRequests.filter((r) => r.id !== requestId),
        friends: alreadyFriend ? s.friends : [...s.friends, req.from],
      };
    });
    (async () => {
      const { data: req } = await supabase.from("friend_requests")
        .select("from_user_id")
        .eq("id", requestId)
        .maybeSingle();
      if (req) {
        await supabase.from("friend_requests")
          .update({ status: "accepted" })
          .eq("id", requestId);
        // Create bidirectional friendship
        await supabase.from("friendships").insert({
          user_id: currentUser.id,
          friend_id: req.from_user_id,
        });
      }
      _invalidate(["friends", "friend_requests"]);
    })();
  },

  declineFriendRequest: (requestId) => {
    set((s) => ({
      friendRequests: s.friendRequests.filter((r) => r.id !== requestId),
    }));
    const { _invalidate } = get();
    (async () => {
      await supabase.from("friend_requests")
        .update({ status: "declined" })
        .eq("id", requestId);
      _invalidate(["friend_requests"]);
    })();
  },

  sendFriendRequest: (toUser) => {
    const { currentUser, _invalidate } = get();
    set((s) => {
      if (s.sentFriendRequests.includes(toUser.id)) return s;
      return {
        sentFriendRequests: [...s.sentFriendRequests, toUser.id],
      };
    });
    (async () => {
      await supabase.from("friend_requests").insert({
        from_user_id: currentUser.id,
        to_user_id: toUser.id,
      });
      _invalidate(["sent_friend_requests"]);
    })();
  },

  unfriend: (userId) => {
    const { currentUser, _invalidate } = get();
    const state = get();
    const theirFriendsOnlyQuestIds = state.quests
      .filter((q) => q.isFollowerOnly && q.createdBy.id === userId && q.participants.some((p) => p.id === currentUser.id))
      .map((q) => q.id);
    const myFriendsOnlyQuestIds = state.quests
      .filter((q) => q.isFollowerOnly && q.createdBy.id === currentUser.id && q.participants.some((p) => p.id === userId))
      .map((q) => q.id);
    const theirOwnedGroupIds = state.groups
      .filter((g) => g.ownerId === userId && g.members.some((m) => m.id === currentUser.id))
      .map((g) => g.id);
    const myOwnedGroupIds = state.groups
      .filter((g) => g.ownerId === currentUser.id && g.members.some((m) => m.id === userId))
      .map((g) => g.id);
    const pendingInviteIds = state.groupInvitations
      .filter((i) => i.status === "pending" && i.invitedBy.id === userId)
      .map((i) => i.id);

    set((s) => ({
      friends: s.friends.filter((f) => f.id !== userId),
      quests: s.quests.map((q) => {
        if (theirFriendsOnlyQuestIds.includes(q.id)) {
          return { ...q, participants: q.participants.filter((p) => p.id !== currentUser.id) };
        }
        if (myFriendsOnlyQuestIds.includes(q.id)) {
          return { ...q, participants: q.participants.filter((p) => p.id !== userId) };
        }
        return q;
      }),
      groups: s.groups
        .filter((g) => !theirOwnedGroupIds.includes(g.id))
        .map((g) => myOwnedGroupIds.includes(g.id)
          ? {
              ...g,
              members: g.members.filter((m) => m.id !== userId),
              memberRoles: g.memberRoles.filter((mr) => mr.user.id !== userId),
            }
          : g),
      groupInvitations: s.groupInvitations.filter((i) => !pendingInviteIds.includes(i.id)),
      notifications: s.notifications.filter((n) => !(n.type === "board_invitation" && n.entityId && pendingInviteIds.includes(n.entityId))),
    }));
    (async () => {
      await supabase.from("friendships")
        .delete()
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUser.id})`);

      if (theirFriendsOnlyQuestIds.length > 0) {
        await supabase
          .from("sidequest_participants")
          .delete()
          .in("sidequest_id", theirFriendsOnlyQuestIds)
          .eq("user_id", currentUser.id);
      }
      if (myFriendsOnlyQuestIds.length > 0) {
        await supabase
          .from("sidequest_participants")
          .delete()
          .in("sidequest_id", myFriendsOnlyQuestIds)
          .eq("user_id", userId);
      }

      if (theirOwnedGroupIds.length > 0) {
        await supabase
          .from("group_members")
          .delete()
          .in("group_id", theirOwnedGroupIds)
          .eq("user_id", currentUser.id);
      }
      if (myOwnedGroupIds.length > 0) {
        await supabase
          .from("group_members")
          .delete()
          .in("group_id", myOwnedGroupIds)
          .eq("user_id", userId);
      }

      await supabase.from("group_invitations")
        .delete()
        .eq("status", "pending")
        .or(`and(invited_by.eq.${userId},invited_user_id.eq.${currentUser.id}),and(invited_by.eq.${currentUser.id},invited_user_id.eq.${userId})`);

      _invalidate(["friends", "quests", "groups", "group_invitations", "notifications"]);
    })();
  },

  addComment: (questId, comment) => {
    set((s) => ({
      quests: s.quests.map((q) =>
        q.id === questId ? { ...q, comments: [...q.comments, comment] } : q
      ),
    }));
    const { currentUser, _invalidate } = get();
    (async () => {
      await supabase.from("comments").insert({
        sidequest_id: questId,
        user_id: currentUser.id,
        text: comment.text,
      });
      _invalidate(["quests"]);
    })();
  },

  updateQuest: (questId, updates) => {
    set((s) => ({
      quests: s.quests.map((q) => (q.id === questId ? { ...q, ...updates } : q)),
    }));
    const { _invalidate } = get();
    (async () => {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description || null;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
      if (updates.photos !== undefined) dbUpdates.photos = updates.photos || [];
      if (updates.links !== undefined) dbUpdates.links = updates.links || [];
      if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt || null;
      if (updates.groupId !== undefined) dbUpdates.group_id = updates.groupId || null;
      if (updates.isFollowerOnly !== undefined) dbUpdates.is_friends_only = !!updates.isFollowerOnly;
      if (updates.logistics !== undefined) {
        const l = updates.logistics;
        if (l) {
          dbUpdates.logistics_date = l.date || null;
          dbUpdates.logistics_time = l.time || null;
          dbUpdates.logistics_location = l.location || null;
          dbUpdates.logistics_meetup_spot = l.meetupSpot || null;
          dbUpdates.logistics_transportation = l.transportation || null;
          dbUpdates.logistics_carpool_slots = l.carpoolSlots || null;
          dbUpdates.logistics_custom_notes = l.customNotes || null;
          dbUpdates.contribution_roles = l.contributionRoles || [];
        } else {
          dbUpdates.logistics_date = null;
          dbUpdates.logistics_time = null;
          dbUpdates.logistics_location = null;
          dbUpdates.logistics_meetup_spot = null;
          dbUpdates.logistics_transportation = null;
          dbUpdates.logistics_carpool_slots = null;
          dbUpdates.logistics_custom_notes = null;
          dbUpdates.contribution_roles = [];
        }
      }
      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from("sidequests").update(dbUpdates).eq("id", questId);
      }
      _invalidate(["quests"]);
    })();
  },

  deleteQuest: (questId) => {
    set((s) => ({
      quests: s.quests.filter((q) => q.id !== questId),
      transferRequests: s.transferRequests.filter((tr) => !(tr.type === "quest" && tr.entityId === questId)),
    }));
    const { _invalidate } = get();
    (async () => {
      await supabase.from("sidequests").delete().eq("id", questId);
      _invalidate(["quests", "transfer_requests"]);
    })();
  },

  updateProfile: (updates) => {
    const { currentUser, _invalidate } = get();
    const updatedUser = { ...currentUser, ...updates };
    set({ currentUser: updatedUser });
    (async () => {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.display_name = updates.name;
      if (updates.username !== undefined) dbUpdates.username = updates.username;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.profilePicture !== undefined) dbUpdates.avatar_url = updates.profilePicture || null;
      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from("profiles")
          .update(dbUpdates)
          .eq("user_id", currentUser.id);
      }
      _invalidate(["profiles", "profile"]);
    })();
  },

  removeParticipant: (questId, userId) => {
    set((s) => ({
      quests: s.quests.map((q) =>
        q.id === questId
          ? { ...q, participants: q.participants.filter((p) => p.id !== userId) }
          : q
      ),
    }));
    const { _invalidate } = get();
    (async () => {
      await supabase.from("sidequest_participants")
        .delete()
        .eq("sidequest_id", questId)
        .eq("user_id", userId);
      _invalidate(["quests"]);
    })();
  },

  cleanupEmptyQuests: () => {
    // No-op with real data — DB handles this
  },

  transferQuestOwnership: (questId, newOwnerId) => {
    const { currentUser, _invalidate } = get();
    set((s) => {
      const quest = s.quests.find((q) => q.id === questId);
      if (!quest) return s;
      const newOwner = quest.participants.find((p) => p.id === newOwnerId);
      if (!newOwner) return s;
      return {
        quests: s.quests.map((q) =>
          q.id === questId
            ? { ...q, createdBy: newOwner, participants: q.participants.filter((p) => p.id !== currentUser.id) }
            : q
        ),
      };
    });
    (async () => {
      await supabase.from("sidequests")
        .update({ created_by: newOwnerId })
        .eq("id", questId);
      await supabase.from("sidequest_participants")
        .delete()
        .eq("sidequest_id", questId)
        .eq("user_id", currentUser.id);
      _invalidate(["quests"]);
    })();
  },

  transferGroupOwnership: (groupId, newOwnerId) => {
    const { currentUser, _invalidate } = get();
    set((s) => ({
      groups: s.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              ownerId: newOwnerId,
              members: g.members.filter((m) => m.id !== currentUser.id),
              memberRoles: g.memberRoles
                .filter((mr) => mr.user.id !== currentUser.id)
                .map((mr) =>
                  mr.user.id === newOwnerId ? { ...mr, role: "owner" as const } : mr
                ),
            }
          : g
      ),
    }));
    (async () => {
      await supabase.from("groups")
        .update({ owner_id: newOwnerId })
        .eq("id", groupId);
      await supabase.from("group_members")
        .update({ role: "owner" })
        .eq("group_id", groupId)
        .eq("user_id", newOwnerId);
      await supabase.from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", currentUser.id);
      _invalidate(["groups"]);
    })();
  },

  deleteGroup: (groupId) => {
    set((s) => ({
      groups: s.groups.filter((g) => g.id !== groupId),
      quests: s.quests.filter((q) => q.groupId !== groupId),
      transferRequests: s.transferRequests.filter((tr) => !(tr.type === "group" && tr.entityId === groupId)),
    }));
    const { _invalidate } = get();
    (async () => {
      await supabase.from("groups").delete().eq("id", groupId);
      _invalidate(["groups", "quests", "transfer_requests"]);
    })();
  },

  requestQuestTransfer: (questId, newOwnerId) => {
    const { currentUser, _invalidate } = get();
    set((s) => {
      const quest = s.quests.find((q) => q.id === questId);
      if (!quest) return s;
      const transfer: TransferRequest = {
        id: `tr${Date.now()}`,
        type: "quest",
        entityId: questId,
        fromUser: currentUser,
        toUserId: newOwnerId,
      };
      return { transferRequests: [...s.transferRequests, transfer] };
    });
    (async () => {
      await supabase.from("transfer_requests").insert({
        type: "quest",
        entity_id: questId,
        from_user_id: currentUser.id,
        to_user_id: newOwnerId,
      });
      // Create notification
      const quest = get().quests.find((q) => q.id === questId);
      await supabase.from("notifications").insert({
        user_id: newOwnerId,
        type: "transfer_quest",
        message: `wants to transfer '${quest?.title}' to you`,
        entity_id: questId,
        group_id: quest?.groupId || null,
        from_user_id: currentUser.id,
      });
      _invalidate(["transfer_requests", "notifications"]);
    })();
  },

  requestGroupTransfer: (groupId, newOwnerId) => {
    const { currentUser, _invalidate } = get();
    set((s) => {
      const group = s.groups.find((g) => g.id === groupId);
      if (!group) return s;
      const transfer: TransferRequest = {
        id: `tr${Date.now()}`,
        type: "group",
        entityId: groupId,
        fromUser: currentUser,
        toUserId: newOwnerId,
      };
      return { transferRequests: [...s.transferRequests, transfer] };
    });
    (async () => {
      await supabase.from("transfer_requests").insert({
        type: "group",
        entity_id: groupId,
        from_user_id: currentUser.id,
        to_user_id: newOwnerId,
      });
      const group = get().groups.find((g) => g.id === groupId);
      await supabase.from("notifications").insert({
        user_id: newOwnerId,
        type: "transfer_group",
        message: `wants to transfer `,
        group_name: group?.name,
        entity_id: groupId,
        from_user_id: currentUser.id,
      });
      _invalidate(["transfer_requests", "notifications"]);
    })();
  },

  acceptTransfer: (transferId) => {
    const { currentUser, _invalidate } = get();
    set((s) => {
      const transfer = s.transferRequests.find((tr) => tr.id === transferId);
      if (!transfer) return s;
      if (transfer.type === "quest") {
        return {
          transferRequests: s.transferRequests.filter((tr) => tr.id !== transferId),
          notifications: s.notifications.filter((n) => !(n.type === "transfer_quest" && n.entityId === transfer.entityId)),
          quests: s.quests.map((q) =>
            q.id === transfer.entityId
              ? { ...q, createdBy: currentUser, participants: q.participants.filter((p) => p.id !== transfer.fromUser.id) }
              : q
          ),
        };
      } else {
        return {
          transferRequests: s.transferRequests.filter((tr) => tr.id !== transferId),
          notifications: s.notifications.filter((n) => !(n.type === "transfer_group" && n.entityId === transfer.entityId)),
          groups: s.groups.map((g) =>
            g.id === transfer.entityId
              ? {
                  ...g,
                  ownerId: currentUser.id,
                  members: g.members.filter((m) => m.id !== transfer.fromUser.id),
                  memberRoles: g.memberRoles
                    .filter((mr) => mr.user.id !== transfer.fromUser.id)
                    .map((mr) => mr.user.id === currentUser.id ? { ...mr, role: "owner" as const } : mr),
                }
              : g
          ),
        };
      }
    });
    (async () => {
      const { data: transfer } = await supabase.from("transfer_requests")
        .select("*")
        .eq("id", transferId)
        .maybeSingle();
      if (!transfer) return;
      await supabase.from("transfer_requests")
        .update({ status: "accepted" })
        .eq("id", transferId);
      if (transfer.type === "quest") {
        await supabase.from("sidequests")
          .update({ created_by: currentUser.id })
          .eq("id", transfer.entity_id);
        await supabase.from("sidequest_participants")
          .delete()
          .eq("sidequest_id", transfer.entity_id)
          .eq("user_id", transfer.from_user_id);
      } else {
        await supabase.from("groups")
          .update({ owner_id: currentUser.id })
          .eq("id", transfer.entity_id);
        await supabase.from("group_members")
          .update({ role: "owner" })
          .eq("group_id", transfer.entity_id)
          .eq("user_id", currentUser.id);
        await supabase.from("group_members")
          .delete()
          .eq("group_id", transfer.entity_id)
          .eq("user_id", transfer.from_user_id);
      }
      _invalidate(["transfer_requests", "quests", "groups", "notifications"]);
    })();
  },

  declineTransfer: (transferId) => {
    const { currentUser, _invalidate } = get();
    set((s) => {
      const transfer = s.transferRequests.find((tr) => tr.id === transferId);
      if (!transfer) return { transferRequests: s.transferRequests.filter((tr) => tr.id !== transferId) };
      return {
        transferRequests: s.transferRequests.filter((tr) => tr.id !== transferId),
        notifications: s.notifications.filter(
          (n) => !(n.type === (`transfer_${transfer.type}` as any) && n.entityId === transfer.entityId)
        ),
      };
    });
    (async () => {
      await supabase.from("transfer_requests")
        .update({ status: "declined" })
        .eq("id", transferId);
      _invalidate(["transfer_requests", "notifications"]);
    })();
  },

  volunteerForQuest: (questId, role) => {
    const { currentUser, _invalidate } = get();
    set((s) => ({
      quests: s.quests.map((q) => {
        if (q.id !== questId) return q;
        const logistics = q.logistics || { volunteers: [] };
        if (logistics.volunteers.some((v) => v.userId === currentUser.id)) return q;
        return {
          ...q,
          logistics: {
            ...logistics,
            volunteers: [...logistics.volunteers, { userId: currentUser.id, user: currentUser, role }],
          },
        };
      }),
    }));
    (async () => {
      await supabase.from("sidequest_volunteers").insert({
        sidequest_id: questId,
        user_id: currentUser.id,
        role,
      });
      _invalidate(["quests"]);
    })();
  },

  unvolunteerFromQuest: (questId) => {
    const { currentUser, _invalidate } = get();
    set((s) => ({
      quests: s.quests.map((q) => {
        if (q.id !== questId) return q;
        const logistics = q.logistics || { volunteers: [] };
        return {
          ...q,
          logistics: {
            ...logistics,
            volunteers: logistics.volunteers.filter((v) => v.userId !== currentUser.id),
          },
        };
      }),
    }));
    (async () => {
      await supabase.from("sidequest_volunteers")
        .delete()
        .eq("sidequest_id", questId)
        .eq("user_id", currentUser.id);
      _invalidate(["quests"]);
    })();
  },

  updateQuestLogistics: (questId, logisticsUpdates) => {
    set((s) => ({
      quests: s.quests.map((q) => {
        if (q.id !== questId) return q;
        return {
          ...q,
          logistics: { ...(q.logistics || { volunteers: [] }), ...logisticsUpdates },
        };
      }),
    }));
    const { _invalidate } = get();
    (async () => {
      const dbUpdates: any = {};
      if (logisticsUpdates.date !== undefined) dbUpdates.logistics_date = logisticsUpdates.date || null;
      if (logisticsUpdates.time !== undefined) dbUpdates.logistics_time = logisticsUpdates.time || null;
      if (logisticsUpdates.location !== undefined) dbUpdates.logistics_location = logisticsUpdates.location || null;
      if (logisticsUpdates.meetupSpot !== undefined) dbUpdates.logistics_meetup_spot = logisticsUpdates.meetupSpot || null;
      if (logisticsUpdates.transportation !== undefined) dbUpdates.logistics_transportation = logisticsUpdates.transportation || null;
      if (logisticsUpdates.carpoolSlots !== undefined) dbUpdates.logistics_carpool_slots = logisticsUpdates.carpoolSlots || null;
      if (logisticsUpdates.customNotes !== undefined) dbUpdates.logistics_custom_notes = logisticsUpdates.customNotes || null;
      if (logisticsUpdates.contributionRoles !== undefined) dbUpdates.contribution_roles = logisticsUpdates.contributionRoles || [];
      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from("sidequests").update(dbUpdates).eq("id", questId);
      }
      _invalidate(["quests"]);
    })();
  },

  addNotification: (notification) => {
    set((s) => ({ notifications: [notification, ...s.notifications] }));
    const { _invalidate } = get();
    (async () => {
      await supabase.from("notifications").insert({
        user_id: notification.fromUser.id, // This should be the recipient but we keep the pattern
        type: notification.type,
        message: notification.message,
        entity_id: notification.entityId || null,
        group_id: notification.groupId || null,
        comment_id: notification.commentId || null,
        group_name: notification.groupName || null,
        from_user_id: notification.fromUser.id,
      });
      _invalidate(["notifications"]);
    })();
  },

  markNotificationRead: (notificationId) => {
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    }));
    (async () => {
      await supabase.from("notifications")
        .update({ read: true })
        .eq("id", notificationId);
    })();
  },

  markAllNotificationsRead: () => {
    const { currentUser } = get();
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
    (async () => {
      await supabase.from("notifications")
        .update({ read: true })
        .eq("user_id", currentUser.id);
    })();
  },

  clearNotification: (notificationId) => {
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== notificationId),
    }));
    (async () => {
      await supabase.from("notifications")
        .delete()
        .eq("id", notificationId);
    })();
  },

  // ---- Moderation ----
  blockUser: async (userId) => {
    const { currentUser, _invalidate } = get();
    if (!currentUser.id || userId === currentUser.id) return;
    // Optimistic local removal of friendship/quests/etc.
    set((s) => ({
      blockedUserIds: s.blockedUserIds.includes(userId) ? s.blockedUserIds : [...s.blockedUserIds, userId],
      friends: s.friends.filter((f) => f.id !== userId),
      friendRequests: s.friendRequests.filter((r) => r.from.id !== userId),
      sentFriendRequests: s.sentFriendRequests.filter((id) => id !== userId),
      groupInvitations: s.groupInvitations.filter((i) => i.invitedBy.id !== userId),
      allUsers: s.allUsers.filter((u) => u.id !== userId),
    }));
    await supabase.from("blocked_users").insert({
      blocker_id: currentUser.id,
      blocked_id: userId,
    });
    _invalidate(["blocked_users", "friends", "friend_requests", "sent_friend_requests", "group_invitations", "quests", "all_users", "profiles"]);
  },

  unblockUser: async (userId) => {
    const { currentUser, _invalidate } = get();
    set((s) => ({
      blockedUserIds: s.blockedUserIds.filter((id) => id !== userId),
    }));
    await supabase.from("blocked_users")
      .delete()
      .eq("blocker_id", currentUser.id)
      .eq("blocked_id", userId);
    _invalidate(["blocked_users", "all_users", "profiles", "quests"]);
  },

  reportUser: async (userId, reason, description) => {
    const { currentUser } = get();
    if (!currentUser.id || userId === currentUser.id) return;
    await supabase.from("user_reports").insert({
      reporter_id: currentUser.id,
      reported_user_id: userId,
      reason,
      description: description?.trim() || null,
    });
  },
}));
