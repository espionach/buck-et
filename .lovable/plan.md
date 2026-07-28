# SideQuest — Normalized PostgreSQL Schema (Documentation)

This is a documentation-only plan. No SQL, no code changes. It reflects the current `public` schema as it actually exists in the database, normalized and annotated. Standard columns `id uuid PK default gen_random_uuid()`, `created_at timestamptz default now()`, and `updated_at timestamptz default now()` are omitted per-table and noted once here — assume `id`/`created_at` on every table unless stated, and `updated_at` only where listed.

Auth note: `auth.users` is managed by Supabase. User FKs point at `auth.users(id)` conceptually but are not declared as FKs in this project (per platform convention). `profiles.user_id` is the app-side handle for a user.

---

## 1. Identity & Profile

### `profiles` — one row per app user
Why: public-facing user card (name, avatar, username, bio) plus per-user settings that don't belong on `auth.users`.
- `user_id uuid NOT NULL UNIQUE` → auth user
- `username text NOT NULL` (case-insensitive unique via lower(username))
- `display_name text`
- `avatar_url text`
- `bio text`
- `timezone text` — device TZ, used by reminders
- `onboarded_at timestamptz`, `onboarding_step text` — onboarding funnel
- `activity_sharing_enabled boolean NOT NULL default true` — opt-out for friend activity feed
- `updated_at timestamptz`
- Indexes: unique on `lower(username)`, unique on `user_id`

### `user_roles` — RBAC
Why: role storage kept off `profiles` to prevent privilege escalation via profile edits. Read via `has_role()` SECURITY DEFINER.
- `user_id uuid NOT NULL`
- `role app_role NOT NULL` (enum: `admin | moderator | user`)
- Unique `(user_id, role)`

### `user_flags` — moderation state per user
Why: track strikes, suspensions, bans; consumed by `user_can_act()`.
- `user_id uuid NOT NULL UNIQUE`
- `strike_count int NOT NULL default 0`
- `is_suspended boolean NOT NULL default false`
- `suspended_until timestamptz`
- `is_banned boolean NOT NULL default false`
- `notes text`
- `updated_at timestamptz`

### `contact_identifiers` — hashed contact lookups
Why: privacy-preserving friend discovery. Stores SHA-256 of normalized email/phone, never raw.
- `user_id uuid NOT NULL`
- `kind text NOT NULL` (`email` | `phone`)
- `hash_sha256 bytea NOT NULL`
- `verified_at timestamptz`
- Unique `(kind, hash_sha256)`

### `contact_discovery_consents` — opt-in flag for discovery
Why: gate for the `contact-discovery-match` edge function.
- `user_id uuid NOT NULL PRIMARY KEY`
- `enabled boolean NOT NULL default false`
- `updated_at timestamptz`

---

## 2. Social Graph

### `friend_requests`
Why: pending state before a bidirectional friendship exists.
- `from_user_id uuid NOT NULL`
- `to_user_id uuid NOT NULL`
- `status text NOT NULL` (`pending | accepted | declined`)
- Unique `(from_user_id, to_user_id)`
- Index on `to_user_id` (inbox), `from_user_id` (outbox)

### `friendships` — accepted mutual friends
Why: symmetric relation stored as directed row; app queries both directions. Deletion trigger `handle_friendship_deleted` cascades cleanup (invites, friends-only participants, group memberships).
- `user_id uuid NOT NULL`
- `friend_id uuid NOT NULL`
- Unique `(user_id, friend_id)`; also enforce `user_id <> friend_id`
- Indexes on both columns

### `blocked_users`
Why: hard block that removes friendship, pending invites, and shared quest participation via `handle_block_created` trigger.
- `blocker_id uuid NOT NULL`
- `blocked_id uuid NOT NULL`
- Unique `(blocker_id, blocked_id)`

---

## 3. Groups

