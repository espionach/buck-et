import { useAppStore } from "@/data/appState";
import { QuestVolunteer, isQuestCompleted } from "@/data/mockData";
import { ALL_CONTRIBUTION_ROLES } from "@/data/contributionRoles";
import UserAvatar from "@/components/UserAvatar";
import GroupSwatch from "@/components/GroupSwatch";
import SidequestPhoto from "@/components/SidequestPhoto";
import MediaViewer from "@/components/MediaViewer";
import CommentThread from "@/components/CommentThread";
import MapPreview from "@/components/MapPreview";
import { ArrowLeft, ChevronLeft, ChevronRight, MapPin, Calendar, Clock, Car, Bike, Train, Footprints, Send, ExternalLink, HandMetal, Check, Globe, StickyNote, MoreVertical, Pencil, Pin, Trash2, Flag, Share2, Lock, Info, Plus, ImagePlus } from "lucide-react";
import { uploadSidequestPhotos } from "@/lib/uploads";
import NudgeModal from "@/components/NudgeModal";
import EmptyState from "@/components/EmptyState";
import QuestDetailPreview from "@/components/QuestDetailPreview";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const fromOnboarding = searchParams.get("fromOnboarding") === "1";
  const swipeHint = searchParams.get("swipeHint") === "1";
  const { questId } = useParams<{ questId: string }>();
  const handleBack = () => {
    if (fromOnboarding) navigate("/", { replace: true });
    else navigate(-1);
  };
  const { user, loading: authLoading } = useAuth();
  const { data: hydratedQuests, isLoading: questsLoading, isFetching: questsFetching } = useQuests();
  const { quests, groups, addComment, volunteerForQuest, unvolunteerFromQuest, currentUser, pinQuest, unpinQuest, pinnedQuestIds, deleteQuest, toggleImIn, updateQuest } = useAppStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [prefillNudgeUserId, setPrefillNudgeUserId] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [joinAnim, setJoinAnim] = useState<"idle" | "morph" | "exit" | "done">("idle");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const completedFileInputRef = useRef<HTMLInputElement>(null);
  usePopup(showDeleteConfirm);

  // Sibling sidequests from the originating list — used for left/right swipe nav.
  const [siblingIds, setSiblingIds] = useState<string[]>(() => {
    const s = (location.state as any)?.siblingIds;
    return Array.isArray(s) ? s : [];
  });
  useEffect(() => {
    const s = (location.state as any)?.siblingIds;
    if (Array.isArray(s) && s.length) setSiblingIds(s);
  }, [location.state]);

  // Direction of the most recent sibling navigation: +1 = swiped to next, -1 = swiped to prev.
  // Used to drive the page slide animation between sidequests.
  const [swipeDir, setSwipeDir] = useState(0);
  // When commit comes from a drag, the incoming page should mount where the
  // neighbor preview already was on screen, then smoothly animate to 0.
  // dragHandoff is the screen-x offset (in px) the new page should start at;
  // null means a normal (non-drag) navigation.
  const [dragHandoff, setDragHandoff] = useState<number | null>(null);
  // The questId that previews are currently being shown for. Previews only
  // render on the motion.div whose key matches this — preventing the exiting
  // page (during AnimatePresence) from accidentally picking up the new
  // page's neighbors and flashing a "quest after that" preview.
  const [previewsForQuestId, setPreviewsForQuestId] = useState<string | null>(null);
  const previewHideTimer = useRef<number | null>(null);

  const hideSwipePreviews = (delay = 0) => {
    if (previewHideTimer.current !== null) window.clearTimeout(previewHideTimer.current);
    if (delay === 0) {
      setPreviewsForQuestId(null);
      previewHideTimer.current = null;
      return;
    }
    previewHideTimer.current = window.setTimeout(() => {
      setPreviewsForQuestId(null);
      previewHideTimer.current = null;
    }, delay);
  };

  const revealSwipePreviews = () => {
    if (previewHideTimer.current !== null) window.clearTimeout(previewHideTimer.current);
    previewHideTimer.current = null;
    if (questId) setPreviewsForQuestId(questId);
  };


  const siblingIdx = questId ? siblingIds.indexOf(questId) : -1;
  const hasPrev = siblingIdx > 0;
  const hasNext = siblingIdx >= 0 && siblingIdx < siblingIds.length - 1;

  const goToSibling = (dir: 1 | -1, handoffPx: number | null = null) => {
    if (!questId || siblingIds.length < 2) return;
    const idx = siblingIds.indexOf(questId);
    if (idx === -1) return;
    const target = siblingIds[idx + dir];
    if (!target) return;
    setSwipeDir(dir);
    setDragHandoff(handoffPx);
    navigate(`/quest/${target}`, { replace: true, state: { siblingIds } });
  };

  useEffect(() => { window.scrollTo(0, 0); }, [questId]);
  // Reset the drag-handoff after the new page mounts so subsequent
  // chevron/button navigations get their normal slide-in animation.
  useEffect(() => {
    if (dragHandoff === null) return;
    const t = setTimeout(() => setDragHandoff(null), 450);
    return () => clearTimeout(t);
  }, [questId, dragHandoff]);
  useEffect(() => {
    return () => {
      if (previewHideTimer.current !== null) window.clearTimeout(previewHideTimer.current);
    };
  }, []);

  // Auto-open nudge modal with a preselected target (e.g., from a friend's profile)
  useEffect(() => {
    const state = location.state as { prefillNudgeUserId?: string; siblingIds?: string[] } | null;
    const targetId = state?.prefillNudgeUserId;
    if (!targetId) return;
    const q = (hydratedQuests ?? quests).find((qq) => qq.id === questId);
    if (!q) return;
    if (q.createdBy.id !== currentUser.id) return;
    setPrefillNudgeUserId(targetId);
    setShowNudge(true);
    navigate(location.pathname, { replace: true, state: { siblingIds: state?.siblingIds ?? siblingIds } });
  }, [location.state, location.pathname, hydratedQuests, quests, questId, currentUser.id, navigate, siblingIds]);

  const questList = hydratedQuests ?? quests;
  const quest = questList.find((q) => q.id === questId);
  const [newComment, setNewComment] = useState("");
  const isQuestLookupPending = authLoading || (!!user && !quest && (questsLoading || questsFetching));

  // Completed quests now render their own read-only detail view below
  // instead of redirecting away.


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

  const isFinished = isQuestCompleted(quest);
  const wasJoinedWhenFinished = quest.completedByUserIds?.includes(currentUser.id);
  const isIn = quest.participants.some((p) => p.id === currentUser.id);

  const group = quest.groupId ? groups.find((g) => g.id === quest.groupId) : null;
  const isOwner = quest.createdBy.id === currentUser.id;
  const logistics = quest.logistics || { volunteers: [] };
  const TransportIcon = logistics.transportation ? transportIcons[logistics.transportation] : null;

  const myVolunteerRole = logistics.volunteers.find((v) => v.userId === currentUser.id);

  // Neighboring sidequests for swipe-preview peeking.
  const prevQuest = hasPrev ? questList.find((q) => q.id === siblingIds[siblingIdx - 1]) : null;
  const nextQuest = hasNext ? questList.find((q) => q.id === siblingIds[siblingIdx + 1]) : null;


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
  const canAddCompletedMedia = isFinished && (isOwner || wasJoinedWhenFinished);
  const canAddActiveMedia = !isFinished && (isOwner || isIn);
  const handleCompletedMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (!files.length) return;
    setUploadingMedia(true);
    try {
      const paths = await uploadSidequestPhotos(quest.id, files);
      updateQuest(quest.id, { photos: [...(quest.photos ?? []), ...paths] });
      toast.success(paths.length > 1 ? "Photos added" : "Photo added");
    } catch (err: any) {
      toast.error(err?.message || "Couldn't upload. Try again?");
    } finally {
      setUploadingMedia(false);
    }
  };


  return (
    <div className="min-h-screen pb-28 relative overflow-x-hidden">
      {/* Edge swipe chevrons — only when siblings exist */}
      {(hasPrev || hasNext) && (
        <>
          {hasPrev && (
            <button
              onClick={() => goToSibling(-1)}
              aria-label="Previous sidequest"
              className="fixed left-1 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-card/80 backdrop-blur border border-border/50 text-muted-foreground hover:text-foreground active:scale-95 transition-all shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {hasNext && (
            <button
              onClick={() => goToSibling(1)}
              data-spotlight="quest-swipe-arrow"
              aria-label="Next sidequest"
              className="fixed right-1 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-card/80 backdrop-blur border border-border/50 text-muted-foreground hover:text-foreground active:scale-95 transition-all shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </>
      )}

      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={questId}
          initial={
            dragHandoff !== null
              ? { x: dragHandoff, opacity: 1 }
              : { x: swipeDir > 0 ? "100%" : swipeDir < 0 ? "-100%" : 0, opacity: swipeDir === 0 ? 1 : 0.6 }
          }
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: swipeDir > 0 ? "-100%" : "100%", opacity: 1 }}
          transition={{ type: "tween", duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          drag={dragHandoff === null && siblingIds.length > 1 ? "x" : false}
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.9}
          dragTransition={{ bounceStiffness: 400, bounceDamping: 40, power: 0 }}
          dragMomentum={false}
          onDragStart={() => {
            if (dragHandoff === null) revealSwipePreviews();
          }}
          onDragEnd={(_, info) => {
            // Distance-based — must drag more than ~60% of the screen to commit.
            const w = typeof window !== "undefined" ? window.innerWidth : 400;
            const distanceThreshold = w * 0.6;
            if (Math.abs(info.offset.x) <= distanceThreshold) {
              hideSwipePreviews(450);
              return;
            }
            if (Math.abs(info.offset.x) < Math.abs(info.offset.y)) {
              hideSwipePreviews(450);
              return;
            }
            const dir: 1 | -1 = info.offset.x < 0 ? 1 : -1;
            if (dir === 1 && !hasNext) {
              hideSwipePreviews(450);
              return;
            }
            if (dir === -1 && !hasPrev) {
              hideSwipePreviews(450);
              return;
            }
            // Hand off: the incoming page should start where its preview already is.
            // Preview sits at ±w in local space; with current drag offset info.offset.x,
            // it appears on screen at (dir === 1 ? w + info.offset.x : -w + info.offset.x).
            const rawHandoff = dir === 1 ? w + info.offset.x : -w + info.offset.x;
            const handoff = dir === 1
              ? Math.max(0, Math.min(w, rawHandoff))
              : Math.min(0, Math.max(-w, rawHandoff));
            hideSwipePreviews();
            goToSibling(dir, handoff);
          }}
          className="relative"
        >
          {/* Off-screen previews of neighboring sidequests — visible while dragging. */}
          {previewsForQuestId === questId && prevQuest && (
            <div className="absolute inset-y-0 right-full w-full" aria-hidden>
              <QuestDetailPreview quest={prevQuest} />
            </div>
          )}
          {previewsForQuestId === questId && nextQuest && (
            <div className="absolute inset-y-0 left-full w-full" aria-hidden>
              <QuestDetailPreview quest={nextQuest} />
            </div>
          )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg px-5 pt-14 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} data-spotlight="quest-back" className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0" data-spotlight="quest-header-title">
            <h1 className="text-lg font-bold text-foreground">{quest.title}</h1>
            <p className="text-xs text-muted-foreground">
              {group ? <span className="flex items-center gap-1"><GroupSwatch color={group.color} size={12} />{group.name}</span> : <span className="flex items-center gap-1"><Globe className="w-3 h-3" />Friends</span>}
            </p>
          </div>

          {/* Owner badge / Join / Joined button — hidden once the quest is finished */}
          {!isFinished && (isOwner ? (
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
                  data-spotlight="quest-join-friend"
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
          ))}
          {isFinished && (
            <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold">
              Completed
            </span>
          )}


          {/* Overflow menu — Share for everyone, plus owner actions or Report */}
          {(() => {
            const pinned = isOwner ? pinnedQuestIds.includes(quest.id) : false;
            const pinDisabled = isOwner && !pinned && pinnedQuestIds.length >= 3;
            return (
              <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
                <DropdownMenuTrigger asChild>
                  <button
                    data-spotlight={isOwner ? "quest-share" : undefined}
                    className="p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Sidequest actions"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={4} className="min-w-[160px]">
                  <DropdownMenuItem onSelect={handleShare} className="gap-2 text-xs">
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </DropdownMenuItem>
                  {isOwner && !isFinished && (
                    <DropdownMenuItem
                      onSelect={() => navigate(`/quest/${quest.id}/edit`)}
                      className="gap-2 text-xs"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </DropdownMenuItem>
                  )}
                  {isOwner && !isFinished && (
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
                  )}
                  {isOwner && (
                    <DropdownMenuItem
                      onSelect={() => setShowDeleteConfirm(true)}
                      className="gap-2 text-xs text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </DropdownMenuItem>
                  )}
                  {!isOwner && (
                    <DropdownMenuItem
                      onSelect={() => setShowReport(true)}
                      className="gap-2 text-xs text-destructive focus:text-destructive"
                    >
                      <Flag className="w-3.5 h-3.5" /> Report
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })()}
        </div>
      </div>


      {isFinished ? (
        <motion.div layout className="px-5 mt-2">

          {/* Completed banner / meta */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pb-1">
            <Check className="w-3.5 h-3.5 text-secondary" />
            <span>Completed{quest.completedAt ? ` ${quest.completedAt}` : ""}</span>
          </div>


          {/* Photos & Videos — primary content for completed quests */}
          <section className="py-5 border-t border-border/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Photos & Videos</h3>

              {canAddCompletedMedia && (
                <>
                  <input
                    ref={completedFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleCompletedMediaUpload}
                  />
                  <button
                    type="button"
                    onClick={() => completedFileInputRef.current?.click()}
                    disabled={uploadingMedia}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold disabled:opacity-60"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    {uploadingMedia ? "Uploading…" : "Add"}
                  </button>
                </>
              )}
            </div>
            {quest.photos && quest.photos.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">

                {quest.photos.map((photo, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setViewerIndex(i)}
                    className={`${quest.photos!.length === 1 ? "w-full aspect-[4/3]" : "w-64 h-64"} shrink-0 rounded-xl overflow-hidden border border-border/30 focus:outline-none focus:ring-2 focus:ring-ring`}
                    aria-label={`Open photo ${i + 1}`}
                  >
                    <SidequestPhoto src={photo} alt={`Quest photo ${i + 1}`} thumbnail className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ImagePlus}
                title="No photos yet"
                description={canAddCompletedMedia ? "Add photos or videos from the day." : "No one's added photos for this sidequest yet."}
                size="sm"
              />
            )}
            {quest.photos && quest.photos.length > 0 && viewerIndex !== null && (
              <MediaViewer
                sources={quest.photos}
                startIndex={viewerIndex}
                open={viewerIndex !== null}
                onOpenChange={(o) => !o && setViewerIndex(null)}
              />
            )}
          </section>

          {/* Comments */}
          <section className="py-5 border-t border-border/40 space-y-3">
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Comments {(() => {

                const tally = (list: typeof quest.comments): number =>
                  list.reduce((n, c) => n + 1 + (c.replies ? tally(c.replies) : 0), 0);
                const count = tally(quest.comments);
                return count > 0 ? `(${count})` : "";
              })()}
            </h3>
            <CommentThread quest={quest} />
          </section>

          {/* Quest details (moved to bottom, past tense, read-only) */}
          <section className="py-5 border-t border-border/40 space-y-4">
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Sidequest details</h3>


            {/* Creator */}
            <div className="flex items-center gap-2">
              <UserAvatar user={quest.createdBy} size="sm" />
              <div>
                <span className="text-sm font-bold text-foreground">{quest.createdBy.name}</span>
                <p className="text-[11px] text-muted-foreground">Hosted this sidequest</p>
              </div>
            </div>

            {quest.description && (
              <p className="text-sm text-muted-foreground">{quest.description}</p>
            )}

            {(logistics.date || logistics.location || logistics.transportation || logistics.customNotes) && (
              <div className="space-y-2.5">
                {logistics.date && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{logistics.date}</span>
                    {logistics.time && <span className="text-muted-foreground">at {logistics.time}</span>}
                  </div>
                )}
                {logistics.location && (
                  <div className="flex items-center gap-2.5 text-sm flex-wrap">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground flex-1 min-w-0">{logistics.location}</span>
                  </div>
                )}
                {logistics.transportation && TransportIcon && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <TransportIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{transportLabels[logistics.transportation]}</span>
                  </div>
                )}
                {logistics.customNotes && (
                  <p className="text-xs text-muted-foreground p-2.5 rounded-lg bg-muted/50 flex items-start gap-1.5">
                    <StickyNote className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {logistics.customNotes}
                  </p>
                )}
              </div>
            )}

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

            {/* Who went */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">Who went ({quest.participants.length})</p>
              <div className="flex flex-wrap gap-2">
                {quest.participants.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (p.id === currentUser.id) navigate("/profile");
                      else navigate(`/profile?viewUser=${p.id}`);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted text-xs hover:bg-muted/80 transition-colors"
                  >
                    <UserAvatar user={p} size="xs" />
                    <span className="text-foreground font-medium">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Who helped (read-only volunteers) */}
            {logistics.volunteers.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Who helped</p>
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
              </div>
            )}
          </section>

        </motion.div>
      ) : (
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

          {/* Photos & Videos moved to its own boxed section below Sidequest Details */}

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
                data-spotlight="quest-nudge"
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

        {/* Photos & Videos Section */}
        {(quest.photos && quest.photos.length > 0) || canAddActiveMedia ? (
          <div className="p-4 rounded-xl border border-border/50 bg-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Photos & Videos</h3>
              {canAddActiveMedia && (
                <>
                  <input
                    ref={completedFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleCompletedMediaUpload}
                  />
                  <button
                    type="button"
                    onClick={() => completedFileInputRef.current?.click()}
                    disabled={uploadingMedia}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold disabled:opacity-60"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    {uploadingMedia ? "Uploading…" : "Add"}
                  </button>
                </>
              )}
            </div>
            {quest.photos && quest.photos.length > 0 ? (
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
            ) : (
              <EmptyState
                icon={ImagePlus}
                title="No photos yet"
                description={canAddActiveMedia ? "Add photos or videos to share with your group." : "No one's added photos for this sidequest yet."}
                size="sm"
              />
            )}
            {quest.photos && quest.photos.length > 0 && viewerIndex !== null && (
              <MediaViewer
                sources={quest.photos}
                startIndex={viewerIndex}
                open={viewerIndex !== null}
                onOpenChange={(o) => !o && setViewerIndex(null)}
              />
            )}
          </div>
        ) : null}


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
      )}
        </motion.div>
      </AnimatePresence>

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
