# Empty State Overhaul

Apply your finalized copy across the app, swap all emoji icons for lucide, and standardize layout via a small shared component.

## 1. New shared component: `src/components/EmptyState.tsx`

A single presentational component every empty state uses, so spacing, typography, and CTA styling stay consistent.

Props:
- `icon`: lucide icon component (required)
- `title`: bolded first line
- `description`: second line (muted)
- `cta?`: `{ label: string; onClick: () => void }` — renders pill button matching existing primary/secondary button styling
- `size?`: `"sm" | "md"` (sm for inline lists like comments, md for full-page)

Visual: centered column, icon in muted circle-less style, title `font-bold text-foreground`, description `text-sm text-muted-foreground`, CTA below using existing primary button look.

## 2. Copy + icon map (final)

| Location | File | Title (bold) | Description | Icon | CTA |
|---|---|---|---|---|---|
| Profile (own) — Active | `Profile.tsx` | No active sidequests | Nothing planned yet. Start something fun. | `Sparkles` | Create sidequest → `/create` |
| Profile (own) — Completed | `Profile.tsx` | No completed sidequests yet | Finished sidequests will show up here. | `CheckCircle2` | — |
| Profile (friend) — Active | `UserProfileView.tsx` | No upcoming sidequests | Nothing planned right now. Start something they can join. | `Sparkles` | Create sidequest |
| Profile (friend) — Completed | `UserProfileView.tsx` | No completed sidequests | Finished sidequests will appear here. | `CheckCircle2` | — |
| Home feed / Friends feed default | `Home.tsx`, `Feed.tsx`, `QuestList.tsx` default | Your feed is quiet | Sidequests from friends and groups will show up here. Add friends to get things going. | `Users` | Add friends → friends/onboarding entry |
| My Groups | `MyGroupsTab.tsx` | No groups yet | Tap "New group" to create one and get started. | `Users` | New group |
| Feed search | `Feed.tsx` (search mode) | No sidequests found | Try another search or clear your filters. | `Search` | Clear search |
| Calendar — empty day | `Calendar.tsx` | Nothing planned for this day | Looks like you've got a little breathing room. | `CalendarIcon` | — |
| Calendar — zero dated quests | `Calendar.tsx` | Your calendar is waiting | Sidequests with dates will appear here. | `CalendarIcon` | Create sidequest |
| Notifications | `NotificationPanel.tsx` | Nothing new yet | Friend requests, comments, and updates will appear here. | `Bell` | — |
| Quest detail — no access | `QuestDetail.tsx` | You don't have access | This sidequest is private or unavailable. | `Lock` | — |
| Quest detail — logistics | `QuestDetail.tsx` | No details yet | Add a time, place, or anything people should know. | `Info` | Add details (owners only) |
| Quest detail — comments | `CommentThread.tsx` | No comments yet | Be the first to say something. | `MessageCircle` | Add comment (focuses input) |
| Group members — empty | `GroupMembers.tsx` | No one here yet | Add friends and start planning together. | `Users` | Add friends |
| Group members — search no match | `GroupMembers.tsx`, `AddMembersModal.tsx`, `GroupSettings.tsx` | No matches found | Try another name. | `UserSearch` | — |
| Create group — no friends | `CreateGroup.tsx` | No friends added yet | Buck-et works best with people you know. Add a few friends to get started. | `Users` | Add friends |
| Blocked users | `BlockedUsers.tsx` | No blocked users | People you block will appear here. | `ShieldOff` | — |
| Legal updates | `LegalUpdates.tsx` | Nothing here yet | Legal updates and policy changes will appear here. | `FileText` | — |

All current emoji icons (🔭, 👤) get removed; only lucide icons render.

## 3. Files touched

Create: `src/components/EmptyState.tsx`

Edit: `Profile.tsx`, `UserProfileView.tsx`, `Home.tsx`, `Feed.tsx`, `MyGroupsTab.tsx`, `Calendar.tsx`, `NotificationPanel.tsx`, `QuestDetail.tsx`, `CommentThread.tsx`, `GroupMembers.tsx`, `AddMembersModal.tsx`, `GroupSettings.tsx`, `CreateGroup.tsx`, `BlockedUsers.tsx`, `LegalUpdates.tsx`, `QuestList.tsx` (default `emptyText` removed in favor of `EmptyState` rendered by caller).

No backend, schema, or business-logic changes.

## 4. Items from the audit not in your new spec

Want me to also update these, or leave as-is?

- **Admin screens** (`AdminReports.tsx`, `AdminDashboard.tsx` tabs: reports / sidequests / comments / appeals / actions) — internal tooling, currently flat text.
- **BucketLoader** (`Buck-et, we ball…`) — this is the loading screen tagline, not an empty state. Leaving untouched unless you say otherwise.
- **Feed header subtitle** in `Feed.tsx` (`Buck-et, we ball. Join sidequests, have fun.`) — header copy, not empty state.

Confirm and I'll implement, including admin if you want them included.
