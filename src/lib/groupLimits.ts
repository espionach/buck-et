/** Product limits for friend lists (called "groups" in code/DB). */
export const MAX_GROUPS_PER_USER = 50;
export const MAX_MEMBERS_PER_GROUP = 100;

export const GROUP_LIMIT_MESSAGE = `You've exceeded the max per user — you can have up to ${MAX_GROUPS_PER_USER} friend lists.`;
export const MEMBER_LIMIT_MESSAGE = `You've exceeded the max per friend list — up to ${MAX_MEMBERS_PER_GROUP} members allowed.`;
export const DUPLICATE_NAME_MESSAGE = "You already have a friend list with that name.";

/** Maps a database error into a friendly friend-list limit message. */
export const mapGroupError = (message?: string | null): string | null => {
  if (!message) return null;
  if (message.includes("GROUP_LIMIT_REACHED")) return GROUP_LIMIT_MESSAGE;
  if (message.includes("GROUP_MEMBER_LIMIT_REACHED")) return MEMBER_LIMIT_MESSAGE;
  if (
    message.includes("groups_owner_name_unique_idx") ||
    message.includes("duplicate key value")
  )
    return DUPLICATE_NAME_MESSAGE;
  return null;
};
