
# Contact Import & Friend Discovery — Architecture Plan

Goal: let users discover which of their phone contacts are already on SideQuest and invite the rest, while respecting privacy (mutual-friendship model, profiles private by default).

## Recommendation summary

- **Mobile contact access:** native via Capacitor (`@capacitor-community/contacts`), gated behind an explicit in-app permission screen with clear copy. Web fallback: manual email/phone invite + share link.
- **Contacts stay device-only.** We never upload raw contact books. Only short-lived, salted hashes of normalized identifiers are sent for matching, and they are not persisted server-side.
- **Matching by hashed identifiers** (SHA-256 over a server-issued salt + normalized E.164 phone / lowercased email). Phones currently aren't stored on `profiles`, so we'd add an optional, hashed-only identifier table — never the raw value.
- **Non-user contacts:** never stored on the server. Invite flow uses the OS share sheet / `mailto:` / `sms:` with a referral link; no shadow profiles.
- **Retention:** matches are computed in-memory in an edge function and returned to the client. Nothing about the user's address book is written to the DB.

---

## 1. Mobile contact access

Two-tier approach:

- **Native (Capacitor app):** `@capacitor-community/contacts`. Request permission only when the user taps "Find friends from contacts" — not at app launch. Show a pre-prompt explaining what we do and don't do with contacts.
- **Web (PWA):** browsers have no Contacts API on iOS and only a limited Picker on Android Chrome. Fall back to: paste an email, share an invite link, or QR code.

Required UI:
- New `FindFriends` page (entry from Friends tab and onboarding step "Find people you know").
- Pre-permission screen → OS permission → results screen (matched users + invitable contacts).
- Settings toggle: "Allow contact matching" (off by default).

## 2. Device-only vs upload

**Device-only.** We never persist the address book. Trade-offs considered:

| Option | Pros | Cons |
|---|---|---|
| Upload raw contacts | Easier "people you may know" suggestions later | Major privacy liability, GDPR/CCPA disclosure burden, shadow-profile risk |
| Upload hashes, store them | Enables reverse-match (notify A when their contact B joins later) | Still PII-equivalent under GDPR; rainbow-table risk on weak identifiers like phone numbers |
| **Hash on device, match in-memory, store nothing (chosen)** | Strongest privacy story, matches app's "private by default" stance | No reverse-match — user must re-run discovery to find newly joined contacts |

The "no reverse-match" downside is acceptable: surface a "Refresh" action on the Find Friends screen, and prompt re-run after a friend invite is sent.

## 3. Hashing strategy

- **Normalization (client):**
  - Phones → E.164 using `libphonenumber-js` with the device region.
  - Emails → trim + lowercase. For gmail.com, optionally strip `+suffix` and dots (configurable; default off to avoid surprises).
- **Salt:** server-issued, per-request, short-lived (e.g. 60s TTL) via an edge function `contact-discovery-salt`. This prevents clients from precomputing hashes against the whole user base offline.
- **Hash:** `SHA-256(salt || ":" || identifier)`, base64url.
- **Match call:** client posts the array of hashes (capped, e.g. 2000 per call, batched) to edge function `contact-discovery-match`. The function hashes each candidate identifier in `contact_identifiers` with the same salt and returns intersection rows (`user_id`, `display_name`, `username`, `avatar_url`).
- **No raw identifiers in logs.** Edge function logs only counts.

Why a salt at all if we already hash? Phone numbers have ~10^10 entropy — trivial to rainbow-table SHA-256 of all US numbers. A per-request salt makes any leak of the request payload useless after the TTL.

## 4. Schema changes

New table `contact_identifiers` — opt-in, stores **only hashes** of the user's own verifiable identifiers so others can find them:

```
contact_identifiers
  id            uuid pk
  user_id       uuid not null            -- owner
  kind          text check in ('phone','email')
  hash_sha256   bytea not null           -- SHA-256 of normalized identifier, no salt (server re-salts at match time)
  verified_at   timestamptz              -- only verified ids participate in matching
  created_at    timestamptz default now()
  unique (kind, hash_sha256)
```

Notes:
- We store an **unsalted** hash here, then re-hash with the per-request salt inside the edge function before comparing to the client's salted hashes. The stored hash is still not the raw value, and the table is never exposed via PostgREST (see RLS).
- Email rows are populated automatically on signup/verification from `auth.users.email`.
- Phone rows are added only when the user explicitly verifies a phone (out of scope for v1 — we can ship email-only matching first).

New table `contact_discovery_consents` — audit of who enabled the feature and when (helps with GDPR DSARs):

```
contact_discovery_consents
  user_id      uuid pk
  enabled      boolean not null
  updated_at   timestamptz default now()
```

RLS:
- `contact_identifiers`: no `SELECT` for `anon`/`authenticated`. Only the edge function (service role) reads it. Users may `DELETE` their own rows.
- `contact_discovery_consents`: user can `SELECT`/`UPDATE` their own row.
- Standard GRANTs alongside.

No changes to `profiles` (keeps it lean and avoids leaking phone presence via profile reads).

## 5. Non-user contacts

- Not stored. Period.
- After matching, the client diff'd locally between "matched" and "not matched" contacts. For the non-matched set we show name + email/phone (from the device) and an "Invite" button that opens the OS share sheet (`navigator.share`) or `mailto:` / `sms:` with a personalized referral URL `https://…/invite/<token>`.
- Invite tokens (optional, v2) live in a `friend_invite_links` table tied to the inviter; they don't reference any contact identifier.

## 6. Deletion & retention

- **Address book:** never persisted → nothing to delete.
- **Per-request hashes:** held in edge function memory for the duration of the call; never logged, never written.
- **`contact_identifiers`:** user can disable contact discovery in Settings → triggers `DELETE FROM contact_identifiers WHERE user_id = auth.uid()`. Also deleted on account deletion via cascade in the existing account-deletion flow.
- **Consent log:** retained for the lifetime of the account for audit purposes, deleted with the account.
- **Salts:** stored in Redis-style memory or signed JWT with 60s exp — no DB row.

## 7. Edge functions

- `contact-discovery-salt` (verify_jwt = true): returns `{ salt, expires_at }`.
- `contact-discovery-match` (verify_jwt = true): body `{ salt, hashes: string[] }`. Validates salt freshness, looks up `contact_identifiers`, returns matched public profile fields. Rate-limited per user (e.g. 10 calls / 10 min, 2000 hashes / call).

## 8. UX additions

- Friends tab → "Find friends from contacts" entry.
- Onboarding optional step.
- Settings → Privacy → "Allow contact matching" toggle (default off) + "Delete my contact hashes" button.
- Privacy Policy section describing the flow.

## 9. Rollout

1. v1: **email-only matching** (no phone permission needed, works on web + native), `contact_identifiers` auto-populated from verified emails, `FindFriends` screen with manual email entry + paste list.
2. v1.5: native contacts permission + bulk hashed match on mobile.
3. v2: phone verification + phone hashing, invite tokens with attribution.

## Open questions for you

1. Ship **email-only v1 first**, or wait and do phones + emails together?
2. Should enabling contact discovery be **opt-in via Settings** (recommended) or **prompted during onboarding**?
3. Are you OK with the **no-reverse-match** trade-off (privacy win, but users must re-run discovery to catch newly joined contacts)?
4. PWA or native Capacitor app — has that been decided? It affects what we can ship in v1.5.
