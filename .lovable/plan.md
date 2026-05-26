## Sidequest Drafts (local-only)

Autosave in-progress sidequests as drafts when the user exits Create, and give them a dedicated drafts page reachable from a banner on the Active tab.

### Behavior

- **Autosave on exit**: When the user leaves `CreateQuest` (back button, navigation, route change, tab/app close) and at least one field has content (title, description, group, any logistics field, photos, links, contribution roles), save a draft to localStorage.
- **No mid-typing writes**: nothing is saved while the user is still on the screen, only on unmount/exit.
- **Resuming a draft**: Tapping a draft opens `CreateQuest` prefilled with all saved values. The same draft ID is reused, so editing and exiting again updates the same entry.
- **On launch**: Successfully creating the sidequest deletes its draft.
- **Manual delete**: Each draft row in the drafts page has a delete button. A clear warning sits at the top: "Drafts are saved on this device only. Clearing your browser data or signing in on another device will erase them."

### Placement

- **Active tab (Profile → Current)**: When ≥1 draft exists, show a single compact row pinned above the quest list: `Drafts (N) ›`. Tapping it navigates to a new `/drafts` page. Hidden when zero drafts.
- **Drafts page**: Own route with back navigation to Profile. Lists drafts newest-first showing title (or "Untitled draft"), short description preview, group chip if set, and last-edited time. Row tap → resume in Create. Trash icon → confirm + delete. Empty state if user deletes them all. Warning banner at top.

### Photos caveat

Photos in Create are raw `File` objects (not yet uploaded). `File`s can't be serialized to localStorage. For drafts:
- Persist links, text fields, logistics, group, contribution roles fully.
- For pending photos, store only a count + filenames as a reminder ("3 photos — please re-add"). Cleanly drop them on resume rather than silently losing them without notice. Already-uploaded photo URLs (none in Create today) would persist fine.

### Technical sketch

- New `src/lib/drafts.ts`: typed `QuestDraft` shape, `listDrafts()`, `getDraft(id)`, `saveDraft(partial)`, `deleteDraft(id)`. Stored under `sidequest_drafts_v1` keyed by user id (`currentUser.id`) so multi-account on one device stays separate. Each draft: `{ id, userId, updatedAt, title, description, groupId, logistics{...}, links, contributionRoles, photoPlaceholderCount }`.
- `CreateQuest.tsx`:
  - Accept `?draftId=...` (or router state) to hydrate initial state.
  - Track a stable `draftIdRef`. On unmount, if any field has content and the form wasn't successfully submitted, call `saveDraft`. If submitted successfully, call `deleteDraft(draftIdRef.current)`.
  - Use a `submittedRef` flag set right before navigating away on successful create to skip the save-on-exit.
- `src/pages/Drafts.tsx` (new): list + delete + warning banner + back button. Route added to `App.tsx` as `/drafts`.
- `src/pages/Profile.tsx` (Current tab): read `listDrafts(currentUser.id)`; if length > 0, render the `Drafts (N) ›` row above the quest list, linking to `/drafts`.

### Out of scope

- No backend table, no migrations, no RLS changes.
- No cross-device sync.
- No changes to other tabs, notifications, or the nudge feature.