### `groups` — private lists of friends
Why: named container for sharing quests with a fixed subset of friends. Groups are private (no join concept).
- `owner_id uuid NOT NULL`
- `name text NOT NULL`
- `emoji text NOT NULL`
- `color text NOT NULL`
- `icon_color text NOT NULL`
- `description text`

### `group_members`
Why: membership rows (owner + members).
- `group_id uuid NOT NULL → groups(id) ON DELETE CASCADE`
- `user_id uuid NOT NULL`
- `role text NOT NULL` (`owner | member`)
- Unique `(group_id, user_id)`

### `group_invitations`
Why: pending invite before membership.
- `group_id uuid NOT NULL → groups(id) ON DELETE CASCADE`
- `invited_by uuid NOT NULL`
- `invited_user_id uuid NOT NULL`
- `status text NOT NULL` (`pending | accepted | declined`)
- Unique `(group_id, invited_user_id)` where status = pending

### `group_notification_mutes`
Why: per-user mute of a specific group's notifications.
- `user_id uuid NOT NULL`
- `group_id uuid NOT NULL → groups(id) ON DELETE CASCADE`
- Unique `(user_id, group_id)`

---

## 4. Sidequests (core entity)

### `sidequests`
Why: the plan/activity itself. Denormalizes logistics fields inline (single object per quest — no separate logistics table needed since 1:1 and always fetched together).
- `created_by uuid NOT NULL`
- `group_id uuid → groups(id) ON DELETE SET NULL` (optional — quest can be friends-only instead)
- `title text NOT NULL`
- `description text`
- `notes text`
- `photos text[]` — legacy inline photo URLs
- `links text[]`
- `is_friends_only boolean NOT NULL default false`
- `is_hidden boolean NOT NULL default false` — moderation hide
- `completed_at timestamptz` — owner-completion timestamp (per-user completion is separate)
- Logistics (all optional):
  - `logistics_date date`
  - `logistics_time text` (h:mm AM/PM stored as text)
  - `logistics_location text`
  - `logistics_latitude numeric`, `logistics_longitude numeric`, `logistics_place_id text`
  - `logistics_meetup_spot text`
  - `logistics_transportation text` (`car | bike | walk | transit | other`)
  - `logistics_carpool_slots int`
  - `logistics_custom_notes text`
- `contribution_roles text[] NOT NULL default '{}'` — role IDs the creator opened up
- Indexes: `created_by`, `group_id`, `logistics_date`

Rule: `group_id IS NOT NULL` XOR `is_friends_only = true` is enforced at app layer, not DB.

### `sidequest_participants`
Why: who has joined a quest. Membership snapshot at time of owner completion is captured via `sidequest_completions`.
- `sidequest_id uuid NOT NULL → sidequests(id) ON DELETE CASCADE`
- `user_id uuid NOT NULL`
- Unique `(sidequest_id, user_id)`
- Index on `user_id` for "my quests"

### `sidequest_volunteers`
Why: per-user role sign-ups (driver, snacks, photographer, …). Separate from participants because roles are optional and can be multiple per quest.
- `sidequest_id uuid NOT NULL → sidequests(id) ON DELETE CASCADE`
- `user_id uuid NOT NULL`
- `role text NOT NULL` (role id from `ALL_CONTRIBUTION_ROLES`)
- Unique `(sidequest_id, user_id, role)`

### `sidequest_completions`
Why: completion is per-user, not per-quest. Records which participant marked it done and when.
- `sidequest_id uuid NOT NULL → sidequests(id) ON DELETE CASCADE`
- `user_id uuid NOT NULL`
- `completed_at timestamptz NOT NULL`
- Unique `(sidequest_id, user_id)`

### `sidequest_photo_events`
Why: append-only event stream of photo uploads. Powers the friend activity feed (photos added by any participant, not just the owner). Distinct from the inline `sidequests.photos` array because we need per-event author + timestamp.
- `sidequest_id uuid NOT NULL → sidequests(id) ON DELETE CASCADE`
- `user_id uuid NOT NULL`
- `photo_url text NOT NULL`
- Index on `(sidequest_id, created_at DESC)`

