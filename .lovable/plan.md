## What's going wrong

After remixing, the database is brand new (empty tables, new RLS, your fresh signup is the only user). The features themselves work — the bug is in how the app sources the *current user id* before sending writes to the backend.

### Root cause

Every mutation in `src/data/appState.ts` and several pages (e.g. `src/pages/CreateQuest.tsx`, profile picture upload) reads `currentUser.id` from the Zustand store. The store is initialized with:

```ts
const emptyUser = { id: "", name: "", avatar: "👤", bio: "" };
```

`currentUser` is only replaced once `useCurrentProfile()` finishes loading inside `DataProvider`. There is a race window where:

- You're signed in (auth user exists)
- The profile query hasn't returned yet (or the `profiles` row was just created by the `handle_new_user` trigger and the cache hasn't caught up)
- But the UI is already interactive

In that window, any action sends `created_by: ""` / `user_id: ""` to Supabase, which produces exactly the two error classes you're seeing:

1. `invalid input syntax for type uuid: ""` — the UUID error
2. `new row violates row-level security policy` — because RLS checks `auth.uid() = user_id`, and `""` never matches

A remix makes this much more visible because:
- There's no cached profile from a previous session
- The `profiles` row is created by a trigger on first signup, so the first few seconds after signup have no profile yet
- The post-onboarding flow immediately drops you into Create Quest / Profile edit, hitting the race every time

### Secondary issue: raw error messages

`CreateQuest.tsx`, `Settings.tsx`, and several store mutations call `toast.error(err.message)` or `toast({ description: error.message })`, which shows raw Postgres text like `invalid input syntax for type uuid: ""` to the user. The project already has `src/lib/errorMapping.ts` (`getUserFriendlyError`) and `ErrorBanner` for this — they're just not used at the action sites.

## Fix plan

### 1. Always read the user id from auth, not from the store

- In `src/data/appState.ts`, replace every `currentUser.id` used inside a write (`addQuest`, `toggleParticipant`, group creation, friend requests, profile updates, notifications, comment likes, etc.) with the live auth user id read via `supabase.auth.getUser()` at the top of the async block. If no auth user is returned, bail out early and surface a friendly error instead of inserting.
- In `src/pages/CreateQuest.tsx`, use `user.id` from `useAuth()` instead of `currentUser.id` for the insert and participant rows. Disable the "Launch" button while `user` is null or while `loading` is true.
- Same change anywhere else a mutation reads `currentUser.id` (profile picture upload, comment posting, etc.).

### 2. Don't let actions fire before auth + profile are ready

- Add a small `useAuthReady()` helper (or extend `useAuth`) that exposes `ready: boolean` — true only after `getSession()` has resolved and either a user exists or we know the user is signed out.
- In `DataProvider`, keep the existing "initialized" gate but also block render of the protected app shell until `ready && profile.data` (or show a lightweight skeleton). This eliminates the race entirely for the common path.
- The store's `emptyUser` stays as a safe default for read paths, but no write should ever use it.

### 3. Stop showing raw backend errors

- Replace the raw `toast.error(err.message)` / `toast({ description: error.message })` calls in:
  - `src/pages/CreateQuest.tsx`
  - `src/pages/Settings.tsx` (notification prefs save, support form, appeal submit)
  - any store mutation that surfaces a toast
- Route them through `getUserFriendlyError(source, err.message)` so the user sees things like "Couldn't create your sidequest — please try again" while the raw message is still `console.error`'d for debugging.
- The existing `ErrorBanner` already does this for query errors; we're applying the same treatment to mutation errors.

### 4. Verify

- Sign in fresh, immediately try: upload avatar, create sidequest, like a comment, send a friend request. None should produce UUID or RLS errors.
- Confirm console still has the technical details for any genuine failure, while the toast/banner shows a friendly message.

## Out of scope

- No schema changes, no RLS edits — the database is fine. The fix is purely client-side: where we read the user id and how we render errors.
- Google Maps Platform link from the earlier remix step is unrelated and untouched.
