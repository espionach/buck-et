import { Quest, Comment, User } from "@/data/mockData";
import { useAppStore } from "@/data/appState";
import UserAvatar from "@/components/UserAvatar";
import { GroupIconDisplay } from "@/components/GroupIcon";
import OwnerLeaveDialog from "@/components/OwnerLeaveDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Check, HandMetal, MessageCircle, ChevronDown, ChevronUp, Send, Pencil, Plus, Undo2, ExternalLink, X, Calendar } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "@/hooks/use-popup";
import { format, parseISO } from "date-fns";

interface QuestCardProps {
  quest: Quest;
  index?: number;
  showGroup?: boolean;
  onEditCurrent?: (quest: Quest) => void;
  onEditPast?: (quest: Quest) => void;
  disableJoin?: boolean;
  onMarkDone?: () => void;
  onMarkUndone?: () => void;
  autoOpenComments?: boolean;
  highlightCommentId?: string;
  hideActions?: boolean;
  onViewProfile?: (user: User) => void;
}

const QuestCard = ({ quest, index = 0, showGroup = true, onEditCurrent, onEditPast, disableJoin = false, onMarkDone, onMarkUndone, autoOpenComments = false, highlightCommentId, hideActions = false, onViewProfile }: QuestCardProps) => {
  const navigate = useNavigate();
  const { toggleImIn, markDone, markUndone, groups, addComment, deleteQuest, transferQuestOwnership, requestQuestTransfer, transferRequests, acceptTransfer, declineTransfer, currentUser } = useAppStore();
  const isIn = quest.participants.some((p) => p.id === currentUser.id);
  const group = quest.groupId ? groups.find((g) => g.id === quest.groupId) : null;
  const userInGroup = group ? group.members.some((m) => m.id === currentUser.id) : true;
  const canJoin = !disableJoin && userInGroup;
  const isOwner = quest.createdBy.id === currentUser.id;
  const groupOwner = group ? group.ownerId === currentUser.id : false;
  const canToggleStatus = isOwner || groupOwner;
  const isFollowersOnly = quest.isFollowerOnly;
  const canNavigateToDetail = isIn && !quest.isDone;

  const [showComments, setShowComments] = useState(autoOpenComments);
  const [newComment, setNewComment] = useState("");
  const [showOwnerLeave, setShowOwnerLeave] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  usePopup(showOwnerLeave || showDeleteConfirm);

  // Check for pending transfer request for this quest targeting current user
  const pendingTransfer = transferRequests.find(
    (tr) => tr.type === "quest" && tr.entityId === quest.id && tr.toUserId === currentUser.id
  );

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

  const handleToggleImIn = () => {
    if (!canJoin) return;
    if (isOwner && isIn) {
      if (isFollowersOnly) {
        setShowDeleteConfirm(true);
      } else {
        setShowOwnerLeave(true);
      }
      return;
    }
    toggleImIn(quest.id);
  };

  const handleMarkDone = () => {
    markDone(quest.id);
    onMarkDone?.();
  };

  const handleMarkUndone = () => {
    markUndone(quest.id);
    onMarkUndone?.();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.06 }}
        onClick={() => canNavigateToDetail && navigate(`/quest/${quest.id}`)}
        className={`relative p-4 overflow-hidden ${quest.isDone ? "opacity-60" : ""} ${canNavigateToDetail ? "cursor-pointer active:scale-[0.99] transition-transform" : ""}`}
      >
        {/* Transfer request banner */}
        {pendingTransfer && (
          <div className="mb-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-xs text-foreground font-medium mb-2">
              {pendingTransfer.fromUser.name} wants to transfer this quest to you
            </p>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  acceptTransfer(pendingTransfer.id);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold"
              >
                <Check className="w-3.5 h-3.5" /> Accept
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  declineTransfer(pendingTransfer.id);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-semibold"
              >
                <X className="w-3.5 h-3.5" /> Decline
              </button>
            </div>
          </div>
        )}

        {/* Pencil icon for owned current quests */}
        {!quest.isDone && isOwner && onEditCurrent && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditCurrent(quest);
            }}
            className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Plus icon for past quests — right side, inside card */}
        {quest.isDone && onEditPast && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditPast(quest);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:scale-110 transition-transform"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Header: Creator name + group */}
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <UserAvatar user={quest.createdBy} size="sm" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onViewProfile) onViewProfile(quest.createdBy);
              }}
              className="text-sm font-bold text-foreground hover:underline"
            >
              {quest.createdBy.name}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground ml-8">
            {group ? <><GroupIconDisplay icon={group.emoji} size={12} className="text-muted-foreground inline-block mr-1" />{group.name}</> : "🌍 Followers only"}
          </p>
        </div>

        {/* Title + join button row */}
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-display font-bold text-foreground leading-tight text-[15px] flex-1 min-w-0">{quest.title}</h4>

          {!quest.isDone && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleImIn();
              }}
              disabled={!canJoin}
              className={`shrink-0 flex items-center justify-center transition-all active:scale-95 ${
                isIn
                  ? "w-8 h-8 rounded-full bg-secondary text-secondary-foreground"
                  : !canJoin
                  ? "px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground/50 cursor-not-allowed text-xs font-semibold"
                  : "px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold"
              }`}
            >
              {isIn ? <Check className="w-4 h-4" strokeWidth={2.5} /> : "Join"}
            </button>
          )}
        </div>

        {/* Description */}
        {quest.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{quest.description}</p>
        )}

        {/* Date */}
        {!quest.isDone && quest.logistics?.date && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {format(parseISO(quest.logistics.date), "MMM d, yyyy")}
              {quest.logistics.time && ` · ${quest.logistics.time}`}
            </span>
          </div>
        )}

        {/* Links */}
        {quest.links && quest.links.length > 0 && (
          <div className="mt-2 space-y-1">
            {quest.links.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{link}</span>
              </a>
            ))}
          </div>
        )}

        {/* Completed timestamp */}
        {quest.isDone && quest.completedAt && (
          <p className="text-[10px] text-muted-foreground mt-1">
            Completed {quest.completedAt}
          </p>
        )}

        {/* Photos & Videos */}
        {quest.photos && quest.photos.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {quest.photos.map((photo, i) => (
              photo.startsWith("data:video") ? (
                <video key={i} src={photo} className="w-20 h-20 rounded-xl object-cover shrink-0 border border-border/30" muted controls />
              ) : (
                <img key={i} src={photo} alt={`Quest photo ${i + 1}`} className="w-20 h-20 rounded-xl object-cover shrink-0 border border-border/30" />
              )
            ))}
          </div>
        )}

        {/* Social proof + actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1.5">
              {quest.participants.slice(0, 3).map((p) => (
                <UserAvatar key={p.id} user={p} size="xs" className="border-2 border-card" />
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

            {!quest.isDone && isIn && !hideActions && canToggleStatus && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkDone();
                }}
                className="flex items-center gap-1 text-xs text-secondary font-semibold"
              >
                <Check className="w-3.5 h-3.5" />
                Finish Quest
              </button>
            )}

            {quest.isDone && isIn && !hideActions && canToggleStatus && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkUndone();
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Move to Active
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
                  <div
                    key={c.id}
                    className={`flex items-start gap-2 p-1.5 rounded-lg transition-colors ${
                      highlightCommentId === c.id ? "bg-primary/10 ring-1 ring-primary/30" : ""
                    }`}
                  >
                    <UserAvatar user={c.user} size="xs" />
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

      {/* Owner leave dialog — for group quests */}
      <AnimatePresence>
        {showOwnerLeave && (
          <OwnerLeaveDialog
            type="quest"
            members={quest.participants}
            ownerId={currentUser.id}
            onDelete={() => {
              deleteQuest(quest.id);
              setShowOwnerLeave(false);
            }}
            onTransfer={(newOwnerId) => {
              requestQuestTransfer(quest.id, newOwnerId);
              setShowOwnerLeave(false);
            }}
            onCancel={() => setShowOwnerLeave(false)}
          />
        )}
      </AnimatePresence>

      {/* Followers-only delete confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-foreground/40 flex items-center justify-center p-5"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-card rounded-xl p-5 space-y-4 shadow-lg text-center"
            >
              <p className="text-sm font-bold text-foreground">Are you sure?</p>
              <p className="text-xs text-muted-foreground">
                This quest will be permanently deleted for everyone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    deleteQuest(quest.id);
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuestCard;
