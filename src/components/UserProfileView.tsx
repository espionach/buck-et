import { useAppStore } from "@/data/appState";
import QuestCard from "@/components/QuestCard";
import UserAvatar from "@/components/UserAvatar";
import { ArrowLeft, X, Users as UsersIcon, Lock, UserPlus, Clock, UserMinus, Check } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePopup } from "@/hooks/use-popup";
import { User } from "@/data/mockData";

interface UserProfileViewProps {
  user: User;
  backLabel: string;
  onBack: () => void;
  onViewProfile: (user: User) => void;
}

const UserProfileView = ({ user, backLabel, onBack, onViewProfile }: UserProfileViewProps) => {
  const { quests, friends, currentUser, sentFriendRequests, sendFriendRequest, unfriend, friendRequests, acceptFriendRequest } = useAppStore();
  const [tab, setTab] = useState<"current" | "past">("current");
  const [showFriends, setShowFriends] = useState(false);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  usePopup(showFriends || showUnfriendConfirm);

  const isFriend = friends.some((f) => f.id === user.id);
  const hasRequested = sentFriendRequests.includes(user.id);
  const incomingRequest = friendRequests.find((r) => r.from.id === user.id);

  const profileQuests = quests.filter(
    (q) =>
      q.createdBy.id === user.id ||
      q.participants.some((p) => p.id === user.id)
  );
  const activeQuests = profileQuests.filter((q) => !q.completedByUserIds.includes(user.id));
  const completedQuests = profileQuests.filter((q) => q.completedByUserIds.includes(user.id));
  const shownQuests = tab === "current" ? activeQuests : completedQuests;

  // Mock friend count for other users
  const userFriendsList = friends.filter((f) => f.id !== user.id).slice(0, 3);

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <button
        onClick={onBack}
        className="p-2 rounded-xl bg-muted text-muted-foreground mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center mb-4">
        <UserAvatar user={user} size="lg" />
        <h2 className="text-lg font-bold text-foreground mt-3">{user.name}</h2>
        <p className="text-sm text-muted-foreground mt-1 text-center">{user.bio}</p>
        <div className="flex items-center gap-4 mt-3">
          {isFriend ? (
            <button
              onClick={() => setShowFriends(true)}
              className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
            >
              <UsersIcon className="w-4 h-4" />
              {userFriendsList.length} Friends
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <UsersIcon className="w-4 h-4" />
              {userFriendsList.length} Friends
            </div>
          )}

          {isFriend && (
            <button
              onClick={() => setShowUnfriendConfirm(true)}
              className="px-4 py-2 rounded-xl bg-muted text-muted-foreground font-semibold text-sm flex items-center gap-2"
            >
              <UserMinus className="w-4 h-4" />
              Unfriend
            </button>
          )}
        </div>
      </div>

      {/* Unfriend Confirmation Modal */}
      <AnimatePresence>
        {showUnfriendConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center p-5"
            onClick={() => setShowUnfriendConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-xl p-5 shadow-lg"
            >
              <h3 className="font-bold text-foreground text-sm mb-2">Unfriend {user.name}?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You'll no longer be able to see each other's quests and profile.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowUnfriendConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    unfriend(user.id);
                    setShowUnfriendConfirm(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm"
                >
                  Unfriend
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friends Modal */}
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
              {userFriendsList.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setShowFriends(false);
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

      {!isFriend ? (
        <div className="text-center py-16">
          <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-foreground mb-1">Private Account</p>
          <p className="text-sm text-muted-foreground mb-4">Add as friend to see their quests</p>
          {incomingRequest ? (
            <button
              onClick={() => acceptFriendRequest(incomingRequest.id)}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 mx-auto"
            >
              <Check className="w-4 h-4" />
              Accept Friend Request
            </button>
          ) : hasRequested ? (
            <button
              disabled
              className="px-6 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm flex items-center gap-2 mx-auto cursor-default"
            >
              <Clock className="w-4 h-4" />
              Request Sent
            </button>
          ) : (
            <button
              onClick={() => sendFriendRequest(user)}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-2 mx-auto"
            >
              <UserPlus className="w-4 h-4" />
              Add Friend
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

          <div className="divide-y divide-border">
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