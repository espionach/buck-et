import { useState } from "react";
import { motion } from "framer-motion";
import { Users, ArrowRightLeft, Trash2, ArrowLeft, Check } from "lucide-react";
import { Group } from "@/data/mockData";
import { GroupDeleteAction } from "@/data/appState";
import GroupSwatch from "@/components/GroupSwatch";

interface GroupDeleteDialogProps {
  group: Group;
  otherGroups: Group[];
  questCount: number;
  onConfirm: (action: GroupDeleteAction) => void;
  onCancel: () => void;
}

const GroupDeleteDialog = ({
  group,
  otherGroups,
  questCount,
  onConfirm,
  onCancel,
}: GroupDeleteDialogProps) => {
  const [step, setStep] = useState<"choose" | "pick" | "confirmDelete">("choose");
  const [targetId, setTargetId] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-foreground/40 flex items-center justify-center p-5"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-card rounded-2xl p-5 space-y-4 shadow-lg max-h-[80vh] flex flex-col"
      >
        {step === "choose" && (
          <>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Delete "{group.name}"?</h3>
              <p className="text-xs text-muted-foreground">
                {questCount === 0
                  ? "No sidequests are tied to this friend list."
                  : `${questCount} sidequest${questCount === 1 ? " is" : "s are"} shared only with this friend list. What should happen to ${questCount === 1 ? "it" : "them"}?`}
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onConfirm({ mode: "all-friends" })}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted text-left transition-colors"
              >
                <Users className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Share with all friends</p>
                  <p className="text-xs text-muted-foreground">Keep the sidequests, open to all friends</p>
                </div>
              </button>

              <button
                onClick={() => setStep("pick")}
                disabled={otherGroups.length === 0}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted text-left transition-colors disabled:opacity-40"
              >
                <ArrowRightLeft className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Move to another friend list</p>
                  <p className="text-xs text-muted-foreground">
                    {otherGroups.length === 0 ? "No other friend lists yet" : "Pick which list gets them"}
                  </p>
                </div>
              </button>

              <button
                onClick={() => setStep("confirmDelete")}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-destructive/30 hover:bg-destructive/5 text-left transition-colors"
              >
                <Trash2 className="w-4 h-4 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-destructive">Delete the sidequests</p>
                  <p className="text-xs text-muted-foreground">Remove them along with the friend list</p>
                </div>
              </button>
            </div>

            <button
              onClick={onCancel}
              className="w-full py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
            >
              Cancel
            </button>
          </>
        )}

        {step === "pick" && (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep("choose")}
                className="p-1.5 -ml-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="text-base font-bold text-foreground">Choose a friend list</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 -mx-1 px-1">
              {otherGroups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setTargetId(g.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-colors ${
                    targetId === g.id
                      ? "border-primary bg-primary/5"
                      : "border-border/50 bg-muted/40 hover:bg-muted/70"
                  }`}
                >
                  <GroupSwatch group={g} size="sm" />
                  <span className="text-sm font-medium text-foreground flex-1 truncate">{g.name}</span>
                  {targetId === g.id && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep("choose")}
                className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
              >
                Back
              </button>
              <button
                disabled={!targetId}
                onClick={() => targetId && onConfirm({ mode: "move", targetGroupId: targetId })}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40"
              >
                Confirm
              </button>
            </div>
          </>
        )}

        {step === "confirmDelete" && (
          <>
            <div className="space-y-1 text-center">
              <h3 className="text-base font-bold text-foreground">
                Delete {questCount} sidequest{questCount === 1 ? "" : "s"}?
              </h3>
              <p className="text-xs text-muted-foreground">
                The friend list and its sidequests will be permanently deleted. This can't be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep("choose")}
                className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
              >
                Back
              </button>
              <button
                onClick={() => onConfirm({ mode: "delete" })}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default GroupDeleteDialog;
