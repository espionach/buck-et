import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/data/appState";
import { isQuestCompleted } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import CompletionCelebration, { VisibilityChoice } from "@/components/CompletionCelebration";
import { toast } from "sonner";

/**
 * Backfill guard: completions recorded before this feature shipped should not
 * retroactively trigger the congrats screen.
 */
const FEATURE_CUTOFF = "2026-08-04T03:00:00Z";

interface Pending {
  completionId: string;
  questId: string;
}

const CompletionCelebrationHost = () => {
  const { user } = useAuth();
  const { quests, groups, _invalidate } = useAppStore();
  const [pending, setPending] = useState<Pending | null>(null);
  /** Completions already celebrated in this session — guards against the
   * refetch racing the celebration_seen_at write and re-opening the screen. */
  const handledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || pending) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("sidequest_completions")
        .select("id, sidequest_id, completed_at, celebration_seen_at")
        .eq("user_id", user.id)
        .is("celebration_seen_at", null)
        .gt("completed_at", FEATURE_CUTOFF)
        .order("completed_at", { ascending: false });
      if (cancelled || !data?.length) return;
      // Only celebrate quests the owner actually finished.
      const row = data.find((r) => {
        if (handledRef.current.has(r.id)) return false;
        const q = quests.find((qq) => qq.id === r.sidequest_id);
        return q && isQuestCompleted(q);
      });
      if (row) {
        handledRef.current.add(row.id);
        setPending({ completionId: row.id, questId: row.sidequest_id });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, quests, pending]);


  const quest = pending ? quests.find((q) => q.id === pending.questId) : undefined;
  if (!pending || !quest || !user) return null;

  const isOwner = quest.createdBy.id === user.id;
  const group = quest.groupId ? groups.find((g) => g.id === quest.groupId) : undefined;

  const markSeen = async () => {
    const p = pending;
    setPending(null);
    if (!p) return;
    await supabase
      .from("sidequest_completions")
      .update({ celebration_seen_at: new Date().toISOString() })
      .eq("id", p.completionId);
  };

  const handleSave = async (choice: VisibilityChoice) => {
    const questId = pending.questId;
    const completionId = pending.completionId;
    setPending(null);
    try {
      await supabase
        .from("sidequest_completions")
        .update({
          celebration_seen_at: new Date().toISOString(),
          visibility: choice === "private" ? "private" : "all_friends",
        })
        .eq("id", completionId);

      if (isOwner) {
        if (choice === "private") {
          await supabase.from("sidequests").update({ is_private: true }).eq("id", questId);
        } else if (choice === "friends") {
          await supabase
            .from("sidequests")
            .update({ is_private: false, group_id: null, is_friends_only: true })
            .eq("id", questId);
        } else {
          await supabase.from("sidequests").update({ is_private: false }).eq("id", questId);
        }
      }
      _invalidate(["quests"]);
      toast.success("Visibility updated");
    } catch {
      toast.error("Couldn't update visibility");
    }
  };

  return (
    <AnimatePresence>
      <CompletionCelebration
        key={pending.completionId}
        title={quest.title}
        isOwner={isOwner}
        groupName={group?.name}
        groupColor={group?.color}
        initialChoice={isOwner ? (group ? "group" : "friends") : "friends"}
        onSave={handleSave}
        onDismiss={markSeen}
      />
    </AnimatePresence>
  );
};

export default CompletionCelebrationHost;
