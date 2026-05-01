## Password requirements

Rules to enforce:
- Minimum 8 characters
- At least one uppercase and one lowercase letter
- At least one number
- Reject leaked passwords (Have I Been Pwned check)

Applied everywhere a password is set: Signup, Reset Password, and any future password-change flow.

## Implementation

1. **Server-side leaked password protection**
   - Enable HIBP check in Cloud auth settings so the backend rejects any password found in known breach databases. This applies automatically to signup, reset, and password updates.

2. **Shared validator (`src/lib/passwordPolicy.ts`)**
   - New utility exporting:
     - A `zod` schema enforcing the four rules above (length, upper, lower, digit).
     - A `validatePassword(value)` helper returning the first user-friendly error, for inline form validation.
     - A small `PasswordRequirements` checklist component showing each rule with a live check/x as the user types — used on Signup and Reset Password.

3. **Wire into existing forms**
   - `src/pages/Signup.tsx`: validate with the shared schema before calling `signUp`; show the requirements checklist under the password field; show toast on failure.
   - `src/pages/ResetPassword.tsx`: same validation + checklist before calling `updateUser({ password })`.
   - Map backend "leaked password" errors to a clear inline message ("This password has appeared in a data breach. Please choose another.").

4. **Error mapping**
   - Extend `src/lib/errorMapping.ts` (already used in auth flows) to translate Supabase's `weak_password` / HIBP error codes into the friendly message above.

No database migration is needed — this is auth configuration plus client-side validation. Existing accounts are not affected; rules apply the next time a password is set.