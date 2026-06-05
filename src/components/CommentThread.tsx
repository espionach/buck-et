import { Comment, User, Quest } from "@/data/mockData";
import { useAppStore } from "@/data/appState";
import UserAvatar from "@/components/UserAvatar";
import { Send, Trash2, CornerDownRight, Flag, Heart, MessageCircle } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useState } from "react";
import { validateContent } from "@/lib/contentFilter";
import { toast } from "sonner";
import ReportContentModal from "@/components/ReportContentModal";

interface CommentThreadProps {
  quest: Quest;
  highlightCommentId?: string;
  /** Optional click handler so card-embedded threads don't bubble. */
  onInteract?: (e: React.MouseEvent) => void;
}

const CommentThread = ({ quest, highlightCommentId, onInteract }: CommentThreadProps) => {
  const { currentUser, addComment, deleteComment, toggleCommentLike } = useAppStore();
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<Comment | null>(null);

  const isQuestOwner = quest.createdBy.id === currentUser.id;

  const submit = (text: string, parentId?: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const violation = validateContent(trimmed);
    if (violation) {
      toast.error(violation);
      return;
    }
    const comment: Comment = {
      id: `c${Date.now()}`,
      userId: currentUser.id,
      user: currentUser,
      text: trimmed,
      createdAt: new Date().toISOString().split("T")[0],
      parentId,
      replies: [],
    };
    addComment(quest.id, comment);
  };

  const renderComment = (c: Comment, depth: number) => {
    const canDelete = c.userId === currentUser.id || isQuestOwner;
    const isReplying = replyTo === c.id;
    return (
      <div key={c.id} style={{ marginLeft: depth > 0 ? Math.min(depth, 2) * 16 : 0 }}>
        <div
          className={`flex items-start gap-2 p-1.5 rounded-lg group transition-colors ${
            highlightCommentId === c.id ? "bg-primary/10 ring-1 ring-primary/30" : ""
          }`}
        >
          {depth > 0 && (
            <CornerDownRight className="w-3 h-3 text-muted-foreground/60 mt-1 shrink-0" />
          )}
          <UserAvatar user={c.user} size="xs" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground">{c.user.name}</span>
            </div>
            <p className="text-xs text-muted-foreground break-words">{c.text}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInteract?.(e);
                  toggleCommentLike(quest.id, c.id);
                }}
                className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${
                  c.likedByMe ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-label={c.likedByMe ? "Unlike comment" : "Like comment"}
              >
                <Heart className={`w-2.5 h-2.5 ${c.likedByMe ? "fill-current" : ""}`} />
                {c.likeCount ? c.likeCount : ""}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInteract?.(e);
                  setReplyTo(isReplying ? null : c.id);
                  setReplyText("");
                }}
                className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                {isReplying ? "Cancel" : "Reply"}
              </button>
              {canDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInteract?.(e);
                    setConfirmDelete(c.id);
                  }}
                  className="text-[10px] font-medium text-muted-foreground/70 hover:text-destructive transition-colors"
                >
                  Delete
                </button>
              )}
              {!canDelete && c.userId !== currentUser.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInteract?.(e);
                    setReportTarget(c);
                  }}
                  className="text-[10px] font-medium text-muted-foreground/70 hover:text-destructive transition-colors flex items-center gap-1"
                  aria-label="Report comment"
                >
                  <Flag className="w-2.5 h-2.5" /> Report
                </button>
              )}
            </div>

            {confirmDelete === c.id && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Delete?</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInteract?.(e);
                    deleteComment(quest.id, c.id);
                    setConfirmDelete(null);
                  }}
                  className="text-[10px] font-semibold text-destructive"
                >
                  Yes
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInteract?.(e);
                    setConfirmDelete(null);
                  }}
                  className="text-[10px] font-semibold text-muted-foreground"
                >
                  No
                </button>
              </div>
            )}

            {isReplying && (
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      submit(replyText, c.id);
                      setReplyText("");
                      setReplyTo(null);
                    }
                  }}
                  onClick={(e) => { e.stopPropagation(); onInteract?.(e); }}
                  placeholder={`Reply to ${c.user.name}…`}
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInteract?.(e);
                    submit(replyText, c.id);
                    setReplyText("");
                    setReplyTo(null);
                  }}
                  className="p-1.5 rounded-lg bg-primary text-primary-foreground"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {c.replies && c.replies.length > 0 && (
          <div className="mt-1 space-y-1">
            {c.replies.map((r) => renderComment(r, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {quest.comments.length === 0 && (
        <EmptyState
          icon={MessageCircle}
          title="No comments yet"
          description="Be the first to say something."
          size="sm"
        />
      )}
      {quest.comments.map((c) => renderComment(c, 0))}

      <div className="flex items-center gap-2 mt-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              submit(newComment);
              setNewComment("");
            }
          }}
          onClick={(e) => { e.stopPropagation(); onInteract?.(e); }}
          placeholder="Add a comment..."
          className="flex-1 text-xs px-3 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInteract?.(e);
            submit(newComment);
            setNewComment("");
          }}
          className="p-1.5 rounded-lg bg-primary text-primary-foreground"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {reportTarget && (
        <ReportContentModal
          targetType="comment"
          targetId={reportTarget.id}
          reportedUserId={reportTarget.userId}
          open={!!reportTarget}
          onOpenChange={(o) => { if (!o) setReportTarget(null); }}
        />
      )}
    </div>
  );
};

export default CommentThread;