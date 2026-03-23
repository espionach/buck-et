import { Group, currentUser } from "@/data/mockData";
import { useAppStore } from "@/data/appState";
import UserAvatar from "@/components/UserAvatar";
import { motion } from "framer-motion";
import { Users, Zap, Check, X } from "lucide-react";

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
  const { transferRequests, acceptTransfer, declineTransfer } = useAppStore();

  const pendingTransfer = transferRequests.find(
    (tr) => tr.type === "group" && tr.entityId === group.id && tr.toUserId === currentUser.id
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="w-full"
    >
      {/* Transfer request banner */}
      {pendingTransfer && (
        <div className="mb-1 p-2.5 rounded-t-2xl bg-primary/10 border border-primary/20 border-b-0">
          <p className="text-[10px] text-foreground font-medium mb-1.5">
            {pendingTransfer.fromUser.name} wants to transfer this board to you
          </p>
          <div className="flex gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                acceptTransfer(pendingTransfer.id);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary text-secondary-foreground text-[10px] font-semibold"
            >
              <Check className="w-3 h-3" /> Accept
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                declineTransfer(pendingTransfer.id);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-muted-foreground text-[10px] font-semibold"
            >
              <X className="w-3 h-3" /> Decline
            </button>
          </div>
        </div>
      )}

      <button
        onClick={onClick}
        className={`w-full text-left p-5 ${pendingTransfer ? "rounded-b-2xl rounded-t-none" : "rounded-2xl"} bg-gradient-to-br ${gradients[index % gradients.length]} border border-border/50 active:scale-[0.98] transition-transform`}
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
      </button>
    </motion.div>
  );
};

export default GroupCard;
