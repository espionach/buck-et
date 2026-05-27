// Contact discovery: match a user's address-book emails against existing
// SideQuest users using SHA-256 hashes only. Raw emails never reach this
// function or its logs.
//
// v1: email-only, unsalted SHA-256 over normalized (trimmed, lowercased) email.
// Email entropy is high enough that rainbow-table risk is acceptable for v1.
// When phone support lands (v1.5+) we will switch to per-request salted hashes
// since phone numbers are low-entropy.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_HASHES_PER_CALL = 2000;
const HEX_RE = /^[0-9a-f]{64}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ error: "server_misconfigured" }, 500);
  }

  // Authenticate caller
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return json({ error: "unauthorized" }, 401);
  }
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return json({ error: "unauthorized" }, 401);
  }
  const userId = userData.user.id;

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const hashes = (body as { hashes?: unknown })?.hashes;
  if (!Array.isArray(hashes)) {
    return json({ error: "hashes_required" }, 400);
  }
  if (hashes.length === 0) {
    return json({ matches: [] });
  }
  if (hashes.length > MAX_HASHES_PER_CALL) {
    return json({ error: "too_many_hashes", max: MAX_HASHES_PER_CALL }, 400);
  }

  // Validate and deduplicate
  const clean = new Set<string>();
  for (const h of hashes) {
    if (typeof h !== "string") continue;
    const lower = h.toLowerCase();
    if (HEX_RE.test(lower)) clean.add(lower);
  }
  if (clean.size === 0) {
    return json({ matches: [] });
  }

  // Service client for cross-user lookup
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Confirm user has consented (defense in depth — UI also enforces)
  const { data: consent } = await admin
    .from("contact_discovery_consents")
    .select("enabled")
    .eq("user_id", userId)
    .maybeSingle();
  if (!consent?.enabled) {
    return json({ error: "consent_required" }, 403);
  }

  // Convert hex hashes to bytea literals for the IN clause
  const byteaLiterals = Array.from(clean).map((h) => `\\x${h}`);

  const { data: rows, error: matchErr } = await admin
    .from("contact_identifiers")
    .select("user_id, hash_sha256")
    .eq("kind", "email")
    .in("hash_sha256", byteaLiterals);

  if (matchErr) {
    console.error("match query failed", matchErr.message);
    return json({ error: "match_failed" }, 500);
  }

  const matchedUserIds = Array.from(
    new Set(
      (rows ?? [])
        .map((r) => r.user_id as string)
        .filter((id) => id !== userId)
    )
  );

  if (matchedUserIds.length === 0) {
    return json({ matches: [] });
  }

  // Fetch public profile fields
  const { data: profiles, error: profErr } = await admin
    .from("profiles")
    .select("user_id, display_name, username, avatar_url")
    .in("user_id", matchedUserIds);

  if (profErr) {
    console.error("profile lookup failed", profErr.message);
    return json({ error: "profile_lookup_failed" }, 500);
  }

  // Build hash -> user_id map so client can correlate matches to their contacts
  const hashToUser: Record<string, string> = {};
  for (const r of rows ?? []) {
    const hex = bytesToHex(r.hash_sha256 as unknown);
    if (hex && r.user_id !== userId) hashToUser[hex] = r.user_id as string;
  }

  return json({
    matches: (profiles ?? []).map((p) => ({
      user_id: p.user_id,
      display_name: p.display_name,
      username: p.username,
      avatar_url: p.avatar_url,
    })),
    hash_to_user: hashToUser,
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Postgrest returns bytea as `\x...` hex string (default). Handle both string and Uint8Array.
function bytesToHex(v: unknown): string | null {
  if (typeof v === "string") {
    const s = v.startsWith("\\x") ? v.slice(2) : v;
    return /^[0-9a-fA-F]+$/.test(s) ? s.toLowerCase() : null;
  }
  if (v instanceof Uint8Array) {
    return Array.from(v).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return null;
}
