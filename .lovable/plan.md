## Problem

Two related navigation issues across the app:

1. **Scroll glitch when launching a new page.** When you press "Create sidequest" from the Calendar page (or other deep-scrolled views), the new page mounts inheriting the previous scroll offset, then snaps to the top — visible as a flash/glitch. There is no global scroll-reset on route change.
2. **Back buttons go to fixed routes.** Many headers hard-code `navigate("/")`, `navigate("/profile?tab=groups")`, etc., so pressing back always lands on Home/Profile instead of returning the user to whichever page they came from (Feed vs Calendar vs a quest detail, etc.).

## Fix 1 — Global scroll-to-top on navigation

Add a tiny `<ScrollToTop />` component mounted inside `BrowserRouter` in `src/App.tsx`. On every `location.pathname` change (excluding back/forward POP navigations so the browser can restore prior scroll on real back gestures), it runs `window.scrollTo({ top: 0, left: 0, behavior: "instant" })` before paint. This eliminates the "mid-scroll then glitch to top" effect for every push navigation.

## Fix 2 — Back buttons that respect history

Adopt the existing pattern (already used by `CreateGroup`, `CreateQuest`, Calendar's CTA) everywhere:

- The launching page passes `state: { from: location.pathname + location.search }` when calling `navigate(...)`.
- The destination's back button reads `location.state?.from` and falls back to `navigate(-1)` (and then a sensible default only if there's no history).

This way, opening Create Sidequest from Calendar returns to Calendar; from Feed returns to Feed; etc.

## Inventory — buttons that open a new page (need to launch at top)

Covered automatically by the global `ScrollToTop`. No per-button changes needed, but these are the navigations it will affect:

- **BottomNav**: Home tab, Calendar tab, Profile tab, central "+" → `/create`.
- **Feed (`/`)**: quest card → `/quest/:id`; empty-state "Create sidequest" → `/create`; "Add friends" → `/onboarding/friends`; group filter "Create sidequest" → `/create-quest?groupId=...`; "Mark done/undone" → `/profile?tab=past|current`.
- **Calendar (`/calendar`)**: "Create sidequest" CTA → `/create`; quest item → `/quest/:id`.
- **Home / Groups tab (`/profile?tab=groups`)**: "Create group" → `/create-group`; group card → `/groups/:id`; group settings icon → `/groups/:id/settings`; pending invitation → `/g/:groupId/invite`.
- **Profile / Past / Current tabs**: same quest card → `/quest/:id` route.
- **QuestDetail (`/quest/:id`)**: edit menu → `/quest/:id/edit`; participant avatar → `/profile` or `/profile?viewUser=...`.
- **NotificationPanel**: deep-links to `/quest/:id`, `/profile`, `/profile?tab=groups|current`, `/u/:username`.
- **NudgeQuestPicker**: → `/quest/:id`.
- **UserProfileView**: → `/quest/:id`.
- **Settings**: → `/settings/blocked`, `/settings/community-guidelines`, `/settings/privacy-policy`, `/settings/terms`, `/settings/legal-updates`, `/find-friends`, `/admin`, `/admin/reports`.
- **Login/Signup/Forgot/Reset password** cross-links.
- **Onboarding** flow steps.

## Inventory — back buttons (need to return to previous page)

The following currently use a fixed destination and will be switched to "use `location.state.from` → else `navigate(-1)` → else current fallback":

| File | Current back target | New behavior |
|---|---|---|
| `src/pages/CreateQuest.tsx` (header back, line ~311) | already supports `fromPath`, but callers don't always pass it | Ensure every entry point (BottomNav "+", Feed CTAs, Calendar CTA, Home CTA, group-scoped CTA) passes `from`. Fallback to `navigate(-1)`. |
| `src/pages/CreateGroup.tsx` (line 74) | `fromPath` or `/profile?tab=groups` | Use `from` → `navigate(-1)` → `/profile?tab=groups`. |
| `src/pages/GroupMembers.tsx` (lines 41, 64) | `/profile?tab=groups` | Use `from` → `navigate(-1)` → `/profile?tab=groups`. |
| `src/pages/GroupSettings.tsx` (line 27) | `/profile?tab=groups` | Use `from` → `navigate(-1)` → `/profile?tab=groups`. (Line 61 "go to members" stays as-is — it's a forward link, not back.) |
| `src/pages/QuestDetail.tsx` (line 97 fallback, line 170 already uses `-1`) | mixed | Standardize on `navigate(-1)` with `/` only as last-resort when there's no history. |
| `src/pages/EditQuest.tsx` (lines 107, 194) | already `navigate(-1)` | Keep. |
| `src/pages/Settings.tsx` and its sub-pages (`BlockedUsers`, `CommunityGuidelines`, `PrivacyPolicy`, `TermsAndConditions`, `LegalUpdates`, `FindFriends`, `AdminReports`, `AdminDashboard`, `Drafts`) | TBD (each has a header back) | Audit each header and switch to `navigate(-1)` with the existing destination as fallback. |
| `src/pages/PublicProfile.tsx` | header back | `navigate(-1)`. |

Entry points that need to start passing `state: { from }` (so back works correctly across the app):

- `BottomNav` "+" button (`/create`).
- `Feed` "Create sidequest" CTAs (already partial).
- `Home` "Create group" (already passes `from`), group card → `/groups/:id`, settings icon → `/groups/:id/settings`, invitation → `/g/:groupId/invite`.
- `MyGroupsTab` group card and settings.
- `Settings.tsx` rows that navigate into sub-pages.
- `NotificationPanel` deep links.

## Technical details

1. **New file** `src/components/ScrollToTop.tsx`:
   - `useLocation()` + `useNavigationType()` from react-router-dom.
   - On `pathname` change where `navigationType !== "POP"`, call `window.scrollTo(0, 0)` inside a `useLayoutEffect` so it runs before paint (no flicker).
   - Returns `null`.

2. **`src/App.tsx`**: render `<ScrollToTop />` as a sibling of `<AppLayout />` inside `<BrowserRouter>`.

3. **Small shared helper** `goBack(navigate, location, fallback)` in `src/lib/utils.ts`:
   ```ts
   export function goBack(navigate, location, fallback = "/") {
     const from = (location.state as any)?.from;
     if (from) navigate(from);
     else if (window.history.length > 1) navigate(-1);
     else navigate(fallback);
   }
   ```
   Use it in each back button listed above.

4. **Entry-point updates**: pass `state: { from: location.pathname + location.search }` to every `navigate(...)` that opens a page with a back button (Settings rows, BottomNav "+", group-card navigations, notification deep-links, etc.).

5. **No router-config or route changes** — purely component/handler edits.

## Out of scope

- Restoring scroll position on browser back/forward (the default browser behavior already does this; `ScrollToTop` deliberately skips POP).
- Cross-tab persistence of scroll position between bottom-nav switches (Home/Calendar/Profile reset to top, matching the user's request).
