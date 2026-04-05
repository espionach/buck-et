import { useAppStore } from "@/data/appState";
import { friends, nonFollowedUsers, User } from "@/data/mockData";
import QuestList from "@/components/QuestList";
import UserAvatar from "@/components/UserAvatar";
import NotificationPanel from "@/components/NotificationPanel";
import { Search, Lock, UserPlus, Mail, X } from "lucide-react";
import { GroupIconDisplay } from "@/components/GroupIcon";
import UserProfileView from "@/components/UserProfileView";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

const Feed = () => {
  const { quests, groups, friends: friendsList, cleanupEmptyQuests, notifications, friendRequests, currentUser } = useAppStore();
  const [search, setSearch] = useState("");
  const [searchTab, setSearchTab] = useState<"quests" | "people">("quests");
  const [selectedProfile, setSelectedProfile] = useState<User | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [feedFilter, setFeedFilter] = useState<"all" | "followers" | string>("all");
  const [searchMode, setSearchMode] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    cleanupEmptyQuests();
  }, [location.pathname]);

  const unreadCount = notifications.filter((n) => !n.read).length + friendRequests.length;

  // Show followers-only quests from friends AND group quests where user is a member
  const userGroupIds = groups.map((g) => g.id);
  const friendIds = new Set(friendsList.map((f) => f.id));
  const feedQuests = quests.filter((q) => {
    if (q.isDone) return false;
    // Group quests: show if user is in that group
    if (q.groupId && userGroupIds.includes(q.groupId)) return true;
    // Friend-only quests: only show if creator is a friend (or self)
    if (q.isFollowerOnly && (friendIds.has(q.createdBy.id) || q.createdBy.id === currentUser.id)) return true;
    return false;
  });

  // Apply filter
  const filterOptions = [
    { key: "all", label: "All" },
    { key: "followers", label: "Friends" },
    ...groups.map((g) => ({ key: g.id, label: `${g.emoji} ${g.name}` })),
  ];

  const filteredByTab = feedQuests.filter((q) => {
    if (feedFilter === "all") return true;
    if (feedFilter === "followers") return q.isFollowerOnly;
    return q.groupId === feedFilter;
  });

  const allSearchableUsers = [...friends, ...nonFollowedUsers];
  const isFriend = (user: User) => friendsList.some((f) => f.id === user.id);

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
    return (
      <UserProfileView
        user={selectedProfile}
        backLabel="Back to Feed"
        onBack={() => setSelectedProfile(null)}
        onViewProfile={(user) => setSelectedProfile(user)}
      />
    );
  }

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-foreground">Home</h1>
        <button
          onClick={() => setShowNotifications(true)}
          className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Mail className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
      

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={searchInputRef}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!searchMode) setSearchMode(true);
          }}
          onFocus={() => {
            if (!searchMode) setSearchMode(true);
          }}
          placeholder="Search quests or people..."
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-muted border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {(search || searchMode) && (
          <button
            onClick={() => {
              setSearch("");
              setSearchMode(false);
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2"
          >
            <X className="w-4 h-4 text-destructive" />
          </button>
        )}
      </div>

      {/* Search mode page */}
      {searchMode ? (
        <div>
          {/* Toggle */}
          <div className="flex bg-muted rounded-2xl p-1 mb-4">
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

          {!search ? (
            /* No query — show recent searches */
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Recent Searches
                </p>
                {recentSearches.length > 0 && (
                  <button
                    onClick={() => setRecentSearches([])}
                    className="text-[10px] font-semibold text-destructive"
                  >
                    Clear all
                  </button>
                )}
              </div>
              {recentSearches.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm">No recent searches</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentSearches.map((term, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/50 active:scale-[0.98] transition-transform"
                    >
                      <button
                        onClick={() => setSearch(term)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm text-foreground truncate">{term}</span>
                      </button>
                      <button
                        onClick={() => setRecentSearches((prev) => prev.filter((_, idx) => idx !== i))}
                        className="shrink-0"
                      >
                        <X className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Has query — show results */
            <motion.div key={searchTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {searchTab === "quests" ? (
                <div className="divide-y divide-border">
                  <QuestList
                    quests={filteredQuests}
                    emptyIcon="🔭"
                    emptyText="No quests found"
                    onMarkDone={() => navigate("/profile?tab=past")}
                    onMarkUndone={() => navigate("/profile?tab=current")}
                    onViewProfile={(user) => {
                      if (search.trim()) {
                        setRecentSearches((prev) => [search.trim(), ...prev.filter((s) => s !== search.trim())].slice(0, 10));
                      }
                      setSelectedProfile(user);
                    }}
                  />
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {filteredPeople.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <p className="text-4xl mb-3">👤</p>
                      <p className="font-semibold">No people found</p>
                    </div>
                  ) : (
                    filteredPeople.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          if (search.trim()) {
                            setRecentSearches((prev) => [search.trim(), ...prev.filter((s) => s !== search.trim())].slice(0, 10));
                          }
                          setSelectedProfile(user);
                        }}
                        className="w-full flex items-center gap-3 py-3 text-left active:scale-[0.98] transition-transform"
                      >
                        <UserAvatar user={user} size="md" />
                        <div className="flex-1">
                          <p className="font-semibold text-foreground text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.bio}</p>
                        </div>
                        {isFriend(user) ? (
                          <span className="text-[10px] font-semibold text-secondary px-2 py-1 rounded-full bg-secondary/10">
                            Friend
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-muted-foreground px-2 py-1 rounded-full bg-muted">
                            Not a friend
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      ) : (
        <>
          {/* Filter tabs */}
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

          {/* Content */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="divide-y divide-border">
              <QuestList
                quests={filteredQuests}
                emptyIcon="🔭"
                emptyText="No quests to show"
                emptySubtext="Follow more friends to see their side quests!"
                onMarkDone={() => navigate("/profile?tab=past")}
                onMarkUndone={() => navigate("/profile?tab=current")}
                onViewProfile={(user) => setSelectedProfile(user)}
              />
            </div>
          </motion.div>
        </>
      )}

      <NotificationPanel open={showNotifications} onClose={() => setShowNotifications(false)} />
    </div>
  );
};

export default Feed;
