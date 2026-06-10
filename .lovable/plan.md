## Goal

Replace the "+" photo button on completed sidequest cards with a tap-to-open Completed Sidequest Detail page. Reuse `QuestDetail.tsx` with a completed-mode variant that reorders sections, switches to past-tense copy, and disables nudging.

## Changes

### 1. `src/components/QuestCard.tsx`
- For completed quests, make the whole card navigable to `/quest/:id` (same handler as active quests). Remove the special `canNavigateToDetail = !isFinished` guard.
- Replace the floating "+" button with a small inline "Add photos" action inside the card (still owner / was-joined-when-finished only) — tapping it navigates to `/quest/:id?addMedia=1` (the detail page opens the media picker directly).
- Keep swipe-to-undo behavior unchanged.

### 2. `src/pages/QuestDetail.tsx`
Allow rendering for completed quests:
- Remove the `useEffect` + early `return null` that redirects away when `isQuestCompleted(quest)` is true.
- Compute `isFinished = isQuestCompleted(quest)`.
- When `isFinished`:
  - Hide Join / Owner / nudge / volunteer / "I'm in" controls.
  - Hide pin and edit menu items; keep Share, Report, Delete (owner).
  - Reorder body: **Photos & Videos → Comments → Quest details (date, time, location, transportation, notes, links, volunteers list)** at the bottom under a "Quest details" heading.
  - Switch copy to past tense:
    - "Who's in" → "Who went"
    - "I'm in" / "Join" → hidden
    - "Volunteers" → "Who helped" (read-only chips, no claim/unclaim)
    - "Logistics" → "Details"
  - Show "Completed {quest.completedAt}" near the title.
  - Auto-open the media uploader if `?addMedia=1` is present (owners / participants only) and strip the query param after opening.
- Disable swipe-to-next-sibling and chevron nav only if it causes confusion across active/completed boundaries — keep it for now, siblings are already scoped per-list.

### 3. Completed-quest detail behavior summary
- Read-only: no join, no volunteer claim, no nudge, no pin, no edit (still can add photos + comment + share + report + delete).
- Comments remain fully interactive (add/reply).
- Photos/videos viewer + add-media flow preserved.

## Files touched
- `src/components/QuestCard.tsx` (navigation + replace "+" button)
- `src/pages/QuestDetail.tsx` (allow completed render, reorder, past-tense copy, hide nudge/volunteer-claim, `?addMedia=1` handling)

## Out of scope
- No DB / schema changes.
- No changes to history list layout.
- No changes to active quest detail behavior.
