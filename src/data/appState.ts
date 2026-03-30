import { create } from "zustand";
import {
  Quest,
  Group,
  User,
  Comment,
  GroupInvitation,
  FollowRequest,
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
  pendingFollowRequests as initialFollowRequests,
  pendingTransferRequests as initialTransfers,
  initialNotifications,
} from "./mockData";

interface AppState {
  quests: Quest[];
  groups: Group[];
  following: User[];
  followers: User[];
  groupInvitations: GroupInvitation[];
  followRequests: FollowRequest[];
  transferRequests: TransferRequest[];
  notifications: AppNotification[];
  currentUser: User;

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
  acceptFollowRequest: (requestId: string) => void;
  declineFollowRequest: (requestId: string) => void;
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
  following: friends,
  followers: [...friends.slice(0, 4)],
  groupInvitations: initialInvitations,
  followRequests: initialFollowRequests,
  transferRequests: initialTransfers,
  notifications: initialNotifications,
  currentUser: currentUser,

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
      };
    }),

  declineGroupInvitation: (invitationId) =>
    set((s) => ({
      groupInvitations: s.groupInvitations.filter((i) => i.id !== invitationId),
    })),

  acceptFollowRequest: (requestId) =>
    set((s) => {
      const req = s.followRequests.find((r) => r.id === requestId);
      if (!req) return s;
      return {
        followRequests: s.followRequests.filter((r) => r.id !== requestId),
        followers: [...s.followers, req.from],
      };
    }),

  declineFollowRequest: (requestId) =>
    set((s) => ({
      followRequests: s.followRequests.filter((r) => r.id !== requestId),
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
    set((s) => ({ currentUser: { ...s.currentUser, ...updates } })),

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
      return {
        transferRequests: s.transferRequests.filter((tr) => tr.id !== transferId),
        notifications: transfer
          ? s.notifications.filter(
              (n) => !(n.type === (`transfer_${transfer.type}` as any) && n.entityId === transfer.entityId)
            )
          : s.notifications,
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
