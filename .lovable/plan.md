

## Plan

### 1. Hide current user's own quests from the Home feed

In `src/pages/Feed.tsx`, the feed filter (line 40) currently includes quests where `q.createdBy.id === currentUser.id`. Remove this condition so the user's own quests never appear in the feed — they already appear on the Profile page.

**Change**: In the `feedQuests` filter, remove `|| q.createdBy.id === currentUser.id` from line 40, and also add an early return `if (q.createdBy.id === currentUser.id) return false;` to exclude all self-created quests (including group quests).

### 2. Display all filled-out quest fields on QuestCard

Currently `QuestCard` only shows: description, links, photos, and date/time. It does **not** show location, meetup spot, transportation, carpool slots, or custom notes — even when filled out. These should display on the card whenever they have values.

**Add to `QuestCard.tsx`** (after the date section, before the social proof section):
- **Location** — show with MapPin icon when `quest.logistics?.location` exists
- **Meetup Spot** — show with MapPin icon (muted) when `quest.logistics?.meetupSpot` exists  
- **Transportation** — show with appropriate transport icon when `quest.logistics?.transportation` exists (include carpool slots if applicable)
- **Custom Notes** — show truncated with a note icon when `quest.logistics?.customNotes` exists

Import `MapPin` and the transport icons (`Car`, `Bike`, `Train`, `Footprints`) into QuestCard.

### 3. Ensure all fields visible in QuestDetail and edit modal

The QuestDetail page and the Profile edit modal already display all logistics fields. No changes needed there — just verify the edit modal initializes all fields correctly (confirmed: it does in `handleOpenCurrentEditor`).

### Files to edit
- `src/pages/Feed.tsx` — filter out own quests
- `src/components/QuestCard.tsx` — add location, meetup, transport, and notes display

