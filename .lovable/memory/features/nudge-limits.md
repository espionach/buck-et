---
name: Nudge Limits
description: Product and rate limits for nudging — participants only, per-recipient throttle, owner hourly/daily caps, no self or post-completion nudges
type: feature
---
Nudging rules (enforced by the `enforce_nudge_limits` trigger on quest_nudges, mirrored in NudgeModal UI):
- Recipients: ONLY current participants of the sidequest. A nudge is a reminder, not an invite-to-join — the friend-profile "nudge to join" CTA and NudgeQuestPicker were removed for this reason.
- Same participant: 1 nudge per 24 hours per sidequest.
- Owner totals: max 20 nudges/hour and max 50 nudges/24 hours across all sidequests.
- No self-nudges; no nudges once the sidequest is completed.
- Constants + error mapping live in src/lib/nudgeLimits.ts; DB trigger messages use NUDGE_* prefixes that mapNudgeError translates.
