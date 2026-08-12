# Project Memory

## Core
Minimalist white-based design, DM Sans, 0.625rem radius. Lucide 2D icons only (no emojis in UI).
Globally use "friend lists" in UI copy (never "Groups" or "Boards") and "Friends" for user relationships. Code identifiers/routes may still say group.
Profiles private by default (requires mutual friendship).
Sidequest completion is tracked individually per user. Only owners can edit/delete.
Paginate sidequest lists to max 10 initially, with a 'Load More' button.
Home feed excludes user's own quests, showing friends/shared friend lists.

## Memories
- [App Concept](mem://product/concept) — Core vision of SideQuest app for friend group activities
- [Navigation Structure](mem://navigation/structure) — Three-tab main layout and floating action button rules
- [Sidequest Lifecycle](mem://features/quest-lifecycle) — State transitions (Active/Completed) and chronological sorting rules
- [Permissions & Ownership](mem://features/permissions-and-ownership) — Edit/delete rights, ownership transfers, and unjoining rules
- [Privacy & Friends](mem://security/privacy-rules) — Mutual friendship rules, profile visibility, unfriending impacts
- [Visual Identity & Styling](mem://style/visual-identity) — Global design system, typography, icons, and loading states
- [Notification System](mem://features/notifications) — Activity tracking panel, badge logic, and deep-linking behaviors
- [Group Management](mem://features/group-management) — Naming constraints, creation flow, and member rules
- [Sidequest Details & Logistics](mem://features/quest-details-and-logistics) — Logistics display rules, read-only detail view, and role volunteers
- [Sidequest Creation](mem://features/quest-creation) — Creation flow, inputs, launch button, and post-creation navigation
- [Quest Card Styling & Interaction](mem://style/quest-cards) — Card layout, visual hierarchy, and interaction states
- [Filtering & Search](mem://ux/filtering-and-search) — Feed filtering logic, search mode, and history persistence
- [Contact Discovery](mem://features/contact-discovery) — Privacy-first friend matching via hashed emails (no raw contacts stored)
- [Nudge Limits](mem://features/nudge-limits) — Participants-only recipients, 1/24h per person, 20/hr + 50/day owner caps, no self/completed nudges
