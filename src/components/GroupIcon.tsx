import {
  Target, Trophy, Flame, Zap, Star, Heart, Mountain, Compass,
  Music, Camera, BookOpen, Utensils, Dumbbell, Palette, Gamepad2,
  Globe, Rocket, Leaf, Sun, Moon, Waves, Coffee, Film, Bike,
  Footprints, PartyPopper, Gem, Sparkles, Shield, Swords
} from "lucide-react";

export const GROUP_ICON_OPTIONS = [
  "target", "trophy", "flame", "zap", "star", "heart",
  "mountain", "compass", "music", "camera", "book-open", "utensils",
  "dumbbell", "palette", "gamepad-2", "globe", "rocket", "leaf",
  "sun", "moon", "waves", "coffee", "film", "bike",
  "footprints", "party-popper", "gem", "sparkles", "shield", "swords",
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, any> = {
  target: Target,
  trophy: Trophy,
  flame: Flame,
  zap: Zap,
  star: Star,
  heart: Heart,
  mountain: Mountain,
  compass: Compass,
  music: Music,
  camera: Camera,
  "book-open": BookOpen,
  utensils: Utensils,
  dumbbell: Dumbbell,
  palette: Palette,
  "gamepad-2": Gamepad2,
  globe: Globe,
  rocket: Rocket,
  leaf: Leaf,
  sun: Sun,
  moon: Moon,
  waves: Waves,
  coffee: Coffee,
  film: Film,
  bike: Bike,
  footprints: Footprints,
  "party-popper": PartyPopper,
  gem: Gem,
  sparkles: Sparkles,
  shield: Shield,
  swords: Swords,
};

interface GroupIconDisplayProps {
  icon: string;
  size?: number;
  className?: string;
}

export const GroupIconDisplay = ({ icon, size = 24, className }: GroupIconDisplayProps) => {
  const IconComponent = ICON_MAP[icon];

  // Fallback for legacy emoji strings
  if (!IconComponent) {
    return <span style={{ fontSize: size * 0.85 }}>{icon}</span>;
  }

  // Lighter stroke + soft translucent fill to match the SideQuest bucket logo:
  // a clean outlined glyph with a tinted body in the current color.
  return (
    <IconComponent
      size={size}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity={0.18}
      className={className || "text-foreground"}
    />
  );
};
