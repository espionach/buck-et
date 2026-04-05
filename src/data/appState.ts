import { create } from "zustand";
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
  quests as initialQuests,
  groups as initialGroups,
  currentUser,
  friends,
  pendingGroupInvitations as initialInvitations,
  pendingFriendRequests as initialFriendRequests,
  pendingTransferRequests as initialTransfers,
  initialNotifications,
} from "./mockData";

interface AppState {
  quests: Quest[];
  groups: Group[];
  friends: User[];
  groupInvitations: GroupInvitation[];
  friendRequests: FriendRequest[];
  sentFriendRequests: string[]; // user IDs we've sent requests to
  transferRequests: TransferRequest[];
  notifications: AppNotification[];
  currentUser: User;
  hideGlobalFab: boolean;
  popupCount: number;
  setHideGlobalFab: (hide: boolean) => void;
  pushPopup: () => void;
  popPopup: () => void;

  addQuest: (quest: Quest) => void;
  toggleImIn: (questId: string) => void;
  markUndone: (questId: string) => void;
  markDone: (questId: string) => void;
  addGroup: (group: Group) => void;
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

  // Transfer requests
  requestQuestTransfer: (questId: string, newOwnerId: string) => void;
  requestGroupTransfer: (groupId: string, newOwnerId: string) => void;
  acceptTransfer: (transferId: string) => void;
  declineTransfer: (transferId: string) => void;

  // Volunteer actions
  volunteerForQuest: (questId: string, role: string) => void;
  unvolunteerFromQuest: (questId: string) => void;
  updateQuestLogistics: (questId: string, logistics: Partial<QuestLogistics>) => void;