### `quest_nudges`
Why: lightweight "poke" from one user to another about a specific quest.
- `sidequest_id uuid NOT NULL → sidequests(id) ON DELETE CASCADE`
- `from_user_id uuid NOT NULL`
- `to_user_id uuid NOT NULL`
- `note text`

### `quest_reminders_sent`
Why: idempotency ledger for the `quest-reminders` edge function so we don't double-send reminder emails/notifs.
- `sidequest_id uuid NOT NULL → sidequests(id) ON DELETE CASCADE`
- `user_id uuid NOT NULL`
- `kind text NOT NULL` (e.g. `day_of_9am`, `hour_before`)
- `sent_at timestamptz NOT NULL`
- Unique `(sidequest_id, user_id, kind)`

---

## 5. Comments

### `comments`
Why: threaded discussion on a quest. Self-reference supports one level of replies.
- `sidequest_id uuid NOT NULL → sidequests(id) ON DELETE CASCADE`
- `user_id uuid NOT NULL`
- `text text NOT NULL`
- `parent_comment_id uuid → comments(id) ON DELETE CASCADE` (nullable = top-level)
- Index on `(sidequest_id, created_at)`, `parent_comment_id`

### `comment_likes`
Why: per-user like on a comment; unique constraint prevents double-likes.
- `comment_id uuid NOT NULL → comments(id) ON DELETE CASCADE`
- `user_id uuid NOT NULL`
- Unique `(comment_id, user_id)`

---

## 6. Notifications & Requests

### `notifications` — user-directed inbox
Why: everything relevant to the current user (their own comments-replies, joins on their quests, invites, transfers, reminders). Friend-centric events (photos, launches) live in the activity feed instead, not here.
- `user_id uuid NOT NULL` (recipient)
- `type text NOT NULL` (enum-like — see `AppNotification` type)
- `message text NOT NULL`
- `entity_id uuid` (quest id, request id, …)
- `group_id uuid → groups(id) ON DELETE CASCADE`
- `comment_id uuid → comments(id) ON DELETE CASCADE`
- `group_name text` (denormalized for deleted-group rendering)
- `from_user_id uuid`
- `read boolean NOT NULL default false`
- Index on `(user_id, created_at DESC)`, partial index on `(user_id) WHERE read = false`

### `notification_preferences`
Why: per-user toggles for each notification category, plus a global mute snapshot.
- `user_id uuid NOT NULL UNIQUE`
- Boolean columns per category (ownership transfer, group invitation, quest join, new contribution, photo added, comment reply, quest updated/canceled/reminder, friend accepted, friend new quest, removed, new quest in group)
- `is_muted_all boolean NOT NULL default false`
- `pre_mute_snapshot jsonb` — restore prior settings when un-muting
- `updated_at timestamptz`

### `transfer_requests`
Why: hand over ownership of a quest or group. Pending state with accept/decline.
- `type text NOT NULL` (`quest | group`)
- `entity_id uuid NOT NULL`
- `from_user_id uuid NOT NULL`
- `to_user_id uuid NOT NULL`
- `status text NOT NULL` (`pending | accepted | declined | canceled`)
- Unique partial `(type, entity_id) WHERE status = 'pending'`

---

## 7. Moderation & Safety

### `user_reports`
Why: user- or content-level reports; trigger `auto_flag_on_reports` bumps strikes at 3 pending reports.
- `reporter_id uuid NOT NULL`
- `reported_user_id uuid NOT NULL`
- `target_type text NOT NULL` (`user | quest | comment | photo`)
- `target_id uuid`
- `reason text NOT NULL`
- `description text`
- `status text NOT NULL` (`pending | reviewed | dismissed | actioned`)

