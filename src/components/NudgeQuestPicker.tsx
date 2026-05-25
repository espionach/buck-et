import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Quest, User } from "@/data/mockData";
import { usePopup } from "@/hooks/use-popup";

interface NudgeQuestPickerProps {
  open: boolean;
  onClose: () => void;
  quests: Quest[];
  targetUser: User;
}

const NudgeQuestPicker = ({ open, onClose, quests, targetUser }: NudgeQuestPickerProps) => {
  const navigate = useNavigate();
  usePopup(open);

  const handlePick = (questId: string) => {
    onClose();
    navigate(`/quest/${questId}`, { state: { prefillNudgeUserId: targetUser.id } });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-5"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card rounded-xl shadow-lg max-h-[60vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div>
                <h3 className="font-bold text-foreground text-sm">Nudge {targetUser.name}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Pick a sidequest to invite them to
                </p>
              </div>
              <button onClick={onClose} aria-label="Close" className="p-1 -m-1">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {quests.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No active sidequests
                </div>
              ) : (
                <ul className="space-y-1">
                  {quests.map((q) => (
                    <li key={q.id}>
                      <button
                        type="button"
                        onClick={() => handlePick(q.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted active:bg-muted transition-colors text-left"
                      >
                        <span className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-primary" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {q.title}
                          </p>
                          {q.date && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {q.date}
                              {q.time ? ` · ${q.time}` : ""}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NudgeQuestPicker;
