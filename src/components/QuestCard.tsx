import { Quest, Comment, User, isQuestCompleted } from "@/data/mockData";
import { useAppStore } from "@/data/appState";
import UserAvatar from "@/components/UserAvatar";
import { GroupIconDisplay } from "@/components/GroupIcon";
import SidequestPhoto from "@/components/SidequestPhoto";
import CommentThread from "@/components/CommentThread";

import { motion, AnimatePresence } from "framer-motion";
import { Check, MessageCircle, ChevronDown, ChevronUp, Send, MoreVertical, Plus, Undo2, ExternalLink, X, Calendar, Globe, Pin, Pencil, Trash2, Share2, Flag } from "lucide-react";
import OwnerLeaveDialog from "@/components/OwnerLeaveDialog";
import ReportContentModal from "@/components/ReportContentModal";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePopup } from "@/hooks/use-popup";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

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
  const canNavigateToDetail = isIn && !isFinished;
  const pinned = pinnedQuestIds.includes(quest.id);

  const [showComments, setShowComments] = useState(autoOpenComments);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOwnerLeave, setShowOwnerLeave] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  usePopup(showDeleteConfirm || showOwnerLeave);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  // Position menu when opened
  useEffect(() => {
    if (showMenu && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.right - 140, // align right edge of menu with right edge of button
      });
    }
  }, [showMenu]);

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.06 }}
        onClick={() => { if (canNavigateToDetail) { onQuestClick?.(); navigate(`/quest/${quest.id}`); } }}
        className={`relative p-4 ${isFinished ? "opacity-60" : ""} ${canNavigateToDetail ? "cursor-pointer active:scale-[0.99] transition-transform" : ""} ${justAdded ? "animate-just-added rounded-xl" : ""} ${isPinned ? "rounded-xl border-2 border-primary/30 bg-primary/[0.03]" : ""}`}
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
          <div className="absolute top-3 right-3 z-10" ref={menuRef}>
            <button
              ref={menuButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ position: 'fixed' }}
                  className="bg-card border border-border rounded-xl shadow-lg py-1 min-w-[140px] z-[100]"
                >
                  {isOwner && onEditCurrent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onEditCurrent(quest);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                  {!hidePin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        if (pinned) {
                          unpinQuest(quest.id);
                        } else {
                          pinQuest(quest.id);
                        }
                      }}
                      disabled={!pinned && pinnedQuestIds.length >= 3}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Pin className="w-3.5 h-3.5" /> {pinned ? "Unpin" : "Pin"}
                      {!pinned && pinnedQuestIds.length >= 3 && <span className="text-[10px] text-muted-foreground ml-auto">Max 3</span>}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      handleShare();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                  {!isOwner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        setShowReport(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                    >
                      <Flag className="w-3.5 h-3.5" /> Report
                    </button>
                  )}
                  {isOwner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        if (group && !isFollowersOnly) {
                          setShowOwnerLeave(true);
                        } else {
                          setShowDeleteConfirm(true);
                        }
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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
              {group ? <><GroupIconDisplay icon={group.emoji} size={12} className="text-muted-foreground inline-block mr-1" />{group.name}</> : <span className="inline-flex items-center gap-1"><Globe className="w-3 h-3" />Friends only</span>}
            </p>
          </div>
        </div>

        {/* Title + join button row */}
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-display font-bold text-foreground leading-snug text-[15px] flex-1 min-w-0">{quest.title}</h4>

          {!isFinished && (
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
          <p className="text-sm text-muted-foreground mt-2 truncate pr-12">{quest.description}</p>
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

        {/* Photos & Videos */}
        {quest.photos && quest.photos.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {quest.photos.map((photo, i) => (
              <SidequestPhoto
                key={i}
                src={photo}
                alt={`Quest photo ${i + 1}`}
                className="w-20 h-20 rounded-xl object-cover shrink-0 border border-border/30"
              />
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

            {!isFinished && isOwner && !hideActions && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkDone();
                }}
                className="flex items-center gap-1 text-xs text-secondary font-semibold"
              >
                <Check className="w-3.5 h-3.5" />
                Finish Sidequest
              </button>
            )}

            {isFinished && isOwner && !hideActions && (
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
