// Types used throughout the app — no longer contains mock data

export interface User {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  bio: string;
  profilePicture?: string;
}

export interface Comment {
  id: string;
  userId: string;
  user: User;
  text: string;
  createdAt: string;
  parentId?: string;
  replies?: Comment[];
}

export type GroupMemberRole = "owner" | "member" | "invited";

export interface GroupMember {
  user: User;
  role: GroupMemberRole;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  color?: string;
  /** Color of the icon itself (separate from card color). */
  iconColor?: string;
  description?: string;
  members: User[];
  memberRoles: GroupMember[];
  ownerId: string;
  activeQuests: number;
  createdAt: string;
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  group: Group;
  invitedBy: User;
  status: "pending" | "accepted" | "declined";
}

export interface FriendRequest {
  id: string;
  from: User;
  status: "pending" | "accepted" | "declined";
}

export type FollowRequest = FriendRequest;

export interface QuestVolunteer {
  userId: string;
  user: User;
  role: string;
}

export interface QuestLogistics {
  date?: string;
  time?: string;
  location?: string;
  /** Resolved latitude from Google Places (when user picked a suggestion) */
  latitude?: number;
  /** Resolved longitude from Google Places (when user picked a suggestion) */
  longitude?: number;
  /** Google place_id for the chosen location, if any */
  placeId?: string;
  meetupSpot?: string;
  transportation?: "car" | "bike" | "walk" | "transit" | "other";
  carpoolSlots?: number;
  volunteers: QuestVolunteer[];
  customNotes?: string;
  /** Contribution role IDs the creator chose to include for sign-ups */
  contributionRoles?: string[];
}

export interface Quest {
  id: string;
  title: string;
  description?: string;
  createdBy: User;
  groupId?: string;
  isFollowerOnly: boolean;
  participants: User[];
  completedByUserIds: string[];
  createdAt: string;
  completedAt?: string;
  photos?: string[];
  notes?: string;
  links?: string[];
  comments: Comment[];
  logistics?: QuestLogistics;
}

export interface TransferRequest {
  id: string;
  type: "quest" | "group";
  entityId: string;
  fromUser: User;
  toUserId: string;
}

export interface AppNotification {
  id: string;
  type:
    | "transfer_quest"
    | "transfer_group"
    | "transfer_declined"
    | "new_comment"
    | "comment_reply"
    | "new_participant"
    | "new_contribution"
    | "photo_added"
    | "follow_request"
    | "friend_request"
    | "friend_accepted"
    | "friend_new_quest"
    | "board_invitation"
    | "removed_from_group"
    | "removed_from_quest"
    | "new_quest_in_group"
    | "quest_updated"
    | "quest_canceled"
    | "quest_reminder";
  message: string;
  entityId?: string;
  groupId?: string;
  commentId?: string;
  groupName?: string;
  fromUser: User;
  read: boolean;
  createdAt: string;
}

// Helper to create a placeholder user from an ID when profile isn't loaded yet
export function placeholderUser(id: string): User {
  return { id, name: "Loading...", avatar: "👤", bio: "" };
}

/**
 * A sidequest is considered finished only when its OWNER has marked it done.
 * Other participants are added to `completedByUserIds` as a snapshot of who
 * was joined when the owner finished the quest, so we can later decide whose
 * profile shows it as completed and who can attach photos/videos to it.
 */
export function isQuestCompleted(q: Quest): boolean {
  return q.completedByUserIds.includes(q.createdBy.id);
}
