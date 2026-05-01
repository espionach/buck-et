import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Shield, Users as UsersIcon, ScrollText, Flag, Search, Trash2,
  ShieldCheck, ShieldOff, ChevronUp, ChevronDown, MessageSquare, History,
  AlertTriangle, EyeOff, Eye, Ban, Clock, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/data/appState";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

type Tab = "users" | "quests" | "comments" | "reports" | "audit";

interface UserFlag {
  user_id: string;
  strike_count: number;
  is_suspended: boolean;
  suspended_until: string | null;
  is_banned: boolean;
}

interface AdminUser {
  user_id: string;
  display_name: string | null;
  username: string;
  created_at: string;
  is_admin: boolean;
  is_moderator: boolean;
  flag?: UserFlag;
  report_count?: number;
}

interface AdminQuest {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  completed_at: string | null;
  group_id: string | null;
  is_hidden: boolean;
  creator_name?: string;
}

interface AdminComment {
  id: string;
  text: string;
  user_id: string;
  sidequest_id: string;
  created_at: string;
  author_name?: string;
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
  target_preview?: string;
}

interface AuditEntry {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string | null;
  target_user_id: string | null;
  reason: string | null;
  created_at: string;
  admin_name?: string;
  target_name?: string;
}

const TabButton = ({ active, onClick, icon: Icon, label, count }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string; count?: number }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
      active ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    <span>{label}</span>
    {typeof count === "number" && count > 0 && (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-background/20" : "bg-foreground/10"}`}>{count}</span>
    )}
  </button>
);

