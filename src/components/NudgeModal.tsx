import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Check, HandMetal, Hourglass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/data/appState";
import { Quest, User } from "@/data/mockData";
import UserAvatar from "@/components/UserAvatar";
import EmptyState from "@/components/EmptyState";
import { usePopup } from "@/hooks/use-popup";
import { notifyUsers } from "@/lib/notifications";
import { validateContent } from "@/lib/contentFilter";
import {
  MAX_NUDGES_PER_HOUR,
  MAX_NUDGES_PER_DAY,
  NUDGE_HOURLY_LIMIT_MESSAGE,
  NUDGE_DAILY_LIMIT_MESSAGE,
  mapNudgeError,
} from "@/lib/nudgeLimits";
import { toast } from "sonner";

interface NudgeModalProps {
  open: boolean;
  onClose: () => void;
  quest: Quest;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

const NudgeModal = ({ open, onClose, quest }: NudgeModalProps) => {
  const { currentUser } = useAppStore();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [recentNudges, setRecentNudges] = useState<Set<string>>(new Set());
  const [hourlyCount, setHourlyCount] = useState(0);
  const [dailyCount, setDailyCount] = useState(0);
  const [sending, setSending] = useState(false);
  usePopup(open);

  // Only current participants can be nudged
  const candidates: User[] = useMemo(() => {
    if (!open) return [];
    return quest.participants.filter((u) => u.id !== currentUser.id);
  }, [open, quest.participants, currentUser.id]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setSearch("");
      setSelected(new Set());
      setNote("");
    }
  }, [open]);

  // Load per-recipient throttle (24h) + owner rate-limit usage (1h / 24h)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const dayAgo = new Date(Date.now() - ONE_DAY_MS).toISOString();
      const hourAgo = new Date(Date.now() - ONE_HOUR_MS).toISOString();
      const [recentRes, hourRes, dayRes] = await Promise.all([
        supabase
          .from("quest_nudges")
          .select("to_user_id")
          .eq("sidequest_id", quest.id)
          .eq("from_user_id", currentUser.id)
          .gte("created_at", dayAgo),
        supabase
          .from("quest_nudges")
          .select("id", { count: "exact", head: true })
          .eq("from_user_id", currentUser.id)
          .gte("created_at", hourAgo),
        supabase
          .from("quest_nudges")
          .select("id", { count: "exact", head: true })
          .eq("from_user_id", currentUser.id)
          .gte("created_at", dayAgo),
      ]);
      if (cancelled) return;
      setRecentNudges(new Set((recentRes.data || []).map((r) => r.to_user_id)));
      setHourlyCount(hourRes.count ?? 0);
      setDailyCount(dayRes.count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, quest.id, currentUser.id]);

  const rateLimitMessage =
    hourlyCount >= MAX_NUDGES_PER_HOUR
      ? NUDGE_HOURLY_LIMIT_MESSAGE
      : dailyCount >= MAX_NUDGES_PER_DAY
      ? NUDGE_DAILY_LIMIT_MESSAGE
      : null;

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return candidates;
    return candidates.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q)
    );
  }, [candidates, q]);

  const toggle = (id: string) => {
    if (recentNudges.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (sending || selected.size === 0 || rateLimitMessage) return;
    const trimmedNote = note.trim();
    if (trimmedNote) {
      const violation = validateContent(trimmedNote);
      if (violation) {
        toast.error(violation);
        return;
      }
    }
    setSending(true);
    const recipients = Array.from(selected);
    const baseMessage = trimmedNote
      ? `nudged you about '${quest.title}': "${trimmedNote}"`
      : `nudged you about '${quest.title}'`;

    try {
      // Insert audit/throttle rows (DB enforces the nudge limits)
      const nudgeRows = recipients.map((to) => ({
        sidequest_id: quest.id,
        from_user_id: currentUser.id,
        to_user_id: to,
        note: trimmedNote || null,
      }));
      const { error: nudgeErr } = await supabase.from("quest_nudges").insert(nudgeRows);
      if (nudgeErr) throw nudgeErr;

      // Fire notifications
      await notifyUsers({
        recipientIds: recipients,
        fromUserId: currentUser.id,
        type: "nudge",
        message: baseMessage,
        entityId: quest.id,
        groupId: quest.groupId || null,
      });

      toast.success(
        recipients.length === 1 ? "Nudge sent!" : `Nudged ${recipients.length} people!`
      );
      onClose();
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "";
      const friendly = mapNudgeError(msg);
      if (friendly) {
        toast.error(friendly);
      } else if (msg.toLowerCase().includes("permission") || e?.code === "42501") {
        toast.error("You need to own this sidequest to send a nudge.");
      } else {
        toast.error(msg ? `Couldn't send nudge: ${msg}` : "Couldn't send nudge");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-foreground/40 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-xl border border-border h-[75vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <HandMetal className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground text-base">Send a nudge</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Remind people who've joined this sidequest
                  </p>
                </div>
              </div>
              <button onClick={onClose} aria-label="Close" className="p-1 -m-1">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 pt-3 pb-2 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name"
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 py-2 min-h-[140px]">
              {filtered.length === 0 ? (
                <div className="py-8">
                  <EmptyState
                    icon={Search}
                    title={candidates.length === 0 ? "Nobody to nudge yet" : "No matches"}
                    description={
                      candidates.length === 0
                        ? "Only people who've joined this sidequest can be nudged."
                        : undefined
                    }
                    size="sm"
                  />
                </div>
              ) : (
                <ul className="space-y-1">
                  {filtered.map((u) => {
                    const isSelected = selected.has(u.id);
                    const isThrottled = recentNudges.has(u.id);
                    return (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => toggle(u.id)}
                          disabled={isThrottled}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                            isThrottled
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-muted active:bg-muted"
                          }`}
                        >
                          <UserAvatar user={u} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {u.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {isThrottled
                                ? "Nudged recently — try again later"
                                : u.username
                                ? `@${u.username}`
                                : ""}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-primary border-primary"
                                : "border-muted-foreground/40 bg-transparent"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Rate-limit notice / note + send bar */}
            <AnimatePresence>
              {(selected.size > 0 || rateLimitMessage) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="border-t border-border/50 p-3 space-y-2 bg-card"
                >
                  {rateLimitMessage ? (
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-muted/60">
                      <Hourglass className="w-4 h-4 text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground leading-snug">
                        {rateLimitMessage}
                      </p>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value.slice(0, 140))}
                        placeholder="Add a note (optional)"
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending}
                        className="w-full py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60"
                      >
                        {sending ? "Sending…" : `Send a nudge! (${selected.size})`}
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NudgeModal;
