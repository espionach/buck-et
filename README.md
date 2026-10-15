# Remix of Backend Bucket

Product Concept

A collaborative, mobile side‑questing app that turns friend‑group ideas into action. Friends can add, vote, and nudge each other to act—making spontaneous adventures easy to start, track, and remember.

Primary users: college students and close friend groups who already coordinate informally through group chats (e.g., iMessage, Instagram DMs).




Core Value Proposition

Reduce friction in casual group planning by turning vague “we should do X” chats into shared, visible side quests.

Make participation social and effortless—you can see who’s in, what’s next, and which ideas are gaining momentum.

Reward follow‑through with lightweight ways to record and revisit memories after completion.





2. Information Architecture (Logic Check)

Based on the bucket_flowchart.jpg, the app follows a four-pillar navigation structure:

Home Page: The hub for Group Boards and management.

Global New Quest Button: A persistent entry point accessible from Home and Feed.

Feed: Specifically for Followers' Quests with integrated Search.

Profile: The personal archive and settings hub.





3. Updated MVP Feature Set

A. Centralized Group Hub (Home Page)

Group Board Cards: Display name, member count, and active quest count.

Group Management: Access via a settings icon on the specific board to edit group name, add/remove members, or leave the group.

Entry Point: Dedicated "+ New Group" button.

B. Global Quest Creation Flow

The flowchart identifies a "Global New Quest Button" that bridges the Home and Feed tabs.

Step 1 (Details): Input Title and optional description/notes.

Step 2 (Audience Routing):

Group Quest: Select a specific Group Board. The quest is "locked" to those members.

Followers-Only Quest: No group selected; visible to all approved followers in their Feed.

Automation: Upon creation, the quest automatically populates in the creator's Current Tab and the selected Board/Feed.

C. Feed & Discovery

Follower Quests: A scrollable list of "Followers-only" quests created by people the user follows.

Integrated Search: A search bar at the top of the Feed specifically for finding friend profiles to follow.

"I'm In" Interaction: A one-tap toggle on any card (Feed or Group Board) that adds the quest to the user's Current Tab.

D. Profile & Personal Archive

Personalization: Displays Avatar, Name, and Bio.

The "Current" Tab: Unified view of all joined or created quests.

The "Past" Tab: Quests moved here via a checkbox on the Quest Card.

Memory Capture: Ability to add photos or notes to quests once moved to the Past tab.

Settings Hub: Access to "Account & Privacy" and "Followers/Requests" management.





4. Technical & Privacy Requirements

Private by Default: All profiles require an approved follow request before any quest data is visible.

Locked States: If a user views a friend's profile and sees a Group Quest for a group they are not in, they can see the card but the "Join" button is disabled/hidden.

State Sync: Checking a quest as "Done" on a Group Board must reflect in the individual's Profile Past tab.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7a495eec-50ef-416b-8c54-6b16aa3d8228).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
