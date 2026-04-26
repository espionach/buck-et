## Add Glassmorphism Effect to Group Icons

Give the icons on the Groups page a frosted-glass tile look inspired by the user's reference screenshot — a translucent glass plate with a soft colored glow behind it, a subtle inner highlight, and a small specular sparkle.

### Changes

**1. New component: `src/components/GlassIconTile.tsx`**

A reusable component that renders a Lucide group icon inside a glass plate.

Layered structure (rounded square):
- **Color blob (back layer)** — A soft, blurred gradient blob using the group's `cardColor` (mapped from `GROUP_COLORS`) to create the colored glow behind the glass.
- **Glass plate (middle layer)** — `bg-white/30`, `backdrop-blur-md`, `border border-white/40`, `rounded-2xl`, `shadow-md`, plus a subtle inner top highlight (a small absolute `bg-gradient-to-b from-white/60 to-transparent` strip at the top edge).
- **Specular sparkle** — A tiny `w-1.5 h-1.5` white circle at the top-left, slightly blurred and low-opacity, to mimic the highlight in the reference.
- **Icon (front layer)** — `GroupIconDisplay` centered on top, using the group's `iconColor` class via `iconColorClassFor`.

Props:
- `icon: string`
- `iconColor?: string` (from `GROUP_ICON_COLORS`)
- `cardColor?: string` (from `GROUP_COLORS`, drives the colored glow)
- `size?: "sm" | "md" | "lg"` (defaults to `md`)
- `className?: string`

**2. Update `src/components/GroupCard.tsx`**

- Replace the existing top-of-card `GroupIconDisplay` with `<GlassIconTile icon={group.emoji} iconColor={group.iconColor} cardColor={group.color} />`.
- Keep the card's outer gradient, name, members count, and avatars untouched.
- Slightly adjust the top row spacing if needed so the larger glass tile sits cleanly.

### Scope (intentionally limited)

- Only group cards on the Groups page get the glass tile.
- Inline icons elsewhere (quest cards, dropdowns, profile chips, the `GroupIconPicker` preview and picker grid) remain plain `GroupIconDisplay` glyphs to keep them legible at small sizes.

### Notes
- Uses only existing Tailwind utilities (`backdrop-blur-md`, `bg-white/30`, gradients, `shadow-md`) — no new dependencies and no `index.css` changes.
- Falls back gracefully to the first color in `GROUP_COLORS` if `cardColor` is missing.