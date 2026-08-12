import { useAppStore } from "@/data/appState";
import QuestCard from "@/components/QuestCard";
import UserAvatar from "@/components/UserAvatar";
import { ArrowLeft, X, Users as UsersIcon, Lock, UserPlus, Clock, UserMinus, Check, ShieldOff, Share2, Sparkles, CheckCircle2, Zap, Flag } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePopup } from "@/hooks/use-popup";
import { User, isQuestCompleted, placeholderUser } from "@/data/mockData";
import UserMenu from "@/components/UserMenu";
import CancelRequestDialog from "@/components/CancelRequestDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfileViewProps {
  user: User;
  backLabel: string;
  onBack: () => void;
  onViewProfile: (user: User) => void;
}

const UserProfileView = ({ user, backLabel, onBack, onViewProfile }: UserProfileViewProps) => {
  const { quests, friends, currentUser, sentFriendRequests, sendFriendRequest, cancelFriendRequest, unfriend, friendRequests, acceptFriendRequest, blockedUserIds } = useAppStore();
  
  const [tab, setTab] = useState<"current" | "past">("current");
  const [showFriends, setShowFriends] = useState(false);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const [showCancelRequestConfirm, setShowCancelRequestConfirm] = useState(false);
  
  const [viewedUserFriends, setViewedUserFriends] = useState<User[] | null>(null);
  usePopup(showFriends || showUnfriendConfirm || showCancelRequestConfirm);

  const isBlocked = blockedUserIds.includes(user.id);
  const isFriend = friends.some((f) => f.id === user.id);
  const hasRequested = sentFriendRequests.includes(user.id);
  const incomingRequest = friendRequests.find((r) => r.from.id === user.id);

  const profileQuests = quests.filter(
    (q) =>
      q.createdBy.id === user.id ||
      q.participants.some((p) => p.id === user.id)
  );
  const activeQuests = profileQuests.filter((q) => !isQuestCompleted(q));
  // For another user's "completed" tab, show finished quests where they were
  // joined when the owner finished it (or quests they themselves owned & finished).
  const completedQuests = profileQuests.filter(
    (q) =>
      isQuestCompleted(q) &&
      q.completedByUserIds.includes(user.id) &&
      !(q.isPrivate && q.createdBy.id === user.id) &&
      q.completionVisibility?.[user.id] !== "private"
  );
  const shownQuests = tab === "current" ? activeQuests : completedQuests;




  // Fetch the viewed user's actual friends (visible to them and their friends).
  useEffect(() => {
    let cancelled = false;
    if (isBlocked) { setViewedUserFriends([]); return; }
    setViewedUserFriends(null);
    (async () => {
      const { data: ids, error } = await supabase.rpc("get_user_friend_ids", { _user_id: user.id });
      if (cancelled || error || !ids || ids.length === 0) {
        if (!cancelled) setViewedUserFriends([]);
        return;
      }
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url, bio")
        .in("user_id", ids as string[]);
      if (cancelled) return;
      const list: User[] = (ids as string[]).map((id) => {
        const p = profiles?.find((pp) => pp.user_id === id);
        if (!p) return placeholderUser(id);
        return {
          id: p.user_id,
          name: p.display_name || p.username,
          username: p.username,
          avatar: "👤",
          bio: p.bio || "",
          profilePicture: p.avatar_url || undefined,
        };
      });
      setViewedUserFriends(list);
    })();
    return () => { cancelled = true; };
  }, [user.id, isBlocked, isFriend]);

  const userFriendsList = viewedUserFriends ?? [];
  const friendsLoaded = viewedUserFriends !== null;

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          aria-label="Back"
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1">
          {user.username && (
            <button
              onClick={async () => {
                const url = `${window.location.origin}/u/${user.username}`;
                try {
                  await navigator.clipboard.writeText(url);
                  toast.success("Profile link copied!");
                } catch {
                  toast.error("Couldn't copy link.");
                }
              }}
              aria-label="Copy profile link"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
          <UserMenu user={user} onBlocked={onBack} />
        </div>
      </div>

      {isBlocked ? (
        <div className="text-center py-20">
          <ShieldOff className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-bold text-foreground mb-1">User unavailable</p>
          <p className="text-sm text-muted-foreground">
            You've blocked this user. Unblock them from the menu above to view their profile again.
          </p>
        </div>
      ) : !friendsLoaded ? null : (
      <div className="animate-fade-in">

      <div className="flex flex-col items-center mb-4">
        <UserAvatar user={user} size="lg" />
        <h2 className="text-lg font-bold text-foreground mt-3">{user.name}</h2>
        {user.username && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">@{user.username}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1 text-center">{user.bio}</p>
        <div className="flex flex-col items-center gap-2 mt-3">
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
              className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground font-medium text-xs flex items-center gap-1.5"
            >
              <UserMinus className="w-3.5 h-3.5" />
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
                You won't see each other's profiles or friends-only quests. You'll be removed from each other's friend lists. Other friend lists aren't affected.
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
          <p className="text-sm text-muted-foreground mb-4">Add as friend to see their sidequests</p>
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
              onClick={() => setShowCancelRequestConfirm(true)}
              className="px-6 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm flex items-center gap-2 mx-auto hover:bg-muted/80 transition-colors"
            >
              <Clock className="w-4 h-4" />
              Requested
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
          <div className="flex border-b border-border mb-5">
            {([
              { id: "current", label: "Active sidequests", Icon: Zap },
              { id: "past", label: "Completed sidequests", Icon: Flag },
            ] as const).map(({ id, label, Icon }) => {
              const isActive = tab === id;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
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
                      layoutId="user-profile-tab-underline"
                      className="absolute -bottom-px left-0 right-0 h-[2px] bg-foreground rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="divide-y divide-border"
          >
            {shownQuests.length === 0 ? (
              <EmptyState
                icon={tab === "current" ? Sparkles : CheckCircle2}
                title={
                  tab === "current"
                    ? "No upcoming sidequests"
                    : "No completed sidequests"
                }
                description={
                  tab === "current"
                    ? "Nothing planned right now. Start something they can join."
                    : "Finished sidequests will appear here."
                }
                cta={
                  tab === "current"
                    ? { label: "Create sidequest", onClick: () => { window.location.href = "/create"; } }
                    : undefined
                }
              />
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
          </motion.div>
        </>
      )}
      </div>
      )}



      <CancelRequestDialog
        open={showCancelRequestConfirm}
        userName={user.name}
        onConfirm={() => cancelFriendRequest(user.id)}
        onClose={() => setShowCancelRequestConfirm(false)}
      />
    </div>

  );
};

export default UserProfileView;