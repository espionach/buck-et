import { Group } from "@/data/mockData";
import UserAvatar from "@/components/UserAvatar";
import { motion } from "framer-motion";
import { Users, Zap } from "lucide-react";

interface GroupCardProps {
  group: Group;
  onClick: () => void;
  index: number;
}

const gradients = [
  "from-primary/20 to-quest-gold/20",
  "from-secondary/20 to-quest-blue/20",
  "from-accent/20 to-quest-pink/20",
];

const GroupCard = ({ group, onClick, index }: GroupCardProps) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl bg-gradient-to-br ${gradients[index % gradients.length]} border border-border/50 active:scale-[0.98] transition-transform`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{group.emoji}</span>
        <div className="flex items-center gap-1 bg-card/80 rounded-full px-2.5 py-1">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">{group.activeQuests}</span>
        </div>
      </div>
      <h3 className="font-display font-bold text-lg text-foreground mb-1">{group.name}</h3>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Users className="w-3.5 h-3.5" />
        <span className="text-xs">{group.members.length} members</span>
      </div>
      <div className="flex -space-x-1.5 mt-3">
        {group.members.slice(0, 4).map((m) => (
          <UserAvatar
            key={m.id}
            user={m}
            size="xs"
            className="border-2 border-card w-7 h-7"
          />
        ))}
        {group.members.length > 4 && (
          <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground border-2 border-card">
            +{group.members.length - 4}
          </span>
        )}
      </div>
    </motion.button>
  );
};

export default GroupCard;
