# SideQuest — User Flows

Behavioral flows only: what happens, what the system does, who is affected.

---

## 1. Account Creation & Onboarding

User signs up with email + password (12+ chars, upper/lower/digit) or Google
↓
Email confirmation required before session is active
↓
Profile record is created (name, username, avatar, bio)
↓
Onboarding: user reviews community guidelines
↓
User optionally allows contact discovery — contacts are hashed locally, matched server-side against hashed emails, raw contacts never stored
↓
Matched users are surfaced as suggested friends; user sends requests
↓
User is shown example sidequests and launches their first one
↓
First launch lands on that sidequest; guided tips begin and are recorded per-user so they never repeat unless replayed from Settings

---

## 2. Friendships

User searches people by name/username (server-side search returns only public fields)
↓
Sends friend request
↓
Recipient is notified; request is pending
↓
Sender may cancel the pending request (with confirmation)
↓
Recipient accepts → mutual friendship created; both are notified; the event appears in the activity feed of friends of either party
↓
Recipient declines → request closed, no notification of decline
↓
Either user may unfriend later: mutual visibility ends, active sidequest participation between them is unwound, but completed sidequests remain in each user's history
↓
Either user may block: all visibility, activity, comments and requests between them are suppressed in both directions

Profiles are private by default — full profile content requires mutual friendship.

---

## 3. Friend Lists

Owner creates a friend list (name, icon, color)
↓
Owner invites friends
↓
Invitees receive a pending invitation
↓
Invitee accepts → becomes a member; can see sidequests launched to that list
↓
Invitee declines → invitation closed
↓
Owner may remove a member, or transfer ownership (requires the new owner to accept)
↓
On removal: the member loses access to the list, is unjoined from all *ongoing* sidequests belonging to that list, loses any volunteer roles there, and can no longer see completions others restricted to that list — while their own already-completed sidequests from that list stay on their profile
↓
Member may leave voluntarily (same effects). If the owner leaves, ownership must first pass to another member or the list is deleted.

---

## 4. Creating a Sidequest

Owner creates a sidequest (title + optional details)
↓
Owner chooses audience: all friends, or one specific friend list
↓
Owner optionally adds logistics: date, normalized time, location (resolved via place lookup), meetup spot, transportation, carpool slots, contribution roles
↓
Draft can be saved and resumed later
↓
On launch, the sidequest becomes active and is owned by the creator
↓
Eligible audience sees it in their feed; friends receive it as activity (not a personal notification)
↓
Owner may edit any field, cancel, delete, or transfer ownership (transfer requires acceptance)

---

## 5. Joining & Participating

Eligible user opens a friend's active sidequest
↓
User joins → becomes a participant; owner is notified; the join appears in friends' activity
↓
Participant may claim a contribution role from the roles the owner enabled; owner is notified
↓
Participant may release the role or leave the sidequest at any time
↓
Owner may remove a participant, who is then notified
↓
Anyone with access can comment, reply to comments, and like comments — the comment author and thread participants are notified; friends see it as activity
↓
Participants can attach photos/videos; these are logged as activity for friends, never as a personal notification
↓
Owner may nudge participants about an upcoming sidequest, which reaches them as a notification
↓
Scheduled sidequests generate reminder notifications to participants as the date approaches

---

## 6. Completing a Sidequest

Owner marks the sidequest done
↓
The set of currently joined participants is snapshotted as the people who "went"
↓
The sidequest moves to completed state for the owner and every snapshotted participant
↓
Each of them, on next view, gets a completion celebration once — never repeated
↓
Each chooses their own visibility for it: private, the specific friend list it was launched to (only when it was list-scoped), or all friends
↓
Completed sidequests support photos, videos and comments but no joining and no nudging
↓
Visibility can be changed later from the user's profile
↓
Owner may reopen a completed sidequest, returning it to active

---

## 7. Home Feed & Activity

Feed shows friends' sidequests the user is permitted to see, excluding their own, filtered by friend-list membership, completion visibility, privacy and blocks
↓
User can search and filter, and paginate ten at a time
↓
Activity tab shows what friends did: joined, completed, commented, added photos, became friends
↓
Activity respects a single per-user toggle in Settings: turning it off both stops the user emitting activity and empties their own activity tab
↓
Activity older than 30 days drops off

---

## 8. Notifications

Notifications only cover things aimed at the user personally: friend requests and acceptances, friend-list invitations, comments and replies on their sidequests, someone joining or claiming a role on their sidequest, being removed from a list or sidequest, ownership transfer requests and outcomes, edits or cancellation of a sidequest they joined, reminders, and nudges
↓
Opening a notification deep-links to the exact sidequest, comment or list
↓
Notifications can be marked read individually or in bulk, and cleared

Friend-centric events (a friend launching a sidequest, a friend adding photos) are activity only, never notifications.

---

## 9. Calendar

Scheduled sidequests the user can see appear on a date
↓
User steps forward/backward through days
↓
Selecting one opens the sidequest

---

## 10. Profile & Settings

Own profile shows active and completed sidequests plus the friend list
↓
Swiping a card right marks it complete or returns it to active
↓
Completed items expose a visibility picker
↓
Friends can be removed from the list with confirmation
↓
Settings control activity sharing, notification categories, blocked users, tip replay, legal acceptance, and account deletion

---

## 11. Safety & Moderation

User reports another user or a piece of content with a reason
↓
Report is stored for admin review
↓
Admins review reports and act on accounts
↓
Blocking is immediate and mutual in effect: no feed presence, no activity, no comments, no requests

---

## 12. Legal Updates

Terms or guidelines are updated
↓
User sees a pending-acceptance state on next session
↓
User reviews and accepts to continue using the app
