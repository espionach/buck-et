import { create } from "zustand";
import { Quest, Group, quests as initialQuests, groups as initialGroups, currentUser, friends, User } from "./mockData";

interface AppState {
  quests: Quest[];
  groups: Group[];
  following: User[];
  addQuest: (quest: Quest) => void;
  toggleImIn: (questId: string) => void;
  markDone: (questId: string) => void;
  addGroup: (group: Group) => void;
}

export const useAppStore = create<AppState>((set) => ({
  quests: initialQuests,
  groups: initialGroups,
  following: friends,
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
      quests: s.quests.map((q) => (q.id === questId ? { ...q, isDone: true } : q)),
    })),
  addGroup: (group) => set((s) => ({ groups: [...s.groups, group] })),
}));
