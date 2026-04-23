

## Lighter, Logo-Style Group Icons + Persistent Selections

Three changes: refresh icon style to match the bucket logo (light stroke + soft fill), expand the icon color palette to mirror the card colors plus black/white, and stop user picks from "glitching back" after selection.

### 1. Match icon style to the bucket logo

In `src/components/GroupIcon.tsx`, drop the heavy hand-drawn look for a softer, logo-matching style:

- `strokeWidth` reduced from `2.5` to `1.75` (matches the bucket's lighter outline).
- Add a translucent fill of the same color: `fill="currentColor"` with `fillOpacity={0.18}`.
- Keep `strokeLinecap="round"` and `strokeLinejoin="round"` for soft corners.
- Drop the "all icons emulate a heavy hand-drawn outline" comment — replace with a note about the bucket-logo styling.

Result: each lucide icon renders as a clean outlined glyph with a soft tinted fill — visually consistent with the filled bucket on the home feed.

### 2. Rework the icon color palette

In `src/data/groupColors.ts`, replace `GROUP_ICON_COLORS` so it has the **same count as `GROUP_COLORS` (6)** plus **black** and **white** — 8 total. Each is a darker counterpart of a card color so the icon pops against the lighter card gradient:

| id        | text class           | swatch class       |
|-----------|----------------------|--------------------|
| sky       | `text-sky-700`       | `bg-sky-700`       |
| rose      | `text-rose-700`      | `bg-rose-700`      |
| amber     | `text-amber-700`     | `bg-amber-700`     |
| emerald   | `text-emerald-700`   | `bg-emerald-700`   |
| violet    | `text-violet-700`    | `bg-violet-700`    |
| slate     | `text-slate-700`     | `bg-slate-700`     |
| black     | `text-neutral-900`   | `bg-neutral-900`   |
| white     | `text-white`         | `bg-white border border-border` |

The white swatch needs a border so it's visible against the white background of the picker.

### 3. Stop selections from "glitching back"

Two real causes today:

**A. `GroupSettings` local state (`editEmoji` / `editColor` / `editIconColor`) initializes from `group.*` only on mount.** When the optimistic update propagates and the modal re-renders with a refreshed `group` prop, the local state stays at the *old* value. If the user then edits the name and clicks save, `handleSave` writes the stale color back.

Fix in `src/components/GroupSettings.tsx`: add a `useEffect` that re-syncs the three `edit*` states whenever `group.id`, `group.emoji`, `group.color`, or `group.iconColor` changes. This keeps local state aligned with the source of truth.

**B. React Query refetch race.** `updateGroup` in `src/data/appState.ts` writes optimistically to the Zustand store but does **not** update the React Query cache. When `_invalidate(["groups"])` fires the refetch, there's a brief window where the in-flight query result (still computing) lands and overwrites the store via the `DataProvider` useEffect — sometimes with a slightly stale row if Supabase hasn't fully reflected the write yet.

Fix in `src/data/appState.ts` `updateGroup`:
- Keep the optimistic Zustand `set`.
- After `await supabase.from("groups").update(...)`, instead of bare `_invalidate(["groups"])`, do an optimistic React Query cache patch: call `_invalidate` only after the DB write resolves (already does), AND have the new `useGroups` refetch be the authoritative source. To eliminate the flicker, also patch the query cache directly via a new helper exposed from `DataProvider` — simplest: skip `_invalidate` when only `color` / `iconColor` / `emoji` change (these are already in the store and don't affect joins), and only invalidate on `name` / `description` changes that other queries might depend on.

This is the minimal change that removes the race without restructuring data flow.

### Files touched

- `src/components/GroupIcon.tsx` — lighter stroke + translucent fill.
- `src/data/groupColors.ts` — 8-entry icon palette (6 colors + black + white).
- `src/components/GroupSettings.tsx` — `useEffect` to re-sync `editEmoji` / `editColor` / `editIconColor` from props; white swatch needs the bordered class.
- `src/data/appState.ts` — `updateGroup`: only invalidate `groups` query when `name` or `description` changes; pure visual updates (`emoji` / `color` / `iconColor`) skip the refetch and rely on the optimistic Zustand state.
- `src/components/GroupIconPicker.tsx` — no logic change; the picker grid already uses `iconColorClassFor`, so the new palette flows through automatically. White will need the same bordered swatch treatment if shown as a button.

### Out of scope

- No DB migration (the `icon_color` column already exists).
- No change to `GroupCard` rendering — it already reads `group.iconColor` and applies the class.
- No change to the bucket logo itself.

