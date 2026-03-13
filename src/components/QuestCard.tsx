import { Quest, currentUser } from "@/data/mockData";
import { useAppStore } from "@/data/appState";
import { motion } from "framer-motion";
import { Check, HandMetal, Users } from "lucide-react";

interface QuestCardProps {
  quest: Quest;
  index?: number;
  showGroup?: boolean;
}

const QuestCard = ({ quest, index = 0, showGroup = false }: QuestCardProps) => {
  const { toggleImIn, markDone, groups } = useAppStore();
  const isIn = quest.participants.some((p) => p.id === currentUser.id);
  const group = quest.groupId ? groups.find((g) => g.id === quest.groupId) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`p-4 rounded-2xl border border-border/50 bg-card ${quest.isDone ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {showGroup && group && (
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {group.emoji} {group.name}
            </span>
          )}
          <h4 className="font-display font-bold text-foreground leading-tight">{quest.title}</h4>
          {quest.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{quest.description}</p>
          )}
        </div>

        {!quest.isDone && (
          <button
            onClick={() => toggleImIn(quest.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
              isIn
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <HandMetal className="w-3.5 h-3.5" />
            {isIn ? "I'm In" : "Join"}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
        <div className="flex items-center gap-2">
          <span className="text-sm">{quest.createdBy.avatar}</span>
          <span className="text-xs text-muted-foreground">{quest.createdBy.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span className="text-xs">{quest.participants.length}</span>
          </div>
          {!quest.isDone && isIn && (
            <button
              onClick={() => markDone(quest.id)}
              className="flex items-center gap-1 text-xs text-secondary font-semibold"
            >
              <Check className="w-3.5 h-3.5" />
              Done
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default QuestCard;
