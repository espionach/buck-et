import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper, Sparkles, Star, Heart, Lock, Users, Globe, Check } from "lucide-react";
import GroupSwatch from "@/components/GroupSwatch";

export type VisibilityChoice = "private" | "group" | "friends";

interface CompletionCelebrationProps {
  title: string;
  isOwner: boolean;
  /** Friend list the sidequest was launched to, if any (owner only). */
  groupName?: string;
  groupColor?: string;
  /** Current selection to pre-highlight. */
  initialChoice?: VisibilityChoice;
  onSave: (choice: VisibilityChoice) => void;
  onDismiss: () => void;
}

const CONFETTI_ICONS = [PartyPopper, Sparkles, Star, Heart];
const CONFETTI_COLORS = [
  "text-primary",
  "text-secondary",
  "text-accent-foreground",
  "text-foreground",
];

const CompletionCelebration = ({
  title,
  isOwner,
  groupName,
  groupColor,
  initialChoice,
  onSave,
  onDismiss,
}: CompletionCelebrationProps) => {
  const [showSheet, setShowSheet] = useState(false);
  const [choice, setChoice] = useState<VisibilityChoice>(
    initialChoice ?? (isOwner && groupName ? "group" : "friends")
  );

  useEffect(() => {
    const t = window.setTimeout(() => setShowSheet(true), 1900);
    return () => window.clearTimeout(t);
  }, []);

  const confetti = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        Icon: CONFETTI_ICONS[i % CONFETTI_ICONS.length],
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        duration: 1.6 + Math.random() * 1.4,
        size: 14 + Math.round(Math.random() * 14),
        rotate: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360),
      })),
    []
  );

  const options: { key: VisibilityChoice; label: string; hint: string; icon: JSX.Element }[] = [
    {
      key: "private",
      label: "Private",
      hint: "Only you can see this completed sidequest.",
      icon: <Lock className="w-4 h-4" />,
    },
    ...(isOwner && groupName
      ? [
          {
            key: "group" as VisibilityChoice,
            label: groupName,
            hint: "Only this friend list can see it.",
            icon: groupColor ? <GroupSwatch color={groupColor} size={16} /> : <Users className="w-4 h-4" />,
          },
        ]
      : []),
    {
      key: "friends",
      label: "All friends",
      hint: "Everyone you're friends with can see it.",
      icon: <Globe className="w-4 h-4" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((c, i) => (
          <motion.div
            key={i}
            initial={{ y: "-15vh", opacity: 0, rotate: 0 }}
            animate={{ y: "110vh", opacity: [0, 1, 1, 0], rotate: c.rotate }}
            transition={{ delay: c.delay, duration: c.duration, ease: "easeIn" }}
            className={`absolute ${c.color}`}
            style={{ left: `${c.left}%` }}
          >
            <c.Icon style={{ width: c.size, height: c.size }} />
          </motion.div>
        ))}
      </div>

      {/* Headline */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative z-10 px-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PartyPopper className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Congrats! Sidequest completed!
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{title}</p>
      </motion.div>

      {/* Visibility sheet */}
      <AnimatePresence>
        {showSheet && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="absolute bottom-0 left-0 right-0 z-20 rounded-t-3xl border-t border-border bg-card p-5 pb-8 shadow-lg"
          >
            <div className="mx-auto max-w-md">
              <h2 className="font-display text-base font-bold text-foreground">
                Who can see this sidequest?
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {isOwner
                  ? "Update visibility now that it's completed."
                  : "Choose who can see that you went on this sidequest."}
              </p>

              <div className="mt-4 space-y-2">
                {options.map((o) => {
                  const selected = choice === o.key;
                  return (
                    <button
                      key={o.key}
                      onClick={() => setChoice(o.key)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <span className={selected ? "text-primary" : "text-muted-foreground"}>
                        {o.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {o.label}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">{o.hint}</span>
                      </span>
                      {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={onDismiss}
                  className="flex-1 rounded-xl bg-muted py-3 text-sm font-semibold text-muted-foreground"
                >
                  Keep as is
                </button>
                <button
                  onClick={() => onSave(choice)}
                  className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompletionCelebration;
