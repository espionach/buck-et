/** Product limits + validation for sidequest links. Mirrors the server-side trigger. */
export const MAX_LINKS_PER_QUEST = 5;
export const MAX_LINK_LENGTH = 2048;

export const LINK_LIMIT_MESSAGE = `You've reached the max — up to ${MAX_LINKS_PER_QUEST} links per sidequest.`;
export const LINK_INVALID_MESSAGE = "That doesn't look like a valid web address.";
export const LINK_DUPLICATE_MESSAGE = "You've already added that link.";

/** Adds https:// when the user omits a scheme, and trims whitespace. */
export function normalizeLink(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value; // other scheme — leave as-is (invalid)
  return `https://${value}`;
}

/** Client-side URL check (UX only — the database enforces the same rules). */
export function isValidLink(raw: string): boolean {
  const value = normalizeLink(raw);
  if (!value || value.length > MAX_LINK_LENGTH) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (/\s/.test(value)) return false;
  const host = url.hostname;
  if (host === "localhost") return true;
  return /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(host);
}

/**
 * Validates a candidate link against the existing list.
 * Returns the normalized link, or an error message to show the user.
 */
export function validateNewLink(
  raw: string,
  existing: string[]
): { link: string; error?: undefined } | { link?: undefined; error: string } {
  if (existing.length >= MAX_LINKS_PER_QUEST) return { error: LINK_LIMIT_MESSAGE };
  const link = normalizeLink(raw);
  if (!isValidLink(link)) return { error: LINK_INVALID_MESSAGE };
  if (existing.some((l) => l.toLowerCase() === link.toLowerCase())) {
    return { error: LINK_DUPLICATE_MESSAGE };
  }
  return { link };
}

/** Maps a database error into a friendly link message. */
export function mapLinkError(message?: string | null): string | null {
  if (!message) return null;
  if (message.includes("LINK_LIMIT_REACHED")) return LINK_LIMIT_MESSAGE;
  if (message.includes("LINK_INVALID")) return LINK_INVALID_MESSAGE;
  return null;
}
