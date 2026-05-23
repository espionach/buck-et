import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MoreVertical,
  Trash2,
  UserPlus,
  Search,
  X,
  UserSearch,
  Users,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useAppStore } from "@/data/appState";
import { User } from "@/data/mockData";
import UserAvatar from "@/components/UserAvatar";
import { usePopup } from "@/hooks/use-popup";
import {
  parseGroupColor,
  gradientClassFor,
  gradientStyleFor,
  patternStyleFor,
} from "@/data/groupColors";

const GroupMembers = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { groups, friends, inviteToGroup, removeMemberFromGroup } = useAppStore();
  const group = groups.find((g) => g.id === groupId);

  const [showAdd, setShowAdd] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<User | null>(null);
  usePopup(showAdd || !!confirmRemove);

  if (!group) {
    return (
      <div className="min-h-screen p-5 space-y-4">
        <button
          onClick={() => navigate("/profile?tab=groups")}
          className="p-2 rounded-xl bg-muted text-muted-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="text-sm text-muted-foreground text-center py-12">
          Group not found.
        </p>
      </div>
    );
  }

  const parsed = parseGroupColor(group.color);
  const overlay = patternStyleFor(parsed.pattern);

  const memberIds = new Set(group.members.map((m) => m.id));
  const available = friends.filter((f) => !memberIds.has(f.id));

  return (
    <div className="min-h-screen p-5 space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/profile?tab=groups")}
          className="p-2 rounded-xl bg-muted text-muted-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => navigate(`/groups/${group.id}/settings`)}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Group settings"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div
        style={gradientStyleFor(group.color)}
        className={`relative w-full p-5 rounded-xl ${gradientClassFor(group.color)} border border-border/50 overflow-hidden`}
      >
        {overlay && (
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-70"
            style={overlay}
          />
        )}
        <h1 className="relative font-display font-bold text-lg text-foreground">
          {group.name}
        </h1>
        <p className="relative text-xs text-muted-foreground mt-0.5">
          {group.members.length} {group.members.length === 1 ? "member" : "members"}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-foreground text-sm">Members</h2>
          <button
            onClick={() => {
              setMemberSearch("");
              setShowAdd(true);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-primary"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        {group.members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No one here yet"
            description="Add friends and start planning together."
            cta={{ label: "Add friends", onClick: () => { setMemberSearch(""); setShowAdd(true); } }}
            size="sm"
          />
        ) : (
          <div className="space-y-1">
            {group.members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <UserAvatar user={m} size="sm" />
                <span className="text-sm font-medium text-foreground flex-1 truncate">
                  {m.name}
                </span>
                <button
                  onClick={() => setConfirmRemove(m)}
                  className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label={`Remove ${m.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-foreground/40 flex items-start sm:items-center justify-center p-4 pt-20 sm:p-5"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-2xl p-5 space-y-4 shadow-lg max-h-[70vh] sm:max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Add Members</h3>
                <button
                  onClick={() => setShowAdd(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  autoFocus
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search friends by name"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {(() => {
                const q = memberSearch.trim().toLowerCase();
                const matches = q
                  ? available.filter((u) => u.name.toLowerCase().includes(q))
                  : available;
                const visible = q ? matches : matches.slice(0, 8);
                return (
                  <div className="flex-1 overflow-y-auto -mx-1 px-1">
                    {available.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-6 text-center">
                        All your friends are already in this group.
                      </p>
                    ) : visible.length === 0 ? (
                      <EmptyState
                        icon={UserSearch}
                        title="No matches found"
                        description="Try another name."
                        size="sm"
                      />
                    ) : (
                      <div className="space-y-1">
                        {visible.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => {
                              inviteToGroup(group.id, user);
                              setShowAdd(false);
                            }}
                            className="w-full flex items-center gap-2 p-2 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/50 text-left active:scale-[0.98] transition-all"
                          >
                            <UserAvatar user={user} size="sm" />
                            <span className="text-sm font-medium text-foreground flex-1 truncate">
                              {user.name}
                            </span>
                            <UserPlus className="w-4 h-4 text-primary" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmRemove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-foreground/40 flex items-center justify-center p-5"
            onClick={() => setConfirmRemove(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-card rounded-xl p-5 space-y-4 shadow-lg text-center"
            >
              <p className="text-sm font-semibold text-foreground">
                Remove <span className="text-primary">{confirmRemove.name}</span> from{" "}
                <span className="text-primary">{group.name}</span>?
              </p>
              <p className="text-xs text-muted-foreground">
                They'll stop seeing new sidequests you launch to this group.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmRemove(null)}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    removeMemberFromGroup(group.id, confirmRemove.id);
                    setConfirmRemove(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupMembers;
