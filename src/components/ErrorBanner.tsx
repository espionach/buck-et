import { useState } from "react";
import { AlertTriangle, X, ChevronDown, ChevronUp } from "lucide-react";

export interface ApiError {
  id: string;
  source: string;
  message: string;         // raw technical message (kept for console)
  friendlyMessage: string; // what users see
  code?: string;
  timestamp: Date;
}

interface ErrorBannerProps {
  errors: ApiError[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

const ErrorBanner = ({ errors, onDismiss, onDismissAll }: ErrorBannerProps) => {
  const [expanded, setExpanded] = useState(false);

  if (errors.length === 0) return null;

  const latestError = errors[0];

  return (
    <div className="mx-5 mt-2 mb-1 rounded-lg border border-destructive/30 bg-destructive/10 overflow-hidden">
      {/* Header row */}
      <div className="flex items-start gap-2 px-3 py-2.5">
        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-destructive leading-tight">
            {errors.length === 1
              ? latestError.friendlyMessage
              : `${errors.length} issues need your attention`}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {errors.length > 1 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          <button
            onClick={onDismissAll}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded error list — only friendly messages */}
      {expanded && errors.length > 1 && (
        <div className="border-t border-destructive/20 px-3 py-1.5 space-y-1.5 max-h-40 overflow-y-auto">
          {errors.map((err) => (
            <div key={err.id} className="flex items-start gap-2 text-[11px]">
              <span className="text-foreground/80 flex-1">
                {err.friendlyMessage}
              </span>
              <button
                onClick={() => onDismiss(err.id)}
                className="ml-auto p-0.5 text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ErrorBanner;
