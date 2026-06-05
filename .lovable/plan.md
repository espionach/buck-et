# Profile: Icon Tab Bar (Instagram/TikTok style)

Replace the current pill-style segmented control on the Profile page (Active / Completed / Groups text buttons) with a minimal, icon-only tab bar where the active tab is indicated by a thin underline beneath the icon.

## Icons
- **Active** → `Zap` (lightning bolt — "in-progress energy")
- **Completed** → `Flag` (finish-line flag)
- **Groups** → `Users2` (three-people silhouette)

## Visual spec
- Full-width row, 3 equal-width tab buttons.
- Each button: icon centered, ~24px, `text-foreground` when active, `text-muted-foreground` when inactive.
- Active tab: 2px underline bar (`bg-foreground`) anchored to the bottom of the row, ~40% the width of the button, animated horizontally between tabs (Framer Motion `layoutId`).
- Bottom border (`border-b border-border`) spanning the full row, sitting behind the active underline — same pattern as Instagram/TikTok.
- Remove the muted pill background and shadow chips.
- Remove the numeric counts (e.g., "Active (3)") to keep it clean and icon-only, matching the reference. Counts already appear in section content.
- Each tab keeps an `aria-label` ("Active sidequests", "Completed sidequests", "Groups") for accessibility.
- Tap target ≥ 44px tall (py-3).

## Behavior
- No change to tab state, URL param handling, or content rendering — only the bar's markup/styles change.
- Preserve existing `data-tour="profile-tab-current|past|groups"` hooks so onboarding coachmarks still attach.

## Files
- `src/pages/Profile.tsx` — replace the block at lines ~702-719 with the new icon tab bar; add `Zap`, `Flag`, `Users2` to the lucide-react imports (keep `CheckCircle2`/`Sparkles` since they're still used in the empty-state).

## Out of scope
- No changes to tab content, drafts shortcut, or routing.
- No changes to BottomNav or any other nav surface.
