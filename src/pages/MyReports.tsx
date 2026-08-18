import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReportRow {
  id: string;
  reported_user_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  target_type: string | null;
  target_id: string | null;
}

const targetLabel = (t: string | null) =>
  t === "sidequest" ? "Sidequest" : t === "comment" ? "Comment" : t === "media" ? "Media" : "User";

const MyReports = () => {
  const nav = useNavigate();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("user_reports")
        .select("id, reported_user_id, reason, description, status, created_at, target_type, target_id")
        .eq("reporter_id", uid)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      const rows = (data || []) as ReportRow[];
      setReports(rows);
      setLoading(false);

      const ids = Array.from(new Set(rows.map((r) => r.reported_user_id)));
      if (ids.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, username")
          .in("user_id", ids);
        if (cancelled) return;
        const map: Record<string, string> = {};
        (profiles || []).forEach((p) => {
          map[p.user_id] = p.display_name || (p.username ? `@${p.username}` : "User");
        });
        setNames(map);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => nav(-1)}
          className="p-2 -ml-2 text-muted-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">My Reports</h1>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Loading…</p>
      ) : reports.length === 0 ? (
        <div className="text-center py-16">
          <Flag className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-foreground mb-1">No reports yet</p>
          <p className="text-sm text-muted-foreground">
            Anything you report will show up here with its status.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="bg-card border border-border/50 rounded-2xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {r.reason}
                </span>
                <span className="text-[10px] font-semibold uppercase text-muted-foreground/80 ml-auto">
                  {targetLabel(r.target_type)}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    r.status === "pending"
                      ? "bg-primary/10 text-primary"
                      : r.status === "resolved"
                      ? "bg-muted text-muted-foreground"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <p className="text-sm text-foreground mb-1">
                <span className="text-muted-foreground">You reported </span>
                <span className="font-semibold">{names[r.reported_user_id] || "a user"}</span>
                {r.target_type && r.target_type !== "user" && (
                  <span className="text-muted-foreground">
                    's {r.target_type === "sidequest" ? "sidequest" : r.target_type === "media" ? "media" : "comment"}
                  </span>
                )}
              </p>
              {r.description && (
                <p className="text-sm text-muted-foreground mb-2">{r.description}</p>
              )}
              <p className="text-xs text-muted-foreground/70">
                {new Date(r.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReports;
