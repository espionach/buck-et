export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
}

export interface Group {
  id: string;
  name: string;
  emoji: string;
  members: User[];
  activeQuests: number;
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
  photos?: string[];
  notes?: string;
}

export const currentUser: User = {
  id: "u1",
  name: "Alex Chen",
  avatar: "🧑‍🚀",
  bio: "always down for spontaneous adventures ✨",
};

export const friends: User[] = [
  { id: "u2", name: "Maya Johnson", avatar: "🎨", bio: "creative soul" },
  { id: "u3", name: "Jake Williams", avatar: "🏄", bio: "surf & turf" },
  { id: "u4", name: "Priya Patel", avatar: "📸", bio: "moment collector" },
  { id: "u5", name: "Sam Kim", avatar: "🎸", bio: "indie everything" },
  { id: "u6", name: "Luna Martinez", avatar: "🌙", bio: "night owl vibes" },
];

export const groups: Group[] = [
  {
    id: "g1",
    name: "Sunset Chasers",
    emoji: "🌅",
    members: [currentUser, friends[0], friends[1], friends[2]],
    activeQuests: 3,
  },
  {
    id: "g2",
    name: "Foodie Gang",
    emoji: "🍜",
    members: [currentUser, friends[3], friends[4]],
    activeQuests: 2,
  },
  {
    id: "g3",
    name: "Weekend Warriors",
    emoji: "⚔️",
    members: [currentUser, friends[0], friends[2], friends[4], friends[1]],
    activeQuests: 5,
  },
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
  },
  {
    id: "q5",
    title: "Learn to make sushi together",
    createdBy: friends[4],
    isFollowerOnly: true,
    participants: [friends[4]],
    isDone: false,
    createdAt: "2026-03-09",
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
    notes: "Best bonfire yet — Jake brought the guitar!",
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
  },
];
