import { useAppStore } from "@/data/appState";
import QuestCard from "@/components/QuestCard";
import UserAvatar from "@/components/UserAvatar";
import { Edit, X, Check, Users as UsersIcon, UserPlus, Trash2, ImagePlus, Camera, Link as LinkIcon, Plus, ArrowLeft } from "lucide-react";
import UserProfileView from "@/components/UserProfileView";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quest, User, friends, nonFollowedUsers } from "@/data/mockData";
import { useLocation, useSearchParams } from "react-router-dom";

const Profile = () => {
  const {
    currentUser,
    quests,
    following,
    followers,
    followRequests,
    acceptFollowRequest,
    declineFollowRequest,
    updateProfile,
    updateQuest,
    deleteQuest,
    removeParticipant,
    cleanupEmptyQuests,
  } = useAppStore();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<"current" | "past">(
    new URLSearchParams(location.search).get("tab") === "past" ? "past" : "current"
  );
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editBio, setEditBio] = useState(currentUser.bio);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [viewingUserTab, setViewingUserTab] = useState<"current" | "past">("current");
  const [viewingUserFollowers, setViewingUserFollowers] = useState(false);
  const [viewingUserFollowing, setViewingUserFollowing] = useState(false);
  const [snapshotQuestIds, setSnapshotQuestIds] = useState<string[]>([]);
  // Profile picture upload
  const profilePicRef = useRef<HTMLInputElement>(null);
  const [editProfilePic, setEditProfilePic] = useState(currentUser.profilePicture || "");

  // Current quest editing state
  const [editingCurrentQuest, setEditingCurrentQuest] = useState<Quest | null>(null);
  const [editQuestTitle, setEditQuestTitle] = useState("");
  const [editQuestDescription, setEditQuestDescription] = useState("");
  const [editQuestParticipants, setEditQuestParticipants] = useState<User[]>([]);
  const [editQuestLinks, setEditQuestLinks] = useState<string[]>([]);
  const [editQuestPhotos, setEditQuestPhotos] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");
  const currentPhotoRef = useRef<HTMLInputElement>(null);

  // Past quest editing state
  const [editingPastQuest, setEditingPastQuest] = useState<Quest | null>(null);
  const [questNotes, setQuestNotes] = useState("");
  const [questPhotos, setQuestPhotos] = useState<string[]>([]);
  const [questCompletedAt, setQuestCompletedAt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync tab from URL params
  useEffect(() => {
    const urlTab = new URLSearchParams(location.search).get("tab");
    if (urlTab === "past") setTab("past");
    else if (urlTab === "current") setTab("current");
  }, [location.search]);

  // Handle viewUser query param from QuestDetail
  useEffect(() => {
    const viewUserId = searchParams.get("viewUser");
    if (viewUserId && viewUserId !== currentUser.id) {
      const allUsers = [...friends, ...nonFollowedUsers];
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

  // Cleanup empty quests on mount
  useEffect(() => {
    cleanupEmptyQuests();
  }, [location.pathname]);

  const myQuests = quests.filter(
    (q) =>
      q.createdBy.id === currentUser.id ||
      q.participants.some((p) => p.id === currentUser.id) ||
      snapshotQuestIds.includes(q.id)
  );

  const current = myQuests
    .filter((q) => !q.isDone)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Snapshot current quest IDs so unjoined quests stay visible until navigation
  useEffect(() => {
    const currentIds = quests
      .filter(
        (q) =>
          !q.isDone &&
          (q.createdBy.id === currentUser.id ||
            q.participants.some((p) => p.id === currentUser.id))
      )
      .map((q) => q.id);
    setSnapshotQuestIds(currentIds);
  }, [location.pathname]);

  const past = myQuests
    .filter((q) => q.isDone)
    .sort((a, b) => {
      const aDate = a.completedAt || a.createdAt;
      const bDate = b.completedAt || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  const active = tab === "current" ? current : past;

  const handleSaveProfile = () => {
    updateProfile({
      name: editName.trim(),
      bio: editBio.trim(),
      profilePicture: editProfilePic || undefined,
    });
    setShowEditProfile(false);
  };

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setEditProfilePic(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Current quest handlers
  const handleOpenCurrentEditor = (quest: Quest) => {
    setEditingCurrentQuest(quest);
    setEditQuestTitle(quest.title);
    setEditQuestDescription(quest.description || "");
    setEditQuestParticipants([...quest.participants]);
    setEditQuestLinks(quest.links || []);
    setEditQuestPhotos(quest.photos || []);
    setNewLink("");
  };

  const handleSaveCurrentQuest = () => {
    if (editingCurrentQuest) {
      const removedUsers = editingCurrentQuest.participants.filter(
        (p) => !editQuestParticipants.some((ep) => ep.id === p.id)
      );
      removedUsers.forEach((u) => removeParticipant(editingCurrentQuest.id, u.id));

      updateQuest(editingCurrentQuest.id, {
        title: editQuestTitle.trim(),
        description: editQuestDescription.trim() || undefined,
        links: editQuestLinks.length > 0 ? editQuestLinks : undefined,
        photos: editQuestPhotos.length > 0 ? editQuestPhotos : undefined,
      });
      setEditingCurrentQuest(null);
    }
  };

  const [confirmRemoveUser, setConfirmRemoveUser] = useState<{ userId: string; userName: string; context: string } | null>(null);

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
    if (editingCurrentQuest) {
      deleteQuest(editingCurrentQuest.id);
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

  const handleCurrentPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setEditQuestPhotos((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setQuestPhotos((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setQuestPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Viewing another user's profile from followers/following list
  const isFollowingUser = (user: User) => following.some((f) => f.id === user.id);

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
      <div className="min-h-screen pb-24 px-5 pt-14">
        <button
          onClick={() => setShowEditProfile(false)}
          className="text-sm text-primary font-semibold mb-4 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>

        <h1 className="text-xl font-bold text-foreground mb-6">Edit Profile</h1>

        <div className="space-y-4">
          {/* Profile picture */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {editProfilePic ? (
                <img src={editProfilePic} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-4xl">
                  {currentUser.avatar}
                </div>
              )}
              <button
                onClick={() => profilePicRef.current?.click()}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground"
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
            <p className="text-xs text-muted-foreground">Tap camera to change photo</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Name</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Name"
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Bio</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Bio"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
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
    <div className="min-h-screen pb-24 px-5 pt-14">
      {/* Profile Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <UserAvatar user={currentUser} size="xl" />
          <div>
            <h1 className="text-xl font-bold text-foreground">{currentUser.name}</h1>
            <p className="text-sm text-muted-foreground">{currentUser.bio}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditName(currentUser.name);
            setEditBio(currentUser.bio);
            setEditProfilePic(currentUser.profilePicture || "");
            setShowEditProfile(true);
          }}
          className="p-2 rounded-xl bg-muted text-muted-foreground"
        >
          <Edit className="w-5 h-5" />
        </button>
      </div>


      {/* Followers / Following row */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setShowFollowers(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-card border border-border/50 text-sm font-semibold text-foreground"
        >
          <UsersIcon className="w-4 h-4" />
          {followers.length} Followers
        </button>
        <button
          onClick={() => setShowFollowing(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-card border border-border/50 text-sm font-semibold text-foreground"
        >
          <UsersIcon className="w-4 h-4" />
          {following.length} Following
        </button>
        {followRequests.length > 0 && (
          <button
            onClick={() => setShowRequests(true)}
            className="relative p-2.5 rounded-xl bg-primary/10 text-primary"
          >
            <UserPlus className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {followRequests.length}
            </span>
          </button>
        )}
      </div>

      {/* Follow Requests Modal Popup */}
      <AnimatePresence>
        {showRequests && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-5"
            onClick={() => setShowRequests(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-xl p-5 shadow-lg max-h-[60vh] overflow-y-auto space-y-2"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-foreground text-sm">Follow Requests</h3>
                <button onClick={() => setShowRequests(false)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              {followRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between">
                  <button
                    className="flex items-center gap-2"
                    onClick={() => {
                      setShowRequests(false);
                      setViewingUser(req.from);
                    }}
                  >
                    <UserAvatar user={req.from} size="sm" />
                    <span className="text-sm font-semibold text-foreground">{req.from.name}</span>
                  </button>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        acceptFollowRequest(req.id);
                        if (followRequests.length <= 1) setShowRequests(false);
                      }}
                      className="p-1.5 rounded-lg bg-secondary text-secondary-foreground"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        declineFollowRequest(req.id);
                        if (followRequests.length <= 1) setShowRequests(false);
                      }}
                      className="p-1.5 rounded-lg bg-muted text-muted-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Followers Modal Popup */}
      <AnimatePresence>
        {showFollowers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-5"
            onClick={() => setShowFollowers(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-xl p-5 shadow-lg max-h-[60vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground text-sm">Followers</h3>
                <button onClick={() => setShowFollowers(false)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              {followers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setViewingUser(u);
                    setShowFollowers(false);
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

      {/* Following Modal Popup */}
      <AnimatePresence>
        {showFollowing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-5"
            onClick={() => setShowFollowing(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-xl p-5 shadow-lg max-h-[60vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground text-sm">Following</h3>
                <button onClick={() => setShowFollowing(false)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              {following.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setViewingUser(u);
                    setShowFollowing(false);
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

      {/* Tabs */}
      <div className="flex bg-muted rounded-2xl p-1 mb-5">
        {(["current", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all relative ${
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t === "current" ? `Active (${current.length})` : `Completed (${past.length})`}
          </button>
        ))}
      </div>

      {/* Quests */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {active.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">{tab === "current" ? "🗺️" : "📜"}</p>
            <p className="text-sm">
              {tab === "current" ? "No active quests — go start one!" : "No completed quests yet"}
            </p>
          </div>
        ) : (
          active.map((q, i) => (
            <QuestCard
              key={q.id}
              quest={q}
              index={i}
              showGroup
              onEditCurrent={tab === "current" ? handleOpenCurrentEditor : undefined}
              onEditPast={tab === "past" ? handleOpenPastEditor : undefined}
              onMarkDone={() => setTab("past")}
              onMarkUndone={() => setTab("current")}
              onViewProfile={(user) => {
                if (user.id !== currentUser.id) setViewingUser(user);
              }}
            />
          ))
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
            onClick={() => setEditingCurrentQuest(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-xl p-5 space-y-4 shadow-lg max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">Edit Quest</h3>
                <button onClick={() => setEditingCurrentQuest(null)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Quest Name</label>
                <input
                  value={editQuestTitle}
                  onChange={(e) => setEditQuestTitle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Details</label>
                <textarea
                  value={editQuestDescription}
                  onChange={(e) => setEditQuestDescription(e.target.value)}
                  placeholder="Add details..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Participants with remove */}
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
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Links (optional)</label>
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
                      className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
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

              {/* Photos */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Photos (optional)</label>
                <input
                  ref={currentPhotoRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleCurrentPhotoUpload}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2">
                  {editQuestPhotos.map((photo, i) => (
                    <div key={i} className="relative group">
                      <img src={photo} alt={`Photo ${i + 1}`} className="w-16 h-16 rounded-xl object-cover border border-border/30" />
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
                    className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <ImagePlus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveCurrentQuest}
                  disabled={!editQuestTitle.trim()}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleDeleteQuest}
                  className="p-3 rounded-xl bg-destructive/10 text-destructive"
                >
                  <Trash2 className="w-5 h-5" />
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
              <p className="text-xs text-muted-foreground">They'll be removed from this quest but can rejoin later.</p>
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
            onClick={() => setEditingPastQuest(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-xl p-5 space-y-4 shadow-lg max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">Quest Memories</h3>
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
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Notes & Reflections</label>
                <textarea
                  value={questNotes}
                  onChange={(e) => setQuestNotes(e.target.value)}
                  placeholder="Add your thoughts, memories..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Photo upload */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Photos</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2">
                  {questPhotos.map((photo, i) => (
                    <div key={i} className="relative group">
                      <img
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
