import { motion, AnimatePresence } from "framer-motion";
import { usePopup } from "@/hooks/use-popup";

interface CancelRequestDialogProps {
  open: boolean;
  userName?: string;
  onConfirm: () => void;
  onClose: () => void;
}

const CancelRequestDialog = ({ open, userName, onConfirm, onClose }: CancelRequestDialogProps) => {
  usePopup(open);
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
            className="w-full max-w-sm bg-card rounded-xl p-5 shadow-lg"
          >
            <h3 className="font-bold text-foreground text-sm mb-2">
              Cancel friend request{userName ? ` to ${userName}` : ""}?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              You can send another request later.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
              >
                Keep request
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm"
              >
                Cancel request
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CancelRequestDialog;
