import { motion, AnimatePresence } from "framer-motion";
import { User } from "@/data/mockData";
import { usePopup } from "@/hooks/use-popup";

interface BlockConfirmDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const BlockConfirmDialog = ({ user, open, onOpenChange, onConfirm }: BlockConfirmDialogProps) => {
  usePopup(open);

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
            <h3 className="font-bold text-foreground text-sm mb-2">Block {user.name}?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You won't see each other's profiles, sidequests, or activity. Any existing friendship and pending requests will be removed. They won't be notified.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm"
              >
                Block
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BlockConfirmDialog;
