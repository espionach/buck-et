# Legal Updates System

A simple in-app system to notify users when the Terms of Service or Privacy Policy changes, and let them review past updates from Settings.

## What gets built

1. **Database**
   - New table `legal_updates`: `id`, `type` (`terms` | `privacy`), `version` (int), `title`, `message`, `effective_date`, `created_at`. Public read, admin-only write.
   - New table `user_legal_acknowledgements`: `user_id`, `type`, `last_seen_version`, `seen_at`. Unique on (user_id, type). Each user can only read/write their own rows.

2. **Banner**
   - New `LegalUpdateBanner` component shown above the bottom nav on the main app screens (Home, Groups, Profile).
   - Queries the latest `legal_updates` row per type and compares with the user's `user_legal_acknowledgements`.
   - If anything is unseen, shows a single banner: title "We updated our Terms" / "We updated our Privacy Policy", message "Tap to review the latest changes.", and a "Review" button that navigates to `/settings/terms` or `/settings/privacy-policy`.
   - When the user opens that page, we mark the latest version as seen, which dismisses the banner.
   - If multiple updates are unseen, the most recent one is shown first; the next appears after acknowledging the first.

3. **Policy pages**
   - `TermsAndConditions.tsx` and `PrivacyPolicy.tsx` already show a "Last updated" date — keep it, and on mount upsert `user_legal_acknowledgements` with the latest version of that type.

4. **Settings → Legal Updates**
   - New row in Settings opening `/settings/legal-updates`.
   - Page lists past `legal_updates` (newest first) with title, date, short summary, and a button to open the corresponding policy page.

5. **Seeding current versions**
   - Insert two initial rows so the system has a known "current" version for each policy:
     - Terms: version 1, date May 11, 2026, title "Terms of Service Update", message "We updated our Terms of Service."
     - Privacy: version 1, date May 06, 2026, title "Privacy Policy Update", message "We updated our Privacy Policy."

## Technical details

- New routes in `App.tsx`: `/settings/legal-updates`. Add to `hideNav` list.
- Banner placement: render inside `AppLayout` just above `<BottomNav />`, hidden on the same routes `hideNav` hides the nav, plus auth/onboarding routes.
- Hook `useLegalUpdates()` returns `{ latestByType, unseen, acknowledge(type, version) }` using Supabase queries; subscribes to realtime changes on `legal_updates` so banner appears immediately when admins publish a new update.
- Acknowledgement uses `upsert` on (user_id, type) with `last_seen_version = greatest(existing, new)`.
- All styling uses existing semantic tokens (`bg-card`, `text-foreground`, `text-muted-foreground`, `text-primary`); no custom colors. Lucide icons only.
- To publish a future update: admin inserts a new `legal_updates` row with an incremented `version` for that type. (No admin UI in this pass — table writes happen via SQL/migration. Can be added later if you want.)

## Out of scope

- Push notifications, email notifications.
- Admin UI for composing legal updates (insert directly in the DB / via migration for now).
