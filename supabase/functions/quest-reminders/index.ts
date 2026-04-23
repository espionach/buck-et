import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Scheduled scanner: inserts `quest_reminder` notifications for joined
 * participants when a quest's start time is approaching.
 *
 * Rules:
 *  - Send a "24h before" reminder when start time is within [23h, 25h] from now.
 *  - Send a "1h before"  reminder when start time is within [45m, 75m] from now.
 *  - Skip quests with no `logistics_time` (timeless quests don't get reminders).
 *  - Each (quest, user, kind) is sent at most once — recorded in `quest_reminders_sent`.
 *  - Respect `notify_quest_reminder` preference (default true).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = Date.now();
  // Look ahead up to 25h so we catch both 24h and 1h windows.
  const horizon = new Date(now + 26 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const today = new Date(now).toISOString().slice(0, 10);

  // Fetch upcoming quests with both date AND time set.
  const { data: quests, error: qErr } = await supabase
    .from("sidequests")
    .select("id, title, logistics_date, logistics_time, completed_at")
    .gte("logistics_date", today)
    .lte("logistics_date", horizon)
    .is("completed_at", null)
    .not("logistics_time", "is", null);

  if (qErr) {
    return new Response(JSON.stringify({ error: qErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let inserted = 0;

  for (const q of quests ?? []) {
    if (!q.logistics_date || !q.logistics_time) continue;

    // Combine date + time as UTC. (We don't know user TZ; UTC is the contract.)
    const startMs = Date.parse(`${q.logistics_date}T${q.logistics_time}Z`);
    if (Number.isNaN(startMs)) continue;
    const minutesUntil = (startMs - now) / 60000;

    let kind: "24h" | "1h" | null = null;
    if (minutesUntil >= 23 * 60 && minutesUntil <= 25 * 60) kind = "24h";
    else if (minutesUntil >= 45 && minutesUntil <= 75) kind = "1h";
    if (!kind) continue;

    // Joined participants for this quest.
    const { data: parts } = await supabase
      .from("sidequest_participants")
      .select("user_id")
      .eq("sidequest_id", q.id);
    const userIds = (parts ?? []).map((p) => p.user_id);
    if (userIds.length === 0) continue;

    // Filter out users who already received this reminder kind.
    const { data: alreadySent } = await supabase
      .from("quest_reminders_sent")
      .select("user_id")
      .eq("sidequest_id", q.id)
      .eq("kind", kind)
      .in("user_id", userIds);
    const sentSet = new Set((alreadySent ?? []).map((r) => r.user_id));
    const candidates = userIds.filter((u) => !sentSet.has(u));
    if (candidates.length === 0) continue;

    // Filter by notification preference (default true if no row).
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("user_id, notify_quest_reminder")
      .in("user_id", candidates);
    const optedOut = new Set(
      (prefs ?? [])
        .filter((p: { notify_quest_reminder: boolean }) => p.notify_quest_reminder === false)
        .map((p: { user_id: string }) => p.user_id),
    );
    const recipients = candidates.filter((u) => !optedOut.has(u));
    if (recipients.length === 0) continue;

    const label = kind === "24h" ? "tomorrow" : "in 1 hour";
    const message = `'${q.title}' is starting ${label}`;

    const notifRows = recipients.map((uid) => ({
      user_id: uid,
      from_user_id: null,
      type: "quest_reminder",
      message,
      entity_id: q.id,
    }));
    const { error: nErr } = await supabase.from("notifications").insert(notifRows);
    if (nErr) continue;

    const sentRows = recipients.map((uid) => ({
      sidequest_id: q.id,
      user_id: uid,
      kind,
    }));
    await supabase.from("quest_reminders_sent").insert(sentRows);
    inserted += recipients.length;
  }

  return new Response(JSON.stringify({ ok: true, inserted }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});