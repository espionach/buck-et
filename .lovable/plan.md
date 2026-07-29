## Goal
Let the user cancel a friend request they've already sent. Clicking the existing "Requested" / "Request Sent" button re-triggers the action, but instead of doing nothing, it opens a confirmation dialog. Confirming removes the pending request (both locally and in the `friend_requests` table).

## Changes

### 1. `src/data/appState.ts` — add `cancelFriendRequest`
- Add `cancelFriendRequest: (toUserId: string) => void` to the store type and default state.
- Implementation: optimistically remove `toUserId` from `sentFriendRequests`, then delete the matching pending row:
  ```
  supabase.from("friend_requests")
    .delete()
    .eq("from_user_id", currentUser.id)
    .eq("to_user_id", toUserId)
    .eq("status", "pending");
  ```
- Invalidate `["sent_friend_requests"]` so `DataProvider` refetches.

### 2. `src/components/UserProfileView.tsx`
- Currently the "Request Sent" button is `disabled`. Enable it, add `onClick` that opens a new confirmation modal (mirroring the existing unfriend modal style).
- Modal copy: title "Cancel friend request?", body "You can send another request later." Buttons: "Keep request" (dismiss) and "Cancel request" (destructive) → calls `cancelFriendRequest(user.id)`.

### 3. `src/pages/FindFriends.tsx`
- The "Requested" pill (line ~265) is a static `<span>`. Wrap it in a button that opens the same-style confirmation dialog, then calls `cancelFriendRequest(u.id)` on confirm.

### 4. `src/pages/Feed.tsx`
- In the requests section (around line 383), the "Requested" state currently re-calls `sendFriendRequest`. Change it to open the shared confirmation dialog and call `cancelFriendRequest` instead.

### 5. Shared confirmation dialog
- Add a small `CancelRequestDialog` component under `src/components/` reused by all three locations, styled like the existing unfriend confirm (framer-motion overlay + card, destructive confirm button). Takes `open`, `userName`, `onConfirm`, `onClose`.

## Out of scope
- No schema changes; the `friend_requests` row is simply deleted, matching how declines already work.
- Onboarding Friends page keeps its current behavior (no cancel there, per current UI).
