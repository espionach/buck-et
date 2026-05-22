## What happened

The app is stuck because the new safety gate I added waits for the signed-in user’s profile row before rendering the app. Your current session is authenticated, but the backend returns no matching `profiles` row for that user, so the gate never opens.

That also explains the earlier “nothing works” behavior: after the remix, profile creation is not happening reliably. The app had an authenticated user, but no profile/user identity in the app store, so actions like creating sidequests or uploading avatars could run with an empty/missing user id and hit UUID/RLS-style backend errors.

## Fix plan

1. **Replace the fragile loading gate**
   - Stop blocking forever on `profile.data`.
   - Only show loading while auth/profile queries are actually loading.
   - If a profile is missing, run a recovery path instead of leaving the app on `Loading...`.

2. **Add profile self-repair**
   - Add a safe backend function that creates the current user’s missing profile using the authenticated session.
   - It will not expose admin privileges or rely on client-supplied user ids.
   - `useCurrentProfile()` will call this when the profile query returns no row, then return the recovered profile.

3. **Make auth readiness explicit**
   - Ensure authenticated queries only run after auth restoration is complete.
   - This prevents queries/mutations from firing while the session token is still being restored.

4. **Keep user-facing errors clean**
   - If profile recovery fails, show a friendly “We couldn’t finish loading your account” message with retry/sign-out options instead of raw backend errors.

5. **Verify the affected workflows**
   - Fresh login no longer stays on loading.
   - Missing profile gets recreated.
   - Create sidequest, upload profile picture, like comments, and settings actions no longer send empty UUIDs.
   - Onboarding should only show based on the saved profile fields, not from transient fetch failures.

## Notes

The current data state appears empty after remixing, so existing sidequests/groups/friends may not be present in this backend unless they were migrated/restored separately. This plan fixes the app being unusable and prevents missing-profile identity failures going forward.

<presentation-actions>
<presentation-open-history>View History</presentation-open-history>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>