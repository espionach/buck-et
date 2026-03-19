import { useAppStore } from "@/data/appState";
import { currentUser, User } from "@/data/mockData";
import GroupCard from "@/components/GroupCard";
import QuestCard from "@/components/QuestCard";
import GroupSettings from "@/components/GroupSettings";
import UserAvatar from "@/components/UserAvatar";
import { Plus, Search, Check, X, Settings, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Boards = () => {
  const { groups, quests, groupInvitations, acceptGroupInvitation, declineGroupInvitation } = useAppStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const openGroup = searchParams.get("open");

  const [selectedGroup, setSelectedGroup] = useState<string | null>(openGroup);
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showAllInvites, setShowAllInvites] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);

  useEffect(() => {
    if (openGroup) setSelectedGroup(openGroup);
  }, [openGroup]);

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

  const groupQuests = selectedGroup
    ? quests.filter((q) => q.groupId === selectedGroup && !q.isDone)
    : [];

  const selectedGroupData = groups.find((g) => g.id === selectedGroup);

  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleViewProfile = (user: User) => {
    setViewingProfile(user);
    setShowSettings(false);
  };

  const pendingInvitations = groupInvitations.filter((i) => i.status === "pending");

  const { following } = useAppStore();
  const isFollowing = (user: User) => following.some((f) => f.id === user.id);

  // Profile view for member clicked in settings
  if (viewingProfile) {
    const profileQuests = quests.filter(
      (q) =>
        q.createdBy.id === viewingProfile.id ||
        q.participants.some((p) => p.id === viewingProfile.id)
    );
    const isFollowed = isFollowing(viewingProfile);

    return (
      <div className="min-h-screen pb-24 px-5 pt-14">
        <button
          onClick={() => setViewingProfile(null)}
          className="text-sm text-primary font-semibold mb-4 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Board
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
            {viewingProfile.avatar}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{viewingProfile.name}</h2>
            <p className="text-sm text-muted-foreground">{viewingProfile.bio}</p>
          </div>
        </div>

        {!isFollowed ? (
          <div className="text-center py-16">
            <p className="font-bold text-foreground mb-1">Private Account</p>
            <p className="text-sm text-muted-foreground mb-4">Follow to see their quests</p>
            <button className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm mx-auto">
              Request to Follow
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {profileQuests.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No quests to show</p>
            ) : (
              profileQuests.map((q, i) => <QuestCard key={q.id} quest={q} index={i} showGroup />)
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Hey, {currentUser.name.split(" ")[0]} 👋</p>
        <h1 className="text-2xl font-bold text-foreground">Your Boards</h1>
      </div>

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
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Pending invitations - hidden during search */}
            {pendingInvitations.length > 0 && !search && (
              <div className="space-y-2 mb-4">
                {/* Always show first invitation */}
                <motion.div
                  key={pendingInvitations[0].id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl border border-border/50 bg-card/60 opacity-80"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{pendingInvitations[0].group.emoji}</span>
                      <div>
                        <p className="font-bold text-foreground text-sm">{pendingInvitations[0].group.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Invited by {pendingInvitations[0].invitedBy.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => acceptGroupInvitation(pendingInvitations[0].id)}
                        className="p-2 rounded-xl bg-secondary text-secondary-foreground"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => declineGroupInvitation(pendingInvitations[0].id)}
                        className="p-2 rounded-xl bg-muted text-muted-foreground"
                      >
                        <X className="w-4 h-4" />
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
                        className="w-full text-center text-xs font-semibold text-primary py-2"
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
                              className="p-4 rounded-2xl border border-border/50 bg-card/60 opacity-80"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{inv.group.emoji}</span>
                                  <div>
                                    <p className="font-bold text-foreground text-sm">{inv.group.name}</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      Invited by {inv.invitedBy.name}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => acceptGroupInvitation(inv.id)}
                                    className="p-2 rounded-xl bg-secondary text-secondary-foreground"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => declineGroupInvitation(inv.id)}
                                    className="p-2 rounded-xl bg-muted text-muted-foreground"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        <button
                          onClick={() => setShowAllInvites(false)}
                          className="w-full text-center text-xs font-semibold text-primary py-2"
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
            <div className="grid grid-cols-2 gap-3 mb-4">
              {filteredGroups.map((group, i) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  index={i}
                  onClick={() => setSelectedGroup(group.id)}
                />
              ))}
            </div>

            {/* New Group Button */}
            <button
              onClick={() => navigate("/create-group")}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold text-sm">New Group</span>
            </button>
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
              }}
              className="text-sm text-primary font-semibold mb-4 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              All Boards
            </button>

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedGroupData?.emoji}</span>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedGroupData?.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedGroupData?.members.length} members • {groupQuests.length} active
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenSettings}
                className="p-2 rounded-xl bg-muted text-muted-foreground"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Settings panel */}
            <AnimatePresence>
              {showSettings && selectedGroupData && (
                <GroupSettings
                  group={selectedGroupData}
                  onClose={() => setShowSettings(false)}
                  onLeave={() => {
                    setSelectedGroup(null);
                    setShowSettings(false);
                  }}
                  onViewProfile={handleViewProfile}
                />
              )}
            </AnimatePresence>

            {/* In-board new quest button */}
            <button
              onClick={() => navigate(`/create?groupId=${selectedGroup}`)}
              className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-xl bg-primary/10 text-primary font-semibold text-sm active:scale-[0.98] transition-transform"
            >
              <Plus className="w-4 h-4" />
              New Quest for this board
            </button>

            {/* Quest list */}
            <div className="space-y-3">
              {groupQuests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg mb-1">No active quests yet</p>
                  <p className="text-sm">Start one for the crew! 🚀</p>
                </div>
              ) : (
                groupQuests.map((q, i) => <QuestCard key={q.id} quest={q} index={i} />)
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Boards;
