import { useAppStore } from "@/data/appState";
import { QuestVolunteer, isQuestCompleted } from "@/data/mockData";
import { ALL_CONTRIBUTION_ROLES } from "@/data/contributionRoles";
import UserAvatar from "@/components/UserAvatar";
import { GroupIconDisplay } from "@/components/GroupIcon";
import SidequestPhoto from "@/components/SidequestPhoto";
import CommentThread from "@/components/CommentThread";
import { ArrowLeft, MapPin, Calendar, Clock, Car, Bike, Train, Footprints, Send, ExternalLink, HandMetal, Check, Globe, StickyNote, MoreVertical, Pencil, Pin, Trash2, Flag, Share2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePopup } from "@/hooks/use-popup";
import ReportContentModal from "@/components/ReportContentModal";
import { validateContent } from "@/lib/contentFilter";
import { toast } from "sonner";

const transportIcons = {
  car: Car,
  bike: Bike,
  transit: Train,
  walk: Footprints,
  other: Car,
};

const transportLabels = {
  car: "Driving",
  bike: "Biking",
  transit: "Public Transit",
  walk: "Walking",
  other: "Other",
};

// Use the shared full list so labels resolve correctly even for legacy roles
const volunteerRoles = ALL_CONTRIBUTION_ROLES;

