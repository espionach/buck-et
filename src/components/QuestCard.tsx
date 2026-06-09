import { Quest, Comment, User, isQuestCompleted } from "@/data/mockData";
import { useAppStore } from "@/data/appState";
import UserAvatar from "@/components/UserAvatar";
import GroupSwatch from "@/components/GroupSwatch";
import SidequestPhoto from "@/components/SidequestPhoto";
import MediaViewer from "@/components/MediaViewer";
import CommentThread from "@/components/CommentThread";

import { motion, AnimatePresence } from "framer-motion";
import { Check, MessageCircle, ChevronDown, ChevronUp, Send, MoreVertical, Plus, Undo2, ExternalLink, X, Calendar, Globe, Pin, Pencil, Trash2, Share2, Flag } from "lucide-react";
import OwnerLeaveDialog from "@/components/OwnerLeaveDialog";
import ReportContentModal from "@/components/ReportContentModal";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "@/hooks/use-popup";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useMotionValue, useTransform, animate as motionAnimate } from "framer-motion";

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
  onQuestClick?: () => void;
  justAdded?: boolean;
  isPinned?: boolean;
  hidePin?: boolean;
}

const QuestCard = ({ quest, index = 0, showGroup = true, onEditCurrent, onEditPast, disableJoin = false, onMarkDone, onMarkUndone, autoOpenComments = false, highlightCommentId, hideActions = false, onViewProfile, onQuestClick, justAdded = false, isPinned = false, hidePin = false }: QuestCardProps) => {
  const navigate = useNavigate();
  const { toggleImIn, markDone, markUndone, groups, addComment, deleteQuest, transferQuestOwnership, requestQuestTransfer, transferRequests, acceptTransfer, declineTransfer, currentUser, pinQuest, unpinQuest, pinnedQuestIds } = useAppStore();
  const isIn = quest.participants.some((p) => p.id === currentUser.id);
  const group = quest.groupId ? groups.find((g) => g.id === quest.groupId) : null;
  const userInGroup = group ? group.members.some((m) => m.id === currentUser.id) : true;
  const isOwner = quest.createdBy.id === currentUser.id;
  const groupOwner = group ? group.ownerId === currentUser.id : false;
  const isFollowersOnly = quest.isFollowerOnly;
  // Quest-level completion is now driven solely by whether the OWNER finished it.
  const isFinished = isQuestCompleted(quest);
  // Whether the current viewer was joined at the time the owner finished.
  const wasJoinedWhenFinished = quest.completedByUserIds.includes(currentUser.id);
  const canJoin = !disableJoin && userInGroup && !isFinished;
  const canNavigateToDetail = !isFinished;
  const pinned = pinnedQuestIds.includes(quest.id);

  const [showComments, setShowComments] = useState(autoOpenComments);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOwnerLeave, setShowOwnerLeave] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [showReport, setShowReport] = useState(false);
  usePopup(showDeleteConfirm || showOwnerLeave);

  // Check for pending transfer request for this quest targeting current user
  const pendingTransfer = transferRequests.find(
    (tr) => tr.type === "quest" && tr.entityId === quest.id && tr.toUserId === currentUser.id
  );

  const handleToggleImIn = () => {
    if (!canJoin) return;
      if (isOwner && isIn) {
        if (group && !isFollowersOnly) {
          setShowOwnerLeave(true);
        } else {
          setShowDeleteConfirm(true);
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

  // Three-dots menu: owners get Edit/Pin/Delete; non-owners get Share/Report.
  const showThreeDots = !isFinished;

  // Finish action (owner-only, active quests).
  const canFinish = isOwner && !isFinished && !hideActions;
  // Move-to-active action (owner-only, finished quests).
  const canUndo = isOwner && isFinished && !hideActions;
  const isMobile = useIsMobile();
  const swipeX = useMotionValue(0);
  const underlayOpacity = useTransform(swipeX, [0, 40, 96], [0, 0.6, 1]);
  const wasDragged = useRef(false);
  const enableSwipe = (canFinish || canUndo) && isMobile;

  const handleShare = async () => {
    const url = `${window.location.origin}/quest/${quest.id}`;
    const shareData = {
      title: quest.title,
      text: `Check out this sidequest: ${quest.title}`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // user canceled share; fall through to clipboard fallback only on real errors
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  return (
    <>
      <div className={`relative ${enableSwipe ? "overflow-hidden" : ""} ${isPinned ? "rounded-xl" : ""}`}>
        {enableSwipe && (
          <motion.div
            style={{ opacity: underlayOpacity }}
            className={`absolute inset-0 flex items-center justify-start pl-6 rounded-xl pointer-events-none ${canUndo ? "bg-muted text-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              {canUndo ? <Undo2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
              {canUndo ? "Move to Active" : "Finish"}
            </div>
          </motion.div>
        )}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.06 }}
        style={enableSwipe ? { x: swipeX } : undefined}
        drag={enableSwipe ? "x" : false}
        dragConstraints={{ left: 0, right: 120 }}
        dragElastic={0.15}
        dragDirectionLock
        onDragStart={() => { wasDragged.current = true; }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 64 || info.velocity.x > 400) {
            motionAnimate(swipeX, 400, { duration: 0.2 });
            setTimeout(() => (canUndo ? handleMarkUndone() : handleMarkDone()), 180);
          } else {
            motionAnimate(swipeX, 0, { type: "spring", stiffness: 400, damping: 35 });
          }
          setTimeout(() => { wasDragged.current = false; }, 50);
        }}
        onClick={() => {
          if (wasDragged.current) return;
          if (canNavigateToDetail) { onQuestClick?.(); navigate(`/quest/${quest.id}`); }
        }}
        className={`relative bg-card p-4 ${isFinished ? "opacity-60" : ""} ${canNavigateToDetail ? "cursor-pointer active:scale-[0.99] transition-transform" : ""} ${justAdded ? "animate-just-added rounded-xl" : ""} ${isPinned ? "rounded-xl border-2 border-primary/30 bg-primary/[0.03]" : ""}`}
      >
        {/* Pin icon for pinned quests */}
        {isPinned && (
          <Pin className="absolute top-3 left-3 w-3.5 h-3.5 text-primary" />
        )}

        {/* Transfer request banner */}
        {pendingTransfer && (
          <div className="mb-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-xs text-foreground font-medium mb-2">
              {pendingTransfer.fromUser.name} wants to transfer this sidequest to you
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

        {/* Three-dots menu for owned/joined current quests */}
        {showThreeDots && (
          <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Sidequest actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4} className="min-w-[140px]">
                {isOwner && onEditCurrent && (
                  <DropdownMenuItem
                    onSelect={() => onEditCurrent(quest)}
                    className="gap-2 text-xs"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </DropdownMenuItem>
                )}
                {!hidePin && (
                  <DropdownMenuItem
                    onSelect={() => {
                      if (pinned) unpinQuest(quest.id);
                      else pinQuest(quest.id);
                    }}
                    disabled={!pinned && pinnedQuestIds.length >= 3}
                    className="gap-2 text-xs"
                  >
                    <Pin className="w-3.5 h-3.5" /> {pinned ? "Unpin" : "Pin"}
                    {!pinned && pinnedQuestIds.length >= 3 && (
                      <span className="text-[10px] text-muted-foreground ml-auto">Max 3</span>
                    )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => handleShare()} className="gap-2 text-xs">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </DropdownMenuItem>
                {!isOwner && (
                  <DropdownMenuItem onSelect={() => setShowReport(true)} className="gap-2 text-xs">
                    <Flag className="w-3.5 h-3.5" /> Report
                  </DropdownMenuItem>
                )}
                {isOwner && (
                  <DropdownMenuItem
                    onSelect={() => {
                      if (group && !isFollowersOnly) setShowOwnerLeave(true);
                      else setShowDeleteConfirm(true);
                    }}
                    className="gap-2 text-xs text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Plus icon for finished quests — only the owner or someone who was
            joined when the owner finished it can attach photos/videos. */}
        {isFinished && (isOwner || wasJoinedWhenFinished) && onEditPast && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditPast(quest);
            }}
            data-spotlight="completed-add-photos"
            aria-label="Add photos to completed sidequest"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:scale-110 transition-transform"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Header: Creator name + group */}
        <div className={`mb-2 flex items-start gap-2.5 ${isPinned ? "pl-5" : ""}`}>
          <UserAvatar user={quest.createdBy} size="sm" className="mt-0.5" />
          <div className="min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onViewProfile) onViewProfile(quest.createdBy);
              }}
              className="text-sm font-bold text-foreground hover:underline leading-tight"
            >
              {quest.createdBy.name}
            </button>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {group ? <span className="inline-flex items-center gap-1"><GroupSwatch color={group.color} size={12} />{group.name}</span> : <span className="inline-flex items-center gap-1"><Globe className="w-3 h-3" />Friends</span>}
            </p>
          </div>
        </div>

        {/* Title + join button row */}
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-display font-bold text-foreground leading-snug text-[15px] flex-1 min-w-0">{quest.title}</h4>

          {!isFinished && !isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleImIn();
              }}
              disabled={!canJoin}
              className={`shrink-0 flex items-center justify-center transition-all active:scale-95 px-3 py-1.5 rounded-full text-xs font-semibold ${
                isIn
                  ? "bg-background text-primary border border-primary hover:bg-primary/5"
                  : !canJoin
                  ? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {isIn ? "Joined" : "Join"}
            </button>
          )}

        </div>

        {/* Description */}
        {quest.description && (
          <p className="text-sm text-muted-foreground mt-2 truncate pr-12">{quest.description}</p>
        )}

        {/* Photos & Videos */}
        {quest.photos && quest.photos.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-4 px-4">
            {quest.photos.map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewerIndex(i);
                }}
                className={`${quest.photos!.length === 1 ? "w-full max-w-md aspect-[4/3]" : "w-56 h-56"} shrink-0 rounded-xl overflow-hidden border border-border/30 focus:outline-none focus:ring-2 focus:ring-ring`}
                aria-label={`Open photo ${i + 1}`}
              >
                <SidequestPhoto
                  src={photo}
                  alt={`Quest photo ${i + 1}`}
                  thumbnail
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
        {quest.photos && quest.photos.length > 0 && viewerIndex !== null && (
          <MediaViewer
            sources={quest.photos}
            startIndex={viewerIndex}
            open={viewerIndex !== null}
            onOpenChange={(o) => !o && setViewerIndex(null)}
          />
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
                className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate pr-12"
              >
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{link}</span>
              </a>
            ))}
          </div>
        )}

        {/* Completed timestamp — shown below photos/videos so it stays
            visible after the user marks the quest done. */}
        {isFinished && quest.completedAt && (
          <p className="text-[11px] text-muted-foreground mt-2">
            Completed {quest.completedAt}
          </p>
        )}

        {/* Date */}
        {!isFinished && quest.logistics?.date && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>
              {format(parseISO(quest.logistics.date), "MMM d, yyyy")}
              {quest.logistics.time && ` · ${quest.logistics.time}`}
            </span>
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
              {(() => {
                const count = (function tally(list: Comment[]): number {
                  return list.reduce((n, c) => n + 1 + (c.replies ? tally(c.replies) : 0), 0);
                })(quest.comments);
                return count > 0 ? <span>{count}</span> : null;
              })()}
              {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {canFinish && !isMobile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkDone();
                }}
                className="text-xs font-medium text-muted-foreground hover:text-secondary underline-offset-4 hover:underline transition-colors"
              >
                Finish
              </button>
            )}

            {canUndo && !isMobile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkUndone();
                }}
                className="text-xs font-medium text-muted-foreground hover:text-secondary underline-offset-4 hover:underline transition-colors"
              >
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
                <CommentThread
                  quest={quest}
                  highlightCommentId={highlightCommentId}
                  onInteract={(e) => e.stopPropagation()}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      </div>

      {/* Delete confirmation */}
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
                This sidequest will be permanently deleted for everyone.
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

      {/* Owner leave dialog for group quests */}
      <AnimatePresence>
        {showOwnerLeave && (
          <OwnerLeaveDialog
            type="quest"
            members={quest.participants}
            ownerId={currentUser.id}
            onDelete={() => {
              setShowOwnerLeave(false);
              setShowDeleteConfirm(true);
            }}
            onTransfer={(newOwnerId) => {
              requestQuestTransfer(quest.id, newOwnerId);
              setShowOwnerLeave(false);
            }}
            onCancel={() => setShowOwnerLeave(false)}
          />
        )}
      </AnimatePresence>

      {/* Report sidequest modal (non-owners) */}
      {!isOwner && (
        <ReportContentModal
          targetType="sidequest"
          targetId={quest.id}
          reportedUserId={quest.createdBy.id}
          open={showReport}
          onOpenChange={setShowReport}
        />
      )}
    </>
  );
};

export default QuestCard;
