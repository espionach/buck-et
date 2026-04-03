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

export interface FollowRequest {
  id: string;
  from: User;
  status: "pending" | "accepted" | "declined";
}

export interface QuestVolunteer {
  userId: string;
  user: User;
  role: string; // e.g. "driver", "navigator", "snack_provider"
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
  isDone: boolean;
  createdAt: string;
  completedAt?: string;
  photos?: string[];
  notes?: string;
  links?: string[];
  comments: Comment[];
  logistics?: QuestLogistics;
}

export const currentUser: User = {
  id: "u1",
  name: "Alex Chen",
  avatar: "🧑‍🚀",
  bio: "always down for spontaneous adventures ✨",
  profilePicture: "/profile-photos/alex.jpg",
};

export const friends: User[] = [
  { id: "u2", name: "Maya Johnson", avatar: "🎨", bio: "creative soul", profilePicture: "/profile-photos/maya.jpg" },
  { id: "u3", name: "Jake Williams", avatar: "🏄", bio: "surf & turf", profilePicture: "/profile-photos/jake.jpg" },
  { id: "u4", name: "Priya Patel", avatar: "📸", bio: "moment collector", profilePicture: "/profile-photos/priya.jpg" },
  { id: "u5", name: "Sam Kim", avatar: "🎸", bio: "indie everything", profilePicture: "/profile-photos/sam.jpg" },
  { id: "u6", name: "Luna Martinez", avatar: "🌙", bio: "night owl vibes", profilePicture: "/profile-photos/luna.jpg" },
];

export const nonFollowedUsers: User[] = [
  { id: "u7", name: "Kai Nakamura", avatar: "🎿", bio: "mountain life", profilePicture: "/profile-photos/kai.jpg" },
  { id: "u8", name: "Zoe Thompson", avatar: "🧁", bio: "baking adventures", profilePicture: "/profile-photos/zoe.jpg" },
];

export const groups: Group[] = [
  {
    id: "g1",
    name: "Sunset Chasers",
    emoji: "🌅",
    description: "We chase sunsets every weekend",
    members: [currentUser, friends[0], friends[1], friends[2]],
    memberRoles: [
      { user: currentUser, role: "owner" },
      { user: friends[0], role: "member" },
      { user: friends[1], role: "member" },
      { user: friends[2], role: "member" },
    ],
    ownerId: currentUser.id,
    activeQuests: 3,
    createdAt: "2026-02-15",
  },
  {
    id: "g2",
    name: "Foodie Gang",
    emoji: "🍜",
    description: "Exploring every food spot in the city",
    members: [currentUser, friends[3], friends[4]],
    memberRoles: [
      { user: friends[3], role: "owner" },
      { user: currentUser, role: "member" },
      { user: friends[4], role: "member" },
    ],
    ownerId: friends[3].id,
    activeQuests: 2,
    createdAt: "2026-02-20",
  },
  {
    id: "g3",
    name: "Weekend Warriors",
    emoji: "⚔️",
    members: [currentUser, friends[0], friends[2], friends[4], friends[1]],
    memberRoles: [
      { user: currentUser, role: "owner" },
      { user: friends[0], role: "member" },
      { user: friends[2], role: "member" },
      { user: friends[4], role: "member" },
      { user: friends[1], role: "member" },
    ],
    ownerId: currentUser.id,
    activeQuests: 5,
    createdAt: "2026-01-10",
  },
];

export const pendingGroupInvitations: GroupInvitation[] = [
  {
    id: "gi1",
    groupId: "g-new",
    group: {
      id: "g-new",
      name: "Film Club",
      emoji: "🎬",
      members: [friends[0], friends[4]],
      memberRoles: [
        { user: friends[0], role: "owner" },
        { user: friends[4], role: "member" },
      ],
      ownerId: friends[0].id,
      activeQuests: 1,
      createdAt: "2026-03-14",
    },
    invitedBy: friends[0],
    status: "pending",
  },
];

export const pendingFollowRequests: FollowRequest[] = [
  { id: "fr1", from: nonFollowedUsers[0], status: "pending" },
  { id: "fr2", from: nonFollowedUsers[1], status: "pending" },
];

