import { useAppStore } from "@/data/appState";
import QuestList from "@/components/QuestList";
import MyGroupsTab from "@/components/MyGroupsTab";
import UserAvatar from "@/components/UserAvatar";
import { Edit, X, Check, Users as UsersIcon, UserPlus, Trash2, ImagePlus, Camera, Link as LinkIcon, Plus, ArrowLeft, Map, ScrollText, Pin, Settings as SettingsIcon, User as UserIcon, Globe, ChevronDown, Share2, Sparkles, CheckCircle2, Clock, Zap, Flag, Users2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { ALL_CONTRIBUTION_ROLES } from "@/data/contributionRoles";
import GroupSwatch from "@/components/GroupSwatch";
import { TimePicker } from "@/components/TimePicker";
import UserProfileView from "@/components/UserProfileView";
import NotificationBell from "@/components/NotificationBell";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quest, User, isQuestCompleted } from "@/data/mockData";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { usePopup } from "@/hooks/use-popup";
import { uploadAvatar, uploadSidequestPhotos } from "@/lib/uploads";
import SidequestPhoto from "@/components/SidequestPhoto";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFriendlyError } from "@/lib/errorMapping";
import { validateContent } from "@/lib/contentFilter";
import LocationPicker, { LocationValue } from "@/components/LocationPicker";
import { listDrafts } from "@/lib/drafts";
import { FileText, ChevronRight } from "lucide-react";
import BackToTopButton from "@/components/BackToTopButton";
const Profile = () => {
  const {
    currentUser,
    quests,
    friends: friendsList,
    friendRequests,
    acceptFriendRequest,
    declineFriendRequest,
    updateProfile,
    updateQuest,
    deleteQuest,
    removeParticipant,
    cleanupEmptyQuests,
    setHideGlobalFab,
    pinnedQuestIds,
    groups,
  } = useAppStore();
  const { user: authUser } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const justAddedQuestId = (location.state as any)?.justAddedQuestId as string | undefined;
  const initialTab = (() => {
    const t = new URLSearchParams(location.search).get("tab");
    if (t === "past") return "past" as const;
    if (t === "groups") return "groups" as const;
    return "current" as const;
  })();
  const [tab, setTab] = useState<"current" | "past" | "groups">(initialTab);
  // Clear navigation state so refresh doesn't re-trigger
  useEffect(() => {
    if (justAddedQuestId) {
      nav(location.pathname + location.search, { replace: true, state: {} });
    }
  }, []);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editUsername, setEditUsername] = useState(currentUser.username || "");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [editBio, setEditBio] = useState(currentUser.bio);
  const [showFriends, setShowFriends] = useState(false);
  
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [viewingUserTab, setViewingUserTab] = useState<"current" | "past">("current");
  const [snapshotQuestIds, setSnapshotQuestIds] = useState<string[]>([]);
  // Profile picture upload
  const profilePicRef = useRef<HTMLInputElement>(null);
  const [editProfilePic, setEditProfilePic] = useState(currentUser.profilePicture || "");
  const [showPicMenu, setShowPicMenu] = useState(false);

  // Current quest editing state
  const [editingCurrentQuest, setEditingCurrentQuest] = useState<Quest | null>(null);
  const [editQuestTitle, setEditQuestTitle] = useState("");
  const [editQuestDescription, setEditQuestDescription] = useState("");
  const [editQuestParticipants, setEditQuestParticipants] = useState<User[]>([]);
  const [editQuestLinks, setEditQuestLinks] = useState<string[]>([]);
  const [editQuestPhotos, setEditQuestPhotos] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");
  const currentPhotoRef = useRef<HTMLInputElement>(null);

  // Logistics editing state
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editLocationLat, setEditLocationLat] = useState<number | undefined>(undefined);
  const [editLocationLng, setEditLocationLng] = useState<number | undefined>(undefined);
  const [editLocationPlaceId, setEditLocationPlaceId] = useState<string | undefined>(undefined);
  const [editMeetupSpot, setEditMeetupSpot] = useState("");
  const [editTransportation, setEditTransportation] = useState("");
  const [editCarpoolSlots, setEditCarpoolSlots] = useState("");
  const [editCustomNotes, setEditCustomNotes] = useState("");
  const [editContributionRoles, setEditContributionRoles] = useState<string[]>([]);

  // Quest type (Friends Only vs Group) editing state
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [showEditGroupDropdown, setShowEditGroupDropdown] = useState(false);

  // Past quest editing state
  const [editingPastQuest, setEditingPastQuest] = useState<Quest | null>(null);
  const [questNotes, setQuestNotes] = useState("");
  const [questPhotos, setQuestPhotos] = useState<string[]>([]);
  const [questCompletedAt, setQuestCompletedAt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteQuestConfirm, setShowDeleteQuestConfirm] = useState(false);
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);

  // Sync tab from URL params
  useEffect(() => {
    const urlTab = new URLSearchParams(location.search).get("tab");
    if (urlTab === "past") setTab("past");
    else if (urlTab === "current") setTab("current");
    else if (urlTab === "groups") setTab("groups");
  }, [location.search]);

  // Handle viewUser query param from QuestDetail
  useEffect(() => {
    const viewUserId = searchParams.get("viewUser");
    if (viewUserId && viewUserId !== currentUser.id) {
      const allUsers = useAppStore.getState().allUsers;
      const found = allUsers.find((u) => u.id === viewUserId);
      if (found) {
        setViewingUser(found);
        // Clean up the param
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("viewUser");
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [searchParams]);

  // Track sidequest detail page to return to when editor was opened from QuestDetail
  const [returnToQuestId, setReturnToQuestId] = useState<string | null>(null);

  // Handle editQuest query param (legacy deep-link) — redirect to the new Edit page.
  useEffect(() => {
    const editQuestId = searchParams.get("editQuest");
    if (!editQuestId) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("editQuest");
    setSearchParams(newParams, { replace: true });
    nav(`/quest/${editQuestId}/edit`);
  }, [searchParams]);

  // Close the current-quest editor and, if we came from QuestDetail, navigate back there
  const closeCurrentEditor = () => {
    setEditingCurrentQuest(null);
    if (returnToQuestId) {
      const targetId = returnToQuestId;
      setReturnToQuestId(null);
      nav(`/quest/${targetId}`, { replace: true });
    }
  };

  // Cleanup empty quests on mount
  useEffect(() => {
    cleanupEmptyQuests();
  }, [location.pathname]);

  // Hide global FAB during editing modes
  useEffect(() => {
    setHideGlobalFab(showEditProfile || !!editingCurrentQuest || !!editingPastQuest);
    return () => setHideGlobalFab(false);
  }, [showEditProfile, editingCurrentQuest, editingPastQuest]);

  const myQuests = quests.filter(
    (q) =>
      q.createdBy.id === currentUser.id ||
      q.participants.some((p) => p.id === currentUser.id) ||
      snapshotQuestIds.includes(q.id)
  );

  const currentAll = myQuests
    .filter((q) => !isQuestCompleted(q));

  const datedQuests = currentAll
    .filter((q) => q.logistics?.date)
    .sort((a, b) => new Date(a.logistics!.date!).getTime() - new Date(b.logistics!.date!).getTime());

  const undatedQuests = currentAll
    .filter((q) => !q.logistics?.date)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const current = [...datedQuests, ...undatedQuests];

  // Snapshot current quest IDs so unjoined quests stay visible until navigation
  useEffect(() => {
    const currentIds = quests
      .filter(
        (q) =>
          !isQuestCompleted(q) &&
          (q.createdBy.id === currentUser.id ||
            q.participants.some((p) => p.id === currentUser.id))
      )
      .map((q) => q.id);
    setSnapshotQuestIds(currentIds);
  }, [location.pathname]);

  const past = myQuests
    .filter((q) => isQuestCompleted(q))
    .sort((a, b) => {
      const aDate = a.completedAt || a.createdAt;
      const bDate = b.completedAt || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  const active = tab === "current" ? current : tab === "past" ? past : [];

  // Local-only drafts count — refresh on mount + when location changes (e.g. returning from /drafts or /create)
  const [draftCount, setDraftCount] = useState(0);
  useEffect(() => {
    if (!currentUser?.id) return;
    setDraftCount(listDrafts(currentUser.id).length);
  }, [currentUser?.id, location.key]);

  const handleSaveProfile = async () => {
    const trimmedUsername = editUsername.trim();
    setUsernameError(null);

    const violation = validateContent(editName, editBio, trimmedUsername);
    if (violation) {
      toast.error(violation);
      return;
    }

    if (trimmedUsername && trimmedUsername !== (currentUser.username || "")) {
      // Validate format
      if (!/^[a-zA-Z0-9_]{2,30}$/.test(trimmedUsername)) {
        setUsernameError("Use 2–30 letters, numbers, or underscores.");
        return;
      }
      // Uniqueness check (case-insensitive)
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: existing } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("username", trimmedUsername)
        .neq("user_id", currentUser.id)
        .maybeSingle();
      if (existing) {
        setUsernameError("That username's already taken.");
        return;
      }
    }

    updateProfile({
      name: editName.trim(),
      username: trimmedUsername || currentUser.username,
      bio: editBio.trim(),
      profilePicture: editProfilePic || undefined,
    });
    setShowEditProfile(false);
  };

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!authUser?.id) {
      toast.error("Still signing you in. Try again in a moment.");
      return;
    }
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(authUser.id, file);
      setEditProfilePic(url);
    } catch (err: any) {
      console.error("[Profile.uploadAvatar]", err);
      toast.error(getUserFriendlyError("profile picture", err?.message || ""));
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Current quest editor now lives on its own page — navigate there.
  const handleOpenCurrentEditor = (quest: Quest) => {
    nav(`/quest/${quest.id}/edit`);
  };

  const handleSaveCurrentQuest = () => {
    if (editingCurrentQuest) {
      const violation = validateContent(editQuestTitle, editQuestDescription, editCustomNotes, ...editQuestLinks);
      if (violation) {
        toast.error(violation);
        return;
      }
      const removedUsers = editingCurrentQuest.participants.filter(
        (p) => !editQuestParticipants.some((ep) => ep.id === p.id)
      );
      removedUsers.forEach((u) => removeParticipant(editingCurrentQuest.id, u.id));

      const hasLogistics = editDate || editTime || editLocation || editMeetupSpot || editTransportation || editCustomNotes || editContributionRoles.length > 0;
      updateQuest(editingCurrentQuest.id, {
        title: editQuestTitle.trim(),
        description: editQuestDescription.trim() || undefined,
        links: editQuestLinks.length > 0 ? editQuestLinks : undefined,
        photos: editQuestPhotos.length > 0 ? editQuestPhotos : undefined,
        groupId: editGroupId || undefined,
        isFollowerOnly: !editGroupId,
        logistics: hasLogistics ? {
          ...(editingCurrentQuest.logistics || {}),
          date: editDate || undefined,
          time: editTime || undefined,
          location: editLocation || undefined,
          latitude: editLocationLat,
          longitude: editLocationLng,
          placeId: editLocationPlaceId,
          meetupSpot: editMeetupSpot || undefined,
          transportation: (editTransportation as any) || undefined,
          carpoolSlots: editCarpoolSlots ? parseInt(editCarpoolSlots) : undefined,
          volunteers: editingCurrentQuest.logistics?.volunteers || [],
          customNotes: editCustomNotes || undefined,
          contributionRoles: editContributionRoles.length > 0 ? editContributionRoles : undefined,
        } : undefined,
      });
      closeCurrentEditor();
    }
  };

  const [confirmRemoveUser, setConfirmRemoveUser] = useState<{ userId: string; userName: string; context: string } | null>(null);
  usePopup(showFriends || !!confirmRemoveUser || !!editingCurrentQuest || !!editingPastQuest);

  const handleRemoveParticipantFromEditor = (userId: string) => {
    const user = editQuestParticipants.find((p) => p.id === userId);
    setConfirmRemoveUser({
      userId,
      userName: user?.name || "this user",
      context: editingCurrentQuest?.title || "this quest",
    });
  };

  const confirmRemoveParticipant = () => {
    if (confirmRemoveUser) {
      setEditQuestParticipants((prev) => prev.filter((p) => p.id !== confirmRemoveUser.userId));
      setConfirmRemoveUser(null);
    }
  };

  const handleDeleteQuest = () => {
    setShowDeleteQuestConfirm(true);
  };

  const confirmDeleteQuest = () => {
    if (editingCurrentQuest) {
      const targetQuestId = editingCurrentQuest.id;
      deleteQuest(targetQuestId);
      setShowDeleteQuestConfirm(false);
      // Clear return target — the quest is gone, fall back to profile
      setReturnToQuestId(null);
      setEditingCurrentQuest(null);
    }
  };

  // Past quest handlers
  const handleOpenPastEditor = (quest: Quest) => {
    setEditingPastQuest(quest);
    setQuestNotes(quest.notes || "");
    setQuestPhotos(quest.photos || []);
    setQuestCompletedAt(quest.completedAt || "");
  };

  const handleSavePastQuest = () => {
    if (editingPastQuest) {
      updateQuest(editingPastQuest.id, {
        notes: questNotes.trim() || undefined,
        photos: questPhotos.length > 0 ? questPhotos : undefined,
        completedAt: questCompletedAt || undefined,
      });
      setEditingPastQuest(null);
    }
  };

  const handleAddLink = () => {
    if (!newLink.trim()) return;
    setEditQuestLinks((prev) => [...prev, newLink.trim()]);
    setNewLink("");
  };

  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const handleCurrentPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (!files.length || !editingCurrentQuest) return;
    setUploadingPhotos(true);
    try {
      const paths = await uploadSidequestPhotos(editingCurrentQuest.id, files);
      setEditQuestPhotos((prev) => [...prev, ...paths]);
    } catch (err: any) {
      toast.error(err?.message || "Couldn't upload photos. Try again?");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (!files.length || !editingPastQuest) return;
    setUploadingPhotos(true);
    try {
      const paths = await uploadSidequestPhotos(editingPastQuest.id, files);
      setQuestPhotos((prev) => [...prev, ...paths]);
    } catch (err: any) {
      toast.error(err?.message || "Couldn't upload photos. Try again?");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removePhoto = (index: number) => {
    setQuestPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Viewing another user's profile from friends list
  const isFriendUser = (user: User) => friendsList.some((f) => f.id === user.id);

  if (viewingUser) {
    return (
      <UserProfileView
        user={viewingUser}
        backLabel="Back to Profile"
        onBack={() => { setViewingUser(null); setViewingUserTab("current"); }}
        onViewProfile={(user) => { setViewingUser(user); setViewingUserTab("current"); }}
      />
    );
  }

  // Edit profile full-page view
  if (showEditProfile) {
    return (
      <div className="min-h-screen pb-32 px-5 pt-14">
        <button
          onClick={() => setShowEditProfile(false)}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-xl font-bold text-foreground mb-6">Edit Profile</h1>

        <div className="space-y-4">
          {/* Profile picture */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {editProfilePic ? (
                <img src={editProfilePic} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center" aria-label="Profile picture">
                  <UserIcon className="w-10 h-10 text-muted-foreground" strokeWidth={1.75} />
                </div>
              )}
              <button
                onClick={() => setShowPicMenu(true)}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground disabled:opacity-60"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={profilePicRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePicUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {uploadingAvatar ? "Uploading…" : "Tap camera to update photo"}
            </p>
          </div>

          {/* Photo action sheet */}
          <AnimatePresence>
            {showPicMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-foreground/30 z-40"
                  onClick={() => setShowPicMenu(false)}
                />
                <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="pointer-events-auto w-full max-w-[280px] bg-card border border-border/50 rounded-2xl shadow-sm p-2 shadow-xl"
                >
                  <button
                    onClick={() => {
                      setShowPicMenu(false);
                      profilePicRef.current?.click();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted text-left"
                  >
                    <ImagePlus className="w-5 h-5 text-foreground" />
                    <span className="text-sm font-semibold text-foreground">Upload a picture</span>
                  </button>
                  {editProfilePic && (
                    <button
                      onClick={() => {
                        setEditProfilePic("");
                        setShowPicMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted text-left"
                    >
                      <Trash2 className="w-5 h-5 text-destructive" />
                      <span className="text-sm font-semibold text-destructive">Remove current picture</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowPicMenu(false)}
                    className="w-full px-3 py-2.5 mt-1 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>

          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Name</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Name"
              className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">@</span>
              <input
                value={editUsername}
                onChange={(e) => {
                  setEditUsername(e.target.value.replace(/\s/g, ""));
                  setUsernameError(null);
                }}
                placeholder="username"
                className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {usernameError ? (
              <p className="text-xs text-destructive mt-1">{usernameError}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Letters, numbers, underscores. Must be unique.</p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Bio</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Bio"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowEditProfile(false)}
              className="px-5 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 px-5 pt-14">
      <BackToTopButton watchSelector="[data-profile-tabs]" />
      {/* Top right — Notifications & Settings */}
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <NotificationBell />
        <button
          onClick={() => nav("/settings")}
          aria-label="Settings"
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col items-center mb-6">
        <UserAvatar user={currentUser} size="xl" />
        <h1 className="text-xl font-bold text-foreground mt-3">{currentUser.name}</h1>
        {currentUser.username && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">@{currentUser.username}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1 text-center">{currentUser.bio}</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <button
            onClick={() => setShowFriends(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
          >
            <UsersIcon className="w-4 h-4" />
            {friendsList.length} Friends
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => {
              setEditName(currentUser.name);
              setEditUsername(currentUser.username || "");
              setUsernameError(null);
              setEditBio(currentUser.bio);
              setEditProfilePic(currentUser.profilePicture || "");
              setShowEditProfile(true);
            }}
            className="px-2.5 py-0 h-6 rounded-md bg-muted text-muted-foreground text-xs font-medium flex items-center gap-1"
          >
            <Edit className="w-3 h-3" />
            Edit
          </button>
          {currentUser.username && (
            <button
              onClick={async () => {
                const url = `${window.location.origin}/u/${currentUser.username}`;
                try {
                  await navigator.clipboard.writeText(url);
                  toast.success("Profile link copied!");
                } catch {
                  toast.error("Couldn't copy link.");
                }
              }}
              aria-label="Copy profile link"
              className="px-2.5 py-0 h-6 rounded-md bg-muted text-muted-foreground text-xs font-medium flex items-center gap-1"
            >
              <Share2 className="w-3 h-3" />
              Share
            </button>
          )}
        </div>
      </div>



      {/* Friends Modal Popup */}
      <AnimatePresence>
        {showFriends && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-5"
            onClick={() => setShowFriends(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-xl p-5 shadow-lg max-h-[60vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground text-sm">Friends</h3>
                <button onClick={() => setShowFriends(false)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              {friendsList.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setViewingUser(u);
                    setShowFriends(false);
                  }}
                  className="w-full flex items-center gap-2 py-1.5 text-left hover:bg-muted/50 rounded-lg px-1 transition-colors"
                >
                  <UserAvatar user={u} size="sm" />
                  <span className="text-sm text-foreground">{u.name}</span>
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div data-profile-tabs className="flex border-b border-border mb-5">
        {([
          { id: "current", label: "Active sidequests", Icon: Zap },
          { id: "past", label: "Completed sidequests", Icon: Flag },
          { id: "groups", label: "Groups", Icon: Users2 },
        ] as const).map(({ id, label, Icon }) => {
          const isActive = tab === id;
          return (
            <button
              key={id}
              data-tour={`profile-tab-${id}`}
              onClick={() => {
                setTab(id);
                const next = new URLSearchParams(searchParams);
                next.set("tab", id);
                setSearchParams(next, { replace: true });
              }}
              aria-label={label}
              aria-selected={isActive}
              className="relative flex-1 py-3 flex items-center justify-center transition-colors"
            >
              <Icon
                className={`w-6 h-6 transition-colors ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
                strokeWidth={isActive ? 2.25 : 2}
              />
              {isActive && (
                <motion.div
                  layoutId="profile-tab-underline"
                  className="absolute -bottom-px left-0 right-0 h-[2px] bg-foreground rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          );
        })}
      </div>


      {/* Drafts shortcut — sits just below the tab bar, right-aligned */}
      {tab === "current" && draftCount > 0 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => nav("/drafts", { state: { from: "/profile" } })}
            className="flex items-center gap-1.5 text-xs font-semibold text-foreground group"
          >
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span>
              Drafts <span className="text-muted-foreground font-normal">({draftCount})</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-active:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* Sidequests / Groups */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={tab === "groups" ? "" : "divide-y divide-border"}
      >

        {tab === "groups" ? (
          <MyGroupsTab />
        ) : active.length === 0 ? (
          <EmptyState
            icon={tab === "current" ? Sparkles : CheckCircle2}
            title={tab === "current" ? "No active sidequests" : "No completed sidequests yet"}
            description={tab === "current" ? "Nothing planned yet. Start something fun." : "Finished sidequests will show up here."}
            cta={tab === "current" ? { label: "Create sidequest", onClick: () => nav("/create") } : undefined}
          />
        ) : tab === "current" ? (
          <>
            {/* Pinned section */}
            {(() => {
              const pinnedQuests = current.filter((q) => pinnedQuestIds.includes(q.id));
              if (pinnedQuests.length === 0) return null;
              return (
                <>
                  <div className="pt-2 pb-2 px-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Pin className="w-3 h-3" /> Pinned
                    </p>
                  </div>
                  <QuestList
                    quests={pinnedQuests}
                    showGroup
                    onEditCurrent={handleOpenCurrentEditor}
                    onMarkDone={() => setTab("past")}
                    onMarkUndone={() => setTab("current")}
                    onViewProfile={(user) => {
                      if (user.id !== currentUser.id) setViewingUser(user);
                    }}
                    scrollToQuestId={justAddedQuestId}
                    pinnedQuestIds={pinnedQuestIds}
                  />
                </>
              );
            })()}
            {/* Dated quests (excluding pinned) */}
            {(() => {
              const unpinnedDated = datedQuests.filter((q) => !pinnedQuestIds.includes(q.id));
              if (unpinnedDated.length === 0) return null;
              return (
                <QuestList
                  quests={unpinnedDated}
                  showGroup
                  onEditCurrent={handleOpenCurrentEditor}
                  onMarkDone={() => setTab("past")}
                  onMarkUndone={() => setTab("current")}
                  onViewProfile={(user) => {
                    if (user.id !== currentUser.id) setViewingUser(user);
                  }}
                  scrollToQuestId={justAddedQuestId}
                  pinnedQuestIds={pinnedQuestIds}
                />
              );
            })()}
            {/* Someday (undated, excluding pinned) */}
            {(() => {
              const unpinnedUndated = undatedQuests.filter((q) => !pinnedQuestIds.includes(q.id));
              if (unpinnedUndated.length === 0) return null;
              return (
                <>
                  <div className={`${datedQuests.length === 0 ? 'pt-1' : 'pt-4'} pb-2 px-1`}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Someday</p>
                  </div>
                  <QuestList
                    quests={unpinnedUndated}
                    showGroup
                    onEditCurrent={handleOpenCurrentEditor}
                    onMarkDone={() => setTab("past")}
                    onMarkUndone={() => setTab("current")}
                    onViewProfile={(user) => {
                      if (user.id !== currentUser.id) setViewingUser(user);
                    }}
                    scrollToQuestId={justAddedQuestId}
                    pinnedQuestIds={pinnedQuestIds}
                  />
                </>
              );
            })()}
          </>
        ) : (
          <QuestList
            quests={active}
            showGroup
            onEditPast={handleOpenPastEditor}
            onMarkDone={() => setTab("past")}
            onMarkUndone={() => setTab("current")}
            onViewProfile={(user) => {
              if (user.id !== currentUser.id) setViewingUser(user);
            }}
          />
        )}
      </motion.div>


      {/* Current Quest Editor Modal (centered) */}
      <AnimatePresence>
        {editingCurrentQuest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-5"
            onClick={(e) => { if (e.target === e.currentTarget) closeCurrentEditor(); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-xl shadow-lg max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">Edit Sidequest</h3>
                <button onClick={() => closeCurrentEditor()}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Sidequest Name <span className="text-destructive">*</span></label>
                <input
                  value={editQuestTitle}
                  onChange={(e) => setEditQuestTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Date / Time / Location — always visible between title and description */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">Date</label>
                    <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="relative">
                    <label className="text-[11px] text-muted-foreground mb-1 block">Time</label>
                    <TimePicker value={editTime} onChange={setEditTime} className="bg-muted py-2" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Location</label>
                  <LocationPicker
                    value={{
                      text: editLocation,
                      latitude: editLocationLat,
                      longitude: editLocationLng,
                      placeId: editLocationPlaceId,
                    }}
                    onChange={(v: LocationValue) => {
                      setEditLocation(v.text);
                      setEditLocationLat(v.latitude);
                      setEditLocationLng(v.longitude);
                      setEditLocationPlaceId(v.placeId);
                    }}
                    placeholder="Where's this happening?"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Description</label>
                <textarea
                  value={editQuestDescription}
                  onChange={(e) => setEditQuestDescription(e.target.value)}
                  placeholder="Add details..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Photos & Videos — right after description for a more visual feel */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Photos & Videos</label>
                <input
                  ref={currentPhotoRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleCurrentPhotoUpload}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2">
                  {editQuestPhotos.map((photo, i) => (
                    <div key={i} className="relative group">
                      <SidequestPhoto
                        src={photo}
                        alt={`Photo ${i + 1}`}
                        className="w-28 h-28 rounded-xl object-cover border border-border/30"
                      />
                      <button
                        onClick={() => setEditQuestPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => currentPhotoRef.current?.click()}
                    className="w-28 h-28 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Quest type: Friends Only or a Group */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Shared with</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEditGroupDropdown((v) => !v)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-card border border-border text-sm"
                  >
                    <span className="text-foreground font-medium">
                      {editGroupId
                        ? (() => {
                            const g = groups.find((gr) => gr.id === editGroupId);
                            return g ? (
                              <span className="flex items-center gap-1.5">
                                <GroupSwatch color={g.color} size={14} />
                                {g.name}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" />All Friends</span>
                            );
                          })()
                        : <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" />All Friends</span>}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showEditGroupDropdown ? "rotate-180" : ""}`} />
                  </button>
                  {showEditGroupDropdown && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          setEditGroupId(null);
                          setShowEditGroupDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                          !editGroupId ? "bg-primary/5 text-primary font-semibold" : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" />All Friends</span>
                      </button>
                      {groups.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setEditGroupId(g.id);
                            setShowEditGroupDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                            editGroupId === g.id ? "bg-primary/5 text-primary font-semibold" : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <span className="flex items-center gap-1.5"><GroupSwatch color={g.color} size={14} />{g.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Logistics fields — collapsible (date/time/location now live above) */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setEditDetailsOpen((v) => !v)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <span className="text-sm font-semibold text-foreground">Sidequest Details</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {editDetailsOpen ? "Hide" : "Optional"}
                    <ChevronDown className={`w-4 h-4 transition-transform ${editDetailsOpen ? "rotate-180" : ""}`} />
                  </span>
                </button>
                {editDetailsOpen && (<>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Meetup Spot</label>
                  <input type="text" value={editMeetupSpot} onChange={(e) => setEditMeetupSpot(e.target.value)} placeholder="Where should everyone meet?"
                    className="w-full px-3 py-2 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Transportation</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "car", label: "Car" },
                      { id: "bike", label: "Bike" },
                      { id: "transit", label: "Transit" },
                      { id: "walk", label: "Walk" },
                    ].map((t) => (
                      <button key={t.id} type="button"
                        onClick={() => setEditTransportation(editTransportation === t.id ? "" : t.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          editTransportation === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                {editTransportation === "car" && (
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block">Carpool Seats Available</label>
                    <input type="number" value={editCarpoolSlots} onChange={(e) => setEditCarpoolSlots(e.target.value)} placeholder="e.g. 4"
                      className="w-24 px-3 py-2 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                )}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Additional Notes</label>
                  <textarea value={editCustomNotes} onChange={(e) => setEditCustomNotes(e.target.value)} placeholder="Anything else everyone should know?"
                    rows={2} className="w-full px-3 py-2 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>

                {/* Contributions selector */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">
                    Contributions {editContributionRoles.length > 0 && (
                      <span className="text-muted-foreground/70">· {editContributionRoles.length} selected</span>
                    )}
                  </label>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    Pick what others can sign up to bring or do.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_CONTRIBUTION_ROLES.map((role) => {
                      const selected = editContributionRoles.includes(role.id);
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() =>
                            setEditContributionRoles((prev) =>
                              prev.includes(role.id) ? prev.filter((r) => r !== role.id) : [...prev, role.id]
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {selected && <Check className="w-3 h-3" />}
                          {role.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                </>)}
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Participants</label>
                <div className="space-y-1.5">
                  {editQuestParticipants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <UserAvatar user={p} size="xs" />
                        <span className="text-sm text-foreground">{p.name}</span>
                        {p.id === editingCurrentQuest.createdBy.id && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Owner</span>
                        )}
                      </div>
                      {p.id !== editingCurrentQuest.createdBy.id && (
                        <button
                          onClick={() => handleRemoveParticipantFromEditor(p.id)}
                          className="p-1 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Links</label>
                <div className="space-y-1.5">
                  {editQuestLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <LinkIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-primary truncate flex-1">{link}</span>
                      <button
                        onClick={() => setEditQuestLinks((prev) => prev.filter((_, idx) => idx !== i))}
                        className="p-0.5 rounded text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      value={newLink}
                      onChange={(e) => setNewLink(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
                      placeholder="Add a link..."
                      className="flex-1 px-3 py-2 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      onClick={handleAddLink}
                      disabled={!newLink.trim()}
                      className="px-3 py-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              </div>

              {/* Sticky buttons at bottom */}
              <div className="p-5 pt-3 border-t border-border/50 flex gap-2 shrink-0">
                <button
                  onClick={handleSaveCurrentQuest}
                  disabled={!editQuestTitle.trim()}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete quest confirmation */}
      <AnimatePresence>
        {showDeleteQuestConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-foreground/40 flex items-center justify-center p-5"
            onClick={() => setShowDeleteQuestConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-card rounded-xl p-5 space-y-4 shadow-lg text-center"
            >
              <p className="text-sm font-bold text-foreground">Delete this sidequest?</p>
              <p className="text-xs text-muted-foreground">
                This sidequest will be permanently deleted for everyone. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteQuestConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteQuest}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm remove participant dialog */}
      <AnimatePresence>
        {confirmRemoveUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-foreground/40 flex items-center justify-center p-5"
            onClick={() => setConfirmRemoveUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-card rounded-xl p-5 space-y-4 shadow-lg text-center"
            >
              <p className="text-sm font-semibold text-foreground">
                Remove <span className="text-primary">{confirmRemoveUser.userName}</span> from{" "}
                <span className="text-primary">{confirmRemoveUser.context}</span>?
              </p>
              <p className="text-xs text-muted-foreground">They'll be removed from this sidequest but can rejoin later.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmRemoveUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveParticipant}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past Quest Editor Modal (centered) */}
      <AnimatePresence>
        {editingPastQuest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-5"
            onClick={(e) => { if (e.target === e.currentTarget) setEditingPastQuest(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-xl p-5 space-y-4 shadow-lg max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">Sidequest Memories</h3>
                <button onClick={() => setEditingPastQuest(null)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div>
                <p className="font-bold text-foreground mb-1">{editingPastQuest.title}</p>
                {editingPastQuest.description && (
                  <p className="text-sm text-muted-foreground">{editingPastQuest.description}</p>
                )}
              </div>

              {/* Completion date */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Completion Date</label>
                <input
                  type="date"
                  value={questCompletedAt}
                  onChange={(e) => setQuestCompletedAt(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Photo upload */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Photos & Videos</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2">
                  {questPhotos.map((photo, i) => (
                    <div key={i} className="relative group">
                      <SidequestPhoto
                        src={photo}
                        alt={`Photo ${i + 1}`}
                        className="w-20 h-20 rounded-xl object-cover border border-border/30"
                      />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <button
                onClick={handleSavePastQuest}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
              >
                Save Changes
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
