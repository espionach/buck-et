---
name: Friends Activity Feed
description: Live feed on Home tab showing what friends joined/completed/commented/photographed, with opt-out toggle in Settings
type: feature
---
- Lives as a segmented tab on Home: "Sidequests" (default) / "Activity"
- Search bar is hidden on the Activity tab
- Activity types: joined_quest, completed_quest, commented_quest, added_photo, friendship_created (only when both parties are mutual friends or one is the viewer)
- Excluded: group joins (groups are private lists, no join concept) and quest creation (already visible in Quests feed)
- Backed by `get_friend_activity(_before, _limit)` RPC that unions sidequest_participants, sidequest_completions, comments, sidequest_photo_events, and friendships, with privacy: mutual-friend check, blocks, can_view_sidequest, both-sides sharing toggle, and 30-day cutoff
- Photo events: written to `public.sidequest_photo_events` from `updateQuest` when new photos appear on a completed quest (existing photos are NOT backfilled)
- Settings → Preferences → "Share activity with friends" toggle (default ON, opt-out). Single toggle controls both directions: if off, the user emits no activity to friends AND their Activity tab is empty with a prompt to re-enable
- Pagination: 10 rows initially, "Load more" cursored by oldest created_at