export const quests: Quest[] = [
  {
    id: "q1",
    title: "Watch sunrise from the pier",
    description: "Meet at 5:30am, bring coffee ☕",
    createdBy: friends[1],
    groupId: "g1",
    isFollowerOnly: false,
    participants: [currentUser, friends[1], friends[2]],
    isDone: false,
    createdAt: "2026-03-12",
    logistics: {
      date: "2026-04-05",
      time: "5:30 AM",
      location: "Ocean Beach Pier",
      meetupSpot: "Parking lot by the pier entrance",
      transportation: "car",
      carpoolSlots: 3,
      volunteers: [
        { userId: "u3", user: friends[1], role: "driver" },
      ],
      customNotes: "Bring warm layers — it's chilly before sunrise!",
    },
    comments: [
      { id: "c1", userId: "u3", user: friends[1], text: "I'll bring the blankets!", createdAt: "2026-03-12" },
      { id: "c2", userId: "u4", user: friends[2], text: "Can we make it 6am? 😅", createdAt: "2026-03-13" },
    ],
  },
  {
    id: "q2",
    title: "Try the new ramen spot downtown",
    description: "Heard they have amazing tonkotsu",
    createdBy: friends[3],
    groupId: "g2",
    isFollowerOnly: false,
    participants: [currentUser, friends[3]],
    isDone: false,
    createdAt: "2026-03-11",
    logistics: {
      date: "2026-04-02",
      time: "6:00 PM",
      location: "Ichiraku Ramen, 5th & Main",
      transportation: "transit",
      volunteers: [],
      customNotes: "They don't take reservations — first come first served",
    },
    comments: [
      { id: "c3", userId: "u5", user: friends[3], text: "Reservation for 6pm?", createdAt: "2026-03-11" },
    ],
  },
  {
    id: "q3",
    title: "Midnight rooftop stargazing",
    createdBy: friends[4],
    groupId: "g3",
    isFollowerOnly: false,
    participants: [friends[4], friends[0]],
    isDone: false,
    createdAt: "2026-03-10",
    comments: [],
  },
  {
    id: "q4",
    title: "Thrift store challenge — $10 max",
    description: "Best find wins bragging rights",
    createdBy: friends[0],
    isFollowerOnly: true,
    participants: [friends[0], friends[2]],
    isDone: false,
    createdAt: "2026-03-12",
    comments: [
      { id: "c4", userId: "u2", user: friends[0], text: "Meet at Goodwill on 5th!", createdAt: "2026-03-12" },
    ],
  },
  {
    id: "q5",
    title: "Learn to make sushi together",
    createdBy: friends[4],
    isFollowerOnly: true,
    participants: [friends[4]],
    isDone: false,
    createdAt: "2026-03-09",
    comments: [],
  },
  {
    id: "q8",
    title: "Kayak the river at dawn",
    description: "Rentals open at 6am — let's be first!",
    createdBy: currentUser,
    groupId: "g1",
    isFollowerOnly: false,
    participants: [currentUser, friends[0], friends[1]],
    isDone: false,
    createdAt: "2026-03-15",
    links: ["https://www.kayakrentals.com/dawn-tours"],
    logistics: {
      date: "2026-04-12",
      time: "6:00 AM",
      location: "River Bend Kayak Rentals",
      meetupSpot: "Main parking lot",
      transportation: "car",
      carpoolSlots: 4,
      volunteers: [
        { userId: "u1", user: currentUser, role: "driver" },
        { userId: "u2", user: friends[0], role: "snack_provider" },
      ],
      customNotes: "Bring sunscreen and a change of clothes",
    },
    comments: [],
  },
  {
    id: "q9",
    title: "Weekend movie marathon",
    description: "All Studio Ghibli, snacks required 🍿",
    createdBy: currentUser,
    groupId: "g3",
    isFollowerOnly: false,
    participants: [currentUser, friends[2], friends[4]],
    isDone: false,
    createdAt: "2026-03-16",
    photos: ["/mock-photos/ghibli1.jpg", "/mock-photos/ghibli2.jpg"],
    logistics: {
      date: "2026-04-08",
      time: "2:00 PM",
      location: "Alex's apartment",
      transportation: "walk",
      volunteers: [
        { userId: "u4", user: friends[2], role: "snack_provider" },
      ],
      customNotes: "Starting with Spirited Away, then Princess Mononoke",
    },
    comments: [
      { id: "c6", userId: "u4", user: friends[2], text: "I'll bring the popcorn!", createdAt: "2026-03-16" },
    ],
  },
  {
    id: "q10",
    title: "Sunrise yoga in the park",
    createdBy: currentUser,
    isFollowerOnly: true,
    participants: [currentUser, friends[3]],
    isDone: false,
    createdAt: "2026-03-17",
    links: ["https://yogawithadriene.com/morning-flow", "https://maps.google.com/park-location"],
    comments: [],
  },
  {
    id: "q6",
    title: "Beach bonfire last Friday",
    description: "What a night 🔥",
    createdBy: currentUser,
    groupId: "g1",
    isFollowerOnly: false,
    participants: [currentUser, friends[0], friends[1], friends[2]],
    isDone: true,
    createdAt: "2026-03-07",
    completedAt: "2026-03-08",
    photos: ["/mock-photos/bonfire1.jpg", "/mock-photos/bonfire2.jpg"],
    notes: "Best bonfire yet — Jake brought the guitar!",
    comments: [
      { id: "c5", userId: "u1", user: currentUser, text: "Legendary night 🔥", createdAt: "2026-03-08" },
    ],
  },
  {
    id: "q7",
    title: "Hike to Eagle Peak",
    createdBy: currentUser,
    groupId: "g3",
    isFollowerOnly: false,
    participants: [currentUser, friends[0], friends[2]],
    isDone: true,
    createdAt: "2026-03-05",
    completedAt: "2026-03-06",
    photos: ["/mock-photos/hike1.jpg"],
    comments: [],
  },
  {
    id: "q11",
    title: "Dim sum crawl in Chinatown",
    description: "Hit every spot on the list 🥟",
    createdBy: friends[3],
    groupId: "g2",
    isFollowerOnly: false,
    participants: [currentUser, friends[3], friends[4]],
    isDone: true,
    createdAt: "2026-02-25",
    completedAt: "2026-03-01",
    notes: "Best har gow was at Dragon Gate!",
    comments: [
      { id: "c7", userId: "u5", user: friends[3], text: "That was legendary", createdAt: "2026-03-01" },
    ],
  },
];

