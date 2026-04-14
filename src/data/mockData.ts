// Types used throughout the app — no longer contains mock data

export interface User {
  id: string;
  name: string;
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
  meetupSpot?: string;
  transportation?: "car" | "bike" | "walk" | "transit" | "other";
  carpoolSlots?: number;
  volunteers: QuestVolunteer[];
  customNotes?: string;
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
  type: "transfer_quest" | "transfer_group" | "transfer_declined" | "new_comment" | "new_participant" | "follow_request" | "friend_request" | "board_invitation";
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
