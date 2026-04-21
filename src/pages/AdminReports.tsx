import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/data/appState";

interface ReportRow {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  reporter_name?: string;
  reported_name?: string;
}

const AdminReports = () => {
  const nav = useNavigate();
  const currentUserRoles = useAppStore((s) => s.currentUserRoles);
  const isMod = currentUserRoles.includes("admin") || currentUserRoles.includes("moderator");
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isMod) return;
    (async () => {
      const { data } = await supabase
        .from("user_reports")
        .select("*")
        .order("created_at", { ascending: false });
      const rows = (data || []) as ReportRow[];
      const userIds = Array.from(
        new Set(rows.flatMap((r) => [r.reporter_id, r.reported_user_id]))
      );
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username")
        .in("user_id", userIds);
      const nameMap = new Map(
        (profiles || []).map((p) => [
          p.user_id,
          p.display_name || (p.username ? `@${p.username}` : "User"),
        ])
      );
      setReports(
        rows.map((r) => ({
          ...r,
          reporter_name: nameMap.get(r.reporter_id) || "User",
          reported_name: nameMap.get(r.reported_user_id) || "User",
        }))
      );
      setLoading(false);
    })();
  }, [isMod]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("user_reports").update({ status }).eq("id", id);
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  if (!isMod) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 text-center">
        <div>
          <p className="font-bold text-foreground mb-1">Not authorized</p>
          <p className="text-sm text-muted-foreground">
            You need moderator access to view this page.
          </p>
        </div>
      </div>
    );
  }

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
        <h1 className="text-xl font-bold text-foreground">User Reports</h1>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Loading…</p>
      ) : reports.length === 0 ? (
        <div className="text-center py-16">
          <Flag className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-foreground mb-1">No reports</p>
          <p className="text-sm text-muted-foreground">
            Submitted reports will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {r.reason}
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
                <span className="font-semibold">{r.reporter_name}</span>
                <span className="text-muted-foreground"> reported </span>
                <span className="font-semibold">{r.reported_name}</span>
              </p>
              {r.description && (
                <p className="text-sm text-muted-foreground mb-2">{r.description}</p>
              )}
              <p className="text-xs text-muted-foreground/70 mb-3">
                {new Date(r.created_at).toLocaleString()}
              </p>
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(r.id, "resolved")}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-semibold"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => updateStatus(r.id, "dismissed")}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-semibold"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
