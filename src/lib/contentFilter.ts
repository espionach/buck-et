/**
 * Lightweight client-side content filter.
 *
 * Three tiers:
 *  - HARD_BLOCK: slurs, self-harm, sexual violence. Submission rejected.
 *  - SOFT_REVIEW: context-dependent terms. Returns a warning but does NOT block.
 *  - Anything else: allowed.
 *
 * Matching is whole-word / phrase based (not substring), so things like
 * "assignment" or "Scunthorpe" no longer trip the filter. For the
 * sexual-violence group we list explicit inflected forms instead of a
 * general stemmer.
 */

// Single-word entries are matched as whole words after normalization.
// Multi-word entries are matched as phrases in the normalized string.
const HARD_BLOCK: string[] = [
  // slurs
  "nigger",
  "faggot",
  "chink",
  "spic",
  "kike",
  "wetback",
  "gook",
  // harassment / self-harm
  "kys",
  "kill yourself",
  // sexual violence (explicit inflections)
  "rape",
  "raped",
  "rapes",
  "raping",
  "rapist",
  "rapists",
  "molest",
  "molests",
  "molested",
  "molesting",
  "molester",
  "molesters",
];

const SOFT_REVIEW: string[] = [
  "retard",
  "tranny",
  "porn",
  "sexvideo",
  "nudes",
];

export const CONTENT_VIOLATION_MESSAGE = "This content violates our guidelines.";
export const CONTENT_WARNING_MESSAGE =
  "This might violate community guidelines.";

// Lowercase and collapse any non-letter run into a single space, preserving
// word boundaries so whole-word matching is meaningful.
const normalize = (text: string): string =>
  text.toLowerCase().replace(/[^a-z]+/g, " ").trim();

const matchesAny = (normalized: string, list: string[]): boolean => {
  if (!normalized) return false;
  const tokens = new Set(normalized.split(" "));
  for (const entry of list) {
    if (entry.includes(" ")) {
      // phrase match
      if (normalized.includes(entry)) return true;
    } else if (tokens.has(entry)) {
      return true;
    }
  }
  return false;
};

export type ContentCheck =
  | { level: "clean" }
  | { level: "warn"; message: string }
  | { level: "block"; message: string };

export const checkContent = (text: string | null | undefined): ContentCheck => {
  if (!text) return { level: "clean" };
  const normalized = normalize(text);
  if (!normalized) return { level: "clean" };
  if (matchesAny(normalized, HARD_BLOCK)) {
    return { level: "block", message: CONTENT_VIOLATION_MESSAGE };
  }
  if (matchesAny(normalized, SOFT_REVIEW)) {
    return { level: "warn", message: CONTENT_WARNING_MESSAGE };
  }
  return { level: "clean" };
};

/**
 * Back-compat: true only on hard-block hits.
 */
export const containsProfanity = (text: string | null | undefined): boolean =>
  checkContent(text).level === "block";

/**
 * Validate one or more pieces of content at once.
 * Returns null on clean OR warn (so existing call sites don't block on
 * soft-review terms), and an error string on hard block.
 */
export const validateContent = (
  ...parts: Array<string | null | undefined>
): string | null => {
  for (const part of parts) {
    if (checkContent(part).level === "block") {
      return CONTENT_VIOLATION_MESSAGE;
    }
  }
  return null;
};
