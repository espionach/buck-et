import { create } from "zustand";
import {
  Quest,
  Group,
  User,
  Comment,
  GroupInvitation,
  FollowRequest,
  GroupMember,
  quests as initialQuests,
  groups as initialGroups,
  currentUser,
  friends,
  pendingGroupInvitations as initialInvitations,
  pendingFollowRequests as initialFollowRequests,
} from "./mockData";

interface AppState {
  quests: Quest[];
  groups: Group[];
  following: User[];
  followers: User[];
  groupInvitations: GroupInvitation[];
  followRequests: FollowRequest[];
  currentUser: User;

  addQuest: (quest: Quest) => void;
  toggleImIn: (questId: string) => void;
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
  updateProfile: (updates: Partial<User>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  quests: initialQuests,
  groups: initialGroups,
  following: friends,
  followers: [...friends.slice(0, 4)],
  groupInvitations: initialInvitations,
  followRequests: initialFollowRequests,
  currentUser: currentUser,

  addQuest: (quest) => set((s) => ({ quests: [quest, ...s.quests] })),

  toggleImIn: (questId) =>
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
    })),

  markDone: (questId) =>
    set((s) => ({
      quests: s.quests.map((q) =>
        q.id === questId
          ? { ...q, isDone: true, completedAt: new Date().toISOString().split("T")[0] }
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
        groups: [...s.groups, { ...invitation.group, members: [...invitation.group.members, currentUser] }],
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

  updateProfile: (updates) =>
    set((s) => ({ currentUser: { ...s.currentUser, ...updates } })),
}));
