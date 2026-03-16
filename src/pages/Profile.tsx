import { useAppStore } from "@/data/appState";
import QuestCard from "@/components/QuestCard";
import { Settings, Edit, X, Check, Users as UsersIcon, UserPlus } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quest } from "@/data/mockData";

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
  } = useAppStore();
  const [tab, setTab] = useState<"current" | "past">("current");
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editBio, setEditBio] = useState(currentUser.bio);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [questNotes, setQuestNotes] = useState("");

  const myQuests = quests.filter(
    (q) =>
      q.createdBy.id === currentUser.id ||
      q.participants.some((p) => p.id === currentUser.id)
  );

  // Current: sorted by date (soonest first)
  const current = myQuests
    .filter((q) => !q.isDone)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Past: sorted by completion date (most recent first)
  const past = myQuests
    .filter((q) => q.isDone)
    .sort((a, b) => {
      const aDate = a.completedAt || a.createdAt;
      const bDate = b.completedAt || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  const active = tab === "current" ? current : past;

  const handleSaveProfile = () => {
    updateProfile({ name: editName.trim(), bio: editBio.trim() });
    setShowEditProfile(false);
  };

  const handleOpenEditor = (quest: Quest) => {
    setEditingQuest(quest);
    setQuestNotes(quest.notes || "");
  };

  const handleSaveQuestEdit = () => {
    if (editingQuest) {
      updateQuest(editingQuest.id, { notes: questNotes.trim() || undefined });
      setEditingQuest(null);
    }
  };

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      {/* Profile Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
            {currentUser.avatar}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{currentUser.name}</h1>
            <p className="text-sm text-muted-foreground">{currentUser.bio}</p>
          </div>
        </div>
        <button
          onClick={() => setShowEditProfile(true)}
          className="p-2 rounded-xl bg-muted text-muted-foreground"
        >
          <Edit className="w-5 h-5" />
        </button>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
              <h3 className="font-bold text-foreground text-sm">Edit Profile</h3>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Name"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Bio"
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Active", value: current.length, onClick: undefined },
          { label: "Completed", value: past.length, onClick: undefined },
          { label: "Following", value: following.length, onClick: () => setShowFollowing(true) },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={stat.onClick}
            className="bg-card rounded-xl p-3 text-center border border-border/50"
          >
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {stat.label}
            </p>
          </button>
        ))}
      </div>

      {/* Followers row */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setShowFollowers(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-card border border-border/50 text-sm font-semibold text-foreground"
        >
          <UsersIcon className="w-4 h-4" />
          {followers.length} Followers
        </button>
        {followRequests.length > 0 && (
          <button
            onClick={() => setShowRequests(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold"
          >
            <UserPlus className="w-4 h-4" />
            {followRequests.length} Requests
          </button>
        )}
      </div>

      {/* Follow Requests Popup */}
      <AnimatePresence>
        {showRequests && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-foreground text-sm">Follow Requests</h3>
                <button onClick={() => setShowRequests(false)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              {followRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{req.from.avatar}</span>
                    <span className="text-sm font-semibold text-foreground">{req.from.name}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => acceptFollowRequest(req.id)}
                      className="p-1.5 rounded-lg bg-secondary text-secondary-foreground"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => declineFollowRequest(req.id)}
                      className="p-1.5 rounded-lg bg-muted text-muted-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Followers Popup */}
      <AnimatePresence>
        {showFollowers && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground text-sm">Followers</h3>
                <button onClick={() => setShowFollowers(false)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              {followers.map((u) => (
                <div key={u.id} className="flex items-center gap-2 py-1.5">
                  <span className="text-lg">{u.avatar}</span>
                  <span className="text-sm text-foreground">{u.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Following Popup */}
      <AnimatePresence>
        {showFollowing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground text-sm">Following</h3>
                <button onClick={() => setShowFollowing(false)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              {following.map((u) => (
                <div key={u.id} className="flex items-center gap-2 py-1.5">
                  <span className="text-lg">{u.avatar}</span>
                  <span className="text-sm text-foreground">{u.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex bg-muted rounded-xl p-1 mb-5">
        {(["current", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all relative ${
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t === "current" ? "Current" : "Past"}
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
              onEdit={handleOpenEditor}
            />
          ))
        )}
      </motion.div>

      {/* Quest Editor Modal */}
      <AnimatePresence>
        {editingQuest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-end justify-center"
            onClick={() => setEditingQuest(null)}
          >
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-t-3xl p-5 pb-8 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">Edit Quest</h3>
                <button onClick={() => setEditingQuest(null)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div>
                <p className="font-bold text-foreground mb-1">{editingQuest.title}</p>
                {editingQuest.description && (
                  <p className="text-sm text-muted-foreground">{editingQuest.description}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Notes & reflections</label>
                <textarea
                  value={questNotes}
                  onChange={(e) => setQuestNotes(e.target.value)}
                  placeholder="Add your thoughts, memories..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <button
                onClick={handleSaveQuestEdit}
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
