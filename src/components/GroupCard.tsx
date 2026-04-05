import { Group } from "@/data/mockData";
import { useAppStore } from "@/data/appState";
import UserAvatar from "@/components/UserAvatar";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Check, X, ArrowRightLeft } from "lucide-react";
import { useState } from "react";

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
  const [showTransferPopup, setShowTransferPopup] = useState(false);

  const pendingTransfer = transferRequests.find(
    (tr) => tr.type === "group" && tr.entityId === group.id && tr.toUserId === currentUser.id
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08 }}
        className="w-full relative"
      >
        <button
          onClick={onClick}
          className={`w-full text-left p-5 rounded-xl bg-gradient-to-br ${gradients[index % gradients.length]} border border-border/50 active:scale-[0.98] transition-transform flex flex-col`}
        >
          {/* Transfer icon badge */}
          {pendingTransfer && (
            <div
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-orange-500 text-white cursor-pointer shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                setShowTransferPopup(true);
              }}
            >
              <ArrowRightLeft className="w-4.5 h-4.5" />
            </div>
          )}

          <div className="flex items-start justify-between mb-3">
            <span className="text-3xl">{group.emoji}</span>
          </div>
          <h3 className="font-display font-bold text-sm text-foreground mb-1 line-clamp-1">{group.name}</h3>
          <div className="flex items-center gap-1.5 text-muted-foreground ml-0">
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

      {/* Transfer popup modal */}
      <AnimatePresence>
        {showTransferPopup && pendingTransfer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-5"
            onClick={() => setShowTransferPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-card rounded-xl p-5 space-y-4 shadow-lg text-center"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <ArrowRightLeft className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                <span className="text-primary">{pendingTransfer.fromUser.name}</span> wants to transfer ownership of{" "}
                <span className="text-primary">{group.name}</span> to you
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    declineTransfer(pendingTransfer.id);
                    setShowTransferPopup(false);
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-muted text-muted-foreground font-semibold text-sm"
                >
                  Decline
                </button>
                <button
                  onClick={() => {
                    acceptTransfer(pendingTransfer.id);
                    setShowTransferPopup(false);
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm"
                >
                  Accept
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GroupCard;
