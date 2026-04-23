ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS notify_friend_accepted boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_friend_new_quest boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_removed_from_group_or_quest boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_new_contribution boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_photo_added boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_comment_reply boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_quest_updated boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_quest_canceled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_quest_reminder boolean NOT NULL DEFAULT true;