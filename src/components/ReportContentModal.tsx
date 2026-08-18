import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAppStore } from "@/data/appState";
import { usePopup } from "@/hooks/use-popup";
import { toast } from "sonner";

export type ReportTargetType = "sidequest" | "comment" | "media";

interface ReportContentModalProps {
  targetType: ReportTargetType;
  targetId: string;
  reportedUserId: string;
  /** For media reports: the storage path of the reported photo/video. */
  targetPath?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REASONS: { value: string; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Other" },
];

const ReportContentModal = ({
  targetType,
  targetId,
  reportedUserId,
  open,
  onOpenChange,
}: ReportContentModalProps) => {
  const reportContent = useAppStore((s) => s.reportContent);
  const [reason, setReason] = useState<string>("spam");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  usePopup(open);

  const titleLabel =
    targetType === "sidequest" ? "Report sidequest" : "Report comment";

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await reportContent(targetType, targetId, reportedUserId, reason, description);
      toast.success("Thanks, we'll review this.");
      onOpenChange(false);
      setReason("spam");
      setDescription("");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-5"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-card rounded-xl p-5 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground text-sm">{titleLabel}</h3>
              <button onClick={() => onOpenChange(false)} aria-label="Close">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <label className="block text-xs font-semibold text-muted-foreground mb-2">
              Reason
            </label>
            <div className="space-y-1.5 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    reason === r.value
                      ? "bg-primary/10 border-primary text-foreground"
                      : "bg-muted border-transparent text-muted-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <label className="block text-xs font-semibold text-muted-foreground mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
              rows={3}
              placeholder="Add any context that might help us review."
              className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none mb-4"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit Report"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportContentModal;