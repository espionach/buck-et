## Goal

1. Make the "Join" button on quest cards (Home/Feed) orange — matching the "Join sidequest" button styling on the quest details page.
2. On the quest details page, when the user taps "Join sidequest", animate the button morphing into the green check-circle (the same style used on the quest card after joining), then have it fade/scale out while the rest of the page content slides up to fill the space.

## Changes

### 1. `src/components/QuestCard.tsx` — orange Join pill

In the join button (lines ~257–274), replace the muted styling for the not-joined state with the primary (orange) styling. The joined state (green check-circle using `bg-secondary`) stays exactly the same.

- Joinable: `bg-primary text-primary-foreground hover:bg-primary/90` (was `bg-muted text-muted-foreground`).
- Disabled (not in group / can't join): keep a faded primary look, e.g. `bg-primary/40 text-primary-foreground/70 cursor-not-allowed`.
- Joined state unchanged: `w-8 h-8 rounded-full bg-secondary text-secondary-foreground` with `<Check />`.

### 2. `src/pages/QuestDetail.tsx` — join button morph + content slide-up

Wrap the Join CTA region (lines ~209–219) in a Framer Motion sequence. State machine added locally:

```text
idle  ──tap──▶  morphing (pill → circle, color orange → green, label fades to Check)
                    │
                    └─after ~450ms──▶ exiting (circle scales/fades out, height collapses to 0)
                                          │
                                          └─after ~250ms──▶ done (region unmounted; isIn === true so it stays gone)
```

Implementation notes:
- Add `const [joinAnim, setJoinAnim] = useState<"idle"|"morph"|"exit"|"done">("idle")`.
- On click: `setJoinAnim("morph")`, immediately call `toggleImIn(quest.id)` so app state reflects the join (the rest of the page already reads `isIn`, but we suppress the natural unmount until the animation finishes by gating the CTA's render on `joinAnim !== "done"` rather than `!isIn`).
- After 450ms → `setJoinAnim("exit")`. After another 250ms → `setJoinAnim("done")`.
- Use `motion.div` with `layout` on the CTA container and on the `<div className="px-5 space-y-4 mt-2">` content wrapper so when the CTA collapses, the body content animates upward smoothly via Framer's shared layout transitions (`transition={{ type: "spring", stiffness: 400, damping: 32 }}`).
- The button itself uses `motion.button` with `animate` props transitioning:
  - width: `100%` → `32px`
  - borderRadius: `0.75rem` → `9999px`
  - backgroundColor: `hsl(var(--primary))` → `hsl(var(--secondary))`
  - height stays `~40px`, then collapses to 0 on exit.
- Inner content uses `<AnimatePresence mode="wait">` swapping the "Join sidequest" text (fade/scale-out) for a `<Check />` icon (fade/scale-in) once `joinAnim === "morph"`.
- Exit phase animates `opacity: 0, height: 0, marginTop: 0` to remove the row and let the layout shift pull the rest of the details upward.

No store/API changes; `toggleImIn` already exists. No new dependencies — `framer-motion` is already imported.

## Visual reference

```text
[ Join sidequest         ]   ← orange pill, full width
        │ tap
        ▼
       (●)  ← shrinks to right, turns green, shows ✓
        │
        ▼
       (gone) — details below slide up to fill the gap
```

## Out of scope

- No changes to the joined-state appearance on the card.
- No changes to the disabled/finished cases on the details page (already not rendered).
- No changes to logic in `toggleImIn`.
