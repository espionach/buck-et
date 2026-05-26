# Nudge-from-empty-state CTA

## Behavior

On a friend's profile, "Active" tab empty state currently shows: "No upcoming sidequests" + "Create sidequest" CTA. Change so it depends on the **current user's** active quests:

- **Current user has ≥1 active quest** → Title: "No active sidequests yet". Message: "Nudge them to join one of yours." CTA: **Send a nudge** (orange primary button).
- **Current user has 0 active quests** → keep existing "Create sidequest" CTA (message: "Nothing planned right now. Start something they can join.").

The "Past" tab empty state is unchanged.

## Nudge flow from this CTA

Tapping **Send a nudge** opens a new lightweight picker (modal/sheet) listing the current user's active sidequests. Each row is tappable:

- Tap a quest row → navigate to `/quest/:id` (QuestDetail). The friend whose profile we came from is passed via router state as `prefillNudgeUserId`, and QuestDetail auto-opens the existing `NudgeModal` with that friend pre-selected.
- The picker has a close (X) button; QuestDetail already has back navigation. Friend's profile stays in history so back returns there.

If the current user has only 1 active quest, skip the picker and go straight to that quest with the modal pre-opened.

## Technical details

**`src/components/UserProfileView.tsx`**
- Compute `myActiveQuests = quests.filter(q => (q.createdBy.id === currentUser.id || q.participants.some(p => p.id === currentUser.id)) && !isQuestCompleted(q))`.
- Replace the `EmptyState` in the `tab === "current"` branch with conditional props based on `myActiveQuests.length`.
- Add local state `showNudgePicker` and render a new `<NudgeQuestPicker>` modal (see below). Handle the single-quest shortcut inline.

**`src/components/NudgeQuestPicker.tsx`** (new, small)
- Props: `quests: Quest[]`, `targetUser: User`, `onClose`, navigates with `navigate(`/quest/${id}`, { state: { prefillNudgeUserId: targetUser.id } })`.
- Centered card modal matching existing "Friends" modal style in UserProfileView (max-h-[60vh], scroll). Each row: quest title + small meta (date), tappable. Uses `usePopup`.

**`src/pages/QuestDetail.tsx`**
- Read `location.state?.prefillNudgeUserId`. On mount, if present **and** current user is owner, set `showNudgeModal = true` and pass an optional `initialSelectedUserId` prop into `<NudgeModal>`. Clear the state via `navigate(..., { replace: true, state: {} })` after consuming.

**`src/components/NudgeModal.tsx`**
- Accept new optional `initialSelectedUserId?: string`. On open, seed the `selected` set with that id if it's a valid candidate (not rate-limited).

## Out of scope

- No DB / RLS changes. No changes to notification delivery. No copy changes elsewhere.
