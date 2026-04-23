import { useState } from "react";
import { Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GROUP_ICON_OPTIONS, GroupIconDisplay } from "@/components/GroupIcon";
import { iconColorClassFor, GROUP_COLORS } from "@/data/groupColors";

interface GroupIconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  size?: "sm" | "md" | "lg";
  /** Icon color id from GROUP_ICON_COLORS — used to render the preview & picker. */
  iconColor?: string;
  /** Card color id from GROUP_COLORS — fills the preview swatch with the card's gradient. */
  cardColor?: string;
}

const GroupIconPicker = ({ value, onChange, size = "md", iconColor, cardColor }: GroupIconPickerProps) => {
  const [open, setOpen] = useState(false);

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-16 h-16",
  };

  const colorClass = iconColorClassFor(iconColor);
  const gradientClass =
    GROUP_COLORS.find((c) => c.id === cardColor)?.gradient || GROUP_COLORS[0].gradient;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br ${gradientClass} border border-border flex items-center justify-center relative group transition-colors`}
      >
        <GroupIconDisplay icon={value} size={size === "lg" ? 28 : size === "md" ? 24 : 20} className={colorClass} />
        <div className="absolute inset-0 rounded-xl bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
          <Pencil className="w-3.5 h-3.5 text-foreground opacity-0 group-hover:opacity-70 transition-opacity" />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              className="absolute top-full left-0 mt-2 z-50 bg-card border border-border rounded-xl p-3 shadow-lg grid grid-cols-6 gap-1.5 w-[240px]"
            >
              {GROUP_ICON_OPTIONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => {
                    onChange(iconName);
                    setOpen(false);
                  }}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    value === iconName
                      ? "bg-primary/15 ring-2 ring-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <GroupIconDisplay icon={iconName} size={18} className={colorClass} />
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupIconPicker;
