## Make the owner-only nudge gate visible

### Root cause (confirmed)
- `quest_nudges` RLS requires `is_sidequest_owner(sidequest_id, auth.uid())`, and every UI entry point already enforces this (`QuestDetail.tsx:392` is `{isOwner && …}`; `UserProfileView.tsx:58` requires `myActiveQuests.length > 0`).
- Apple owns zero sidequests in the DB. There is no nudge button anywhere apple can press, so nothing reaches potato. Not a Realtime, RLS, or insert bug — a UX/discoverability bug: the gate is silent.

### Fix: surface the gate, don't change behavior

1. **`src/components/UserProfileView.tsx`** — currently the "you need a quest to nudge" hint only renders inside the empty-state for the Active tab (lines 323–347). When the friend has active quests, the empty-state never shows and the viewer with no quests of their own gets zero explanation.
   - When viewing **someone else's** profile (`user.id !== currentUser.id`) and `myActiveQuests.length === 0`, render a small persistent banner above the tabs (regardless of whether the friend has quests). Copy: "Create a sidequest to nudge {firstName}." with a "Create sidequest" button that navigates to `/create`.
   - Keep existing empty-state copy as-is.

2. **`src/pages/QuestDetail.tsx`** — the "Send a nudge" tile (lines 392–409) is wrapped in `{isOwner && …}`. For non-owners viewing a friend's quest, add a small muted hint in the same slot: "Only {ownerFirstName} can nudge people about this sidequest." No CTA, just clarity.

3. **Optional safety net in `NudgeModal.tsx`** — `handleSend` currently swallows nothing but the catch-all toast says "Couldn't send nudge" with no detail. Add the actual `error.message` (or a mapped message for permission-denied) to the toast so future RLS regressions surface immediately during testing. Pure improvement to debuggability; no behavior change.

### Out of scope
- No DB changes — `quest_nudges` RLS and ownership model stay as-is.
- No realtime subscription added to `notifications`; that's a separate concern and the user didn't ask for live updates.
- No change to the `NudgeQuestPicker` flow — it's already gated by `myActiveQuests.length > 0`.

### Files touched
- `src/components/UserProfileView.tsx`
- `src/pages/QuestDetail.tsx`
- `src/components/NudgeModal.tsx`
