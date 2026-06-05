import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Trash2, FileText, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore } from "@/data/appState";
import { listDrafts, deleteDraft, type QuestDraft } from "@/lib/drafts";
import GroupSwatch from "@/components/GroupSwatch";
import EmptyState from "@/components/EmptyState";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

const Drafts = () => {
  const nav = useNavigate();
  const location = useLocation();
  const backTo = (location.state as { from?: string } | null)?.from || "/profile";
  const { currentUser, groups } = useAppStore();
  const [drafts, setDrafts] = useState<QuestDraft[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    setDrafts(listDrafts(currentUser.id));
  }, [currentUser?.id]);

  const handleOpen = (d: QuestDraft) => {
    nav(`/create?draftId=${encodeURIComponent(d.id)}`);
  };

  const handleDelete = (id: string) => {
    if (!currentUser?.id) return;
    deleteDraft(currentUser.id, id);
    setDrafts(listDrafts(currentUser.id));
    setConfirmId(null);
  };

  return (
    <div className="min-h-screen px-5 pt-14 pb-10">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => nav(-1)}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Drafts</h1>
      </div>

      <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-muted/60 border border-border mb-5">
        <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-snug">
          Drafts are saved on this device only. Clearing your browser data or signing in
          on another device will erase them.
        </p>
      </div>

      {drafts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No drafts"
          description="Start a sidequest and exit — we'll save your progress here."
          cta={{ label: "Start a sidequest", onClick: () => nav("/create") }}
        />
      ) : (
        <div className="divide-y divide-border">
          {drafts.map((d) => {
            const group = d.groupId ? groups.find((g) => g.id === d.groupId) : null;
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 py-3"
              >
                <button
                  onClick={() => handleOpen(d)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-sm font-semibold text-foreground truncate">
                    {d.title.trim() || "Untitled draft"}
                  </p>
                  {d.description.trim() && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {d.description.trim()}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {group && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <GroupSwatch color={group.color} size={12} />
                        {group.name}
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {timeAgo(d.updatedAt)}
                    </span>
                    {d.photoPlaceholderCount > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        · {d.photoPlaceholderCount} photo{d.photoPlaceholderCount > 1 ? "s" : ""} to re-add
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setConfirmId(d.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted/60 shrink-0"
                  aria-label="Delete draft"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {confirmId && (
        <div
          className="fixed inset-0 z-50 bg-foreground/40 flex items-end sm:items-center justify-center px-4"
          onClick={() => setConfirmId(null)}
        >
          <div
            className="bg-card rounded-2xl p-5 w-full max-w-sm border border-border shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-foreground">Delete this draft?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              This can't be undone.
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drafts;
