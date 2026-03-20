import { User } from "@/data/mockData";
import UserAvatar from "@/components/UserAvatar";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ArrowRightLeft, X, ArrowLeft } from "lucide-react";
import { useState } from "react";

interface OwnerLeaveDialogProps {
  type: "quest" | "group";
  members: User[];
  ownerId: string;
  onDelete: () => void;
  onTransfer: (newOwnerId: string) => void;
  onCancel: () => void;
}

const OwnerLeaveDialog = ({ type, members, ownerId, onDelete, onTransfer, onCancel }: OwnerLeaveDialogProps) => {
  const [step, setStep] = useState<"choose" | "pick-member">("choose");
  const transferable = members.filter((m) => m.id !== ownerId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-foreground/40 flex items-center justify-center p-5"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-card rounded-2xl p-5 space-y-4 shadow-lg"
      >
        <AnimatePresence mode="wait">
          {step === "choose" ? (
            <motion.div
              key="choose"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">You're the owner</h3>
                <button onClick={onCancel}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                What would you like to do with this {type}?
              </p>

              <button
                onClick={onDelete}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/5 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-semibold">Delete {type}</p>
                  <p className="text-xs opacity-70">Remove for everyone</p>
                </div>
              </button>

              {transferable.length > 0 && (
                <button
                  onClick={() => setStep("pick-member")}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors"
                >
                  <ArrowRightLeft className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">Transfer ownership</p>
                    <p className="text-xs text-muted-foreground">Pass it to another member</p>
                  </div>
                </button>
              )}

              <button
                onClick={onCancel}
                className="w-full py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
              >
                Cancel
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="pick"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <button onClick={() => setStep("choose")} className="p-1 rounded-lg hover:bg-muted transition-colors">
                  <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <h3 className="font-bold text-foreground">Transfer to…</h3>
              </div>

              <div className="space-y-1">
                {transferable.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onTransfer(m.id)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <UserAvatar user={m} size="sm" />
                    <span className="text-sm font-medium text-foreground">{m.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default OwnerLeaveDialog;
