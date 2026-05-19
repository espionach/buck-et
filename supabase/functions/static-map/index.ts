const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Simple in-memory cache so the same pin doesn't re-fetch on every render.
const imageCache = new Map<string, { bytes: Uint8Array; type: string; at: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
    return new Response("Maps not configured", { status: 500, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const lat = parseFloat(url.searchParams.get("lat") || "");
  const lng = parseFloat(url.searchParams.get("lng") || "");
  const zoom = Math.min(20, Math.max(1, parseInt(url.searchParams.get("zoom") || "15", 10)));
  const w = Math.min(640, Math.max(100, parseInt(url.searchParams.get("w") || "600", 10)));
  const h = Math.min(640, Math.max(80, parseInt(url.searchParams.get("h") || "200", 10)));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return new Response("Invalid coordinates", { status: 400, headers: corsHeaders });
  }

  const key = `${lat.toFixed(6)},${lng.toFixed(6)}|${zoom}|${w}x${h}`;
  const hit = imageCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) {
    return new Response(hit.bytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": hit.type,
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: String(zoom),
    size: `${w}x${h}`,
    scale: "2",
    markers: `color:0x111827|${lat},${lng}`,
  });

  const r = await fetch(`https://connector-gateway.lovable.dev/google_maps/maps/api/staticmap?${params}`, {
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
    },
  });
  if (!r.ok) {
    const text = await r.text();
    console.error("static-map error", r.status, text);
    return new Response("Map fetch failed", { status: 502, headers: corsHeaders });
  }
  const bytes = new Uint8Array(await r.arrayBuffer());
  const type = r.headers.get("Content-Type") || "image/png";
  imageCache.set(key, { bytes, type, at: Date.now() });
  return new Response(bytes, {
    headers: {
      ...corsHeaders,
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400",
    },
  });
});