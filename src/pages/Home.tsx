import { useAppStore } from "@/data/appState";
import { currentUser, User } from "@/data/mockData";
import GroupCard from "@/components/GroupCard";
import QuestCard from "@/components/QuestCard";
import GroupSettings from "@/components/GroupSettings";
import UserAvatar from "@/components/UserAvatar";
import UserProfileView from "@/components/UserProfileView";
import { Plus, Search, Check, X, Settings, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Boards = () => {
  const { groups, quests, groupInvitations, acceptGroupInvitation, declineGroupInvitation, cleanupEmptyQuests, setHideGlobalFab } = useAppStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const openGroup = searchParams.get("open");
  const highlightQuestId = searchParams.get("highlightQuest");
  const highlightCommentId = searchParams.get("commentId");

  const [selectedGroup, setSelectedGroup] = useState<string | null>(openGroup);
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showAllInvites, setShowAllInvites] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(highlightQuestId);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(highlightCommentId);
  const [boardTab, setBoardTab] = useState<"active" | "completed">("active");

  useEffect(() => {
    if (openGroup) {
      setSelectedGroup(openGroup);
      setActiveHighlight(highlightQuestId);
      setActiveCommentId(highlightCommentId);
    }
  }, [openGroup, highlightQuestId, highlightCommentId]);

  useEffect(() => {
    cleanupEmptyQuests();
  }, [location.pathname]);

  // Sort groups by date created (newest first)
  const sortedGroups = [...groups].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredGroups = search
    ? sortedGroups.filter(
        (g) =>
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.members.some((m) => m.name.toLowerCase().includes(search.toLowerCase()))
      )
    : sortedGroups;

  const allGroupQuests = selectedGroup
    ? quests.filter((q) => q.groupId === selectedGroup)
    : [];

  const activeGroupQuests = allGroupQuests.filter((q) => !q.isDone);
  const completedGroupQuests = allGroupQuests.filter((q) => q.isDone).sort((a, b) => {
    const aDate = a.completedAt || a.createdAt;
    const bDate = b.completedAt || b.createdAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  const groupQuestsUnsorted = boardTab === "active" ? activeGroupQuests : completedGroupQuests;

  // Sort highlighted quest to the top, rest chronological
  const groupQuests = activeHighlight
    ? [...groupQuestsUnsorted].sort((a, b) => {
        if (a.id === activeHighlight) return -1;
        if (b.id === activeHighlight) return 1;
        return 0;
      })
    : groupQuestsUnsorted;

  const selectedGroupData = groups.find((g) => g.id === selectedGroup);

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleViewProfile = (user: User) => {
    setViewingProfile(user);
    setShowSettings(false);
  };

  const pendingInvitations = groupInvitations.filter((i) => i.status === "pending");

  const { friends: friendsList } = useAppStore();
  const isFriend = (user: User) => friendsList.some((f) => f.id === user.id);

  if (viewingProfile) {
    return (
      <UserProfileView
        user={viewingProfile}
        backLabel="Back to Board"
        onBack={() => setViewingProfile(null)}
        onViewProfile={(user) => setViewingProfile(user)}
      />
    );
  }

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      {/* Header - only show when no group is selected */}
      {!selectedGroup && (
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-foreground">Your Boards</h1>
          <button
            onClick={() => navigate("/create-group")}
            className="p-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!selectedGroup ? (
          <motion.div
            key="groups"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search groups or members..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Pending invitations - hidden during search */}
            {pendingInvitations.length > 0 && !search && (
              <div className="space-y-1.5 mb-3">
                {/* Always show first invitation */}
                <motion.div
                  key={pendingInvitations[0].id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-3 py-2.5 rounded-lg border border-border/40 bg-card/50 opacity-75"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{pendingInvitations[0].group.emoji}</span>
                      <div>
                        <p className="font-semibold text-foreground text-xs">{pendingInvitations[0].group.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Invited by {pendingInvitations[0].invitedBy.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => acceptGroupInvitation(pendingInvitations[0].id)}
                        className="p-1.5 rounded-full bg-secondary text-secondary-foreground"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => declineGroupInvitation(pendingInvitations[0].id)}
                        className="p-1.5 rounded-full bg-muted text-muted-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* View All / collapse for 2+ invitations */}
                {pendingInvitations.length > 1 && (
                  <>
                    {!showAllInvites ? (
                      <button
                        onClick={() => setShowAllInvites(true)}
                        className="w-full text-center text-[10px] font-semibold text-primary py-1"
                      >
                        View all ({pendingInvitations.length} invites)
                      </button>
                    ) : (
                      <>
                        <AnimatePresence>
                          {pendingInvitations.slice(1).map((inv) => (
                            <motion.div
                              key={inv.id}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="px-3 py-2.5 rounded-lg border border-border/40 bg-card/50 opacity-75"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{inv.group.emoji}</span>
                                  <div>
                                    <p className="font-semibold text-foreground text-xs">{inv.group.name}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      Invited by {inv.invitedBy.name}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => acceptGroupInvitation(inv.id)}
                                    className="p-1.5 rounded-full bg-secondary text-secondary-foreground"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => declineGroupInvitation(inv.id)}
                                    className="p-1.5 rounded-full bg-muted text-muted-foreground"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        <button
                          onClick={() => setShowAllInvites(false)}
                          className="w-full text-center text-[10px] font-semibold text-primary py-1"
                        >
                          Hide
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Group Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4 items-stretch">
              {filteredGroups.map((group, i) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  index={i}
                  onClick={() => { setSelectedGroup(group.id); setBoardTab("active"); }}
                />
              ))}
            </div>

          </motion.div>
        ) : (
          <motion.div
            key="board"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            {/* Board Header */}
            <button
              onClick={() => {
                setSelectedGroup(null);
                setShowSettings(false);
                setActiveHighlight(null);
                setActiveCommentId(null);
              }}
              className="p-2 rounded-xl bg-muted text-muted-foreground mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedGroupData?.emoji}</span>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedGroupData?.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedGroupData?.members.length} members
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenSettings}
                className="p-2 rounded-full bg-muted text-muted-foreground"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Settings - full page */}
            {showSettings && selectedGroupData && (
              <div className="fixed inset-0 z-40 bg-background min-h-screen pb-24 px-5 pt-14 overflow-y-auto">
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-xl bg-muted text-muted-foreground mb-4"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <GroupSettings
                  group={selectedGroupData}
                  onClose={() => setShowSettings(false)}
                  onLeave={() => {
                    setSelectedGroup(null);
                    setShowSettings(false);
                  }}
                  onViewProfile={handleViewProfile}
                />
              </div>
            )}

            {/* Active / Completed tabs */}
            <div className="flex bg-muted rounded-2xl p-1 mb-4">
              {(["active", "completed"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setBoardTab(t)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all relative ${
                    boardTab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {t === "active" ? `Active (${activeGroupQuests.length})` : `Completed (${completedGroupQuests.length})`}
                </button>
              ))}
            </div>


            {/* Quest list */}
            <motion.div
              key={boardTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="divide-y divide-border"
            >
              {groupQuests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-4xl mb-2">{boardTab === "active" ? "🗺️" : "📜"}</p>
                  <p className="text-sm">
                    {boardTab === "active" ? "No active quests yet — start one! 🚀" : "No completed quests yet"}
                  </p>
                </div>
              ) : (
                 groupQuests.map((q, i) => (
                  <QuestCard
                    key={q.id}
                    quest={q}
                    index={i}
                    hideActions={selectedGroupData?.ownerId !== currentUser.id}
                    onMarkDone={selectedGroupData?.ownerId === currentUser.id ? () => setBoardTab("completed") : undefined}
                    onMarkUndone={selectedGroupData?.ownerId === currentUser.id ? () => setBoardTab("active") : undefined}
                    autoOpenComments={q.id === activeHighlight && !!activeCommentId}
                    highlightCommentId={q.id === activeHighlight ? (activeCommentId || undefined) : undefined}
                    onViewProfile={(user) => setViewingProfile(user)}
                  />
                ))
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Boards;
