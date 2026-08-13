---
name: Participant Removal Rules
description: Owners can remove participants silently; removed users can never rejoin and the quest is hidden from their home feed
type: feature
---

# Sidequest participant removal rules

- Sidequest owners (and admins) CAN remove participants. The removed user gets NO notification (never send `removed_from_quest`; group removals still notify).
- Removed users CANNOT rejoin, ever. Enforced by `sidequest_removed_participants` table + `record_participant_removal` trigger (fires only when deleter ≠ participant; voluntary leaves and quest-deletion cascades create no record) + the `Join sidequest` RLS WITH CHECK.
- Removed quests must NOT appear on the removed user's home feed (Feed.tsx filters via `removedFromQuestIds`), but the quest remains viewable elsewhere (e.g. owner's profile, deep links).
- Join button for removed users: grey/disabled-looking but still clickable; tapping shows a neutral "Unable to join" popup — copy must NEVER say or imply they were removed ("This sidequest isn't available to join right now.").
- Client state: `removedFromQuestIds` in appState, loaded by `useRemovedFromQuests` and synced in DataProvider.
