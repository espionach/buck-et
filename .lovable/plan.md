## Goal

The desktop "Finish" link on owner-active quest cards is too faint to notice. Make it consistently visible in light grey and turn green on hover.

## File

- `src/components/QuestCard.tsx` (the link at lines 434–444)

## Change

Bump the resting contrast so the link reads clearly without competing with the title, and keep the green hover state.

- Resting color: `text-muted-foreground` (was `text-muted-foreground/70`, which made it nearly invisible against the card)
- Hover color: `text-secondary` (the brand green) — unchanged
- Weight stays `font-medium`, size stays `text-xs`
- Add a touch more presence with `underline-offset-4 hover:underline` so the affordance is obvious on hover without adding visual weight at rest
- Keep `transition-colors`

Result in the card footer row:

```text
[💬 comments]                                Finish
                                  ^ light grey at rest
                                    green + underline on hover
```

## Out of scope

- Visibility rules: still owner-only, active-only, hidden when `hideActions` (unchanged from current behavior). If you also want non-owner joiners to see a "Finish" link, say the word and I'll add it.
- Mobile swipe behavior — unchanged
- "Move to Active" link on finished quests — unchanged
