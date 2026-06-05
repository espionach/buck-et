## Design System Unification

Based on your choices:
- **Inputs** → Outlined (`bg-card border border-border`)
- **Icon buttons** → Bare (no hover background)
- **Cards** → Soft outlined with subtle shadow (`border border-border/50 shadow-sm`)
- **FindFriends back** → Standard icon back button

### Changes

**1. Inputs — every text input/textarea standardized to `bg-card border border-border`**
Affected files: `Feed.tsx`, `Home.tsx` (search), `Settings.tsx` (email, password, support textarea, etc.), `Profile.tsx` (edit name/bio + every modal field), `CreateQuest.tsx` & `EditQuest.tsx` (link sub-input), `CreateGroup.tsx` & `GroupMembers.tsx` (friend search), `AdminDashboard.tsx` (3 search inputs), `CommentThread.tsx` (reply + top-level), `NudgeModal.tsx` (search + custom message), `ReportUserModal.tsx`, `ReportContentModal.tsx`, `AddMembersModal.tsx`.

**2. Cards — soft outline + subtle shadow**
Every `bg-card border border-border rounded-2xl` and `bg-card border border-border/50 rounded-2xl` updated to `bg-card border border-border/50 rounded-2xl shadow-sm`. Affected: `Settings.tsx`, `BlockedUsers.tsx`, `FindFriends.tsx`, `AdminDashboard.tsx`, `AdminReports.tsx`, `LegalUpdates.tsx`, `CommunityGuidelines.tsx`, `Profile.tsx`.

**3. Icon buttons — strip hover backgrounds from header ghost buttons**
- `GroupMembers.tsx:72` — remove `rounded-xl hover:bg-muted`
- `GroupSettings.tsx:83` — remove `rounded-xl hover:bg-muted`

**4. FindFriends back button**
Replace the text "← Back" link with the standard `<ArrowLeft>` icon button (`p-2 -ml-2 text-muted-foreground hover:text-foreground`) used everywhere else.

### Out of scope
- Auth pages (`Login`, `Signup`, `ForgotPassword`, `ResetPassword`) keep their bare shadcn `<Input>` — already consistent with each other; changing them would require restyling the shadcn primitive. Say the word and I'll align them too.
- Inline action circles (accept/decline invite, photo-remove overlay, media viewer close) keep their filled-circle treatment — they're intentionally different from nav icons.

Switch to build mode and approve to apply.