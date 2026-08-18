# Investigation: How sidequests are stored, and why a delete can come back after reload

No code changes made. Findings below are from reading the code and querying the live database.

## 1. Where sidequest data lives

Sidequests are already stored **permanently in the Lovable Cloud database** (Postgres), not in mock data or browser storage.

- Table: `sidequests`, plus related tables `sidequest_participants`, `sidequest_completions`, `sidequest_volunteers`, `comments`, `comment_likes`.
- `src/hooks/useSupabaseData.ts` → `useQuests()` fetches all accessible rows on load and caches them with React Query.
- `src/components/DataProvider.tsx` copies that fetched data into the in-memory Zustand store (`src/data/appState.ts` → `setQuests`).
- `src/data/mockData.ts` is **types only** (first line: "no longer contains mock data").
- The only `localStorage` use in the store is `pinnedQuestIds` — nothing about quest existence.

So: React state is a **cache**, the database is the source of truth. Every reload re-reads from the database.

## 2. The delete handler, step by step

`deleteQuest(questId)` in `src/data/appState.ts` (line ~1045), called from QuestCard, QuestDetail, EditQuest, and Profile:

1. Looks up the quest in local state and computes `archiveOnly = isQuestCompleted(quest)` — true when the **owner** has a completion record.
2. Optimistically updates local state: removes the quest, removes its transfer requests, and (for hard deletes) drops its notifications.
3. Then, asynchronously:
   - If `archiveOnly`: `UPDATE sidequests SET archived_at = now(), archived_by = me` (soft delete, so participants keep their completed history), then invalidates `quests`.
   - Otherwise: notifies other participants ("canceled '<title>'"), runs `DELETE FROM sidequests WHERE id = ...`, then invalidates `quests`, `transfer_requests`, `notifications`.
4. Invalidation triggers `useQuests()` to refetch — whatever the database still returns comes straight back into the UI.

**Key detail:** neither the `update` nor the `delete` call checks the returned `error`. If the database refuses the write, the app never notices and never tells the user.

## 3. Anything that seeds/resets data on load or mount?

No seeding, no defaults, no reset. The only thing that repopulates quests is the real `useQuests()` fetch (on mount, on window focus/refetch, and after every `_invalidate(["quests"])`).

## 4. Can the delete succeed in state but come back?

Yes — that is exactly the shape of this bug, and there are two database-level ways it happens:

- **The delete is rejected by row-level security and fails silently.** The DELETE policies allow only: an admin, or the creator **when the creator has no completion row** for that quest. So a quest that the app treats as active but whose owner does have a completion row (or a delete attempted by anyone who is not the creator/admin) is blocked. Postgres returns "0 rows deleted", not an error the code surfaces; the item vanishes from state, then the refetch or reload brings it right back.
- **Soft-deleted (completed) quests stay visible to admins.** The archive path only stamps `archived_at`. The SELECT policy hides archived quests from the person who archived them — *except* it also grants admins and moderators visibility to everything, archived included. Both admin accounts in this project will therefore still see a completed sidequest they "deleted" after reload.

For reference: there are currently **zero rows with `archived_at` set** in `sidequests`, so nothing has taken the archive path yet in this data.

## 5. Root cause in plain language

This is **not** a missing-persistence problem — the database already exists and deletes are written to it. It is a **logic/permissions problem with silent failure**:

The UI removes the quest from memory immediately and assumes the write succeeded. When the database's delete rules refuse the write (or when the "delete" is really an archive that admins can still see), the next refetch restores the quest, so it looks like the delete "didn't stick" — with no error message explaining why.

## If you want a fix next (not done yet)

- Check and surface the error/row count from the delete and archive writes, and only remove from state once the write is confirmed.
- Align the client's completed/active check with the DELETE policy so completed quests always take the archive path.
- Exclude archived quests from the archiver's own view even for admins/moderators (or filter `archived_at` in the fetch for the current user's own view).
