## Goal

Replace the prominent "Finish Sidequest" CTA on quest cards with a calmer interaction:
- **Desktop**: a subtle "Finish" text link (light grey → green on hover)
- **Mobile**: swipe-right gesture on the card to reveal a green "Finish" action

Only affects the owner's active quest cards (where this button currently appears). Finished/undone states unchanged.

## Files

- `src/components/QuestCard.tsx` — swap the button, add swipe logic
- (uses existing `src/hooks/use-mobile.tsx`)

## Desktop behavior

Replace the existing `Check + "Finish Sidequest"` button (lines 394–405) with a minimal text-only link in the same footer row:

```text
[💬 comments]                              Finish
                                ^ text-muted-foreground/70
                                  hover:text-secondary (green)
                                  text-xs font-medium
                                  transition-colors
```

- No icon, no bold weight
- Same click handler (`handleMarkDone`)
- Same `stopPropagation` so it doesn't navigate into the quest

## Mobile behavior (swipe-to-finish)

Wrap the card content in a swipeable container using Framer Motion (`motion.div` with `drag="x"`, already a project dependency). Pattern:

```text
┌────────────────────────────────────────┐
│ [green Finish action revealed here] →  │  ← underlay
│ ┌────────────────────────────────────┐ │
│ │   Quest card (draggable on x)      │ │  ← drags right to reveal
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

- `drag="x"`, `dragConstraints={{ left: 0, right: 96 }}`, `dragElastic={0.15}`
- Underlay: full-height green panel (`bg-secondary text-secondary-foreground`) with a centered `Check` icon + "Finish" label, revealed as the card translates right
- On `onDragEnd`: if offset > 64px or velocity > 400 → animate card off, call `handleMarkDone()`; else snap back to 0
- Disable drag when `!isOwner || isFinished || hideActions` (falls back to no swipe action — matches current behavior of hiding the button)
- Tap still navigates to detail (Framer Motion distinguishes tap vs drag automatically)
- Remove the desktop "Finish" text link on mobile to avoid duplication (gated by `useIsMobile()`)

## Edge cases

- Pinned cards (`isPinned` border) — swipe still works, underlay sits inside the rounded border via `overflow-hidden` on the wrapper
- `justAdded` animation — apply to the inner draggable layer, not the wrapper, so the pulse still plays
- Comments expansion — unaffected; lives below the draggable row only if we wrap the whole card. We'll wrap the whole `Card` so comments swipe with it; acceptable since swiping is the whole-card gesture
- Reduced motion: respect `prefers-reduced-motion` by disabling drag (fall back to a long-press? — out of scope; just skip swipe and show the desktop-style "Finish" text link instead)

## Out of scope

- Three-dots menu changes
- Any change to the "Move to Active" undo button on finished quests
- Backend / data changes
