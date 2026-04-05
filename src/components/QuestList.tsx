import { Quest, User } from "@/data/mockData";
import QuestCard from "@/components/QuestCard";
import { useState } from "react";

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
}: QuestListProps) => {
  const [visibleCount, setVisibleCount] = useState(pageSize);

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
        <QuestCard
          key={q.id}
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
        />
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
