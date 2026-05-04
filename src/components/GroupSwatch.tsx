import { GROUP_COLORS } from "@/data/groupColors";
import { cn } from "@/lib/utils";

interface GroupSwatchProps {
  color?: string;
  size?: number;
  className?: string;
}

/**
 * Compact decorative swatch representing a group's color/pattern.
 * Replaces the previous group icon glyph in inline contexts.
 */
const GroupSwatch = ({ color, size = 14, className }: GroupSwatchProps) => {
  const opt = GROUP_COLORS.find((c) => c.id === color) || GROUP_COLORS[0];
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-block rounded-md border border-border/40 overflow-hidden align-middle bg-gradient-to-br",
        opt.gradient,
        className,
      )}
      style={{ width: size, height: size }}
    >
      {opt.patternStyle && (
        <span
          className="absolute inset-0 opacity-70"
          style={opt.patternStyle}
        />
      )}
    </span>
  );
};

export default GroupSwatch;