  // Notifications
  addNotification: (notification: AppNotification) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  clearNotification: (notificationId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  quests: initialQuests,
  groups: initialGroups,
  friends: friends,
  groupInvitations: initialInvitations,
  friendRequests: initialFriendRequests,
  sentFriendRequests: [],
  transferRequests: initialTransfers,
  notifications: initialNotifications,
  currentUser: currentUser,
  hideGlobalFab: false,
  popupCount: 0,
  setHideGlobalFab: (hide) => set({ hideGlobalFab: hide }),
  pushPopup: () => set((s) => ({ popupCount: s.popupCount + 1 })),
  popPopup: () => set((s) => ({ popupCount: Math.max(0, s.popupCount - 1) })),

  addQuest: (quest) => set((s) => ({ quests: [quest, ...s.quests] })),

  toggleImIn: (questId) =>
    set((s) => ({
      quests: s.quests.map((q) => {
        if (q.id !== questId) return q;
        const isIn = q.participants.some((p) => p.id === s.currentUser.id);
        return {
          ...q,
          participants: isIn
            ? q.participants.filter((p) => p.id !== s.currentUser.id)
            : [...q.participants, s.currentUser],
        };
      }),
    })),

  markDone: (questId) =>
    set((s) => ({
      quests: s.quests.map((q) =>
        q.id === questId
          ? { ...q, isDone: true, completedAt: new Date().toISOString().split("T")[0] }
          : q
      ),
    })),

  markUndone: (questId) =>
    set((s) => ({
      quests: s.quests.map((q) =>
        q.id === questId
          ? { ...q, isDone: false, completedAt: undefined }
          : q
      ),
    })),

  addGroup: (group) => set((s) => ({ groups: [...s.groups, group] })),

  updateGroup: (groupId, updates) =>
    set((s) => ({
      groups: s.groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)),
    })),

  removeMemberFromGroup: (groupId, userId) =>
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
    })),

  leaveGroup: (groupId) =>
    set((s) => ({
      groups: s.groups.filter((g) => g.id !== groupId),
    })),

  inviteToGroup: (groupId, user) =>
    set((s) => ({
      groups: s.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              members: [...g.members, user],
              memberRoles: [...g.memberRoles, { user, role: "member" as const }],
            }
          : g
      ),
    })),

  acceptGroupInvitation: (invitationId) =>
    set((s) => {
      const invitation = s.groupInvitations.find((i) => i.id === invitationId);
      if (!invitation) return s;
      return {
        groupInvitations: s.groupInvitations.filter((i) => i.id !== invitationId),
        groups: [...s.groups, { ...invitation.group, members: [...invitation.group.members, s.currentUser] }],
        notifications: s.notifications.filter((n) => !(n.type === "board_invitation" && n.entityId === invitationId)),
      };
    }),

  declineGroupInvitation: (invitationId) =>
    set((s) => ({
      groupInvitations: s.groupInvitations.filter((i) => i.id !== invitationId),
      notifications: s.notifications.filter((n) => !(n.type === "board_invitation" && n.entityId === invitationId)),
    })),

  acceptFriendRequest: (requestId) =>
    set((s) => {
      const req = s.friendRequests.find((r) => r.id === requestId);
      if (!req) return s;
      const alreadyFriend = s.friends.some((f) => f.id === req.from.id);
      return {
        friendRequests: s.friendRequests.filter((r) => r.id !== requestId),
        friends: alreadyFriend ? s.friends : [...s.friends, req.from],
      };
    }),

  declineFriendRequest: (requestId) =>
    set((s) => ({
      friendRequests: s.friendRequests.filter((r) => r.id !== requestId),
    })),

  sendFriendRequest: (toUser) =>
    set((s) => {
      if (s.sentFriendRequests.includes(toUser.id)) return s;
      const notification: AppNotification = {
        id: `n${Date.now()}`,
        type: "friend_request",
        message: `${s.currentUser.name} sent a friend request to ${toUser.name}`,
        fromUser: s.currentUser,
        read: false,
        createdAt: new Date().toISOString().split("T")[0],
      };
      return {
        sentFriendRequests: [...s.sentFriendRequests, toUser.id],
        notifications: [notification, ...s.notifications],
      };
    }),

  unfriend: (userId) =>
    set((s) => ({
      friends: s.friends.filter((f) => f.id !== userId),
      quests: s.quests.map((q) => {
        // Remove unfriended user from quests owned by current user
        if (q.createdBy.id === s.currentUser.id) {
          return { ...q, participants: q.participants.filter((p) => p.id !== userId) };
        }
        // Remove current user from quests owned by unfriended user
        if (q.createdBy.id === userId) {
          return { ...q, participants: q.participants.filter((p) => p.id !== s.currentUser.id) };
        }
        return q;
      }),
    })),

  addComment: (questId, comment) =>
    set((s) => ({
      quests: s.quests.map((q) =>
        q.id === questId ? { ...q, comments: [...q.comments, comment] } : q
      ),
    })),

  updateQuest: (questId, updates) =>
    set((s) => ({
      quests: s.quests.map((q) => (q.id === questId ? { ...q, ...updates } : q)),
    })),

  deleteQuest: (questId) =>
    set((s) => ({
      quests: s.quests.filter((q) => q.id !== questId),
      transferRequests: s.transferRequests.filter((tr) => !(tr.type === "quest" && tr.entityId === questId)),
    })),

  updateProfile: (updates) =>
    set((s) => {
      const updatedUser = { ...s.currentUser, ...updates };
      const uid = updatedUser.id;

      const patchUser = (u: User) => (u.id === uid ? { ...u, ...updates } : u);

      const quests = s.quests.map((q) => ({
        ...q,
        createdBy: patchUser(q.createdBy),
        participants: q.participants.map(patchUser),
        comments: q.comments?.map((c) => ({ ...c, user: patchUser(c.user) })),
        logistics: q.logistics
          ? { ...q.logistics, volunteers: q.logistics.volunteers?.map((v) => ({ ...v, user: patchUser(v.user) })) }
          : undefined,
      }));

      const groups = s.groups.map((g) => ({
        ...g,
        members: g.members.map(patchUser),
        memberRoles: g.memberRoles.map((mr) => ({ ...mr, user: patchUser(mr.user) })),
      }));

      const notifications = s.notifications.map((n) => ({
        ...n,
        fromUser: patchUser(n.fromUser),
      }));

      const friendRequests = s.friendRequests.map((fr) => ({
        ...fr,
        from: patchUser(fr.from),
      }));

      const transferRequests = s.transferRequests.map((tr) => ({
        ...tr,
        fromUser: patchUser(tr.fromUser),
      }));

      const friends = s.friends.map(patchUser);

      return { currentUser: updatedUser, quests, groups, notifications, friendRequests, transferRequests, friends };
    }),

  removeParticipant: (questId, userId) =>
    set((s) => ({
      quests: s.quests.map((q) =>
        q.id === questId
          ? { ...q, participants: q.participants.filter((p) => p.id !== userId) }
          : q
      ),
    })),

  cleanupEmptyQuests: () =>
    set((s) => ({
      quests: s.quests.filter((q) => q.isDone || q.participants.length > 0 || q.createdBy.id === s.currentUser.id),
    })),

  transferQuestOwnership: (questId, newOwnerId) =>
    set((s) => {
      const quest = s.quests.find((q) => q.id === questId);
      if (!quest) return s;
      const newOwner = quest.participants.find((p) => p.id === newOwnerId);
      if (!newOwner) return s;
      return {
        quests: s.quests.map((q) =>
          q.id === questId
            ? {
                ...q,
                createdBy: newOwner,
                participants: q.participants.filter((p) => p.id !== s.currentUser.id),
              }
            : q
        ),
      };
    }),

  transferGroupOwnership: (groupId, newOwnerId) =>
    set((s) => ({
      groups: s.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              ownerId: newOwnerId,
              members: g.members.filter((m) => m.id !== s.currentUser.id),
              memberRoles: g.memberRoles
                .filter((mr) => mr.user.id !== s.currentUser.id)
                .map((mr) =>
                  mr.user.id === newOwnerId ? { ...mr, role: "owner" as const } : mr
                ),
            }
          : g
      ),
    })),

  deleteGroup: (groupId) =>
    set((s) => ({
      groups: s.groups.filter((g) => g.id !== groupId),
      quests: s.quests.filter((q) => q.groupId !== groupId),
      transferRequests: s.transferRequests.filter((tr) => !(tr.type === "group" && tr.entityId === groupId)),
    })),

  // Transfer requests
  requestQuestTransfer: (questId, newOwnerId) =>
    set((s) => {
      const quest = s.quests.find((q) => q.id === questId);
      if (!quest) return s;
      const newOwner = quest.participants.find((p) => p.id === newOwnerId);
      if (!newOwner) return s;
      const transferId = `tr${Date.now()}`;
      const transfer: TransferRequest = {
        id: transferId,
        type: "quest",
        entityId: questId,
        fromUser: s.currentUser,
        toUserId: newOwnerId,
      };
      const notification: AppNotification = {
        id: `n${Date.now()}`,
        type: "transfer_quest",
        message: `${s.currentUser.name} wants to transfer '${quest.title}' to you`,
        entityId: questId,
        groupId: quest.groupId,
        fromUser: s.currentUser,
        read: false,
        createdAt: new Date().toISOString().split("T")[0],
      };
      return {
        transferRequests: [...s.transferRequests, transfer],
        notifications: [notification, ...s.notifications],
      };
    }),

  requestGroupTransfer: (groupId, newOwnerId) =>
    set((s) => {
      const group = s.groups.find((g) => g.id === groupId);
      if (!group) return s;
      const newOwner = group.members.find((m) => m.id === newOwnerId);
      if (!newOwner) return s;
      const transfer: TransferRequest = {
        id: `tr${Date.now()}`,
        type: "group",
        entityId: groupId,
        fromUser: s.currentUser,
        toUserId: newOwnerId,
      };
      const notification: AppNotification = {
        id: `n${Date.now()}`,
        type: "transfer_group",
        message: `${s.currentUser.name} wants to transfer '${group.name}' board to you`,
        entityId: groupId,
        fromUser: s.currentUser,
        read: false,
        createdAt: new Date().toISOString().split("T")[0],
      };
      return {
        transferRequests: [...s.transferRequests, transfer],
        notifications: [notification, ...s.notifications],
      };
    }),

  acceptTransfer: (transferId) =>
    set((s) => {
      const transfer = s.transferRequests.find((tr) => tr.id === transferId);
      if (!transfer) return s;

      if (transfer.type === "quest") {
        const quest = s.quests.find((q) => q.id === transfer.entityId);
        if (!quest) return s;
        return {
          transferRequests: s.transferRequests.filter((tr) => tr.id !== transferId),
          notifications: s.notifications.filter(
            (n) => !(n.type === "transfer_quest" && n.entityId === transfer.entityId)
          ),
          quests: s.quests.map((q) =>
            q.id === transfer.entityId
              ? {
                  ...q,
                  createdBy: s.currentUser,
                  participants: q.participants.some((p) => p.id === transfer.fromUser.id)
                    ? q.participants.filter((p) => p.id !== transfer.fromUser.id)
                    : q.participants,
                }
              : q
          ),
        };
      } else {
        return {
          transferRequests: s.transferRequests.filter((tr) => tr.id !== transferId),
          notifications: s.notifications.filter(
            (n) => !(n.type === "transfer_group" && n.entityId === transfer.entityId)
          ),
          groups: s.groups.map((g) =>
            g.id === transfer.entityId
              ? {
                  ...g,
                  ownerId: s.currentUser.id,
                  members: g.members.filter((m) => m.id !== transfer.fromUser.id),
                  memberRoles: g.memberRoles
                    .filter((mr) => mr.user.id !== transfer.fromUser.id)
                    .map((mr) =>
                      mr.user.id === s.currentUser.id ? { ...mr, role: "owner" as const } : mr
                    ),
                }
              : g
          ),
        };
      }
    }),

  declineTransfer: (transferId) =>
    set((s) => {
      const transfer = s.transferRequests.find((tr) => tr.id === transferId);
      if (!transfer) return { transferRequests: s.transferRequests.filter((tr) => tr.id !== transferId) };

      const entityName = transfer.type === "quest"
        ? s.quests.find((q) => q.id === transfer.entityId)?.title || "a quest"
        : s.groups.find((g) => g.id === transfer.entityId)?.name || "a board";

      const declineNotification: AppNotification = {
        id: `n${Date.now()}`,
        type: "transfer_declined",
        message: `${s.currentUser.name} declined the transfer of '${entityName}'`,
        entityId: transfer.entityId,
        fromUser: s.currentUser,
        read: false,
        createdAt: new Date().toISOString().split("T")[0],
      };

      return {
        transferRequests: s.transferRequests.filter((tr) => tr.id !== transferId),
        notifications: [
          declineNotification,
          ...s.notifications.filter(
            (n) => !(n.type === (`transfer_${transfer.type}` as any) && n.entityId === transfer.entityId)
          ),
        ],
      };
    }),

  // Volunteer actions
  volunteerForQuest: (questId, role) =>
    set((s) => ({
      quests: s.quests.map((q) => {
        if (q.id !== questId) return q;
        const logistics = q.logistics || { volunteers: [] };
        const already = logistics.volunteers.some((v) => v.userId === s.currentUser.id);
        if (already) return q;
        return {
          ...q,
          logistics: {
            ...logistics,
            volunteers: [...logistics.volunteers, { userId: s.currentUser.id, user: s.currentUser, role }],
          },
        };
      }),
    })),

  unvolunteerFromQuest: (questId) =>
    set((s) => ({
      quests: s.quests.map((q) => {
        if (q.id !== questId) return q;
        const logistics = q.logistics || { volunteers: [] };
        return {
          ...q,
          logistics: {
            ...logistics,
            volunteers: logistics.volunteers.filter((v) => v.userId !== s.currentUser.id),
          },
        };
      }),
    })),

  updateQuestLogistics: (questId, logisticsUpdates) =>
    set((s) => ({
      quests: s.quests.map((q) => {
        if (q.id !== questId) return q;
        return {
          ...q,
          logistics: { ...(q.logistics || { volunteers: [] }), ...logisticsUpdates },
        };
      }),
    })),

  // Notifications
  addNotification: (notification) =>
    set((s) => ({
      notifications: [notification, ...s.notifications],
    })),

  markNotificationRead: (notificationId) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    })),

  markAllNotificationsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearNotification: (notificationId) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== notificationId),
    })),
}));
