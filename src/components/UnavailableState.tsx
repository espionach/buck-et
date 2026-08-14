import { ArrowLeft, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UnavailableStateProps {
  /** What is unavailable, e.g. "Sidequest", "Profile", "Comment". */
  label: string;
  icon?: LucideIcon;
  /** Show a back arrow header (default true). */
  showBack?: boolean;
  onBack?: () => void;
}

/**
 * Shared "<thing> unavailable" state for deep links whose target no longer
 * exists or is no longer visible to the current user. Deliberately generic —
 * it never reveals whether the object was deleted or is simply private.
 */
const UnavailableState = ({ label, icon: Icon = Lock, showBack = true, onBack }: UnavailableStateProps) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col">
      {showBack && (
        <div className="px-10 pt-14 pb-3">
          <button
            onClick={() => (onBack ? onBack() : navigate(-1))}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      )}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 -mt-12">
        <Icon className="w-8 h-8 text-muted-foreground" strokeWidth={1.75} />
        <p className="text-sm text-muted-foreground">{label} unavailable</p>
      </div>
    </div>
  );
};

export default UnavailableState;
