# Buck-et UI Style Guide Handoff

## Goal
Create a faithful, implementation-ready style guide that another Lovable project can use to reproduce this project’s UI—not merely approximate its color palette.

## Deliverables
- **Polished DOCX style guide** suitable for sharing with collaborators.
- **Matching Markdown source** for easy copying, editing, and versioning.
- **Ready-to-paste Lovable prompt** included in both files, with explicit instructions to recreate the design system while simplifying product functionality.

## What the guide will document
1. **Visual foundations**
   - DM Sans typography hierarchy and exact text sizes/weights.
   - White-based semantic color system, orange primary action color, green secondary color, neutral surfaces, borders, error colors, and quest accents.
   - The `0.625rem` base radius and the project’s recurring corner-radius scale.
   - Spacing, borders, focus rings, icon sizing, motion, and interaction feedback.

2. **Layout system**
   - Mobile-first, narrow centered application shell.
   - Persistent bottom navigation, safe-area treatment, page gutters, top spacing, and bottom clearance.
   - Rules for headers, section spacing, scroll behavior, and responsive desktop presentation.

3. **Reusable UI patterns**
   - Navigation bar and icon-based underline tabs.
   - Sidequest cards, friend-list cards, profile rows, media tiles, and detail sections.
   - Buttons, icon buttons, form fields, selectors, chips, menus, dialogs, and confirmation flows.
   - Loading, empty, unavailable, warning, and error states.
   - Avatar, icon, photo/video, and friend-list color/pattern treatments.

4. **Screen recipes**
   - Home/sidequest feed.
   - Live activity feed.
   - Personal and friend profiles.
   - Sidequest details and creation/edit forms.
   - Friend lists, calendar, settings, and moderation surfaces.
   - Each recipe will explain hierarchy and composition without requiring all original Buck-et features.

5. **Exact recreation rules**
   - Semantic design-token definitions and Tailwind mappings.
   - Approved component conventions and states.
   - “Do / Don’t” guidance to prevent generic AI-app styling, oversized cards, excessive gradients, inconsistent radii, or terminology drift.
   - Accessibility and responsive behavior requirements.

6. **Lovable build prompt**
   - A self-contained prompt specifying the stack, visual tokens, shell, reusable elements, mobile behavior, icon language, animations, and fidelity checks.
   - Clearly separates **design fidelity requirements** from **simplified product scope**, so Lovable copies the UI language without rebuilding every feature.

## Quality checks
- Cross-check measurements and patterns against representative source screens and shared elements.
- Keep the DOCX visually aligned with Buck-et’s own typography, orange/green accents, compact spacing, and restrained surfaces.
- Validate the DOCX package, render every page, and inspect all pages for clipping, overflow, missing content, and visual inconsistencies.
- Ensure the Markdown and DOCX contain the same substantive guidance and copyable prompt.

## Technical details
- Source of truth: global design tokens plus the current navigation, cards, profiles, forms, tabs, dialogs, media, and state components.
- The guide will use semantic token names first, with exact HSL/CSS values supplied in an implementation appendix.
- Deliverables will be saved as downloadable files outside the app codebase; the application itself will not be modified.
