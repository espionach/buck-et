import { GroupIconDisplay } from "@/components/GroupIcon";
import { GROUP_COLORS, iconColorClassFor } from "@/data/groupColors";
import { cn } from "@/lib/utils";

interface GlassIconTileProps {
  icon: string;
  /** Group icon color id (drives the glyph color). */
  iconColor?: string;
  /** Group card color id (drives the colored glow behind the glass). */
  cardColor?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: { box: "w-10 h-10", icon: 20 },
  md: { box: "w-14 h-14", icon: 28 },
  lg: { box: "w-16 h-16", icon: 32 },
};

/**
 * Frosted-glass tile for group icons. A soft colored blob sits behind a
 * translucent glass plate with a subtle inner top highlight and a tiny
 * specular sparkle, with the group's lucide glyph centered on top.
 */
const GlassIconTile = ({
  icon,
  iconColor,
  cardColor,
  size = "md",
  className,
}: GlassIconTileProps) => {
  const { box, icon: iconSize } = SIZE_MAP[size];
  // Reuse the card gradient for the colored glow behind the glass —
  // it ensures the tile picks up the group's chosen color without
  // introducing a new palette mapping.
  const glow =
    GROUP_COLORS.find((c) => c.id === cardColor)?.gradient ||
    GROUP_COLORS[0].gradient;

  return (
    <div className={cn("relative", box, className)}>
      {/* Colored glow blob behind the glass */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-90 blur-md scale-110",
          glow
        )}
        aria-hidden
      />

      {/* Glass plate */}
      <div
        className="absolute inset-0 rounded-2xl bg-white/30 backdrop-blur-md border border-white/40 shadow-md overflow-hidden"
        aria-hidden
      >
        {/* Inner top highlight */}
        <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-white/60 to-transparent rounded-t-2xl" />
        {/* Specular sparkle */}
        <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-white/80 blur-[1px]" />
      </div>

      {/* Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <GroupIconDisplay
          icon={icon}
          size={iconSize}
          className={iconColorClassFor(iconColor)}
        />
      </div>
    </div>
  );
};

export default GlassIconTile;