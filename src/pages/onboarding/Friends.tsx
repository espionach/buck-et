import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Search, Share2, UserPlus, Check, Clock } from "lucide-react";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { useAuth } from "@/contexts/AuthContext";
import { completeOnboarding, setOnboardingStep } from "@/hooks/useOnboarding";
import { useAppStore } from "@/data/appState";
import UserAvatar from "@/components/UserAvatar";
import { toast } from "sonner";

const Friends = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentUser, allUsers, sentFriendRequests, friends, sendFriendRequest, blockedUserIds } = useAppStore();

  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const inviteLink = useMemo(() => {
    const ref = currentUser?.username || "";
    const base = window.location.origin;
    return ref ? `${base}/signup?ref=${ref}` : `${base}/signup`;
  }, [currentUser?.username]);

  const inviteMessage = `Join me on Buck-et — let's plan our next sidequest! ${inviteLink}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join me on Buck-et", text: inviteMessage });
        return;
      } catch {
        // user cancelled — fall through to copy
      }
    }
    handleCopy();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const friendIds = new Set(friends.map((f) => f.id));
  const sentSet = new Set(sentFriendRequests);
  const blocked = new Set(blockedUserIds);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allUsers
      .filter((u) => u.id !== currentUser?.id && !blocked.has(u.id))
      .filter((u) => {
        const uname = (u.username || "").toLowerCase();
        const name = (u.name || "").toLowerCase();
        return uname.includes(q) || name.includes(q);
      })
      .slice(0, 8);
  }, [query, allUsers, currentUser?.id, blocked]);

  const handleAdd = (target: typeof allUsers[number]) => {
    sendFriendRequest(target);
    toast.success(`Request sent to @${target.username || target.name}`);
  };

  const handleContinue = async () => {
    if (user) await setOnboardingStep(user.id, "tour");
    navigate("/onboarding/tour");
  };

  const handleSkipAll = async () => {
    if (user) await completeOnboarding(user.id);
    navigate("/", { replace: true });
  };

  return (
    <OnboardingLayout step="friends" onSkip={handleContinue} skipLabel="Skip">
      <div className="flex-1 flex flex-col overflow-hidden">
        <h1 className="text-2xl font-bold text-foreground mb-2">Add your friends</h1>
        <p className="text-sm text-muted-foreground mb-5">
          Sidequests are better with friends. Invite a few or find people you know.
        </p>

        {/* Share invite link */}
        <div className="rounded-2xl bg-card border border-border p-4 mb-5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Your invite link
          </div>
          <div className="text-xs text-foreground/80 break-all mb-3 font-mono">{inviteLink}</div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-[0.98] transition-transform"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={handleCopy}
              className="px-4 py-2.5 rounded-xl bg-muted text-foreground font-semibold text-sm flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Search by username */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find people by username"
            className="w-full pl-9 pr-3 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {query.trim() && results.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">
              No users found.
            </div>
          )}
          {results.map((u) => {
            const isFriend = friendIds.has(u.id);
            const isPending = sentSet.has(u.id);
            return (
              <div key={u.id} className="flex items-center gap-3 py-2.5">
                <UserAvatar user={u} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{u.name}</div>
                  {u.username && (
                    <div className="text-xs text-muted-foreground truncate">@{u.username}</div>
                  )}
                </div>
                {isFriend ? (
                  <span className="text-xs font-medium text-secondary px-3 py-1.5 rounded-full bg-secondary/10">
                    Friends
                  </span>
                ) : isPending ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground px-3 py-1.5 rounded-full bg-muted">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                ) : (
                  <button
                    onClick={() => handleAdd(u)}
                    className="flex items-center gap-1 text-xs font-semibold text-primary-foreground bg-primary px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                  >
                    <UserPlus className="w-3 h-3" /> Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleContinue}
        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base active:scale-[0.98] transition-transform"
      >
        Continue
      </button>
      <button
        onClick={handleSkipAll}
        className="w-full py-3 mt-2 text-sm font-medium text-muted-foreground active:text-foreground"
      >
        Skip onboarding
      </button>
    </OnboardingLayout>
  );
};

export default Friends;
