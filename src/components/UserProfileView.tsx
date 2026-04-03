import { useAppStore } from "@/data/appState";
import QuestCard from "@/components/QuestCard";
import UserAvatar from "@/components/UserAvatar";
import { ArrowLeft, X, Users as UsersIcon, Lock, UserPlus, Clock } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "@/data/mockData";

interface UserProfileViewProps {
  user: User;
  backLabel: string;
  onBack: () => void;
  onViewProfile: (user: User) => void;
}

const UserProfileView = ({ user, backLabel, onBack, onViewProfile }: UserProfileViewProps) => {
  const { quests, following, followers, currentUser, sentFollowRequests, sendFollowRequest } = useAppStore();
  const [tab, setTab] = useState<"current" | "past">("current");
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const isFollowed = following.some((f) => f.id === user.id);
  const hasRequested = sentFollowRequests.includes(user.id);

  const profileQuests = quests.filter(
    (q) =>
      q.createdBy.id === user.id ||
      q.participants.some((p) => p.id === user.id)
  );
  const activeQuests = profileQuests.filter((q) => !q.isDone);
  const completedQuests = profileQuests.filter((q) => q.isDone);
  const shownQuests = tab === "current" ? activeQuests : completedQuests;

  // Mock follower/following data for other users
  const userFollowersList = followers.filter((f) => f.id !== user.id).slice(0, 3);
  const userFollowingList = following.filter((f) => f.id !== user.id).slice(0, 4);

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <button
        onClick={onBack}
        className="text-sm text-primary font-semibold mb-4 flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </button>

      <div className="flex items-center gap-4 mb-4">
        <UserAvatar user={user} size="lg" />
        <div>
          <h2 className="text-lg font-bold text-foreground">{user.name}</h2>
          <p className="text-sm text-muted-foreground">{user.bio}</p>
        </div>
      </div>

      {/* Follower/Following row */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setShowFollowers(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-card border border-border/50 text-sm font-semibold text-foreground"
        >
          <UsersIcon className="w-4 h-4" />
          {userFollowersList.length} Followers
        </button>
        <button
          onClick={() => setShowFollowing(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-card border border-border/50 text-sm font-semibold text-foreground"
        >
          <UsersIcon className="w-4 h-4" />
          {userFollowingList.length} Following
        </button>
      </div>

      {/* Followers Modal */}
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
              {userFollowersList.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setShowFollowers(false);
                    if (u.id === currentUser.id) onBack();
                    else onViewProfile(u);
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

      {/* Following Modal */}
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
              {userFollowingList.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setShowFollowing(false);
                    if (u.id === currentUser.id) onBack();
                    else onViewProfile(u);
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

      {!isFollowed ? (
        <div className="text-center py-16">
          <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-foreground mb-1">Private Account</p>
          <p className="text-sm text-muted-foreground mb-4">Follow to see their quests</p>
          {hasRequested ? (
            <button
              disabled
              className="px-6 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm flex items-center gap-2 mx-auto cursor-default"
            >
              <Clock className="w-4 h-4" />
              Request Sent
            </button>
          ) : (
            <button
              onClick={() => sendFollowRequest(user)}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 mx-auto"
            >
              <UserPlus className="w-4 h-4" />
              Request to Follow
            </button>
          )}
        </div>
      ) : (
        <>
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
                {t === "current" ? `Active (${activeQuests.length})` : `Completed (${completedQuests.length})`}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {shownQuests.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {tab === "current" ? "No active quests" : "No completed quests"}
              </p>
            ) : (
              shownQuests.map((q, i) => (
                <QuestCard
                  key={q.id}
                  quest={q}
                  index={i}
                  showGroup
                  hideActions
                  onViewProfile={(u) => {
                    if (u.id === user.id) return;
                    if (u.id === currentUser.id) { onBack(); return; }
                    onViewProfile(u);
                  }}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfileView;
