# Loosen content filter

Restructure `src/lib/contentFilter.ts` into three tiers and switch from substring matching to whole-word / phrase matching (with stemming for the dangerous list only).

## Tiers

**HARD BLOCK** — submission rejected, same error as today:
- Slurs: `nigger`, `faggot`, `chink`, `spic`, `kike`, `wetback`, `gook`
- Harassment / self-harm: `kys`
- Sexual violence (with stemming): `rape`, `rapist`, `raping`, `raped`, `molest`, `molester`, `molesting`, `molested`

**SOFT REVIEW** — does NOT block. Returns a warning so the UI can show a "This might violate community guidelines. Post anyway?" confirm:
- `retard`, `tranny`, `porn`, `sexvideo`, `nudes`

**ALLOWED** — removed from the list entirely:
- `fuck`, `shit`, `bitch`, `asshole`, `bastard`, `dickhead`, `dick`, `ass`, `motherfucker`, `cunt`, `nigga`, `blowjob`, `handjob`, `sex`, `fag`

## Matching rules

- Normalize by lowercasing and collapsing non-letter chars to single spaces (instead of stripping them, so word boundaries are preserved).
- Tokenize on whitespace; match whole words against the hard-block and soft-review lists. This fixes false positives like `assignment`, `class`, `Scunthorpe`, etc.
- For the sexual-violence group only, include explicit inflected forms in the list (listed above) rather than a substring scan. No general stemming engine.
- Phrase matching: support multi-word entries (e.g. `kill yourself`) by also checking the normalized full string for any phrase in the list. Add `kill yourself` to hard block alongside `kys`.

## API changes in `contentFilter.ts`

- Replace `BANNED_WORD_STEMS` with `HARD_BLOCK` and `SOFT_REVIEW` arrays.
- `containsProfanity(text)` → kept for back-compat, returns true only on HARD_BLOCK hits.
- New `checkContent(text)` returns `{ level: "clean" | "warn" | "block", message?: string }`.
- `validateContent(...parts)` returns `null` on clean/warn, error string only on block (so existing call sites keep working without UI changes).
- Export `CONTENT_WARNING_MESSAGE` for future soft-review UI.

## Out of scope

- No UI changes to the 6 call sites in this pass; they keep using `validateContent` and will simply allow more content through. Adding the "Post anyway?" confirm dialog can be a follow-up once you confirm the new lists feel right.
