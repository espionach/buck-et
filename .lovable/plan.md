# Smart location for sidequests

Replace the plain "location" text field with a Google-powered address autocomplete, a small embedded map preview while creating/editing, and an "Open in Maps" link on the quest detail page. Resolved coordinates are saved so we don't re-query Google on every view.

## What changes for users

**Create / Edit Sidequest**
- Location field becomes a search box. As you type (after a short pause), real places appear in a dropdown — venue name + address.
- Pick one → field fills with the formatted address, and a small map preview appears below the field with a pin on the spot.
- You can still type a free-form location and skip the suggestions (e.g. "My place"). No map shows in that case.
- A small "Clear" affordance removes the picked place.

**Quest Detail**
- Location row shows the address as today.
- If coordinates are saved, an "Open in Maps" button appears next to it. On iOS it opens Apple Maps; on Android/desktop it opens Google Maps. No embedded map on the detail page (per your direction — only on create).

## Technical plan

### 1. Connector + secrets
- Connect the **Google Maps Platform** connector (managed connection). This provisions:
  - `GOOGLE_MAPS_API_KEY` (server, for the gateway)
  - `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY` (referrer-restricted, safe in browser — used only to render the small map preview)
- All Places autocomplete + Place Details + Geocoding calls go **server-side through the connector gateway**, never directly from the browser. This keeps the browser key narrowly scoped and lets us cache.

### 2. Database (migration)
Add to `public.sidequests`:
- `logistics_latitude` numeric, nullable
- `logistics_longitude` numeric, nullable
- `logistics_place_id` text, nullable — Google place_id so we can de-dupe lookups

New table `public.place_cache` (shared cache, app-wide):
- `place_id` text primary key
- `formatted_address` text
- `latitude` numeric, `longitude` numeric
- `raw` jsonb (display name, types — for future use)
- `fetched_at` timestamptz default now()
- RLS: any authenticated user can SELECT; only the edge function (service role) writes.

### 3. Edge function: `places-proxy`
One function with two actions, keeps the API key server-side and lets us cache:
- `action: "autocomplete"` → calls `places/v1/places:autocomplete` (Places API New) with the user's input + a session token. Returns a trimmed list `{ place_id, primary_text, secondary_text }`.
- `action: "details"` → looks up `place_cache` first; on miss, calls `places/v1/places/{placeId}` with a `X-Goog-FieldMask` limited to `id,formattedAddress,location,displayName`, stores in `place_cache`, returns `{ place_id, formatted_address, latitude, longitude }`.
- Input validated with Zod, rate-limited per user (simple in-memory token bucket — acceptable for current scale, with a note to upgrade later), and requires a valid JWT.

### 4. Frontend
- New component `src/components/LocationPicker.tsx`:
  - Debounced (300ms) input that calls `places-proxy` autocomplete.
  - Dropdown of suggestions. Selecting one calls `places-proxy` details and lifts `{ address, lat, lng, place_id }` to the parent.
  - If the user types but doesn't pick, we still keep the raw text (no coords).
  - Small `MapPreview` (~160px tall, rounded) renders a static map using Google's **Maps Static API** through the connector gateway as a `<img>` src wrapped by a signed proxy — simplest implementation: an edge function `static-map` that streams the bytes through, so the browser key isn't needed at all. Alternative: use the JS Maps API with the browser key. We'll go with the **static map via edge function** for fewer moving parts and zero extra JS payload.
- Update `CreateQuest.tsx` to use `LocationPicker` and persist `latitude`, `longitude`, `place_id` alongside `logistics_location`.
- Update `QuestDetail.tsx` to render an "Open in Maps" button when coords exist. Link format: `https://www.google.com/maps/search/?api=1&query=<lat>,<lng>&query_place_id=<place_id>` (works cross-platform; iOS users with Google Maps installed get it, others fall through to the web map; Apple Maps deep-link also added as a secondary option via `maps://` UA sniff is optional — recommend the universal Google link to keep it simple).

### 5. Cost controls (your asks)
- **Caching**: place details cached in `place_cache` table (forever, with a manual refresh path later if needed). Autocomplete uses session tokens so Google bills one Place Details lookup per session rather than per keystroke.
- **Field masks**: every Places call uses a minimal `X-Goog-FieldMask` to stay in the cheaper tier.
- **Debounce + min length**: no autocomplete request until ≥3 chars and 300ms idle.
- **Rate limit**: edge function caps requests per user per minute.
- **API key restrictions**: browser key isn't shipped to the client at all (we proxy the static map), so referrer restrictions on it don't matter for this feature. Server key is workspace-scoped via the connector gateway.
- **Billing alerts / hard caps**: these are set in Google Cloud Console on the underlying project. With the **managed** Lovable connector, billing lives on Lovable's side and you can't set caps there — I'll call this out. If you want hard spend caps you can enforce, we'd switch to a **custom** Google Maps connection using your own GCP project, where you control budgets and quotas. Want me to set that up instead?

## Open question

The managed Google Maps connector doesn't let you set your own billing alerts or spending caps — those live on the underlying Google Cloud project. If hard caps matter, we should use a custom connection with your own Google Cloud key. Two options:

1. **Ship with the managed connector now** (fastest; usage is included in your Lovable plan, no GCP setup).
2. **Use your own Google Cloud key** (you get budget alerts, quotas, hard caps; requires ~10 min of GCP setup on your end before we wire it up).

Tell me which you prefer when you approve the plan and I'll proceed accordingly.