### `strike_history`
Why: audit of every strike applied to a user.
- `user_id uuid NOT NULL`
- `report_id uuid → user_reports(id) ON DELETE SET NULL`
- `admin_id uuid NOT NULL`
- `reason text`

### `admin_actions`
Why: append-only admin audit log.
- `admin_id uuid NOT NULL`
- `action_type text NOT NULL`
- `target_type text NOT NULL`
- `target_id uuid`
- `target_user_id uuid`
- `reason text`
- `metadata jsonb`

### `appeals`
Why: user-submitted appeal against a suspension/ban.
- `user_id uuid NOT NULL`
- `reason text NOT NULL`
- `status text NOT NULL` (`pending | approved | denied`)
- `reviewed_by uuid`
- `reviewed_at timestamptz`

### `support_messages`
Why: contact-form submissions (works for logged-out users too).
- `user_id uuid` (nullable)
- `email text NOT NULL`
- `subject text NOT NULL`
- `message text NOT NULL`

---

## 8. Legal

### `legal_updates`
Why: versioned Terms/Privacy notices to surface a banner.
- `type text NOT NULL` (`terms | privacy`)
- `version int NOT NULL`
- `title text NOT NULL`
- `message text NOT NULL`
- `effective_date date NOT NULL`
- Unique `(type, version)`

### `user_legal_acknowledgements`
Why: track which version each user has acknowledged.
- `user_id uuid NOT NULL`
- `type text NOT NULL`
- `last_seen_version int NOT NULL`
- `seen_at timestamptz NOT NULL`
- Unique `(user_id, type)`

---

## 9. Caching

### `place_cache` — Google Places result cache
Why: reduce Places API calls; keyed by `place_id`.
- `place_id text PRIMARY KEY`
- `formatted_address text NOT NULL`
- `latitude numeric NOT NULL`
- `longitude numeric NOT NULL`
- `raw jsonb`
- `fetched_at timestamptz NOT NULL`

---

## Enums

- `app_role`: `admin | moderator | user`

## Relationship summary

```text
auth.users (1) ─┬─ (1) profiles
                ├─ (N) user_roles
                ├─ (0..1) user_flags / notification_preferences / contact_discovery_consents
                ├─ (N) contact_identifiers
                ├─ (N) friend_requests {from,to}
                ├─ (N) friendships {user,friend}
                ├─ (N) blocked_users {blocker,blocked}
                ├─ (N) groups (as owner)
                ├─ (N) group_members / group_invitations / group_notification_mutes
                ├─ (N) sidequests (as created_by)
                ├─ (N) sidequest_participants / _volunteers / _completions / _photo_events
                ├─ (N) comments / comment_likes
                ├─ (N) notifications / transfer_requests / quest_nudges
                └─ (N) user_reports / strike_history / appeals / admin_actions / support_messages

groups (1) ─┬─ (N) group_members / group_invitations / group_notification_mutes
            └─ (N) sidequests

sidequests (1) ─┬─ (N) sidequest_participants
                ├─ (N) sidequest_volunteers
                ├─ (N) sidequest_completions
                ├─ (N) sidequest_photo_events
                ├─ (N) comments ─(1..N)─ comment_likes
                ├─ (N) quest_nudges
                └─ (N) quest_reminders_sent

user_reports (1) ─ (0..N) strike_history
```

---

## Not modeled as tables (intentional)

- **Sidequest logistics**: inlined on `sidequests` (strict 1:1, always co-fetched).
- **Sessions / auth tokens**: owned by Supabase `auth` schema.
- **File blobs**: stored in Storage buckets `avatars` (public) and `sidequest-photos` (private); DB stores URLs only.
- **Activity feed**: computed at query time by `get_friend_activity()` RPC (unions participants, completions, comments, photo events, friendships) — no materialized table.

## Next step

Approve this and I can generate the SQL (schema-only, or a full seed + RLS bundle) — or I can add anything missing first.
