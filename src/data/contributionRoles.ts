// Shared list of contribution roles users can sign up for on a sidequest.
// The creator picks a subset to include on their published sidequest.
export interface ContributionRole {
  id: string;
  label: string;
  description: string;
}

export const ALL_CONTRIBUTION_ROLES: ContributionRole[] = [
  { id: "driver", label: "Driver", description: "I can drive people" },
  { id: "snack_provider", label: "Snacks", description: "I'll bring snacks" },
  { id: "drinks", label: "Drinks", description: "I'll bring drinks" },
  { id: "meal", label: "Meal / Food", description: "I'll handle the main food" },
  { id: "dessert", label: "Dessert", description: "I'll bring dessert" },
  { id: "navigator", label: "Navigator", description: "I'll handle directions & route" },
  { id: "photographer", label: "Photographer", description: "I'll take photos" },
  { id: "videographer", label: "Videographer", description: "I'll capture video" },
  { id: "supplies", label: "Supplies", description: "I'll bring gear/supplies" },
  { id: "music", label: "Music / DJ", description: "I'll handle the playlist" },
  { id: "decor", label: "Decorations", description: "I'll bring decorations" },
  { id: "tickets", label: "Tickets", description: "I'll book/buy tickets" },
  { id: "reservations", label: "Reservations", description: "I'll make the reservation" },
  { id: "host", label: "Host", description: "I'll host the spot" },
  { id: "planner", label: "Planner", description: "I'll plan the itinerary" },
  { id: "first_aid", label: "First Aid", description: "I'll bring a first aid kit" },
  { id: "games", label: "Games", description: "I'll bring games/activities" },
  { id: "pet_care", label: "Pet Care", description: "I'll watch the pets" },
  { id: "cleanup", label: "Cleanup", description: "I'll help clean up after" },
  { id: "fundraising", label: "Funds Collector", description: "I'll collect & manage shared costs" },
];

export function getRoleLabel(roleId: string): string {
  return ALL_CONTRIBUTION_ROLES.find((r) => r.id === roleId)?.label || roleId;
}