const QuestDetail = () => {
  const navigate = useNavigate();
  const { questId } = useParams<{ questId: string }>();
  const { quests, groups, addComment, volunteerForQuest, unvolunteerFromQuest, currentUser, pinQuest, unpinQuest, pinnedQuestIds, deleteQuest } = useAppStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  usePopup(showDeleteConfirm);

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
        left: rect.right - 160, // align right edge of menu with right edge of button
      });
    }
  }, [showMenu]);

  useEffect(() => { window.scrollTo(0, 0); }, [questId]);

  const quest = quests.find((q) => q.id === questId);
  const [newComment, setNewComment] = useState("");

  if (!quest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Sidequest not found</p>
      </div>
    );
  }

  // Only joined participants can view; once the owner finishes the quest,
  // the detail view is no longer accessible (the quest moves to history).
  const isIn = quest.participants.some((p) => p.id === currentUser.id);
  if (!isIn || isQuestCompleted(quest)) {
    navigate(-1);
    return null;
  }

  const group = quest.groupId ? groups.find((g) => g.id === quest.groupId) : null;
  const isOwner = quest.createdBy.id === currentUser.id;
  const logistics = quest.logistics || { volunteers: [] };
  const TransportIcon = logistics.transportation ? transportIcons[logistics.transportation] : null;

  const myVolunteerRole = logistics.volunteers.find((v) => v.userId === currentUser.id);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const violation = validateContent(newComment);
    if (violation) {
      toast.error(violation);
      return;
    }
    addComment(quest.id, {
      id: `c${Date.now()}`,
      userId: currentUser.id,
      user: currentUser,
      text: newComment.trim(),
      createdAt: new Date().toISOString().split("T")[0],
    });
    setNewComment("");
  };

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
      // user canceled — fall through
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy link");
    }
  };


  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg px-5 pt-14 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-muted text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground">{quest.title}</h1>
            <p className="text-xs text-muted-foreground">
              {group ? <span className="flex items-center gap-1"><GroupIconDisplay icon={group.emoji} size={12} className="text-muted-foreground" />{group.name}</span> : <span className="flex items-center gap-1"><Globe className="w-3 h-3" />Friends only</span>}
            </p>
          </div>

          {/* Owner actions menu (Edit, Pin, Delete) */}
          {isOwner && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu((s) => !s)}
                className="p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Sidequest actions"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {showMenu && (() => {
                  const pinned = pinnedQuestIds.includes(quest.id);
                  const pinDisabled = !pinned && pinnedQuestIds.length >= 3;
                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-11 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px] z-20"
                    >
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          navigate(`/profile?editQuest=${quest.id}`);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          if (pinned) unpinQuest(quest.id);
                          else pinQuest(quest.id);
                        }}
                        disabled={pinDisabled}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Pin className="w-3.5 h-3.5" /> {pinned ? "Unpin" : "Pin"}
                        {pinDisabled && <span className="text-[10px] text-muted-foreground ml-auto">Max 3</span>}
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          handleShare();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Share
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowDeleteConfirm(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>
          )}

          {/* Non-owner actions: Share + Report */}
          {!isOwner && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu((s) => !s)}
                className="p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Sidequest actions"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-11 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px] z-20"
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleShare();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowReport(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                    >
                      <Flag className="w-3.5 h-3.5" /> Report
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 space-y-4 mt-2">
        {/* Quest Card — Expanded */}
        <div className="p-4 rounded-xl border border-border/50 bg-card space-y-4">
          {/* Creator */}
          <div className="flex items-center gap-2">
            <UserAvatar user={quest.createdBy} size="sm" />
            <div>
              <span className="text-sm font-bold text-foreground">{quest.createdBy.name}</span>
              <p className="text-[11px] text-muted-foreground">Sidequest Owner</p>
            </div>
          </div>

          {/* Description */}
          {quest.description && (
            <p className="text-sm text-muted-foreground">{quest.description}</p>
          )}

          {/* Links */}
          {quest.links && quest.links.length > 0 && (
            <div className="space-y-1">
              {quest.links.map((link, i) => (
                <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate">
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{link}</span>
                </a>
              ))}
            </div>
          )}

          {/* Photos & Videos */}
          {quest.photos && quest.photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {quest.photos.map((photo, i) => (
                <SidequestPhoto
                  key={i}
                  src={photo}
                  alt={`Quest photo ${i + 1}`}
                  className="w-24 h-24 rounded-xl object-cover shrink-0 border border-border/30"
                />
              ))}
            </div>
          )}

          {/* Participants */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Who's In ({quest.participants.length})</p>
            <div className="flex flex-wrap gap-2">
              {quest.participants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (p.id === currentUser.id) {
                      navigate("/profile");
                    } else {
                      navigate(`/profile?viewUser=${p.id}`);
                    }
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted text-xs hover:bg-muted/80 transition-colors"
                >
                  <UserAvatar user={p} size="xs" />
                  <span className="text-foreground font-medium">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logistics Section */}
        <div className="p-4 rounded-xl border border-border/50 bg-card space-y-3">
          <h3 className="text-sm font-bold text-foreground">Sidequest Details</h3>

          <div className="space-y-2.5">
            {logistics.date && (
              <div className="flex items-center gap-2.5 text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-foreground">{logistics.date}</span>
                {logistics.time && <span className="text-muted-foreground">at {logistics.time}</span>}
              </div>
            )}
            {logistics.location && (
              <div className="flex items-center gap-2.5 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-foreground">{logistics.location}</span>
              </div>
            )}
            {logistics.meetupSpot && (
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground">Meet at: {logistics.meetupSpot}</span>
              </div>
            )}
            {logistics.transportation && TransportIcon && (
              <div className="flex items-center gap-2.5 text-sm">
                <TransportIcon className="w-4 h-4 text-primary" />
                <span className="text-foreground">{transportLabels[logistics.transportation]}</span>
                {logistics.carpoolSlots && logistics.transportation === "car" && (
                  <span className="text-muted-foreground text-xs">({logistics.carpoolSlots} seats available)</span>
                )}
              </div>
            )}
            {logistics.customNotes && (
              <p className="text-xs text-muted-foreground mt-2 p-2.5 rounded-lg bg-muted/50 flex items-start gap-1.5">
                <StickyNote className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {logistics.customNotes}
              </p>
            )}
            {!logistics.date && !logistics.location && !logistics.transportation && !logistics.customNotes && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No details added yet
              </p>
            )}
          </div>
        </div>

        {/* Volunteer Section — only the contribution roles the creator picked (plus Driver if carpool) */}
        {(() => {
          const selectedRoleIds = logistics.contributionRoles || [];
          const isCar = logistics.transportation === "car";
          // Build the offered list: optional driver (when car), then creator-picked roles
          const offeredRoles = volunteerRoles.filter((r) => {
            if (r.id === "driver") return isCar;
            return selectedRoleIds.includes(r.id);
          });
          if (offeredRoles.length === 0 && logistics.volunteers.length === 0) return null;
          const heading = isCar ? "Carpool & Contributions" : "Contributions";
          const availableForMe = offeredRoles;
          return (
            <div className="p-4 rounded-xl border border-border/50 bg-card space-y-3">
              <h3 className="text-sm font-bold text-foreground">{heading}</h3>

              {logistics.volunteers.length > 0 && (
                <div className="space-y-2">
                  {logistics.volunteers.map((v) => (
                    <div key={v.userId} className="flex items-center gap-2 p-2 rounded-xl bg-muted/50">
                      <UserAvatar user={v.user} size="xs" />
                      <span className="text-xs font-medium text-foreground">{v.user.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/20 text-secondary ml-auto">
                        {volunteerRoles.find((r) => r.id === v.role)?.label || v.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {!myVolunteerRole ? (
                availableForMe.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">How can you help?</p>
                    <div className="flex flex-wrap gap-2">
                      {availableForMe.map((role) => (
                        <button
                          key={role.id}
                          onClick={() => volunteerForQuest(quest.id, role.id)}
                          className="px-3 py-1.5 rounded-full bg-muted text-xs text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          {role.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/10">
                  <span className="text-xs text-foreground">
                    You're signed up as {volunteerRoles.find((r) => r.id === myVolunteerRole.role)?.label || myVolunteerRole.role}
                  </span>
                  <button
                    onClick={() => unvolunteerFromQuest(quest.id)}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Comments Section */}
        <div className="p-4 rounded-xl border border-border/50 bg-card space-y-3">
          <h3 className="text-sm font-bold text-foreground">
            Comments {(() => {
              const tally = (list: typeof quest.comments): number =>
                list.reduce((n, c) => n + 1 + (c.replies ? tally(c.replies) : 0), 0);
              const count = tally(quest.comments);
              return count > 0 ? `(${count})` : "";
            })()}
          </h3>
          <CommentThread quest={quest} />
        </div>
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-2xl p-5 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-bold text-foreground mb-1">Delete sidequest?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                "{quest.title}" will be permanently removed for everyone.
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
                    navigate(-1);
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

      <ReportContentModal
        targetType="sidequest"
        targetId={quest.id}
        reportedUserId={quest.createdBy.id}
        open={showReport}
        onOpenChange={setShowReport}
      />
    </div>
  );
};

export default QuestDetail;
