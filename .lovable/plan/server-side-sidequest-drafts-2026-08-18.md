# Server-side sidequest drafts

Move drafts from device-only localStorage to the backend so they follow the user across devices, with a hard cap of 100 drafts per user and no expiration.

## What changes for the user

- Drafts saved on one device appear on every device after signing in.
- The Drafts page loses the "saved on this device only" warning; it shows the real synced list with counts.
- When a user already has 100 drafts and tries to leave a new sidequest with content, they get a clear message: "You've reached the maximum of 100 drafts. Delete one to save another." Editing an existing draft always still saves.
- Photos still can't be stored in a draft — the existing "N photos need to be re-added" placeholder behavior stays.

## Database

New table `public.quest_drafts`:

- `id uuid pk default gen_random_uuid()`
- `user_id uuid not null` (owner, defaults to `auth.uid()`)
- `title`, `description`, `group_id uuid`, `logistics_date date`, `logistics_time text`, `location_text`, `location_latitude numeric`, `location_longitude numeric`, `location_place_id text`, `meetup_spot`, `transportation`, `carpool_slots text`, `custom_notes`
- `links text[] not null default '{}'`, `contribution_roles text[] not null default '{}'`
- `photo_placeholder_count int not null default 0`
- `created_at`, `updated_at timestamptz not null default now()`

Migration includes, in order: create table, `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated` and `GRANT ALL ... TO service_role` (no anon grant), enable RLS, then policies scoped to `auth.uid() = user_id` for select/insert/update/delete.

Enforcement (server-side, authoritative):

- `enforce_draft_limit_per_user()` BEFORE INSERT trigger raising an error when the user already has 100 drafts. No expiration/cleanup job.
- `update_updated_at_column` trigger on update to keep `updated_at` fresh.
- Index on `(user_id, updated_at desc)`.

## Application changes

- `src/lib/drafts.ts` becomes async and backed by the database: `listDrafts`, `getDraft`, `saveDraft` (upsert), `deleteDraft`, plus `MAX_DRAFTS_PER_USER = 100` and a mapper turning the limit trigger error into the user-facing message. Row-to-draft mapping keeps the current `QuestDraft` shape so callers change minimally.
- `src/pages/Drafts.tsx`: load via a React Query hook, show loading and error states, remove the device-only warning, delete through the backend and invalidate the query.
- `src/pages/CreateQuest.tsx`: hydrate the draft asynchronously by id; the exit autosave writes to the backend. Since unmount can't await reliably, the autosave fires the save request and surfaces the limit error via toast on the Drafts/Home screen.
- `src/pages/Profile.tsx`: draft count comes from the same query hook instead of localStorage.
- One-time local migration: on first load after this change, any drafts still in `localStorage` for the signed-in user are pushed to the backend (up to the remaining allowance) and the local store is cleared.

## Technical notes

- Drafts query key `["quest_drafts", userId]`, invalidated after save/delete.
- Client-side guard checks the current count before allowing a brand-new draft save so the user sees the message before the trigger fires; the trigger remains the source of truth.
