import { supabase } from "@/integrations/supabase/client";
import {
  NotificationType,
  TYPE_TO_PREF,
  FRIEND_NEW_QUEST_TOP_FRIENDS,
  FRIEND_NEW_QUEST_WINDOW_DAYS,
} from "@/data/notificationCategories";

/**
 * Insert a notification for one or many recipients, after checking each
 * recipient's `notification_preferences`. Recipients who blocked the sender
 * (or who the sender blocked) are skipped automatically by the RLS check on
 * `notifications`, but we also gate on prefs here so unwanted rows aren't
 * even attempted.
 *
 * Pass `recipientIds` excluding the sender; this helper will not auto-strip.
 */
export async function notifyUsers(params: {
  recipientIds: string[];
  fromUserId: string;
  type: NotificationType;
  message: string;
  entityId?: string | null;
  groupId?: string | null;
  groupName?: string | null;
  commentId?: string | null;
}) {
  const {
    recipientIds,
    fromUserId,
    type,
    message,
    entityId = null,
    groupId = null,
    groupName = null,
    commentId = null,
  } = params;

  const dedupRecipients = Array.from(new Set(recipientIds.filter((id) => id && id !== fromUserId)));
  if (dedupRecipients.length === 0) return;

  const prefKey = TYPE_TO_PREF[type];

  // Filter recipients by their preference (default ON if no row exists).
  let allowed = dedupRecipients;
  if (prefKey) {
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select(`user_id, ${prefKey}`)
      .in("user_id", dedupRecipients);

    const optedOut = new Set(
      (prefs || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((p: any) => p[prefKey] === false)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => p.user_id as string)
    );
    allowed = dedupRecipients.filter((id) => !optedOut.has(id));
  }

  if (allowed.length === 0) return;

  const rows = allowed.map((uid) => ({
    user_id: uid,
    from_user_id: fromUserId,
    type,
    message,
    entity_id: entityId,
    group_id: groupId,
    group_name: groupName,
    comment_id: commentId,
  }));

  await supabase.from("notifications").insert(rows);
}

/**
 * "Friend started a quest" — occasional digest.
 *
 * Rules:
 *  - At most one notification per (recipient, sender) per FRIEND_NEW_QUEST_WINDOW_DAYS.
 *  - Only the sender's TOP `FRIEND_NEW_QUEST_TOP_FRIENDS` closest friends receive it.
 *    "Closest" = friends ranked by total mutual interactions:
 *      shared sidequest participations + shared group memberships.
 */
export async function notifyFriendNewQuest(params: {
  fromUserId: string;
  questId: string;
  questTitle: string;
}) {
  const { fromUserId, questId, questTitle } = params;

  // 1. Get all friends of the sender.
  const { data: friendRows } = await supabase
    .from("friendships")
    .select("user_id, friend_id")
    .or(`user_id.eq.${fromUserId},friend_id.eq.${fromUserId}`);
  const friendIds = Array.from(
    new Set(
      (friendRows || []).map((f) => (f.user_id === fromUserId ? f.friend_id : f.user_id))
    )
  );
  if (friendIds.length === 0) return;

  // 2. Score "closeness" for each friend.
  // 2a. Shared sidequest participations.
  const { data: myParts } = await supabase
    .from("sidequest_participants")
    .select("sidequest_id")
    .eq("user_id", fromUserId);
  const myQuestIds = (myParts || []).map((p) => p.sidequest_id);
  const sharedQuestCounts = new Map<string, number>();
  if (myQuestIds.length > 0) {
    const { data: friendParts } = await supabase
      .from("sidequest_participants")
      .select("user_id, sidequest_id")
      .in("sidequest_id", myQuestIds)
      .in("user_id", friendIds);
    (friendParts || []).forEach((p) => {
      sharedQuestCounts.set(p.user_id, (sharedQuestCounts.get(p.user_id) || 0) + 1);
    });
  }

  // 2b. Shared group memberships.
  const { data: myGroups } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", fromUserId);
  const myGroupIds = (myGroups || []).map((g) => g.group_id);
  const sharedGroupCounts = new Map<string, number>();
  if (myGroupIds.length > 0) {
    const { data: friendGroups } = await supabase
      .from("group_members")
      .select("user_id, group_id")
      .in("group_id", myGroupIds)
      .in("user_id", friendIds);
    (friendGroups || []).forEach((g) => {
      sharedGroupCounts.set(g.user_id, (sharedGroupCounts.get(g.user_id) || 0) + 1);
    });
  }

  // 3. Rank and pick top N.
  const ranked = friendIds
    .map((id) => ({
      id,
      score: (sharedQuestCounts.get(id) || 0) + (sharedGroupCounts.get(id) || 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, FRIEND_NEW_QUEST_TOP_FRIENDS)
    .map((r) => r.id);

  if (ranked.length === 0) return;

  // 4. Throttle: skip recipients who already got this notification from this
  //    sender within the window.
  const cutoff = new Date(Date.now() - FRIEND_NEW_QUEST_WINDOW_DAYS * 24 * 3600 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("notifications")
    .select("user_id")
    .eq("type", "friend_new_quest")
    .eq("from_user_id", fromUserId)
    .in("user_id", ranked)
    .gte("created_at", cutoff);
  const throttled = new Set((recent || []).map((r) => r.user_id));
  const recipients = ranked.filter((id) => !throttled.has(id));

  if (recipients.length === 0) return;

  await notifyUsers({
    recipientIds: recipients,
    fromUserId,
    type: "friend_new_quest",
    message: `started a new quest: '${questTitle}'`,
    entityId: questId,
  });
}