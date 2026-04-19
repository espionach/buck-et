import { AlertTriangle, X } from "lucide-react";

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

const ErrorBanner = ({ errors, onDismissAll }: ErrorBannerProps) => {
  if (errors.length === 0) return null;

  // Always show only the most recent error (errors are prepended, so index 0 is newest)
  const latestError = errors[0];

  return (
    <div className="mx-5 mt-2 mb-1 rounded-lg border border-destructive/30 bg-destructive/10 overflow-hidden">
      <div className="flex items-start gap-2 px-3 py-2.5">
        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-destructive leading-tight">
            {latestError.friendlyMessage}
          </p>
        </div>
        <button
          onClick={onDismissAll}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          aria-label="Dismiss error"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ErrorBanner;
