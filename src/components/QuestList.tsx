import { Quest, User } from "@/data/mockData";
import QuestCard from "@/components/QuestCard";
import EmptyState from "@/components/EmptyState";
import { useState, useEffect, useRef } from "react";
import { Users, LucideIcon } from "lucide-react";

interface QuestListProps {
  quests: Quest[];
  pageSize?: number;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyCta?: { label: string; onClick: () => void };
  showGroup?: boolean;
  hideActions?: boolean;
  onEditCurrent?: (quest: Quest) => void;
  onEditPast?: (quest: Quest) => void;
  onMarkDone?: () => void;
  onMarkUndone?: () => void;
  onViewProfile?: (user: User) => void;
  onQuestClick?: () => void;
  autoOpenCommentsId?: string;
  highlightCommentId?: string;
  scrollToQuestId?: string;
  pinnedQuestIds?: string[];
  hidePin?: boolean;
  enableSiblingSwipe?: boolean;
  showSwipeTip?: boolean;
}

const QuestList = ({
  quests,
  pageSize = 10,
  emptyIcon = Users,
  emptyTitle = "Your feed is quiet",
  emptyDescription = "Sidequests from friends and friend lists will show up here. Add friends to get things going.",
  emptyCta,
  showGroup = true,
  hideActions = false,
  onEditCurrent,
  onEditPast,
  onMarkDone,
  onMarkUndone,
  onViewProfile,
  onQuestClick,
  autoOpenCommentsId,
  highlightCommentId,
  scrollToQuestId,
  pinnedQuestIds = [],
  hidePin = false,
  enableSiblingSwipe = true,
  showSwipeTip = false,
}: QuestListProps) => {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [justAdded, setJustAdded] = useState<string | undefined>(scrollToQuestId);

  useEffect(() => {
    if (!scrollToQuestId) return;
    const idx = quests.findIndex((q) => q.id === scrollToQuestId);
    if (idx === -1) return;
    if (idx >= visibleCount) setVisibleCount(idx + 1);
    requestAnimationFrame(() => {
      const el = document.getElementById(`quest-${scrollToQuestId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const timer = setTimeout(() => setJustAdded(undefined), 2000);
    return () => clearTimeout(timer);
  }, [scrollToQuestId]);

  if (quests.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        cta={emptyCta}
      />
    );
  }

  const visible = quests.slice(0, visibleCount);
  const hasMore = visibleCount < quests.length;
  const siblingIds = enableSiblingSwipe ? visible.map((q) => q.id) : undefined;

  return (
    <>
      {visible.map((q, i) => (
        <div key={q.id} id={`quest-${q.id}`}>
          <QuestCard
            quest={q}
            index={i}
            showGroup={showGroup}
            hideActions={hideActions}
            onEditCurrent={onEditCurrent}
            onEditPast={onEditPast}
            onMarkDone={onMarkDone}
            onMarkUndone={onMarkUndone}
            onViewProfile={onViewProfile}
            onQuestClick={onQuestClick}
            autoOpenComments={q.id === autoOpenCommentsId}
            highlightCommentId={q.id === autoOpenCommentsId ? highlightCommentId : undefined}
            justAdded={q.id === justAdded}
            isPinned={pinnedQuestIds.includes(q.id)}
            hidePin={hidePin}
            siblingIds={siblingIds}
            showSwipeTip={showSwipeTip}
          />
        </div>
      ))}
      {hasMore && (
        <div className="py-4 flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + pageSize)}
            className="px-6 py-2.5 rounded-full bg-muted text-muted-foreground text-sm font-semibold hover:bg-muted/80 active:scale-95 transition-all"
          >
            Load More
          </button>
        </div>
      )}
    </>
  );
};

export default QuestList;
