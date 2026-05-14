import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { useLegalUpdates, LEGAL_PATHS, LEGAL_LABEL } from "@/hooks/useLegalUpdates";

const LegalUpdateBanner = () => {
  const nav = useNavigate();
  const { unseen } = useLegalUpdates();
  if (unseen.length === 0) return null;

  const first = unseen[0];
  const title =
    first.type === "terms" ? "We updated our Terms" : "We updated our Privacy Policy";

  return (
    <div className="fixed bottom-40 left-0 right-0 z-40 px-3 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="bg-card border border-border rounded-2xl shadow-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{title}</div>
            <div className="text-[11px] text-muted-foreground truncate">
              Tap to review the latest changes.
            </div>
          </div>
          <button
            onClick={() => nav(LEGAL_PATHS[first.type])}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shrink-0"
            aria-label={`Review ${LEGAL_LABEL[first.type]}`}
          >
            Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalUpdateBanner;