const StatusBadge = ({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "primary" | "destructive" | "warn" }) => {
  const cls =
    tone === "destructive" ? "bg-destructive/10 text-destructive"
    : tone === "primary" ? "bg-primary/10 text-primary"
    : tone === "warn" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
    : "bg-muted text-muted-foreground";
  return <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${cls}`}>{children}</span>;
};

const AdminDashboard = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const currentUserRoles = useAppStore((s) => s.currentUserRoles);
  const isAdmin = currentUserRoles.includes("admin");

  const [tab, setTab] = useState<Tab>("reports");
  const [loading, setLoading] = useState(true);

  // Data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [quests, setQuests] = useState<AdminQuest[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [userSort, setUserSort] = useState<"recent" | "reports">("recent");
  const [questSearch, setQuestSearch] = useState("");
  const [questFilter, setQuestFilter] = useState<"all" | "active" | "completed" | "hidden">("all");
  const [commentSearch, setCommentSearch] = useState("");
  const [reportFilter, setReportFilter] = useState<"all" | "pending" | "resolved" | "dismissed">("pending");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  // Modals
  const [confirmAction, setConfirmAction] = useState<null | {
    title: string;
    desc: string;
    confirmLabel: string;
    destructive?: boolean;
    onConfirm: () => Promise<unknown> | unknown;
  }>(null);
  const [reportDetail, setReportDetail] = useState<AdminReport | null>(null);
  const [reportContent, setReportContent] = useState<{ kind: string; preview: string } | null>(null);
  const [suspendUser, setSuspendUser] = useState<AdminUser | null>(null);
  const [suspendDays, setSuspendDays] = useState(7);

  // Bulk
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const logAction = async (entry: {
    action_type: string; target_type: string; target_id?: string | null;
    target_user_id?: string | null; reason?: string | null;
    metadata?: Record<string, unknown>;
  }) => {
    if (!user) return;
    await supabase.from("admin_actions").insert({
      admin_id: user.id,
      action_type: entry.action_type,
      target_type: entry.target_type,
      target_id: entry.target_id ?? null,
      target_user_id: entry.target_user_id ?? null,
      reason: entry.reason ?? null,
      metadata: entry.metadata ?? null,
    });
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadUsers(), loadQuests(), loadComments(), loadReports(), loadAudit()]);
    setLoading(false);
  };

  const loadUsers = async () => {
    const [{ data: profiles }, { data: roles }, { data: flags }, { data: reportRows }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, username, created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("user_flags").select("*"),
      supabase.from("user_reports").select("reported_user_id"),
    ]);
    const adminSet = new Set<string>();
    const modSet = new Set<string>();
    (roles || []).forEach((r: { user_id: string; role: string }) => {
      if (r.role === "admin") adminSet.add(r.user_id);
      if (r.role === "moderator") modSet.add(r.user_id);
    });
    const flagMap = new Map<string, UserFlag>();
    (flags || []).forEach((f) => flagMap.set(f.user_id, f as UserFlag));
    const reportCounts = new Map<string, number>();
    (reportRows || []).forEach((r: { reported_user_id: string }) => {
      reportCounts.set(r.reported_user_id, (reportCounts.get(r.reported_user_id) || 0) + 1);
    });
    setUsers((profiles || []).map((p) => ({
      user_id: p.user_id,
      display_name: p.display_name,
      username: p.username,
      created_at: p.created_at,
      is_admin: adminSet.has(p.user_id),
      is_moderator: modSet.has(p.user_id),
      flag: flagMap.get(p.user_id),
      report_count: reportCounts.get(p.user_id) || 0,
    })));
  };

  const loadQuests = async () => {
    const { data } = await supabase
      .from("sidequests")
      .select("id, title, description, created_by, created_at, completed_at, group_id, is_hidden")
      .order("created_at", { ascending: false });
    const rows = (data || []) as AdminQuest[];
    const ids = Array.from(new Set(rows.map((r) => r.created_by)));
    const { data: profiles } = await supabase
      .from("profiles").select("user_id, display_name, username").in("user_id", ids);
    const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name || (p.username ? `@${p.username}` : "User")]));
    setQuests(rows.map((r) => ({ ...r, creator_name: nameMap.get(r.created_by) || "User" })));
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from("comments").select("id, text, user_id, sidequest_id, created_at")
      .order("created_at", { ascending: false }).limit(200);
    const rows = (data || []) as AdminComment[];
    const ids = Array.from(new Set(rows.map((r) => r.user_id)));
    const { data: profiles } = await supabase
      .from("profiles").select("user_id, display_name, username").in("user_id", ids);
    const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name || (p.username ? `@${p.username}` : "User")]));
    setComments(rows.map((r) => ({ ...r, author_name: nameMap.get(r.user_id) || "User" })));
  };

  const loadReports = async () => {
    const { data } = await supabase.from("user_reports").select("*").order("created_at", { ascending: false });
    const rows = (data || []) as AdminReport[];
    const ids = Array.from(new Set(rows.flatMap((r) => [r.reporter_id, r.reported_user_id])));
    const { data: profiles } = await supabase
      .from("profiles").select("user_id, display_name, username").in("user_id", ids);
    const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name || (p.username ? `@${p.username}` : "User")]));

    // Fetch content previews for sidequest/comment targets
    const sidequestIds = rows.filter((r) => r.target_type === "sidequest" && r.target_id).map((r) => r.target_id as string);
    const commentIds = rows.filter((r) => r.target_type === "comment" && r.target_id).map((r) => r.target_id as string);
    const [{ data: sqs }, { data: cms }] = await Promise.all([
      sidequestIds.length
        ? supabase.from("sidequests").select("id, title").in("id", sidequestIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      commentIds.length
        ? supabase.from("comments").select("id, text").in("id", commentIds)
        : Promise.resolve({ data: [] as { id: string; text: string }[] }),
    ]);
    const sqMap = new Map((sqs || []).map((s) => [s.id, s.title]));
    const cmMap = new Map((cms || []).map((c) => [c.id, c.text]));

    setReports(rows.map((r) => ({
      ...r,
      reporter_name: nameMap.get(r.reporter_id) || "User",
      reported_name: nameMap.get(r.reported_user_id) || "User",
      target_preview:
        r.target_type === "sidequest" && r.target_id ? sqMap.get(r.target_id) :
        r.target_type === "comment" && r.target_id ? cmMap.get(r.target_id) :
        undefined,
    })));
  };

  const loadAudit = async () => {
    const { data } = await supabase
      .from("admin_actions").select("*").order("created_at", { ascending: false }).limit(200);
    const rows = (data || []) as AuditEntry[];
    const ids = Array.from(new Set(rows.flatMap((r) => [r.admin_id, r.target_user_id].filter(Boolean) as string[])));
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("user_id, display_name, username").in("user_id", ids)
      : { data: [] };
    const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name || (p.username ? `@${p.username}` : "User")]));
    setAudit(rows.map((r) => ({
      ...r,
      admin_name: nameMap.get(r.admin_id) || "Admin",
      target_name: r.target_user_id ? (nameMap.get(r.target_user_id) || "User") : undefined,
    })));
  };

  // ----- User actions
  const toggleAdmin = async (u: AdminUser) => {
    if (u.user_id === user?.id) { toast.error("You can't change your own admin role."); return; }
    if (u.is_admin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", u.user_id).eq("role", "admin");
      if (error) return toast.error(error.message);
      await logAction({ action_type: "demote", target_type: "user", target_user_id: u.user_id });
      toast.success(`Removed admin from ${u.display_name || u.username}`);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: u.user_id, role: "admin" });
      if (error) return toast.error(error.message);
      await logAction({ action_type: "promote", target_type: "user", target_user_id: u.user_id });
      toast.success(`Promoted ${u.display_name || u.username} to admin`);
    }
    loadUsers();
    loadAudit();
  };

  const upsertFlag = async (userId: string, patch: Partial<UserFlag>) => {
    const { data: existing } = await supabase.from("user_flags").select("*").eq("user_id", userId).maybeSingle();
    if (existing) {
      const { error } = await supabase.from("user_flags").update(patch).eq("user_id", userId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("user_flags").insert({ user_id: userId, ...patch });
      if (error) throw error;
    }
  };

  const warnUser = async (u: AdminUser) => {
    try {
      const newCount = (u.flag?.strike_count || 0) + 1;
      await upsertFlag(u.user_id, { strike_count: newCount });
      await logAction({ action_type: "warn", target_type: "user", target_user_id: u.user_id, metadata: { strike_count: newCount } });
      toast.success(`Warned ${u.display_name || u.username} (${newCount} strike${newCount > 1 ? "s" : ""})`);
      loadUsers(); loadAudit();
    } catch (e) { toast.error((e as Error).message); }
  };

  const suspendUserFor = async (u: AdminUser, days: number) => {
    try {
      const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      await upsertFlag(u.user_id, { is_suspended: true, suspended_until: until });
      await logAction({ action_type: "suspend", target_type: "user", target_user_id: u.user_id, metadata: { days } });
      toast.success(`Suspended ${u.display_name || u.username} for ${days} days`);
      loadUsers(); loadAudit();
    } catch (e) { toast.error((e as Error).message); }
  };

  const banUser = async (u: AdminUser) => {
    try {
      await upsertFlag(u.user_id, { is_banned: true, is_suspended: false, suspended_until: null });
      await logAction({ action_type: "ban", target_type: "user", target_user_id: u.user_id });
      toast.success(`Banned ${u.display_name || u.username}`);
      loadUsers(); loadAudit();
    } catch (e) { toast.error((e as Error).message); }
  };

  const unbanUser = async (u: AdminUser) => {
    try {
      await upsertFlag(u.user_id, { is_banned: false, is_suspended: false, suspended_until: null });
      await logAction({ action_type: "unban", target_type: "user", target_user_id: u.user_id });
      toast.success(`Restored ${u.display_name || u.username}`);
      loadUsers(); loadAudit();
    } catch (e) { toast.error((e as Error).message); }
  };

  // ----- Quest actions
  const deleteQuest = async (q: AdminQuest) => {
    const { error } = await supabase.from("sidequests").delete().eq("id", q.id);
    if (error) return toast.error(error.message);
    await logAction({ action_type: "delete_quest", target_type: "sidequest", target_id: q.id, target_user_id: q.created_by });
    toast.success("Sidequest deleted");
    setQuests((prev) => prev.filter((x) => x.id !== q.id));
    loadAudit();
  };

  const toggleHideQuest = async (q: AdminQuest) => {
    const next = !q.is_hidden;
    const { error } = await supabase.from("sidequests").update({ is_hidden: next }).eq("id", q.id);
    if (error) return toast.error(error.message);
    await logAction({ action_type: next ? "hide_quest" : "unhide_quest", target_type: "sidequest", target_id: q.id, target_user_id: q.created_by });
    toast.success(next ? "Quest hidden" : "Quest unhidden");
    setQuests((prev) => prev.map((x) => (x.id === q.id ? { ...x, is_hidden: next } : x)));
    loadAudit();
  };

  // ----- Comment actions
  const deleteComment = async (c: AdminComment) => {
    const { error } = await supabase.from("comments").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    await logAction({ action_type: "delete_comment", target_type: "comment", target_id: c.id, target_user_id: c.user_id });
    toast.success("Comment deleted");
    setComments((prev) => prev.filter((x) => x.id !== c.id));
    loadAudit();
  };

  // ----- Report actions
  const updateReportStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("user_reports").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    const r = reports.find((x) => x.id === id);
    await logAction({
      action_type: status === "resolved" ? "resolve_report" : "dismiss_report",
      target_type: "report", target_id: id, target_user_id: r?.reported_user_id,
    });
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    loadAudit();
  };

  const deleteReport = async (id: string) => {
    const { error } = await supabase.from("user_reports").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setReports((prev) => prev.filter((r) => r.id !== id));
    toast.success("Report deleted");
  };

  const bulkResolve = async () => {
    const ids = Array.from(selectedReports);
    if (!ids.length) return;
    const { error } = await supabase.from("user_reports").update({ status: "resolved" }).in("id", ids);
    if (error) return toast.error(error.message);
    for (const id of ids) {
      const r = reports.find((x) => x.id === id);
      await logAction({ action_type: "resolve_report", target_type: "report", target_id: id, target_user_id: r?.reported_user_id });
    }
    setReports((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, status: "resolved" } : r)));
    setSelectedReports(new Set());
    toast.success(`${ids.length} report${ids.length > 1 ? "s" : ""} resolved`);
    loadAudit();
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedReports);
    if (!ids.length) return;
    const { error } = await supabase.from("user_reports").delete().in("id", ids);
    if (error) return toast.error(error.message);
    setReports((prev) => prev.filter((r) => !ids.includes(r.id)));
    setSelectedReports(new Set());
    toast.success(`${ids.length} report${ids.length > 1 ? "s" : ""} deleted`);
  };

  const openReportDetail = async (r: AdminReport) => {
    setReportDetail(r);
    setReportContent(null);
    if (r.target_type === "sidequest" && r.target_id) {
      const { data } = await supabase.from("sidequests").select("title, description").eq("id", r.target_id).maybeSingle();
      if (data) setReportContent({ kind: "Sidequest", preview: `${data.title}\n\n${data.description || ""}`.trim() });
    } else if (r.target_type === "comment" && r.target_id) {
      const { data } = await supabase.from("comments").select("text").eq("id", r.target_id).maybeSingle();
      if (data) setReportContent({ kind: "Comment", preview: data.text });
    }
  };

  // ----- Filtered views
  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    const list = users.filter((u) => !q || (u.display_name || "").toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
    return [...list].sort((a, b) => {
      if (userSort === "reports") return (b.report_count || 0) - (a.report_count || 0);
      return sortDir === "desc" ? b.created_at.localeCompare(a.created_at) : a.created_at.localeCompare(b.created_at);
    });
  }, [users, userSearch, sortDir, userSort]);

  const filteredQuests = useMemo(() => {
    const q = questSearch.trim().toLowerCase();
    return quests.filter((x) => {
      if (questFilter === "active" && x.completed_at) return false;
      if (questFilter === "completed" && !x.completed_at) return false;
      if (questFilter === "hidden" && !x.is_hidden) return false;
      if (q && !x.title.toLowerCase().includes(q) && !(x.creator_name || "").toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => sortDir === "desc" ? b.created_at.localeCompare(a.created_at) : a.created_at.localeCompare(b.created_at));
  }, [quests, questSearch, questFilter, sortDir]);

  const filteredComments = useMemo(() => {
    const q = commentSearch.trim().toLowerCase();
    return comments.filter((c) => !q || c.text.toLowerCase().includes(q) || (c.author_name || "").toLowerCase().includes(q));
  }, [comments, commentSearch]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => reportFilter === "all" || r.status === reportFilter)
      .sort((a, b) => sortDir === "desc" ? b.created_at.localeCompare(a.created_at) : a.created_at.localeCompare(b.created_at));
  }, [reports, reportFilter, sortDir]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 text-center">
        <div>
          <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-foreground mb-1">Not authorized</p>
          <p className="text-sm text-muted-foreground">You need admin access to view this page.</p>
          <button onClick={() => nav("/")} className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">Go home</button>
        </div>
      </div>
    );
  }

  const pendingReportCount = reports.filter((r) => r.status === "pending").length;

  const userStatusBadge = (u: AdminUser) => {
    if (u.flag?.is_banned) return <StatusBadge tone="destructive">Banned</StatusBadge>;
    if (u.flag?.is_suspended && (!u.flag.suspended_until || new Date(u.flag.suspended_until) > new Date()))
      return <StatusBadge tone="warn">Suspended</StatusBadge>;
    if ((u.flag?.strike_count || 0) > 0)
      return <StatusBadge tone="warn">{u.flag!.strike_count} strike{u.flag!.strike_count > 1 ? "s" : ""}</StatusBadge>;
    return null;
  };

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => nav(-1)} className="p-2 -ml-2 text-muted-foreground" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground leading-tight">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground">Internal moderation tools</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto -mx-5 px-5 pb-1">
        <TabButton active={tab === "reports"} onClick={() => setTab("reports")} icon={Flag} label="Reports" count={pendingReportCount} />
        <TabButton active={tab === "users"} onClick={() => setTab("users")} icon={UsersIcon} label="Users" count={users.length} />
        <TabButton active={tab === "quests"} onClick={() => setTab("quests")} icon={ScrollText} label="Quests" count={quests.length} />
        <TabButton active={tab === "comments"} onClick={() => setTab("comments")} icon={MessageSquare} label="Comments" />
        <TabButton active={tab === "audit"} onClick={() => setTab("audit")} icon={History} label="Audit" />
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
                    value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name or @username"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-muted text-sm text-foreground outline-none"
                  />
                </div>
                <button onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))} className="p-2 rounded-xl bg-muted text-muted-foreground" aria-label="Sort">
                  {sortDir === "desc" ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex gap-1.5 mb-3">
                {(["recent", "reports"] as const).map((k) => (
                  <button key={k} onClick={() => setUserSort(k)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold capitalize ${userSort === k ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                    {k === "recent" ? "Recent" : "Most reported"}
                  </button>
                ))}
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                {filteredUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No users found.</p>
                ) : filteredUsers.map((u) => (
                  <div key={u.user_id} className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground truncate">{u.display_name || u.username}</p>
                          {u.is_admin && <StatusBadge tone="primary">Admin</StatusBadge>}
                          {u.is_moderator && <StatusBadge>Mod</StatusBadge>}
                          {userStatusBadge(u)}
                          {(u.report_count || 0) > 0 && <StatusBadge tone="warn">{u.report_count} report{u.report_count! > 1 ? "s" : ""}</StatusBadge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <button
                        onClick={() => toggleAdmin(u)}
                        disabled={u.user_id === user?.id}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${u.is_admin ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}
                      >
                        {u.is_admin ? <ShieldOff className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                        {u.is_admin ? "Demote" : "Make admin"}
                      </button>
                      <button
                        onClick={() => setConfirmAction({
                          title: "Warn user?", desc: `Adds a strike to ${u.display_name || u.username}.`,
                          confirmLabel: "Warn", onConfirm: () => warnUser(u),
                        })}
                        disabled={u.user_id === user?.id}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 disabled:opacity-40"
                      >
                        <AlertTriangle className="w-3 h-3" /> Warn
                      </button>
                      <button
                        onClick={() => { setSuspendUser(u); setSuspendDays(7); }}
                        disabled={u.user_id === user?.id}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 bg-muted text-foreground disabled:opacity-40"
                      >
                        <Clock className="w-3 h-3" /> Suspend
                      </button>
                      {u.flag?.is_banned ? (
                        <button
                          onClick={() => setConfirmAction({
                            title: "Restore user?", desc: `Lift the ban on ${u.display_name || u.username}.`,
                            confirmLabel: "Restore", onConfirm: () => unbanUser(u),
                          })}
                          disabled={u.user_id === user?.id}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 bg-primary/10 text-primary disabled:opacity-40"
                        >
                          <ShieldCheck className="w-3 h-3" /> Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmAction({
                            title: "Ban user?", desc: `Permanently ban ${u.display_name || u.username}. They will be blocked from creating quests, comments, or reports.`,
                            confirmLabel: "Ban", destructive: true, onConfirm: () => banUser(u),
                          })}
                          disabled={u.user_id === user?.id}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 bg-destructive/10 text-destructive disabled:opacity-40"
                        >
                          <Ban className="w-3 h-3" /> Ban
                        </button>
                      )}
                    </div>
                  </div>
                ))}
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
                    value={questSearch} onChange={(e) => setQuestSearch(e.target.value)}
                    placeholder="Search title or creator"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-muted text-sm text-foreground outline-none"
                  />
                </div>
                <button onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))} className="p-2 rounded-xl bg-muted text-muted-foreground" aria-label="Sort">
                  {sortDir === "desc" ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex gap-1.5 mb-3 flex-wrap">
                {(["all", "active", "completed", "hidden"] as const).map((f) => (
                  <button key={f} onClick={() => setQuestFilter(f)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold capitalize ${questFilter === f ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                    {f}
                  </button>
                ))}
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                {filteredQuests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No sidequests.</p>
                ) : filteredQuests.map((q) => (
                  <div key={q.id} className="p-3 flex items-center gap-3">
                    <button onClick={() => nav(`/quest/${q.id}`)} className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-foreground truncate">{q.title}</p>
                      <p className="text-xs text-muted-foreground truncate">by {q.creator_name}{q.group_id && " · in group"}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <StatusBadge tone={q.completed_at ? "muted" : "primary"}>{q.completed_at ? "Completed" : "Active"}</StatusBadge>
                        {q.is_hidden && <StatusBadge tone="warn">Hidden</StatusBadge>}
                        <span className="text-[10px] text-muted-foreground/70">{new Date(q.created_at).toLocaleDateString()}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => toggleHideQuest(q)}
                      className="p-2 rounded-lg bg-muted text-foreground"
                      aria-label={q.is_hidden ? "Unhide" : "Hide"}
                      title={q.is_hidden ? "Unhide" : "Hide"}
                    >
                      {q.is_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setConfirmAction({
                        title: "Delete sidequest?", desc: `"${q.title}" will be permanently removed.`,
                        confirmLabel: "Delete", destructive: true, onConfirm: () => deleteQuest(q),
                      })}
                      className="p-2 rounded-lg bg-destructive/10 text-destructive" aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COMMENTS */}
          {tab === "comments" && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 relative">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={commentSearch} onChange={(e) => setCommentSearch(e.target.value)}
                    placeholder="Search text or author"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-muted text-sm text-foreground outline-none"
                  />
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                {filteredComments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No comments.</p>
                ) : filteredComments.map((c) => (
                  <div key={c.id} className="p-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-3">{c.text}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {c.author_name} · {new Date(c.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => nav(`/quest/${c.sidequest_id}`)}
                      className="p-2 rounded-lg bg-muted text-foreground" aria-label="View context">
                      <ScrollText className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmAction({
                        title: "Delete comment?", desc: "This comment will be permanently removed.",
                        confirmLabel: "Delete", destructive: true, onConfirm: () => deleteComment(c),
                      })}
                      className="p-2 rounded-lg bg-destructive/10 text-destructive" aria-label="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REPORTS */}
          {tab === "reports" && (
            <div>
              <div className="flex gap-1.5 mb-3 flex-wrap">
                {(["pending", "all", "resolved", "dismissed"] as const).map((f) => (
                  <button key={f} onClick={() => setReportFilter(f)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold capitalize ${reportFilter === f ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                    {f}
                  </button>
                ))}
                <button onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))} className="ml-auto p-1.5 rounded-full bg-muted text-muted-foreground" aria-label="Sort">
                  {sortDir === "desc" ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>

              {selectedReports.size > 0 && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-muted rounded-xl">
                  <span className="text-xs font-semibold text-foreground">{selectedReports.size} selected</span>
                  <button onClick={bulkResolve} className="ml-auto px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold">Resolve</button>
                  <button
                    onClick={() => setConfirmAction({
                      title: `Delete ${selectedReports.size} reports?`, desc: "This cannot be undone.",
                      confirmLabel: "Delete all", destructive: true, onConfirm: bulkDelete,
                    })}
                    className="px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-[11px] font-semibold">Delete</button>
                  <button onClick={() => setSelectedReports(new Set())} className="p-1 text-muted-foreground" aria-label="Clear">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

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
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={selectedReports.has(r.id)}
                          onChange={(e) => {
                            const next = new Set(selectedReports);
                            if (e.target.checked) next.add(r.id); else next.delete(r.id);
                            setSelectedReports(next);
                          }}
                          className="mt-1"
                        />
                        <button onClick={() => openReportDetail(r)} className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <StatusBadge>{r.reason}</StatusBadge>
                            <StatusBadge>{r.target_type === "sidequest" ? "Sidequest" : r.target_type === "comment" ? "Comment" : "User"}</StatusBadge>
                            <StatusBadge tone={r.status === "pending" ? "primary" : r.status === "resolved" ? "muted" : "destructive"}>{r.status}</StatusBadge>
                          </div>
                          <p className="text-sm text-foreground mb-1">
                            <span className="font-semibold">{r.reporter_name}</span>
                            <span className="text-muted-foreground"> reported </span>
                            <span className="font-semibold">{r.reported_name}</span>
                            {r.target_type && r.target_type !== "user" && <span className="text-muted-foreground">'s {r.target_type}</span>}
                          </p>
                          {r.target_preview && (
                            <p className="text-xs text-muted-foreground bg-muted rounded-lg px-2 py-1 mb-1.5 line-clamp-2">"{r.target_preview}"</p>
                          )}
                          {r.description && <p className="text-xs text-muted-foreground mb-1.5">{r.description}</p>}
                          <p className="text-[10px] text-muted-foreground/70">{new Date(r.created_at).toLocaleString()}</p>
                        </button>
                      </div>
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {r.status === "pending" && (
                          <>
                            <button onClick={() => updateReportStatus(r.id, "resolved")} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold">Resolve</button>
                            <button onClick={() => updateReportStatus(r.id, "dismissed")} className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-[11px] font-semibold">Dismiss</button>
                          </>
                        )}
                        {r.target_type === "sidequest" && r.target_id && (
                          <button onClick={() => nav(`/quest/${r.target_id}`)} className="px-2.5 py-1 rounded-lg bg-muted text-foreground text-[11px] font-semibold">View quest</button>
                        )}
                        <button
                          onClick={() => setConfirmAction({
                            title: "Delete report?", desc: "This cannot be undone.", confirmLabel: "Delete",
                            destructive: true, onConfirm: () => deleteReport(r.id),
                          })}
                          className="ml-auto px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-[11px] font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AUDIT */}
          {tab === "audit" && (
            <div>
              <p className="text-xs text-muted-foreground mb-3">Last 200 moderation actions.</p>
              <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
                {audit.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No actions yet.</p>
                ) : audit.map((a) => (
                  <div key={a.id} className="p-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge tone="primary">{a.action_type}</StatusBadge>
                      <StatusBadge>{a.target_type}</StatusBadge>
                      <span className="text-[10px] text-muted-foreground/70 ml-auto">{new Date(a.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-foreground mt-1">
                      <span className="font-semibold">{a.admin_name}</span>
                      {a.target_name && <><span className="text-muted-foreground"> → </span><span className="font-semibold">{a.target_name}</span></>}
                    </p>
                    {a.reason && <p className="text-xs text-muted-foreground mt-0.5">{a.reason}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm modal */}
      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => { const a = confirmAction; setConfirmAction(null); if (a) await a.onConfirm(); }}
              className={confirmAction?.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirmAction?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report detail */}
      <Dialog open={!!reportDetail} onOpenChange={(o) => { if (!o) { setReportDetail(null); setReportContent(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report details</DialogTitle>
            <DialogDescription>
              {reportDetail?.reporter_name} reported {reportDetail?.reported_name}
              {reportDetail?.target_type && reportDetail.target_type !== "user" ? `'s ${reportDetail.target_type}` : ""}
            </DialogDescription>
          </DialogHeader>
          {reportDetail && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Reason</p>
                <p className="text-foreground">{reportDetail.reason}</p>
              </div>
              {reportDetail.description && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Reporter notes</p>
                  <p className="text-foreground">{reportDetail.description}</p>
                </div>
              )}
              {reportContent && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{reportContent.kind} content</p>
                  <p className="text-foreground bg-muted rounded-lg p-2 whitespace-pre-wrap">{reportContent.preview}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">{new Date(reportDetail.created_at).toLocaleString()}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspend modal */}
      <Dialog open={!!suspendUser} onOpenChange={(o) => !o && setSuspendUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend user</DialogTitle>
            <DialogDescription>
              Suspend {suspendUser?.display_name || suspendUser?.username} for a number of days. They will be blocked from creating quests, comments, or reports during this time.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <input
              type="number" min={1} max={365} value={suspendDays}
              onChange={(e) => setSuspendDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
              className="flex-1 px-3 py-2 rounded-xl bg-muted text-sm text-foreground outline-none"
            />
            <span className="text-sm text-muted-foreground">days</span>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setSuspendUser(null)} className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-semibold">Cancel</button>
            <button
              onClick={async () => { if (suspendUser) { await suspendUserFor(suspendUser, suspendDays); setSuspendUser(null); } }}
              className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold"
            >
              Suspend
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
