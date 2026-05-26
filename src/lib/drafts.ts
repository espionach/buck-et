// Local-only sidequest drafts. Stored in localStorage, scoped per user id.
// No backend sync — clearing browser data or switching devices loses drafts.

const STORAGE_KEY = "sidequest_drafts_v1";

export type DraftLocation = {
  text: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
};

export type QuestDraft = {
  id: string;
  userId: string;
  updatedAt: string; // ISO
  title: string;
  description: string;
  groupId: string | null;
  date: string;
  time: string;
  location: DraftLocation;
  meetupSpot: string;
  transportation: string;
  carpoolSlots: string;
  customNotes: string;
  links: string[];
  contributionRoles: string[];
  photoPlaceholderCount: number;
};

type Store = Record<string, QuestDraft[]>; // userId -> drafts

function readStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // out of quota or storage disabled — silently no-op
  }
}

export function listDrafts(userId: string): QuestDraft[] {
  const store = readStore();
  const arr = store[userId] || [];
  return [...arr].sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
}

export function getDraft(userId: string, draftId: string): QuestDraft | null {
  return listDrafts(userId).find((d) => d.id === draftId) || null;
}

export function saveDraft(draft: QuestDraft) {
  const store = readStore();
  const arr = store[draft.userId] || [];
  const idx = arr.findIndex((d) => d.id === draft.id);
  const next: QuestDraft = { ...draft, updatedAt: new Date().toISOString() };
  if (idx >= 0) arr[idx] = next;
  else arr.push(next);
  store[draft.userId] = arr;
  writeStore(store);
}

export function deleteDraft(userId: string, draftId: string) {
  const store = readStore();
  const arr = store[userId];
  if (!arr) return;
  store[userId] = arr.filter((d) => d.id !== draftId);
  writeStore(store);
}

export function draftHasContent(d: Partial<QuestDraft>): boolean {
  return Boolean(
    (d.title && d.title.trim()) ||
      (d.description && d.description.trim()) ||
      d.groupId ||
      d.date ||
      d.time ||
      (d.location && d.location.text && d.location.text.trim()) ||
      (d.meetupSpot && d.meetupSpot.trim()) ||
      (d.transportation && d.transportation.trim()) ||
      (d.carpoolSlots && d.carpoolSlots.trim()) ||
      (d.customNotes && d.customNotes.trim()) ||
      (d.links && d.links.length > 0) ||
      (d.contributionRoles && d.contributionRoles.length > 0) ||
      (d.photoPlaceholderCount && d.photoPlaceholderCount > 0)
  );
}

export function newDraftId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
