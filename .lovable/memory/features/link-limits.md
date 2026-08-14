---
name: Sidequest link limits
description: Max 5 links per sidequest, server-side URL validation, no preview metadata
type: feature
---
- Max 5 links per sidequest. Enforced server-side by the `validate_sidequest_links` trigger on `public.sidequests` (INSERT / UPDATE OF links) and client-side in `src/lib/linkLimits.ts` for UX.
- Links must be http/https, max 2048 chars, no whitespace, valid hostname (localhost allowed). Bare hosts typed by users get `https://` prepended.
- Duplicate links per sidequest are rejected client-side.
- No link preview/OG metadata fetching — links render as plain URLs.
- Server errors `LINK_LIMIT_REACHED` / `LINK_INVALID` map to friendly toasts via `mapLinkError`.
