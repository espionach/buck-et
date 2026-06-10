## Goal
Make the active quest detail page feel like a calm, scrollable read instead of a stack of boxed-up cards. Two parallel cleanups: lose the card chrome (Priya) and quiet down the header row (you).

---

## 1. Lose the boxes

Today the body is four bordered cards stacked vertically:
1. Creator + date/location + description + links + Who's in + nudge
2. Sidequest Details (transport + custom notes)
3. Photos & Videos
4. Contributions / Comments

All of them use the same `p-4 rounded-xl border border-border/50 bg-card` shell, which doubles up visual weight on a page that's already information-dense.

Proposal: replace the bordered cards with **borderless sections separated by a single hairline divider**.
- Drop `border`, `rounded-xl`, `bg-card`, and `p-4` from each block.
- Use `py-5` vertical rhythm and a `border-t border-border/40` between sections (no top border on the first section).
- Section headings (`Sidequest Details`, `Photos & Videos`, etc.) become smaller all-caps eyebrows (`text-[11px] uppercase tracking-wide text-muted-foreground font-semibold`) instead of bold body-size titles — they recede so the content carries the page.
- Keep the **map preview**, **photo strip**, and **nudge CTA** as the only "objects" with their own surface — they earn it because they're media or a primary action. Everything else is flat text + icon rows.

Net effect: the page reads top-to-bottom as one continuous document, not four nested containers.

---

## 2. Quiet the header

Current sticky header has, in one row:
- Back arrow
- Title + group/Friends meta (2-line)
- Join / Owner pill
- Share icon
- Menu (•••) or Report flag

That's 5 elements competing for ~390px wide. The pill and two icons crowd the title.

Two options — pick one:

### Option A — Collapse trailing actions into the menu (recommended)
- Keep in the header row: **Back · Title/meta · Join / Owner pill**
- Move **Share** into the `•••` menu (and for non-owners, replace the standalone Flag with `•••` → Report).
- Result: every quest gets the same 3-slot header (back, title, primary action), and overflow lives in a single menu. The title gets its breathing room back.

### Option B — Two-line header
- **Row 1:** Back · group/Friends chip · ••• (everything secondary lives here: Share, Edit, Pin, Delete/Report)
- **Row 2:** Big title (`text-xl font-bold`) · Join / Owner pill aligned right
- Title becomes the visual anchor, secondary chrome shrinks into a thin top strip.

A is the lighter touch. B is the bigger reset and reads more like Notion / Linear detail pages.

---

## Other small tidies that fall out of this
- Drop the "Sidequest Details" heading on the active view entirely if the only content under it is transport + custom notes — those two rows can sit directly under the date/location block. The card was the only reason that heading existed.
- The empty-state `EmptyState` component inside each card looks heavy without the card around it; swap to a single muted line ("Add a time, place, or anything people should know.") for owners, hide entirely for non-owners.
- "Who's In" pills are fine as-is; they're the one place pill-shapes still carry weight.

---

## What I need from you before building
1. Header — **Option A** (collapse Share into `•••`) or **Option B** (two-line)?
2. Confirm borderless + hairline dividers is the direction (vs. keeping subtle `bg-card` tint without the border).
3. Should the completed-quest view get the same treatment in the same pass, or active-only for now?

Once you answer those three, I'll implement in one go.