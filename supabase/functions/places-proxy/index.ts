import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

// Simple per-instance rate limiter — 30 requests / minute / user.
const buckets = new Map<string, { count: number; resetAt: number }>();
function rateLimit(userId: string): boolean {
  const now = Date.now();
  const b = buckets.get(userId);
  if (!b || b.resetAt < now) {
    buckets.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (b.count >= 30) return false;
  b.count += 1;
  return true;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY not configured" }, 500);
  if (!GOOGLE_MAPS_API_KEY) return json({ error: "GOOGLE_MAPS_API_KEY not configured" }, 500);
  if (!SUPABASE_URL || !SERVICE_ROLE) return json({ error: "Supabase env not configured" }, 500);

  // Validate user JWT
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return json({ error: "Unauthorized" }, 401);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });
  const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userRes.user) return json({ error: "Unauthorized" }, 401);
  const userId = userRes.user.id;

  if (!rateLimit(userId)) return json({ error: "Too many requests" }, 429);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const action = body?.action;

  try {
    if (action === "autocomplete") {
      const input = String(body?.input || "").trim();
      const sessionToken = String(body?.sessionToken || "");
      if (input.length < 3 || input.length > 200) {
        return json({ suggestions: [] });
      }
      const r = await fetch(`${GATEWAY_URL}/places/v1/places:autocomplete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input,
          sessionToken: sessionToken || undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        console.error("autocomplete error", r.status, data);
        return json({ error: "Autocomplete failed", details: data }, 502);
      }
      const suggestions = (data?.suggestions || [])
        .map((s: any) => s?.placePrediction)
        .filter(Boolean)
        .map((p: any) => ({
          place_id: p.placeId,
          primary_text: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
          secondary_text: p.structuredFormat?.secondaryText?.text ?? "",
        }));
      return json({ suggestions });
    }

    if (action === "details") {
      const placeId = String(body?.placeId || "").trim();
      const sessionToken = String(body?.sessionToken || "");
      if (!placeId || !/^[A-Za-z0-9_\-]{5,200}$/.test(placeId)) {
        return json({ error: "Invalid placeId" }, 400);
      }

      // Cache lookup
      const { data: cached } = await supabase
        .from("place_cache")
        .select("place_id, formatted_address, latitude, longitude")
        .eq("place_id", placeId)
        .maybeSingle();
      if (cached) {
        return json({
          place_id: cached.place_id,
          formatted_address: cached.formatted_address,
          latitude: Number(cached.latitude),
          longitude: Number(cached.longitude),
          cached: true,
        });
      }

      const r = await fetch(`${GATEWAY_URL}/places/v1/places/${encodeURIComponent(placeId)}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask": "id,formattedAddress,location,displayName",
          ...(sessionToken ? { "X-Goog-Session-Token": sessionToken } : {}),
        },
      });
      const data = await r.json();
      if (!r.ok) {
        console.error("details error", r.status, data);
        return json({ error: "Details lookup failed", details: data }, 502);
      }
      const lat = data?.location?.latitude;
      const lng = data?.location?.longitude;
      const formatted = data?.formattedAddress || data?.displayName?.text || "";
      if (typeof lat !== "number" || typeof lng !== "number" || !formatted) {
        return json({ error: "Place has no coordinates" }, 404);
      }
      await supabase.from("place_cache").upsert({
        place_id: placeId,
        formatted_address: formatted,
        latitude: lat,
        longitude: lng,
        raw: { displayName: data?.displayName },
      });
      return json({
        place_id: placeId,
        formatted_address: formatted,
        latitude: lat,
        longitude: lng,
        cached: false,
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    console.error("places-proxy error", e);
    return json({ error: e?.message || "Server error" }, 500);
  }
});