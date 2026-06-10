# Friends Activity Feed

## Overview

Add a live activity feed that shows what your friends are doing across SideQuest. It lives as a second tab on the Home page next to the existing quest feed, so users get one social hub without crowding the bottom nav.

A single Settings toggle (on by default) controls both directions: turning it off hides your activity from friends AND hides their activity from you.

## Placement & UX

**Home page gets a segmented tab control at the top:**

```text
┌─────────────────────────────┐
│  [ Quests ]   Activity      │  ← segmented control
├─────────────────────────────┤
│  (existing feed)            │
│   or                        │
│  (new activity timeline)    │
└─────────────────────────────┘
```

- Default tab: Quests (current behavior, no regression)
- Activity tab: reverse-chronological timeline of friend actions
- Search and filter chips stay scoped to the Quests tab
- The notification bell stays as-is (it's about *you*; activity is about *others*)

## Activity Types Shown

Each activity row links to the relevant quest/profile and shows the friend's avatar + name + action + timestamp.

- **Joined a sidequest** — "Alex joined Pottery Night"
- **Commented on a sidequest** — shows comment preview (truncated), tap to open quest
- **Added a photo** — small thumbnail, tap to open quest's media viewer
- **Completed a sidequest** — "Sam completed Sunset Hike"
- **Became friends with someone you also know** — "Jordan and Alex are now friends" (only when both are your friends, respects mutual-friendship privacy)

**Excluded (intentionally):**
- Group joins (groups are private lists; per memory, no group-join concept exists)
- Creating a new sidequest (already visible in the Quests feed — would be noisy duplication)
- Anything from non-friends or blocked users

## Visibility Rules

An activity row is shown to a viewer only if ALL are true:
- Actor is a mutual friend of the viewer
- Viewer is not blocked by the actor (and vice versa)
- Viewer can see the referenced sidequest (reuses `can_view_sidequest`)
- Both actor and viewer have activity sharing enabled
- Activity is < 30 days old (keeps the feed fresh and the table bounded)

## Privacy Toggle

- **Setting:** "Share activity with friends" in Settings → Privacy section
- **Default:** ON for all existing and new users (opt-out)
- **Behavior:** when OFF, the user neither emits new activity rows visible to others nor sees the Activity tab populated (tab shows an empty state explaining how to re-enable)
- Disabling does NOT delete past activity — it just hides it. Re-enabling restores visibility.

## Empty & Loading States

- **Loading:** skeleton rows matching activity layout
- **No friends yet:** prompt to find friends (links to existing /find-friends)
- **Friends exist, no activity:** "No recent activity from your friends" + Lucide icon
- **Sharing disabled:** "Activity sharing is off. Turn it on in Settings to see what your friends are up to." with link to Settings

## Pagination

Per global rule: show 10 rows initially, "Load More" button for older entries.

---

## Technical Section

### New table: `public.friend_activities`

Columns:
- `id` (uuid, pk)
- `actor_id` (uuid, references profiles.user_id)
- `activity_type` (enum: `joined_quest`, `commented_quest`, `added_photo`, `completed_quest`, `friendship_created`)
- `sidequest_id` (uuid, nullable, references sidequests)
- `target_user_id` (uuid, nullable — for friendship_created, the other party)
- `metadata` (jsonb — comment preview, photo url, etc.)
- `created_at` (timestamptz, default now())
- Index on `(actor_id, created_at desc)` and `(sidequest_id)`

**RLS:** SELECT allowed when actor is a mutual friend of `auth.uid()`, neither side is blocked, and both have sharing enabled (check via new column on `profiles`: `activity_sharing_enabled boolean default true`). INSERT only from triggers/edge logic (service_role); no client writes.

GRANTs: `SELECT` to `authenticated`, `ALL` to `service_role`.

### Triggers (server-side, so we don't trust the client)

Add triggers that INSERT into `friend_activities` on:
- `sidequest_participants` insert → `joined_quest`
- `comments` insert → `commented_quest` (store first ~120 chars in metadata)
- `sidequests` update where photo added → `added_photo` (or on a photos table if separate)
- `sidequest_completions` insert → `completed_quest`
- `friendships` insert → `friendship_created` (one row, both parties referenced)

A nightly cleanup deletes rows older than 30 days (cron edge function or a `pg_cron` job).

### Profile column

Add `activity_sharing_enabled boolean not null default true` to `profiles`.

### Frontend

- New component: `src/components/ActivityFeed.tsx` — fetches from `friend_activities` with the visibility join, renders rows by type, handles pagination
- New component: `src/components/ActivityRow.tsx` — per-type rendering
- `src/pages/Feed.tsx` — wrap existing content in a segmented Tabs control (`Quests` / `Activity`), preserve URL state with `?tab=activity`
- `src/pages/Settings.tsx` — add toggle row "Share activity with friends" wired to `profiles.activity_sharing_enabled`
- Realtime subscription on `friend_activities` (filtered) so the Activity tab updates live while open

### Files touched

- New: `friend_activities` table + RLS + triggers (migration)
- New: `src/components/ActivityFeed.tsx`, `src/components/ActivityRow.tsx`
- Edited: `src/pages/Feed.tsx`, `src/pages/Settings.tsx`
- Edited: `mem://features/notifications` or new `mem://features/activity-feed` memory documenting the rules
