import { Quest, currentUser, Comment } from "@/data/mockData";
import { useAppStore } from "@/data/appState";
import { motion, AnimatePresence } from "framer-motion";
import { Check, HandMetal, Users, MessageCircle, ChevronDown, ChevronUp, Send } from "lucide-react";
import { useState } from "react";

interface QuestCardProps {
  quest: Quest;
  index?: number;
  showGroup?: boolean;
  onEdit?: (quest: Quest) => void;
  disableJoin?: boolean;
}

const QuestCard = ({ quest, index = 0, showGroup = true, onEdit, disableJoin = false }: QuestCardProps) => {
  const { toggleImIn, markDone, groups, addComment } = useAppStore();
  const isIn = quest.participants.some((p) => p.id === currentUser.id);
  const group = quest.groupId ? groups.find((g) => g.id === quest.groupId) : null;
  const userInGroup = group ? group.members.some((m) => m.id === currentUser.id) : true;
  const canJoin = !disableJoin && userInGroup;

  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: `c${Date.now()}`,
      userId: currentUser.id,
      user: currentUser,
      text: newComment.trim(),
      createdAt: new Date().toISOString().split("T")[0],
    };
    addComment(quest.id, comment);
    setNewComment("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`p-4 rounded-2xl border border-border/50 bg-card ${quest.isDone ? "opacity-60" : ""}`}
      onClick={() => onEdit?.(quest)}
    >
      {/* Header: Creator name + group */}
      <div className="mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">{quest.createdBy.avatar}</span>
          <span className="text-sm font-bold text-foreground">{quest.createdBy.name}</span>
        </div>
        <p className="text-[11px] text-muted-foreground ml-7">
          {group ? `${group.emoji} ${group.name}` : "🌍 Followers only"}
        </p>
      </div>

      {/* Title + description */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-bold text-foreground leading-tight text-[15px]">{quest.title}</h4>
          {quest.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{quest.description}</p>
          )}
        </div>

        {!quest.isDone && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (canJoin) toggleImIn(quest.id);
            }}
            disabled={!canJoin}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
              !canJoin
                ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                : isIn
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <HandMetal className="w-3.5 h-3.5" />
            I'm In
          </button>
        )}
      </div>

      {/* Completed timestamp */}
      {quest.isDone && quest.completedAt && (
        <p className="text-[10px] text-muted-foreground mt-1">
          Completed {quest.completedAt}
        </p>
      )}

      {/* Social proof + actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
        {/* Participant avatars */}
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1.5">
            {quest.participants.slice(0, 3).map((p) => (
              <span
                key={p.id}
                className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-card"
              >
                {p.avatar}
              </span>
            ))}
          </div>
          {quest.participants.length > 3 && (
            <span className="text-[10px] text-muted-foreground ml-1">
              +{quest.participants.length - 3} others
            </span>
          )}
          {quest.participants.length <= 3 && quest.participants.length > 0 && (
            <span className="text-[10px] text-muted-foreground ml-1">
              {quest.participants.length} joined
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Comments toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(!showComments);
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {quest.comments.length > 0 && <span>{quest.comments.length}</span>}
            {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {!quest.isDone && isIn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                markDone(quest.id);
              }}
              className="flex items-center gap-1 text-xs text-secondary font-semibold"
            >
              <Check className="w-3.5 h-3.5" />
              Done
            </button>
          )}
        </div>
      </div>

      {/* Expandable comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
              {quest.comments.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">No comments yet</p>
              )}
              {quest.comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <span className="text-xs">{c.user.avatar}</span>
                  <div>
                    <span className="text-xs font-semibold text-foreground">{c.user.name}</span>
                    <p className="text-xs text-muted-foreground">{c.text}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Add a comment..."
                  className="flex-1 text-xs px-3 py-2 rounded-lg bg-muted border-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddComment();
                  }}
                  className="p-1.5 rounded-lg bg-primary text-primary-foreground"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QuestCard;
