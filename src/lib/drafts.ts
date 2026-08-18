// Sidequest drafts, stored server-side in `quest_drafts` (synced across devices).
// Hard limit: 100 drafts per user, enforced by a database trigger. No expiration.

import { supabase } from "@/integrations/supabase/client";

export const MAX_DRAFTS_PER_USER = 100;
export const DRAFT_LIMIT_MESSAGE = `You've reached the maximum of ${MAX_DRAFTS_PER_USER} drafts. Delete one to save another.`;

const LEGACY_STORAGE_KEY = "sidequest_drafts_v1";
const LEGACY_MIGRATED_KEY = "sidequest_drafts_migrated_v1";

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

type DraftRow = {
  id: string;
  user_id: string;
  updated_at: string;
  title: string | null;
  description: string | null;
  group_id: string | null;
  logistics_date: string | null;
  logistics_time: string | null;
  location_text: string | null;
  location_latitude: number | null;
  location_longitude: number | null;
  location_place_id: string | null;
  meetup_spot: string | null;
  transportation: string | null;
  carpool_slots: string | null;
  custom_notes: string | null;
  links: string[] | null;
  contribution_roles: string[] | null;
  photo_placeholder_count: number | null;
};

function rowToDraft(row: DraftRow): QuestDraft {
  return {
    id: row.id,
    userId: row.user_id,
    updatedAt: row.updated_at,
    title: row.title || "",
    description: row.description || "",
    groupId: row.group_id,
    date: row.logistics_date || "",
    time: row.logistics_time || "",
    location: {
      text: row.location_text || "",
      latitude: row.location_latitude ?? undefined,
      longitude: row.location_longitude ?? undefined,
      placeId: row.location_place_id ?? undefined,
    },
    meetupSpot: row.meetup_spot || "",
    transportation: row.transportation || "",
    carpoolSlots: row.carpool_slots || "",
    customNotes: row.custom_notes || "",
    links: row.links || [],
    contributionRoles: row.contribution_roles || [],
    photoPlaceholderCount: row.photo_placeholder_count || 0,
  };
}

function draftToRow(d: QuestDraft) {
  return {
    id: d.id,
    user_id: d.userId,
    title: d.title || "",
    description: d.description || "",
    group_id: d.groupId,
    logistics_date: d.date || null,
    logistics_time: d.time || null,
    location_text: d.location?.text || null,
    location_latitude: d.location?.latitude ?? null,
    location_longitude: d.location?.longitude ?? null,
    location_place_id: d.location?.placeId ?? null,
    meetup_spot: d.meetupSpot || null,
    transportation: d.transportation || null,
    carpool_slots: d.carpoolSlots || null,
    custom_notes: d.customNotes || null,
    links: d.links || [],
    contribution_roles: d.contributionRoles || [],
    photo_placeholder_count: d.photoPlaceholderCount || 0,
    updated_at: new Date().toISOString(),
  };
}

/** Turns the database limit error into a user-facing message. */
export function mapDraftError(message?: string | null): string | null {
  if (!message) return null;
  if (message.includes("DRAFT_LIMIT_REACHED")) return DRAFT_LIMIT_MESSAGE;
  return null;
}

export async function listDrafts(userId: string): Promise<QuestDraft[]> {
  const { data, error } = await supabase
    .from("quest_drafts")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as DraftRow[]).map(rowToDraft);
}

export async function countDrafts(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("quest_drafts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count || 0;
}

export async function getDraft(userId: string, draftId: string): Promise<QuestDraft | null> {
  const { data, error } = await supabase
    .from("quest_drafts")
    .select("*")
    .eq("user_id", userId)
    .eq("id", draftId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToDraft(data as DraftRow) : null;
}

export async function saveDraft(draft: QuestDraft): Promise<void> {
  const { error } = await supabase.from("quest_drafts").upsert(draftToRow(draft), { onConflict: "id" });
  if (error) throw error;
}

export async function deleteDraft(userId: string, draftId: string): Promise<void> {
  const { error } = await supabase
    .from("quest_drafts")
    .delete()
    .eq("user_id", userId)
    .eq("id", draftId);
  if (error) throw error;
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
  // UUID v4 fallback (the column is a uuid)
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      Number(c) ^
      (Math.floor(Math.random() * 256) & (15 >> (Number(c) / 4)))
    ).toString(16)
  );
}

/**
 * One-time migration: push any drafts left in localStorage up to the backend,
 * respecting the per-user cap, then clear the local store.
 */
export async function migrateLocalDrafts(userId: string): Promise<number> {
  let raw: string | null = null;
  try {
    if (localStorage.getItem(LEGACY_MIGRATED_KEY)) return 0;
    raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  } catch {
    return 0;
  }
  if (!raw) {
    try { localStorage.setItem(LEGACY_MIGRATED_KEY, "1"); } catch {}
    return 0;
  }

  let migrated = 0;
  try {
    const parsed = JSON.parse(raw) as Record<string, QuestDraft[]>;
    const local = Array.isArray(parsed?.[userId]) ? parsed[userId] : [];
    if (local.length) {
      const existing = await countDrafts(userId);
      const room = Math.max(0, MAX_DRAFTS_PER_USER - existing);
      const toMigrate = local.slice(0, room);
      for (const d of toMigrate) {
        try {
          await saveDraft({ ...d, userId, id: /^[0-9a-f-]{36}$/i.test(d.id) ? d.id : newDraftId() });
          migrated++;
        } catch {
          // skip individual failures
        }
      }
    }
    // Drop this user's local drafts and mark done
    delete parsed[userId];
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(parsed));
    localStorage.setItem(LEGACY_MIGRATED_KEY, "1");
  } catch {
    // corrupt store — nothing to migrate
    try { localStorage.setItem(LEGACY_MIGRATED_KEY, "1"); } catch {}
  }
  return migrated;
}
