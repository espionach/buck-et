import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, FileText, ShieldCheck, ChevronRight } from "lucide-react";
import { useLegalUpdates, LEGAL_PATHS } from "@/hooks/useLegalUpdates";

const LegalUpdates = () => {
  const nav = useNavigate();
  const { updates, loading } = useLegalUpdates();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => nav("/settings")}
          className="p-2 -ml-2 text-muted-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Legal Updates</h1>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        A history of changes to our Terms of Service and Privacy Policy.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : updates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No legal updates yet.</p>
      ) : (
        <div className="space-y-3">
          {updates.map((u) => {
            const Icon = u.type === "terms" ? FileText : ShieldCheck;
            return (
              <button
                key={u.id}
                onClick={() => nav(LEGAL_PATHS[u.type])}
                className="w-full text-left bg-card border border-border rounded-2xl p-4 flex items-start gap-3 active:bg-muted/60 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{u.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{u.message}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {new Date(u.effective_date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    · v{u.version}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LegalUpdates;
