# Nudge Feature Plan

Let quest owners "nudge" friends/group members from the quest details page.

## UX

**In the "Who's In" box on `QuestDetail` (owner only):**
- A new `Send a nudge` button under the participant chips with a one-line description: *"Give friends a friendly poke to join or remember this quest."*

**Nudge picker modal (full-screen sheet on mobile):**
- Header: "Send a nudge" + close (X).
- Sticky search bar at top (filter by name/username).
- List of candidates, one row each:
  - Avatar + name + @username
  - Right side: tap-target circle. Unselected = empty outline circle. Selected = filled orange circle with white check.
- **Candidate pool:** all friends for a friends-only quest, or all members of the group for a group quest (excluding the owner). Participants are included and shown with a small "Joined" pill so the owner knows.
- Optional **note field** (single line, ~140 chars, placeholder "Add a note (optional)").
- Floating sticky bottom bar appears when ≥1 person is selected: orange `Send a nudge! (N)` button. Hidden when 0 selected.
- Per-recipient throttle: if a person was nudged for this quest in the last 24h, their row is disabled with a "Nudged recently" subtext and they can't be selected.

**Recipient side:**
- Inbox notification (bell badge increments) of type `nudge`, deep-linking to the quest.
- In-app toast pops if they're active in the app at delivery time (via existing realtime notifications channel).
- True device push is out of scope for this change — the app isn't wrapped with Capacitor/PWA push yet; the inbox + realtime toast is what's wired today. I'll call this out so we can layer real push later without rework.

## Technical details

**Database (migration):**
- Add `'nudge'` as an allowed value wherever notification `type` is constrained (currently free-text, so no schema change needed — just use `type = 'nudge'`).
- New table `quest_nudges` (for the 24h throttle + audit):
  - `id`, `sidequest_id`, `from_user_id` (owner), `to_user_id`, `note text`, `created_at`.
  - Unique-ish lookup index on `(sidequest_id, to_user_id, created_at desc)`.
  - RLS: insert only if `auth.uid() = from_user_id` AND caller is the quest owner (`is_sidequest_owner`). Select rows where `from_user_id = auth.uid() OR to_user_id = auth.uid()`.

**Notification row** (existing `notifications` table):
- `type = 'nudge'`, `from_user_id = owner`, `user_id = recipient`, `entity_id = quest.id`, `message` = owner's note or default `"<Owner name> nudged you about <Quest title>"`.

**Frontend:**
- New component `src/components/NudgeModal.tsx` — search, list, selection state, send action.
- Hook `useCandidatesForNudge(quest)` — friends list for friends-only quest, group members for group quest.
- Wire into `QuestDetail.tsx` Who's-In section, owner-gated.
- Send flow: client-side check against `quest_nudges` for last-24h dedupe (defense-in-depth; the candidate list already filters them out), insert one `quest_nudges` row + one `notifications` row per recipient. Toast "Nudge sent!".
- Notification rendering: extend the inbox/notification panel renderer to handle `type = 'nudge'` — icon (Hand or Bell), label, tap → navigate to `/quest/:id`.
- Realtime: notifications channel already exists; nudges flow through automatically as toasts.

## Out of scope
- Real device push (requires PWA service worker + push subscription or Capacitor setup; can be layered later).
- Nudging non-friends / non-group-members.
- Rich attachments on the note.
