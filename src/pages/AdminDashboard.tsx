import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Users as UsersIcon, ScrollText, Flag, Search, Trash2, ShieldCheck, ShieldOff, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/data/appState";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Tab = "users" | "quests" | "reports";

interface AdminUser {
  user_id: string;
  display_name: string | null;
  username: string;
  created_at: string;
  is_admin: boolean;
  is_moderator: boolean;
}

interface AdminQuest {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  completed_at: string | null;
  group_id: string | null;
  creator_name?: string;
}

interface AdminReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  target_type: string | null;
  target_id: string | null;
  reporter_name?: string;
  reported_name?: string;
}

const TabButton = ({ active, onClick, icon: Icon, label, count }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string; count?: number }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
      active ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    <span>{label}</span>
    {typeof count === "number" && (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-background/20" : "bg-foreground/10"}`}>{count}</span>
    )}
  </button>
);

const AdminDashboard = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const currentUserRoles = useAppStore((s) => s.currentUserRoles);
  const isAdmin = currentUserRoles.includes("admin");

  const [tab, setTab] = useState<Tab>("users");
  const [loading, setLoading] = useState(true);

  // Data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [quests, setQuests] = useState<AdminQuest[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);

  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [questSearch, setQuestSearch] = useState("");
  const [questFilter, setQuestFilter] = useState<"all" | "active" | "completed">("all");
  const [reportFilter, setReportFilter] = useState<"all" | "pending" | "resolved" | "dismissed">("pending");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadUsers(), loadQuests(), loadReports()]);
    setLoading(false);
  };

  const loadUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, username, created_at")
      .order("created_at", { ascending: false });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");
    const adminSet = new Set<string>();
    const modSet = new Set<string>();
    (roles || []).forEach((r: { user_id: string; role: string }) => {
      if (r.role === "admin") adminSet.add(r.user_id);
      if (r.role === "moderator") modSet.add(r.user_id);
    });
    setUsers(
      (profiles || []).map((p) => ({
        user_id: p.user_id,
        display_name: p.display_name,
        username: p.username,
        created_at: p.created_at,
        is_admin: adminSet.has(p.user_id),
        is_moderator: modSet.has(p.user_id),
      }))
    );
  };

  const loadQuests = async () => {
    const { data } = await supabase
      .from("sidequests")
      .select("id, title, created_by, created_at, completed_at, group_id")
      .order("created_at", { ascending: false });
    const rows = (data || []) as AdminQuest[];
    const ids = Array.from(new Set(rows.map((r) => r.created_by)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, username")
      .in("user_id", ids);
    const nameMap = new Map(
      (profiles || []).map((p) => [p.user_id, p.display_name || (p.username ? `@${p.username}` : "User")])
    );
    setQuests(rows.map((r) => ({ ...r, creator_name: nameMap.get(r.created_by) || "User" })));
  };

  const loadReports = async () => {
    const { data } = await supabase
      .from("user_reports")
      .select("*")
      .order("created_at", { ascending: false });
    const rows = (data || []) as AdminReport[];
    const ids = Array.from(new Set(rows.flatMap((r) => [r.reporter_id, r.reported_user_id])));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, username")
      .in("user_id", ids);
    const nameMap = new Map(
      (profiles || []).map((p) => [p.user_id, p.display_name || (p.username ? `@${p.username}` : "User")])
    );
    setReports(
      rows.map((r) => ({
        ...r,
        reporter_name: nameMap.get(r.reporter_id) || "User",
        reported_name: nameMap.get(r.reported_user_id) || "User",
      }))
    );
  };

  // ----- User actions
  const toggleAdmin = async (u: AdminUser) => {
    if (u.user_id === user?.id) {
      toast.error("You can't change your own admin role.");
      return;
    }
    if (u.is_admin) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", u.user_id)
        .eq("role", "admin");
      if (error) return toast.error(error.message);
      toast.success(`Removed admin from ${u.display_name || u.username}`);
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: u.user_id, role: "admin" });
      if (error) return toast.error(error.message);
      toast.success(`Promoted ${u.display_name || u.username} to admin`);
    }
    loadUsers();
  };

  // ----- Quest actions
  const deleteQuest = async (q: AdminQuest) => {
    if (!confirm(`Delete sidequest "${q.title}"? This can't be undone.`)) return;
    const { error } = await supabase.from("sidequests").delete().eq("id", q.id);
    if (error) return toast.error(error.message);
    toast.success("Sidequest deleted");
    setQuests((prev) => prev.filter((x) => x.id !== q.id));
  };

  // ----- Report actions
  const updateReportStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("user_reports").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Delete this report?")) return;
    const { error } = await supabase.from("user_reports").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.success("Report deleted");
  };

  // ----- Filtered/sorted views
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    const list = users.filter(
      (u) =>
        !q ||
        (u.display_name || "").toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
    );
    return [...list].sort((a, b) =>
      sortDir === "desc"
        ? b.created_at.localeCompare(a.created_at)
        : a.created_at.localeCompare(b.created_at)
    );
  }, [users, userSearch, sortDir]);

  const filteredQuests = useMemo(() => {
    const q = questSearch.trim().toLowerCase();
    return quests
      .filter((x) => {
        if (questFilter === "active" && x.completed_at) return false;
        if (questFilter === "completed" && !x.completed_at) return false;
        if (q && !x.title.toLowerCase().includes(q) && !(x.creator_name || "").toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) =>
        sortDir === "desc"
          ? b.created_at.localeCompare(a.created_at)
          : a.created_at.localeCompare(b.created_at)
      );
  }, [quests, questSearch, questFilter, sortDir]);

  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => reportFilter === "all" || r.status === reportFilter)
      .sort((a, b) =>
        sortDir === "desc"
          ? b.created_at.localeCompare(a.created_at)
          : a.created_at.localeCompare(b.created_at)
      );
  }, [reports, reportFilter, sortDir]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 text-center">
        <div>
          <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-foreground mb-1">Not authorized</p>
          <p className="text-sm text-muted-foreground">You need admin access to view this page.</p>
          <button
            onClick={() => nav("/")}
            className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  const pendingReportCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => nav(-1)}
          className="p-2 -ml-2 text-muted-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground leading-tight">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground">Internal moderation tools</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <TabButton active={tab === "users"} onClick={() => setTab("users")} icon={UsersIcon} label="Users" count={users.length} />
        <TabButton active={tab === "quests"} onClick={() => setTab("quests")} icon={ScrollText} label="Quests" count={quests.length} />
        <TabButton active={tab === "reports"} onClick={() => setTab("reports")} icon={Flag} label="Reports" count={pendingReportCount} />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Loading…</p>
      ) : (
        <>
          {/* USERS */}
          {tab === "users" && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name or @username"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-muted text-sm text-foreground outline-none"
                  />
                </div>
                <button
                  onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                  className="p-2 rounded-xl bg-muted text-muted-foreground"
                  aria-label="Sort by date"
                  title="Sort by created date"
                >
                  {sortDir === "desc" ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                {filteredUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No users found.</p>
                ) : (
                  filteredUsers.map((u) => (
                    <div key={u.user_id} className="p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {u.display_name || u.username}
                          </p>
                          {u.is_admin && (
                            <span className="text-[9px] font-bold uppercase bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Admin</span>
                          )}
                          {u.is_moderator && (
                            <span className="text-[9px] font-bold uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">Mod</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                          Joined {new Date(u.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleAdmin(u)}
                        disabled={u.user_id === user?.id}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                          u.is_admin
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {u.is_admin ? <ShieldOff className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                        {u.is_admin ? "Demote" : "Make admin"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* QUESTS */}
          {tab === "quests" && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={questSearch}
                    onChange={(e) => setQuestSearch(e.target.value)}
                    placeholder="Search title or creator"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-muted text-sm text-foreground outline-none"
                  />
                </div>
                <button
                  onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                  className="p-2 rounded-xl bg-muted text-muted-foreground"
                  aria-label="Sort by date"
                >
                  {sortDir === "desc" ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex gap-1.5 mb-3">
                {(["all", "active", "completed"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setQuestFilter(f)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold capitalize ${
                      questFilter === f ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                {filteredQuests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No sidequests.</p>
                ) : (
                  filteredQuests.map((q) => (
                    <div key={q.id} className="p-3 flex items-center gap-3">
                      <button
                        onClick={() => nav(`/quest/${q.id}`)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className="text-sm font-semibold text-foreground truncate">{q.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          by {q.creator_name}
                          {q.group_id && " · in group"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                              q.completed_at
                                ? "bg-muted text-muted-foreground"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {q.completed_at ? "Completed" : "Active"}
                          </span>
                          <span className="text-[10px] text-muted-foreground/70">
                            {new Date(q.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={() => deleteQuest(q)}
                        className="p-2 rounded-lg bg-destructive/10 text-destructive"
                        aria-label="Delete sidequest"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* REPORTS */}
          {tab === "reports" && (
            <div>
              <div className="flex gap-1.5 mb-3 flex-wrap">
                {(["pending", "all", "resolved", "dismissed"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setReportFilter(f)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold capitalize ${
                      reportFilter === f ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
                <button
                  onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                  className="ml-auto p-1.5 rounded-full bg-muted text-muted-foreground"
                  aria-label="Sort by date"
                >
                  {sortDir === "desc" ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>

              {filteredReports.length === 0 ? (
                <div className="text-center py-12">
                  <Flag className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-bold text-foreground mb-0.5">No reports</p>
                  <p className="text-xs text-muted-foreground">Nothing here right now.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredReports.map((r) => (
                    <div key={r.id} className="bg-card border border-border rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          {r.reason}
                        </span>
                        <span className="text-[9px] font-semibold uppercase text-muted-foreground/80">
                          {r.target_type === "sidequest" ? "Sidequest" : r.target_type === "comment" ? "Comment" : "User"}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ml-auto ${
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
                        {r.target_type && r.target_type !== "user" && (
                          <span className="text-muted-foreground">'s {r.target_type}</span>
                        )}
                      </p>
                      {r.description && (
                        <p className="text-xs text-muted-foreground mb-1.5">{r.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70 mb-2">
                        {new Date(r.created_at).toLocaleString()}
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {r.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateReportStatus(r.id, "resolved")}
                              className="px-2.5 py-1 rounded-lg bg-muted text-foreground text-[11px] font-semibold"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => updateReportStatus(r.id, "dismissed")}
                              className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-[11px] font-semibold"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                        {r.target_type === "sidequest" && r.target_id && (
                          <button
                            onClick={() => nav(`/quest/${r.target_id}`)}
                            className="px-2.5 py-1 rounded-lg bg-muted text-foreground text-[11px] font-semibold"
                          >
                            View quest
                          </button>
                        )}
                        <button
                          onClick={() => deleteReport(r.id)}
                          className="ml-auto px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-[11px] font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;