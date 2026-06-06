# Onboarding redesign: drop Quick Tour, add contextual spotlights

## Goal
Replace the static Quick Tour step with going straight into creating the first sidequest as the onboarding finale. After onboarding completes, new users get **contextual spotlights** the first time they visit each important screen, so they discover features in context instead of in an abstract walkthrough.

## Flow changes

**Before:** Welcome → Examples → Permissions → Friends → **Tour intro → 6-step coachmark walkthrough** → First sidequest → Home

**After:** Welcome → Examples → Permissions → Friends → **First sidequest (finale)** → land on the new quest's detail page → spotlights appear contextually as the user navigates

## What gets built

### 1. Remove the Quick Tour step
- Delete `src/pages/onboarding/Tour.tsx` and `src/components/onboarding/GlobalTour.tsx`.
- Remove the `/onboarding/tour` route and `GlobalTour` mount from `src/App.tsx`.
- Remove `"tour"` from `ONBOARDING_ORDER` / `ONBOARDING_PATHS` in `src/hooks/useOnboarding.ts`.
- In `src/pages/onboarding/Friends.tsx`, change "Continue" to advance directly to `first_quest` and navigate to `/create?onboarding=1` (the existing first-sidequest screen — unchanged copy/layout).
- Remove `tourActive`, `startTour`, `endTour` from `src/data/appState.ts` and the `hideGlobalFab` carve-out in `BottomNav.tsx`.

### 2. Land on the new quest detail after first sidequest
- In `src/pages/CreateQuest.tsx`, when `isOnboarding` is true and the quest is created successfully:
  - Call `completeOnboarding(user.id)` (already imported).
  - Mark a new flag `spotlights_pending = true` in the user's profile (or in `localStorage` keyed by user id — see Technical notes).
  - Navigate to `/quest/<newQuestId>` instead of `/`.

### 3. Contextual spotlight system (new)
A lightweight, per-page, first-visit-only spotlight engine — separate from the existing `Coachmarks` (which is multi-step / route-driving). The existing component stays for now only if needed; new system lives in:

- `src/components/onboarding/SpotlightProvider.tsx` — context + state for "which spotlights has this user already seen" (persisted in `localStorage` under `bucket:spotlights:<userId>`), plus a global "skip all spotlights" flag.
- `src/components/onboarding/Spotlight.tsx` — single-target overlay (reuses the spotlight cutout + tooltip styling from `Coachmarks.tsx`). Renders only if:
  1. The user hasn't dismissed this spotlight id before, AND
  2. They haven't hit "Skip all spotlights", AND
  3. The target element is mounted.
- Each spotlight has: `id`, `title`, `body`, `targetSelector` (or a ref). Tooltip has **"Got it"** (dismiss this one) and **"Skip all tips"** (set the global flag, dismiss everything for this user).
- Mounted globally inside `AppLayout` so it survives route changes; reads which spotlight (if any) to show based on the current route + a small registry.

### 4. Spotlight registry (per page)
First-visit-only, tap to dismiss, one spotlight per surface:

| Route | Spotlight target | Copy (working draft) |
|---|---|---|
| `/quest/:id` (first visit, right after onboarding) | "Join" / contributions area | "This is your sidequest. Friends can join and sign up for roles here." |
| `/` (Home) | Feed first card + FAB | "Your feed of sidequests from friends and groups. Hit + anytime to start your own." |
| `/calendar` | Calendar grid | "Everything you're going to is here on one calendar." |
| `/profile?tab=current` | Active tab | "Your active sidequests live here — finish one and it moves to Completed." |
| `/profile?tab=past` | Past tab | "All the sidequests you've actually done." |
| `/profile?tab=groups` | Groups tab + Create group | "Friend groups for planning with the right people." |
| Notification bell (any page, first time it has content) | Bell icon | "New activity shows up here — friend requests, joins, nudges." |

Final copy can be tightened during implementation.

### 5. "Skip all tips" affordance
- Every spotlight tooltip has a small "Skip all tips" link beside "Got it".
- Tapping it sets the global skip flag in `localStorage`; no spotlight ever shows again for this user.
- Settings → an entry to **"Replay tips"** that clears both the global flag and per-spotlight dismissals so a user can see them again. (Small addition to `src/pages/Settings.tsx`.)

## Files touched
- **Delete:** `src/pages/onboarding/Tour.tsx`, `src/components/onboarding/GlobalTour.tsx`
- **Edit:** `src/App.tsx`, `src/pages/onboarding/Friends.tsx`, `src/pages/CreateQuest.tsx`, `src/hooks/useOnboarding.ts`, `src/data/appState.ts`, `src/components/BottomNav.tsx`, `src/pages/Settings.tsx`
- **New:** `src/components/onboarding/SpotlightProvider.tsx`, `src/components/onboarding/Spotlight.tsx`, `src/data/spotlights.ts` (registry)

## Technical notes
- **Persistence:** Spotlight dismissals are device-level only (localStorage). They don't need to roam across devices — if a user logs in on a new phone they can see tips again, which is fine. Keep this out of the DB to avoid a migration.
- **Onboarding completion** still flips `profiles.onboarded_at` via `completeOnboarding()` — unchanged. Spotlights are an independent layer that runs *after* onboarding.
- **Target waiting:** reuse the `requestAnimationFrame` polling pattern from `Coachmarks.tsx` so spotlights wait for their target to mount (e.g., the first feed card after data loads).
- **One at a time:** the provider only renders one spotlight at a time; if a route has multiple eligible spotlights it shows them sequentially as the user dismisses each.
- **Notification bell spotlight** is gated on the bell actually rendering an unread indicator the first time, so it lands in context.

## Out of scope
- No changes to Welcome / Examples / Permissions / Friends screens.
- No changes to the create-sidequest form itself — only its post-submit navigation when `onboarding=1`.
- No changes to quest detail layout — the spotlight just overlays it.
