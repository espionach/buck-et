import { parseGroupColor, gradientClassFor, gradientStyleFor, patternStyleFor } from "@/data/groupColors";
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
  const parsed = parseGroupColor(color);
  const overlay = patternStyleFor(parsed.pattern);
  const gradientClass = gradientClassFor(color);
  const inlineStyle = { ...gradientStyleFor(color), width: size, height: size };
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-block rounded-md border border-border/40 overflow-hidden align-middle",
        gradientClass,
        className,
      )}
      style={inlineStyle}
    >
      {overlay && (
        <span
          className="absolute inset-0 opacity-70"
          style={overlay}
        />
      )}
    </span>
  );
};

export default GroupSwatch;
