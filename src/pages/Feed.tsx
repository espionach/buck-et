import { useAppStore } from "@/data/appState";
import { currentUser, friends, nonFollowedUsers, User } from "@/data/mockData";
import QuestCard from "@/components/QuestCard";
import UserAvatar from "@/components/UserAvatar";
import NotificationPanel from "@/components/NotificationPanel";
import { Search, Lock, UserPlus, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

const Feed = () => {
  const { quests, groups, following, cleanupEmptyQuests, notifications } = useAppStore();
  const [search, setSearch] = useState("");
  const [searchTab, setSearchTab] = useState<"quests" | "people">("quests");
  const [selectedProfile, setSelectedProfile] = useState<User | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    cleanupEmptyQuests();
  }, [location.pathname]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const followerQuests = quests.filter((q) => q.isFollowerOnly && !q.isDone);

  const allSearchableUsers = [...friends, ...nonFollowedUsers];
  const isFollowing = (user: User) => following.some((f) => f.id === user.id);

  const filteredQuests = search
    ? followerQuests.filter(
        (q) =>
          q.title.toLowerCase().includes(search.toLowerCase()) ||
          q.createdBy.name.toLowerCase().includes(search.toLowerCase()) ||
          q.participants.some((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      )
    : followerQuests;

  const filteredPeople = search
    ? allSearchableUsers.filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase())
      )
    : allSearchableUsers;

  const profileQuests = selectedProfile
    ? quests.filter(
        (q) =>
          q.createdBy.id === selectedProfile.id ||
          q.participants.some((p) => p.id === selectedProfile.id)
      )
    : [];

  if (selectedProfile) {
    const isFollowed = isFollowing(selectedProfile);
    return (
      <div className="min-h-screen pb-24 px-5 pt-14">
        <button
          onClick={() => setSelectedProfile(null)}
          className="text-sm text-primary font-semibold mb-4"
        >
          ← Back to Feed
        </button>

        <div className="flex items-center gap-4 mb-6">
          <UserAvatar user={selectedProfile} size="lg" />
          <div>
            <h2 className="text-lg font-bold text-foreground">{selectedProfile.name}</h2>
            <p className="text-sm text-muted-foreground">{selectedProfile.bio}</p>
          </div>
        </div>

        {!isFollowed ? (
          <div className="text-center py-16">
            <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="font-bold text-foreground mb-1">Private Account</p>
            <p className="text-sm text-muted-foreground mb-4">Follow to see their quests</p>
            <button className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 mx-auto">
              <UserPlus className="w-4 h-4" />
              Request to Follow
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {profileQuests.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No quests to show</p>
            ) : (
              profileQuests.map((q, i) => (
                <QuestCard key={q.id} quest={q} index={i} showGroup />
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-foreground">Home</h1>
        <button
          onClick={() => setShowNotifications(true)}
          className="relative p-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Mail className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-5">See what your friends are up to</p>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search quests or people..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Search tabs — only show when there's a search query */}
      {search && (
        <div className="flex bg-muted rounded-xl p-1 mb-5">
          {(["quests", "people"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSearchTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                searchTab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {t === "quests" ? "Quests" : "People"}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <motion.div key={search ? searchTab : "quests"} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {(!search || searchTab === "quests") ? (
          <div className="space-y-3">
            {filteredQuests.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-4xl mb-3">🔭</p>
                <p className="font-semibold">No quests to show</p>
                <p className="text-sm">Follow more friends to see their side quests!</p>
              </div>
            ) : (
              filteredQuests.map((q, i) => <QuestCard key={q.id} quest={q} index={i} onMarkDone={() => navigate("/profile?tab=past")} onMarkUndone={() => navigate("/profile?tab=current")} />)
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPeople.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-4xl mb-3">👤</p>
                <p className="font-semibold">No people found</p>
              </div>
            ) : (
              filteredPeople.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedProfile(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 text-left active:scale-[0.98] transition-transform"
                >
                  <UserAvatar user={user} size="md" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.bio}</p>
                  </div>
                  {isFollowing(user) ? (
                    <span className="text-[10px] font-semibold text-secondary px-2 py-1 rounded-full bg-secondary/10">
                      Following
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-muted-foreground px-2 py-1 rounded-full bg-muted">
                      Not following
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </motion.div>

      <NotificationPanel open={showNotifications} onClose={() => setShowNotifications(false)} />
    </div>
  );
};

export default Feed;
