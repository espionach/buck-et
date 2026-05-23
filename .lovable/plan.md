# Calendar view

Replace the "Coming soon" placeholder at `/calendar` with a working month calendar that shows the user's scheduled sidequests.

## Behavior

- **Scope of quests shown**: any quest the user owns OR participates in that has a `logistics.date` set. Completed quests still appear on their original date (faded), so the calendar doubles as a light history.
- **Month grid**: shadcn `Calendar` (single-select) as the main view. Each day with one or more quests gets a small dot under the date number (primary color). Days with 3+ quests show a "•••" indicator.
- **Header**: page title "Calendar", short subtitle. Month/year label with prev/next chevrons (DayPicker built-in), plus a "Today" button that snaps back to the current day.
- **Selected-day panel**: under the calendar, list the quests scheduled for the selected date (defaults to today). Each row shows the quest's group color/emoji, title, time (if set), location (if set), and the owner avatar. Tapping a row navigates to `/quest/:id`.
- **Empty states**:
  - No quests on the selected day → "Nothing scheduled" line with a soft icon.
  - User has zero scheduled quests anywhere → keep the calendar visible but show a one-line hint under it explaining that scheduled quests will appear here.
- **Today highlight**: today's cell stays visually distinct even when another date is selected (DayPicker default + our dot still renders).
- **Past dates**: still selectable; past quests render with reduced opacity in the list.

## Layout

```text
┌─────────────────────────────────┐
│ Calendar                        │
│ Your scheduled sidequests       │
│                                 │
│   ‹  November 2026  ›   [Today] │
│   ┌─────────────────────────┐   │
│   │  S  M  T  W  T  F  S    │   │
│   │           1  2  3  4  5 │   │
│   │  6  7  8• 9 10•11 12    │   │
│   │ ...                     │   │
│   └─────────────────────────┘   │
│                                 │
│ Friday, Nov 13                  │
│ ┌─────────────────────────────┐ │
│ │ 🟣 Beach day        7:00 PM │ │
│ │    Santa Monica Pier        │ │
│ ├─────────────────────────────┤ │
│ │ 🟢 Pottery class    2:00 PM │ │
│ └─────────────────────────────┘ │
│                                 │
│ [bottom nav]                    │
└─────────────────────────────────┘
```

## Technical notes

- New file: rewrite `src/pages/Calendar.tsx`.
- Data source: `useAppStore()` → `quests`, `currentUser`. Filter to quests where `logistics?.date` is set and `(createdBy.id === currentUser.id || participants.some(p => p.id === currentUser.id))`.
- Parse `logistics.date` (YYYY-MM-DD) with `parseISO` from `date-fns`. Build a `Map<string, Quest[]>` keyed by `yyyy-MM-dd` for O(1) lookup per day.
- Use shadcn `Calendar` with `mode="single"`, `selected`, `onSelect`. Customize the day cell via the `components.DayContent` (or `modifiers` + `modifiersClassNames`) to render a dot below the number when the date has quests. Keep `className="p-3 pointer-events-auto"` per project convention.
- Quest row card: reuse styling tokens (`bg-card`, `border-border`, `rounded-[var(--radius)]`). Tap → `navigate(\`/quest/${quest.id}\`)`.
- Respect existing visual tokens: DM Sans, lucide icons only, no emoji in UI (the diagram above is illustrative — actual group color comes from the group's color/pattern, not a literal emoji).
- No DB or schema changes. No new dependencies — `react-day-picker` and `date-fns` are already in the project (shadcn Calendar uses them).
