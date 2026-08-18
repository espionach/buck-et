# Sidequest edit notifications: only date/time/location, with debounce

## Goal

Editing a sidequest currently notifies every other participant whenever the title, description, or any logistics field changes. Narrow this to the three things participants actually need to know about — **date, time, location** — and stop rapid-fire notification spam when an owner makes several edits in a row.

## What changes for users

- Editing the title, description, notes, links, photos, meetup spot, transportation, carpool slots, custom notes, or contribution roles: **no notification**.
- Changing the date, the time, or the location: participants get one "updated <quest>" notification.
- If the owner makes several such edits within a short window (10 minutes), participants get **one** notification that refreshes in place instead of a new one for each save. Each recipient is debounced independently.
- The notification still respects each recipient's "Quest updates" preference and mute settings, as it does today.

## Technical details

All work is in `src/data/appState.ts`, inside `updateQuest`'s notification block (currently lines ~980-995).

1. Replace the `meaningfulChange` check with a comparison limited to logistics identity fields:
   - `date`
   - `time`
   - `location` (plus `latitude` / `longitude` / `placeId`, since picking a new place changes those together — a coordinate-only change with identical text still counts as a location change)
   Compare `updates.logistics` against `prevQuest.logistics` field by field, so saving the edit form without touching those fields sends nothing. Title and description changes no longer trigger a notification.

2. Debounce per recipient per quest:
   - Before inserting, query `notifications` for rows with `type = 'quest_updated'`, `entity_id = questId`, `user_id in (recipients)`, `created_at > now() - 10 minutes`.
   - For recipients that already have such a row: `update` that row's `created_at` (and `read = false`) so it resurfaces as one fresh entry rather than stacking duplicates.
   - For the remaining recipients: insert as today via `notifyUsers`.
   - Keep the existing preference/mute filtering path intact for the insert branch; the refresh branch only touches rows that were already allowed through.

3. The debounce window lives as a single named constant (`QUEST_UPDATE_NOTIFY_WINDOW_MINUTES = 10`) so it is easy to tune.

No database migration is needed — this uses the existing `notifications` table and its current RLS policies (owners can update their own notification rows only for `read`; if the update path is blocked by RLS, the fallback is to delete the stale row and insert a fresh one, which is permitted).
