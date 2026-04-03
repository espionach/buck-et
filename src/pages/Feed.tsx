import { useAppStore } from "@/data/appState";
import { currentUser, friends, nonFollowedUsers, User } from "@/data/mockData";
import QuestCard from "@/components/QuestCard";
import UserAvatar from "@/components/UserAvatar";
import NotificationPanel from "@/components/NotificationPanel";
import { Search, Lock, UserPlus, Mail, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

const Feed = () => {
  const { quests, groups, following, cleanupEmptyQuests, notifications } = useAppStore();
  const [search, setSearch] = useState("");
  const [searchTab, setSearchTab] = useState<"quests" | "people">("quests");
  const [selectedProfile, setSelectedProfile] = useState<User | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [feedFilter, setFeedFilter] = useState<"all" | "followers" | string>("all");
  const [searchFocused, setSearchFocused] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    cleanupEmptyQuests();
  }, [location.pathname]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Show followers-only quests AND group quests where user is a member
  const userGroupIds = groups.map((g) => g.id);
  const feedQuests = quests.filter(
    (q) => !q.isDone && (q.isFollowerOnly || (q.groupId && userGroupIds.includes(q.groupId)))
  );

  // Apply filter
  const filterOptions = [
    { key: "all", label: "All" },
    { key: "followers", label: "Following" },
    ...groups.map((g) => ({ key: g.id, label: `${g.emoji} ${g.name}` })),
  ];

  const filteredByTab = feedQuests.filter((q) => {
    if (feedFilter === "all") return true;
    if (feedFilter === "followers") return q.isFollowerOnly;
    return q.groupId === feedFilter;
  });

  const allSearchableUsers = [...friends, ...nonFollowedUsers];
  const isFollowing = (user: User) => following.some((f) => f.id === user.id);

  // Snapshot which quests were joined at page load so order stays stable
  const [joinedSnapshot, setJoinedSnapshot] = useState<Set<string>>(new Set());

  useEffect(() => {
    const joinedIds = new Set(
      feedQuests
        .filter((q) => q.participants.some((p) => p.id === currentUser.id) || q.createdBy.id === currentUser.id)
        .map((q) => q.id)
    );
    setJoinedSnapshot(joinedIds);
  }, [location.pathname]);

  // Sort: unjoined quests first (using snapshot), then joined
  const sortedQuests = [...filteredByTab].sort((a, b) => {
    const aJoined = joinedSnapshot.has(a.id);
    const bJoined = joinedSnapshot.has(b.id);
    if (aJoined && !bJoined) return 1;
    if (!aJoined && bJoined) return -1;
    return 0;
  });

  const filteredQuests = search
    ? sortedQuests.filter(
        (q) =>
          q.title.toLowerCase().includes(search.toLowerCase()) ||
          q.createdBy.name.toLowerCase().includes(search.toLowerCase()) ||
          q.participants.some((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      )
    : sortedQuests;

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
                 <QuestCard key={q.id} quest={q} index={i} showGroup hideActions onViewProfile={(user) => {
                   if (user.id === selectedProfile.id) return;
                   setSelectedProfile(user);
                 }} />
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
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          placeholder="Search quests or people..."
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-destructive" />
          </button>
        )}
      </div>

      {/* Search recommendations when focused but no query */}
      {searchFocused && !search && (
        <div className="mb-3">
          <div className="flex bg-muted rounded-xl p-1 mb-3">
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
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 px-1">
            {searchTab === "quests" ? "Recent Quests" : "Suggested People"}
          </p>
          {searchTab === "quests" ? (
            <div className="space-y-1">
              {sortedQuests.slice(0, 4).map((q) => (
                <button
                  key={q.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setSearch(q.title)}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/50 text-left active:scale-[0.98] transition-transform"
                >
                  <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground truncate">{q.title}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {allSearchableUsers.slice(0, 4).map((user) => (
                <button
                  key={user.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setSelectedProfile(user)}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/50 text-left active:scale-[0.98] transition-transform"
                >
                  <UserAvatar user={user} size="xs" />
                  <span className="text-sm text-foreground">{user.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter tabs — hidden during search */}
      {!search && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFeedFilter(opt.key)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                feedFilter === opt.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

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
              filteredQuests.map((q, i) => <QuestCard key={q.id} quest={q} index={i} onMarkDone={() => navigate("/profile?tab=past")} onMarkUndone={() => navigate("/profile?tab=current")} onViewProfile={(user) => setSelectedProfile(user)} />)
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