export interface TransferRequest {
  id: string;
  type: "quest" | "group";
  entityId: string;
  fromUser: User;
  toUserId: string;
}

export interface AppNotification {
  id: string;
  type: "transfer_quest" | "transfer_group" | "new_comment" | "new_participant";
  message: string;
  entityId: string;
  groupId?: string;
  commentId?: string;
  fromUser: User;
  read: boolean;
  createdAt: string;
}

export const pendingTransferRequests: TransferRequest[] = [
  {
    id: "tr1",
    type: "quest",
    entityId: "q1",
    fromUser: friends[1],
    toUserId: currentUser.id,
  },
  {
    id: "tr2",
    type: "group",
    entityId: "g2",
    fromUser: friends[3],
    toUserId: currentUser.id,
  },
];

export const initialNotifications: AppNotification[] = [
  {
    id: "n1",
    type: "transfer_quest",
    message: "Jake Williams wants to transfer 'Watch sunrise from the pier' to you",
    entityId: "q1",
    groupId: "g1",
    fromUser: friends[1],
    read: false,
    createdAt: "2026-03-18",
  },
  {
    id: "n2",
    type: "transfer_group",
    message: "Sam Kim wants to transfer 'Foodie Gang' board to you",
    entityId: "g2",
    fromUser: friends[3],
    read: false,
    createdAt: "2026-03-18",
  },
  {
    id: "n3",
    type: "new_comment",
    message: "Priya Patel commented on 'Kayak the river at dawn'",
    entityId: "q8",
    groupId: "g1",
    commentId: "c6",
    fromUser: friends[2],
    read: false,
    createdAt: "2026-03-17",
  },
  {
    id: "n4",
    type: "new_participant",
    message: "Maya Johnson joined 'Weekend movie marathon'",
    entityId: "q9",
    groupId: "g3",
    fromUser: friends[0],
    read: false,
    createdAt: "2026-03-17",
  },
];
