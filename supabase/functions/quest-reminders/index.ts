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
 *  - For timeless quests (date set, no time), send a single "day_of" reminder
 *    at ~9:00 AM in each participant's local timezone (from profiles.timezone,
 *    falling back to UTC).
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

  // Fetch all upcoming dated quests (timed AND timeless).
  // For "day_of" we need to consider any user's TZ, so widen the lower bound
  // by one day to catch users west of UTC whose local date is still "yesterday".
  const dayBefore = new Date(now - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data: quests, error: qErr } = await supabase
    .from("sidequests")
    .select("id, title, logistics_date, logistics_time, completed_at")
    .gte("logistics_date", dayBefore)
    .lte("logistics_date", horizon)
    .is("completed_at", null)
    .not("logistics_date", "is", null);

  if (qErr) {
    return new Response(JSON.stringify({ error: qErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let inserted = 0;

  // Helper: get { year, month, day, hour, minute } for `date` in `timeZone`.
  function localParts(date: Date, timeZone: string) {
    try {
      const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const parts = Object.fromEntries(
        fmt.formatToParts(date).map((p) => [p.type, p.value]),
      );
      return {
        ymd: `${parts.year}-${parts.month}-${parts.day}`,
        hour: Number(parts.hour),
        minute: Number(parts.minute === "60" ? "0" : parts.minute),
      };
    } catch {
      // Invalid TZ — fall back to UTC.
      return {
        ymd: date.toISOString().slice(0, 10),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
      };
    }
  }

  for (const q of quests ?? []) {
    if (!q.logistics_date) continue;

    const isTimed = !!q.logistics_time;
    let kind: "24h" | "1h" | "day_of" | null = null;

    if (isTimed) {
      // Combine date + time as UTC. (We don't know user TZ; UTC is the contract.)
      const startMs = Date.parse(`${q.logistics_date}T${q.logistics_time}Z`);
      if (Number.isNaN(startMs)) continue;
      const minutesUntil = (startMs - now) / 60000;
      if (minutesUntil >= 23 * 60 && minutesUntil <= 25 * 60) kind = "24h";
      else if (minutesUntil >= 45 && minutesUntil <= 75) kind = "1h";
      if (!kind) continue;
    } else {
      // Timeless: defer to per-user check below — just mark this for handling.
      kind = "day_of";
    }

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
    let candidates = userIds.filter((u) => !sentSet.has(u));
    if (candidates.length === 0) continue;

    // For timeless "day_of", only include users whose LOCAL time right now is
    // 09:00–09:30 on the quest's date.
    if (kind === "day_of") {
      const { data: tzRows } = await supabase
        .from("profiles")
        .select("user_id, timezone")
        .in("user_id", candidates);
      const tzMap = new Map<string, string>(
        (tzRows ?? []).map((r: { user_id: string; timezone: string | null }) => [
          r.user_id,
          r.timezone || "UTC",
        ]),
      );
      const nowDate = new Date(now);
      candidates = candidates.filter((uid) => {
        const tz = tzMap.get(uid) || "UTC";
        const { ymd, hour, minute } = localParts(nowDate, tz);
        if (ymd !== q.logistics_date) return false;
        const totalMin = hour * 60 + minute;
        return totalMin >= 9 * 60 && totalMin <= 9 * 60 + 30;
      });
      if (candidates.length === 0) continue;
    }

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

    const label =
      kind === "24h" ? "tomorrow" : kind === "1h" ? "in 1 hour" : "today";
    const message =
      kind === "day_of"
        ? `'${q.title}' is ${label}`
        : `'${q.title}' is starting ${label}`;

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