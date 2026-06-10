Swap the Home page tab icons:

- **Sidequests tab** → `LayoutList` (replaces `Zap`)
- **Activity tab** → `Waves` (replaces `Activity`)

**File:** `src/pages/Feed.tsx`
- Update the lucide-react import to bring in `LayoutList` and `Waves`; drop `Zap` and the `Activity as ActivityIcon` alias.
- Use the new icons in the home tabs config. Underline, sizing, stroke weight, and the `home-activity-tab` spotlight hook stay unchanged.

No other files affected.