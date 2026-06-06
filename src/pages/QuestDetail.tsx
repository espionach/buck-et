import { useAppStore } from "@/data/appState";
import { QuestVolunteer, isQuestCompleted } from "@/data/mockData";
import { ALL_CONTRIBUTION_ROLES } from "@/data/contributionRoles";
import UserAvatar from "@/components/UserAvatar";
import GroupSwatch from "@/components/GroupSwatch";
import SidequestPhoto from "@/components/SidequestPhoto";
import MediaViewer from "@/components/MediaViewer";
import CommentThread from "@/components/CommentThread";
import MapPreview from "@/components/MapPreview";
import { ArrowLeft, MapPin, Calendar, Clock, Car, Bike, Train, Footprints, Send, ExternalLink, HandMetal, Check, Globe, StickyNote, MoreVertical, Pencil, Pin, Trash2, Flag, Share2, Lock, Info } from "lucide-react";
import NudgeModal from "@/components/NudgeModal";
import EmptyState from "@/components/EmptyState";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePopup } from "@/hooks/use-popup";
import { useAuth } from "@/contexts/AuthContext";
import { useQuests } from "@/hooks/useSupabaseData";
import ReportContentModal from "@/components/ReportContentModal";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
  const location = useLocation();
  const { questId } = useParams<{ questId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { data: hydratedQuests, isLoading: questsLoading, isFetching: questsFetching } = useQuests();
  const { quests, groups, addComment, volunteerForQuest, unvolunteerFromQuest, currentUser, pinQuest, unpinQuest, pinnedQuestIds, deleteQuest, toggleImIn } = useAppStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [prefillNudgeUserId, setPrefillNudgeUserId] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [joinAnim, setJoinAnim] = useState<"idle" | "morph" | "exit" | "done">("idle");
  usePopup(showDeleteConfirm);

  useEffect(() => { window.scrollTo(0, 0); }, [questId]);

  // Auto-open nudge modal with a preselected target (e.g., from a friend's profile)
  useEffect(() => {
    const state = location.state as { prefillNudgeUserId?: string } | null;
    const targetId = state?.prefillNudgeUserId;
    if (!targetId) return;
    const q = (hydratedQuests ?? quests).find((qq) => qq.id === questId);
    if (!q) return;
    if (q.createdBy.id !== currentUser.id) return;
    setPrefillNudgeUserId(targetId);
    setShowNudge(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, hydratedQuests, quests, questId, currentUser.id, navigate]);

  const questList = hydratedQuests ?? quests;
  const quest = questList.find((q) => q.id === questId);
  const [newComment, setNewComment] = useState("");
  const isQuestLookupPending = authLoading || (!!user && !quest && (questsLoading || questsFetching));

  useEffect(() => {
    if (quest && isQuestCompleted(quest)) {
      navigate(-1);
    }
  }, [quest, navigate]);

  if (isQuestLookupPending) {
    return (
      <div className="min-h-screen flex items-center justify-center px-8 text-sm text-muted-foreground">
        Loading sidequest...
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="px-5 pt-14 pb-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center px-8 -mt-12">
          <EmptyState
            icon={Lock}
            title="You don't have access"
            description="This sidequest is private or unavailable."
          />
        </div>
      </div>
    );
  }

  // Once the owner finishes the quest, the detail view is no longer
  // accessible (the quest moves to history).
  if (isQuestCompleted(quest)) return null;
  const isIn = quest.participants.some((p) => p.id === currentUser.id);

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
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground">{quest.title}</h1>
            <p className="text-xs text-muted-foreground">
              {group ? <span className="flex items-center gap-1"><GroupSwatch color={group.color} size={12} />{group.name}</span> : <span className="flex items-center gap-1"><Globe className="w-3 h-3" />Friends</span>}
            </p>
          </div>

          {/* Owner badge / Join / Joined button */}
          {isOwner ? (
            <span
              data-spotlight="quest-join"
              aria-label="You own this sidequest"
              className="shrink-0 flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground cursor-default select-none"
            >
              Owner
            </span>
          ) : (
            (() => {
              const userInGroup = group ? group.members.some((m) => m.id === currentUser.id) : true;
              const canJoin = userInGroup;
              return (
                <button
                  data-spotlight="quest-join"
                  onClick={() => {
                    if (!canJoin) return;
                    toggleImIn(quest.id);
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
              );
            })()
          )}


          {/* Share button (always visible) */}
          <button
            onClick={handleShare}
            className="p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Share sidequest"
          >
            <Share2 className="w-5 h-5" />
          </button>

          {/* Owner actions menu (Edit, Pin, Delete) */}
          {isOwner && (() => {
            const pinned = pinnedQuestIds.includes(quest.id);
            const pinDisabled = !pinned && pinnedQuestIds.length >= 3;
            return (
              <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Sidequest actions"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={4} className="min-w-[160px]">
                  <DropdownMenuItem
                    onSelect={() => navigate(`/quest/${quest.id}/edit`)}
                    className="gap-2 text-xs"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      if (pinned) unpinQuest(quest.id);
                      else pinQuest(quest.id);
                    }}
                    disabled={pinDisabled}
                    className="gap-2 text-xs"
                  >
                    <Pin className="w-3.5 h-3.5" /> {pinned ? "Unpin" : "Pin"}
                    {pinDisabled && <span className="text-[10px] text-muted-foreground ml-auto">Max 3</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setShowDeleteConfirm(true)}
                    className="gap-2 text-xs text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })()}

          {/* Non-owner: Report button */}
          {!isOwner && (
            <button
              onClick={() => setShowReport(true)}
              className="p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Report sidequest"
            >
              <Flag className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <motion.div layout className="px-5 space-y-4 mt-2">
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

          {/* Date / Time / Location — surfaced near the top */}
          {(logistics.date || logistics.location) && (
            <div className="space-y-2">
              {logistics.date && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{logistics.date}</span>
                  {logistics.time && <span className="text-muted-foreground">at {logistics.time}</span>}
                </div>
              )}
              {logistics.location && (
                <div className="flex items-center gap-2.5 text-sm flex-wrap">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-foreground flex-1 min-w-0">{logistics.location}</span>
                  {logistics.latitude != null && logistics.longitude != null && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(logistics.location)}${logistics.placeId ? `&query_place_id=${encodeURIComponent(logistics.placeId)}` : ""}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-muted text-foreground hover:bg-accent transition-colors"
                    >
                      Open in Maps
                    </a>
                  )}
                </div>
              )}
              {logistics.location && logistics.latitude != null && logistics.longitude != null && (
                <MapPreview lat={logistics.latitude} lng={logistics.longitude} />
              )}
              {logistics.meetupSpot && (
                <div className="flex items-start gap-2.5 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Meet at: {logistics.meetupSpot}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {quest.description && (
            <p className="text-sm text-muted-foreground">{quest.description}</p>
          )}

          {/* Photos & Videos */}
          {quest.photos && quest.photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
              {quest.photos.map((photo, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setViewerIndex(i)}
                  className={`${quest.photos!.length === 1 ? "w-full aspect-[4/3]" : "w-64 h-64"} shrink-0 rounded-xl overflow-hidden border border-border/30 focus:outline-none focus:ring-2 focus:ring-ring`}
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
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowNudge(true)}
                className="mt-3 w-full flex items-center justify-between gap-3 p-2.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <HandMetal className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">Send a nudge</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Give friends a friendly poke to join or remember this quest.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-primary shrink-0">Nudge →</span>
              </button>
            )}
            {!isOwner && (
              <p className="mt-3 text-[11px] text-muted-foreground italic">
                Only {quest.createdBy.name.split(" ")[0]} can nudge people about this sidequest.
              </p>
            )}
          </div>
        </div>
        <NudgeModal
          open={showNudge}
          onClose={() => { setShowNudge(false); setPrefillNudgeUserId(null); }}
          quest={quest}
          initialSelectedUserId={prefillNudgeUserId}
        />


        {/* Logistics Section */}
        <div className="p-4 rounded-xl border border-border/50 bg-card space-y-3">
          <h3 className="text-sm font-bold text-foreground">Sidequest Details</h3>

          <div className="space-y-2.5">
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
              isOwner ? (
                <EmptyState
                  icon={Info}
                  title="No details yet"
                  description="Add a time, place, or anything people should know."
                  size="sm"
                />
              ) : (
                <EmptyState
                  icon={Info}
                  title="No details yet"
                  size="sm"
                />
              )
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
