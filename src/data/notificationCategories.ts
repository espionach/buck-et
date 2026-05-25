/**
 * Single source of truth for notification taxonomy.
 *
 * Drives:
 *  - Settings → Notification Settings toggle list (grouped by section)
 *  - NotificationPanel grouping (each notification's `type` is mapped to a section)
 *  - Helper for deciding whether to fire a notification (respects user prefs)
 */

export type NotifSection =
  | "social"
  | "your_quests"
  | "activity"
  | "updates";

/**
 * All notification `type` values the app produces.
 * Stored as plain text on `notifications.type`, so this list IS the schema.
 */
export type NotificationType =
  // Social
  | "friend_request"
  | "friend_accepted"
  | "friend_new_quest"
  // Groups & Invitations
  | "board_invitation"
  | "removed_from_group"
  | "removed_from_quest"
  | "transfer_quest"
  | "transfer_group"
  | "transfer_declined"
  // Your Quests
  | "new_participant"
  | "new_contribution"
  | "photo_added"
  // Activity & Comments
  | "new_comment"
  | "comment_reply"
  // Updates & Reminders
  | "new_quest_in_group"
  | "quest_updated"
  | "quest_canceled"
  | "quest_reminder"
  // Nudges
  | "nudge"
  // Legacy — kept for back-compat with old rows
  | "follow_request";

/**
 * The boolean columns on `notification_preferences`.
 * Each notification `type` maps to one of these.
 */
export type NotifPrefKey =
  | "notify_friend_request"          // virtual — friend requests are always shown (no opt-out)
  | "notify_friend_accepted"
  | "notify_friend_new_quest"
  | "notify_group_invitation"
  | "notify_removed_from_group_or_quest"
  | "notify_ownership_transfer"
  | "notify_quest_join"
  | "notify_new_contribution"
  | "notify_photo_added"
  | "notify_new_comment"             // virtual — comments on own quest are always notified
  | "notify_comment_reply"
  | "notify_new_quest_in_group"
  | "notify_new_quest_from_friend"   // alias used by `friend_new_quest`
  | "notify_quest_updated"
  | "notify_quest_canceled"
  | "notify_quest_reminder";

/** Real DB columns on `notification_preferences`. The two "virtual" keys above are NOT in DB. */
export const DB_PREF_KEYS = [
  "notify_friend_accepted",
  "notify_friend_new_quest",
  "notify_group_invitation",
  "notify_removed_from_group_or_quest",
  "notify_ownership_transfer",
  "notify_quest_join",
  "notify_new_contribution",
  "notify_photo_added",
  "notify_comment_reply",
  "notify_new_quest_in_group",
  "notify_new_quest_from_friend",
  "notify_quest_updated",
  "notify_quest_canceled",
  "notify_quest_reminder",
] as const;

export type DbPrefKey = (typeof DB_PREF_KEYS)[number];

/** Maps a notification type → which pref controls it (or null if always-on). */
export const TYPE_TO_PREF: Record<NotificationType, DbPrefKey | null> = {
  friend_request: null, // always shown
  friend_accepted: "notify_friend_accepted",
  friend_new_quest: "notify_friend_new_quest",
  board_invitation: "notify_group_invitation",
  removed_from_group: "notify_removed_from_group_or_quest",
  removed_from_quest: "notify_removed_from_group_or_quest",
  transfer_quest: "notify_ownership_transfer",
  transfer_group: "notify_ownership_transfer",
  transfer_declined: "notify_ownership_transfer",
  new_participant: "notify_quest_join",
  new_contribution: "notify_new_contribution",
  photo_added: "notify_photo_added",
  new_comment: null, // always shown — it's on YOUR quest
  comment_reply: "notify_comment_reply",
  new_quest_in_group: "notify_new_quest_in_group",
  quest_updated: "notify_quest_updated",
  quest_canceled: "notify_quest_canceled",
  quest_reminder: "notify_quest_reminder",
  follow_request: null,
};

/** Which section a given notification `type` belongs to in the panel. */
export const TYPE_TO_SECTION: Record<NotificationType, NotifSection> = {
  friend_request: "social",
  friend_accepted: "social",
  friend_new_quest: "social",
  // Group-related types are intentionally hidden from the notification panel
  // so users cannot infer membership in private launch lists others created.
  board_invitation: "updates",
  removed_from_group: "updates",
  removed_from_quest: "updates",
  transfer_quest: "updates",
  transfer_group: "updates",
  transfer_declined: "updates",
  new_participant: "your_quests",
  new_contribution: "your_quests",
  photo_added: "your_quests",
  new_comment: "activity",
  comment_reply: "activity",
  new_quest_in_group: "updates",
  quest_updated: "updates",
  quest_canceled: "updates",
  quest_reminder: "updates",
  follow_request: "social",
};

export const SECTION_LABEL: Record<NotifSection, string> = {
  social: "Social",
  your_quests: "Your Quests",
  activity: "Activity & Comments",
  updates: "Updates & Reminders",
};

/** Order of sections in both Settings and the panel. */
export const SECTION_ORDER: NotifSection[] = [
  "social",
  "your_quests",
  "activity",
  "updates",
];

/** Toggle definitions for the Settings → Notification Settings panel. */
export interface SettingsToggle {
  key: DbPrefKey;
  label: string;
  hint?: string;
}

export const SETTINGS_TOGGLES: Record<NotifSection, SettingsToggle[]> = {
  social: [
    { key: "notify_friend_accepted", label: "Friend request accepted" },
    {
      key: "notify_friend_new_quest",
      label: "Friend started a quest",
      hint: "Sent occasionally — at most once per friend per week.",
    },
  ],
  your_quests: [
    { key: "notify_quest_join", label: "Someone joined your quest" },
    { key: "notify_new_contribution", label: "New contribution on your quest" },
    { key: "notify_photo_added", label: "Photo added" },
  ],
  activity: [
    { key: "notify_comment_reply", label: "Replies to your comments" },
  ],
  updates: [
    { key: "notify_quest_updated", label: "Quest updates" },
    { key: "notify_quest_canceled", label: "Quest canceled" },
    { key: "notify_quest_reminder", label: "Reminders" },
  ],
};

/** Friend-quest digest cap — see `friend_new_quest` throttling logic. */
export const FRIEND_NEW_QUEST_TOP_FRIENDS = 5;
/** Throttle window for `friend_new_quest`: at most one per friend per 7 days. */
export const FRIEND_NEW_QUEST_WINDOW_DAYS = 7;