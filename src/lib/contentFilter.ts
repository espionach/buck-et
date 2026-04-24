/**
 * Lightweight client-side content filter. Blocks the most common slurs and
 * obviously offensive language. This is intentionally a small denylist —
 * server-side moderation and user reports backstop it for everything else.
 */

// Word stems. Matched against text after lowercasing and stripping
// non-alphanumeric characters, so simple obfuscation (spaces, punctuation,
// numbers between letters) doesn't slip past.
const BANNED_WORD_STEMS: string[] = [
  // generic profanity
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "dickhead",
  "dick",
  "ass",
  "motherfucker",
  "cunt",
  // slurs (kept short — extend as needed)
  "nigger",
  "nigga",
  "faggot",
  "fag",
  "retard",
  "tranny",
  "chink",
  "spic",
  "kike",
  "wetback",
  "gook",
  // sexual / harassment-adjacent
  "rape",
  "molest",
  "kys", // "kill yourself"
  // sexual / explicit
  "porn",
  "sexvideo",
  "nudes",
  "blowjob",
  "handjob",
  "sex",
];

const normalize = (text: string): string =>
  text.toLowerCase().replace(/[^a-z]/g, "");

/**
 * Returns true if any banned stem appears as a substring of the normalized text.
 */
export const containsProfanity = (text: string | null | undefined): boolean => {
  if (!text) return false;
  const normalized = normalize(text);
  if (!normalized) return false;
  return BANNED_WORD_STEMS.some((stem) => normalized.includes(stem));
};

/**
 * Convenience: validate one or more pieces of content at once.
 * Returns null if everything is clean, otherwise an error message.
 */
export const validateContent = (
  ...parts: Array<string | null | undefined>
): string | null => {
  for (const part of parts) {
    if (containsProfanity(part)) {
      return "This content violates our guidelines.";
    }
  }
  return null;
};

export const CONTENT_VIOLATION_MESSAGE = "This content violates our guidelines.";