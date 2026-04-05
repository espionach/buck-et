import { Quest, User } from "@/data/mockData";
import QuestCard from "@/components/QuestCard";
import { useState, useEffect, useRef } from "react";

interface QuestListProps {
  quests: Quest[];
  pageSize?: number;
  emptyIcon?: string;
  emptyText?: string;
  emptySubtext?: string;
  showGroup?: boolean;
  hideActions?: boolean;
  onEditCurrent?: (quest: Quest) => void;
  onEditPast?: (quest: Quest) => void;
  onMarkDone?: () => void;
  onMarkUndone?: () => void;
  onViewProfile?: (user: User) => void;
  autoOpenCommentsId?: string;
  highlightCommentId?: string;
  scrollToQuestId?: string;
}

const QuestList = ({
  quests,
  pageSize = 10,
  emptyIcon = "🔭",
  emptyText = "No quests to show",
  emptySubtext,
  showGroup = true,
  hideActions = false,
  onEditCurrent,
  onEditPast,
  onMarkDone,
  onMarkUndone,
  onViewProfile,
  autoOpenCommentsId,
  highlightCommentId,
  scrollToQuestId,
}: QuestListProps) => {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [justAdded, setJustAdded] = useState<string | undefined>(scrollToQuestId);

  // Ensure the target quest is visible (expand pages if needed) then scroll
  useEffect(() => {
    if (!scrollToQuestId) return;
    const idx = quests.findIndex((q) => q.id === scrollToQuestId);
    if (idx === -1) return;
    if (idx >= visibleCount) setVisibleCount(idx + 1);
    // Scroll after render
    requestAnimationFrame(() => {
      const el = document.getElementById(`quest-${scrollToQuestId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    // Clear highlight after animation
    const timer = setTimeout(() => setJustAdded(undefined), 2000);
    return () => clearTimeout(timer);
  }, [scrollToQuestId]);

  if (quests.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-4xl mb-2">{emptyIcon}</p>
        <p className="text-sm font-semibold">{emptyText}</p>
        {emptySubtext && <p className="text-sm">{emptySubtext}</p>}
      </div>
    );
  }

  const visible = quests.slice(0, visibleCount);
  const hasMore = visibleCount < quests.length;

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
            autoOpenComments={q.id === autoOpenCommentsId}
            highlightCommentId={q.id === autoOpenCommentsId ? highlightCommentId : undefined}
            justAdded={q.id === justAdded}
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
