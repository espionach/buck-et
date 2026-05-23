
# Convert Groups → Private "Launch Lists"

Groups stop being mutual/shared spaces. They become **private lists** the owner uses to launch a sidequest to a hand-picked subset of friends — like Instagram Close Friends, but you can have many named lists.

## Behavior

**Group ownership & visibility**
- Every group has one owner. Only the owner can see the group exists, its name, or its members.
- Members of a group are simply added by the owner (no invitations, no acceptance). They must already be friends with the owner.
- A user can be in many groups across many owners. They never see the list, the name, or who else is in it.
- Removing a friend automatically removes them from all of that user's groups (already the case).

**Profile**
- Add a third tab after `Active` and `Completed`: **`Groups`**.
- Only visible on the **current user's own profile**. `UserProfileView` (other users' profiles) shows only Active + Completed.
- Tab lists all groups the user owns with member avatars/names. Tap to edit name, color/icon, and members (add/remove from friends list). Includes a "New group" button.
- Delete group available from the edit screen.

**Sidequest launch & edit**
- `CreateQuest` and the Profile edit-quest sheet keep the existing dropdown but the choices become:
  - `Friends Only` — visible to all the creator's friends (unchanged).
  - One entry per group the creator owns — visible only to members of that group (+ creator).
- Recipients viewing a sidequest do **not** see the group name or know which group they were launched to. To them it just looks like a regular sidequest from a friend.

**Bottom nav**
- Replace `Groups` tab with `Calendar` (icon: `Calendar` from lucide). Route `/calendar` renders a simple placeholder page ("Coming soon"). No real implementation.
- Existing `/groups` and `/boards` routes are removed from the router (the old `Home.tsx` group browser is no longer reachable; file kept for reference but unrouted).

**Notifications**
- Drop group-invitation notifications and the `groupInvitations` UI/state (table can stay, just unused).
- Keep new-quest-from-friend / in-group notifications. Phrase group-scoped notifications as generic "X launched a sidequest" — never mention the group name to recipients.

## Migration

- Existing groups: keep as-is. Each group's existing owner becomes the private-list owner. Existing `group_members` rows become that list's members. No data loss.
- Pending `group_invitations` rows are deleted on migration (they no longer make sense).
- No changes to sidequests' `group_id` — they continue to scope visibility through `is_group_member`.

## Technical Details

**DB migration (single migration)**
- `DELETE FROM group_invitations;` (table kept, unused).
- Tighten `group_members` RLS so only the **group owner** can SELECT/INSERT/DELETE rows. Drop the "Users can join groups" and "Users can leave groups" policies. Members no longer query this table directly.
- Tighten `groups` RLS SELECT: only `owner_id = auth.uid()` (drop the "viewable by members or invitees" branch). Members never need to read the group row.
- `sidequests` SELECT policy keeps the `is_group_member(group_id, auth.uid())` branch — that's still the access mechanism — but `group_id` and `group.name` are simply not surfaced in the recipient's UI.
- Keep `handle_friendship_deleted` trigger (already removes the unfriended user from the other's owned groups). Drop the group-invitation cleanup branch since invitations are gone (optional cleanup, can leave).

**Frontend**
- `appState.ts`: remove `groupInvitations`, `acceptGroupInvitation`, `declineGroupInvitation`, `inviteToGroup`. Replace with `addMemberToGroup(groupId, userId)` (owner-only, direct insert into `group_members`). Keep `removeMemberFromGroup`, `updateGroup`, `addGroup`, `deleteGroup`.
- `Profile.tsx`: add third tab `Groups`, render group list + per-group editor (reuse much of `GroupSettings.tsx` and `AddMembersModal.tsx`, adapted for the new "owner picks from friends" flow — no invites). Hide tab on `UserProfileView`.
- `CreateQuest.tsx` + Profile edit-quest sheet: dropdown stays; populate from `groups` (which are now all owner-owned for the current user).
- `BottomNav.tsx`: swap `Groups`/`LayoutGrid` → `Calendar`/`Calendar`, path `/calendar`.
- `App.tsx`: remove `/groups`, `/boards`, `/g/:groupId/invite` routes. Add `/calendar` → simple placeholder component. Move `/create-group` content into the in-profile editor (drop the standalone page from nav, keep route as a redirect to `/profile?tab=groups&new=1`).
- `DataProvider`/`useSupabaseData`: stop fetching `group_invitations`. Group fetch now returns only groups where `owner_id = currentUser.id`.
- `GlobalTour.tsx`: any `nav-groups` coachmark step is updated to point at the new Profile → Groups tab (or removed if simpler).

**Out of scope (will not build)**
- Calendar feature itself (just a placeholder page).
- Visual redesign of group cards.
- Any per-sidequest "audience indicator" beyond what already exists for the creator.

## Open questions before I build

1. **Existing `groups` where the current user is a member but not owner** — under the new model these become invisible to them (they were never theirs). The sidequests launched into those groups still reach them, but they lose any UI to browse the group. Is that OK?
2. **Calendar tab placement** — keep middle slot (`Home / Calendar / Profile`) or move elsewhere?
3. **Group-launched notification copy** — confirm "X launched a sidequest" with no group reference is the right wording.
