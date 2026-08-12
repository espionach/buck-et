/** Product + rate limits for nudging participants on a sidequest. */
export const MAX_NUDGES_PER_HOUR = 20;
export const MAX_NUDGES_PER_DAY = 50;
export const NUDGE_THROTTLE_HOURS_PER_RECIPIENT = 24;

export const NUDGE_HOURLY_LIMIT_MESSAGE = `You've hit the limit of ${MAX_NUDGES_PER_HOUR} nudges per hour. Try again later.`;
export const NUDGE_DAILY_LIMIT_MESSAGE = `You've hit the limit of ${MAX_NUDGES_PER_DAY} nudges per day. Try again tomorrow.`;

/** Maps a database nudge-limit error into a friendly message. */
export const mapNudgeError = (message?: string | null): string | null => {
  if (!message) return null;
  if (message.includes("NUDGE_SELF_NOT_ALLOWED")) return "You can't nudge yourself.";
  if (message.includes("NUDGE_QUEST_COMPLETED"))
    return "This sidequest is completed, so nudges are off.";
  if (message.includes("NUDGE_RECIPIENT_NOT_PARTICIPANT"))
    return "You can only nudge people who have joined this sidequest.";
  if (message.includes("NUDGE_RECIPIENT_THROTTLED"))
    return "You already nudged this person in the last 24 hours.";
  if (message.includes("NUDGE_HOURLY_LIMIT_REACHED")) return NUDGE_HOURLY_LIMIT_MESSAGE;
  if (message.includes("NUDGE_DAILY_LIMIT_REACHED")) return NUDGE_DAILY_LIMIT_MESSAGE;
  return null;
};
