import { useAppStore } from "@/data/appState";
import { Group, User } from "@/data/mockData";
import UserAvatar from "@/components/UserAvatar";
import OwnerLeaveDialog from "@/components/OwnerLeaveDialog";
import { UserPlus, LogOut, Crown, Clock, Trash2, Pencil, Check, Bell, BellOff, Search, X, UserSearch } from "lucide-react";
import GroupIconPicker from "@/components/GroupIconPicker";
import { useEffect, useState } from "react";
import { usePopup } from "@/hooks/use-popup";
import { motion, AnimatePresence } from "framer-motion";
import { GROUP_COLORS } from "@/data/groupColors";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface GroupSettingsProps {
  group: Group;
  onClose: () => void;
  onLeave: () => void;
  onViewProfile: (user: User) => void;
}

const GroupSettings = ({ group, onClose, onLeave, onViewProfile }: GroupSettingsProps) => {
  const { updateGroup, removeMemberFromGroup, leaveGroup, inviteToGroup, friends: friendsList, requestGroupTransfer, deleteGroup, currentUser } = useAppStore();
  const [editName, setEditName] = useState(group.name);
  const [editEmoji, setEditEmoji] = useState(group.emoji);
  const [editColor, setEditColor] = useState(group.color || "sky");
  const [isEditingName, setIsEditingName] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [showOwnerLeave, setShowOwnerLeave] = useState(false);
  const [confirmRemoveUser, setConfirmRemoveUser] = useState<{ userId: string; userName: string } | null>(null);
  const [muted, setMuted] = useState(false);
  const [muteLoading, setMuteLoading] = useState(true);
  usePopup(showOwnerLeave || !!confirmRemoveUser || showAddMembers);

  const isOwner = group.ownerId === currentUser.id;

  // Load mute state
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("group_notification_mutes")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("group_id", group.id)
        .maybeSingle();
      if (!cancelled) {
        setMuted(!!data);
        setMuteLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [group.id, currentUser.id]);

  const toggleMute = async (next: boolean) => {
    setMuted(next);
    if (next) {
      const { error } = await supabase
        .from("group_notification_mutes")
        .insert({ user_id: currentUser.id, group_id: group.id });
      if (error) {
        setMuted(false);
        toast({ title: "Couldn't mute group", description: error.message, variant: "destructive" });
      }
    } else {
      const { error } = await supabase
        .from("group_notification_mutes")
        .delete()
        .eq("user_id", currentUser.id)
        .eq("group_id", group.id);
      if (error) {
        setMuted(true);
        toast({ title: "Couldn't unmute group", description: error.message, variant: "destructive" });
      }
    }
  };

  const handleColorChange = (colorId: string) => {
    setEditColor(colorId);
    updateGroup(group.id, { color: colorId });
  };

  const handleSave = () => {
    if (editName.trim()) {
      updateGroup(group.id, { name: editName.trim(), emoji: editEmoji, color: editColor });
    }
    setIsEditingName(false);
  };

  const handleLeave = () => {
    if (isOwner) {
      setShowOwnerLeave(true);
      return;
    }
    leaveGroup(group.id);
    onLeave();
  };

  const handleRemove = (userId: string) => {
    const user = group.memberRoles.find((mr) => mr.user.id === userId)?.user
      || group.members.find((m) => m.id === userId);
    setConfirmRemoveUser({ userId, userName: user?.name || "this user" });
  };

  const confirmRemove = () => {
    if (confirmRemoveUser) {
      removeMemberFromGroup(group.id, confirmRemoveUser.userId);
      setConfirmRemoveUser(null);
    }
  };

  const handleInvite = (user: User) => {
    inviteToGroup(group.id, user);
    setShowAddMembers(false);
  };

  const availableToInvite = friendsList.filter(
    (f) => !group.memberRoles.some((mr) => mr.user.id === f.id)
  );

  const getRoleLabel = (userId: string) => {
    const mr = group.memberRoles.find((r) => r.user.id === userId);
    return mr?.role || "member";
  };

  const getRoleIcon = (role: string) => {
    if (role === "owner") return <Crown className="w-3 h-3 text-amber-500" />;
    if (role === "invited") return <Clock className="w-3 h-3 text-muted-foreground" />;
    return null;
  };

  const getRoleBadgeClass = (role: string) => {
    if (role === "owner") return "bg-amber-500/10 text-amber-600";
    if (role === "invited") return "bg-muted text-muted-foreground";
    return "bg-secondary/10 text-secondary";
  };

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Edit Group</h2>

          {/* Edit name/emoji */}
          <div className="flex gap-2 items-end">
            <GroupIconPicker value={editEmoji} onChange={setEditEmoji} size="md" />
            <div className="flex-1 flex items-center gap-1.5">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={!isEditingName}
                className={`flex-1 px-3 py-2.5 rounded-xl border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  isEditingName ? "bg-muted border-border" : "bg-transparent border-transparent"
                }`}
              />
              <button
                onClick={() => isEditingName ? handleSave() : setIsEditingName(true)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {isEditingName ? <Check className="w-4 h-4 text-primary" /> : <Pencil className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Group card color */}
          <div>
            <h3 className="font-bold text-foreground text-sm mb-2">Card Color</h3>
            <div className="flex flex-wrap gap-2">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleColorChange(c.id)}
                  aria-label={c.label}
                  className={`w-9 h-9 rounded-full ${c.swatch} flex items-center justify-center transition-transform active:scale-90 ${
                    editColor === c.id ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
                  }`}
                >
                  {editColor === c.id && <Check className="w-4 h-4 text-foreground" />}
                </button>
              ))}
            </div>
          </div>

          {/* Per-group notifications */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2 flex-1">
              {muted ? (
                <BellOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Bell className="w-4 h-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">Group notifications</p>
                <p className="text-xs text-muted-foreground">
                  {muted ? "Muted — you won't be pinged" : "On — get pings for new activity"}
                </p>
              </div>
            </div>
            <Switch
              checked={!muted}
              disabled={muteLoading}
              onCheckedChange={(v) => toggleMute(!v)}
            />
          </div>

          {/* Members list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-foreground text-sm">
                Members ({group.memberRoles.length})
              </h3>
              <button
                onClick={() => { setMemberSearch(""); setShowAddMembers(true); }}
                className="flex items-center gap-1 text-xs font-semibold text-primary"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Member rows */}
            <div className="space-y-1">
              {group.memberRoles.map((mr) => {
                const role = mr.role;
                const isCurrentUser = mr.user.id === currentUser.id;
                return (
                  <div
                    key={mr.user.id}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <button
                      onClick={() => !isCurrentUser && onViewProfile(mr.user)}
                      className="flex items-center gap-2 flex-1 text-left"
                      disabled={isCurrentUser}
                    >
                      <UserAvatar user={mr.user} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {mr.user.name}
                          {isCurrentUser && (
                            <span className="text-muted-foreground"> (you)</span>
                          )}
                        </p>
                      </div>
                    </button>
                    {isOwner && !isCurrentUser && (
                      <button
                        onClick={() => handleRemove(mr.user.id)}
                        className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center justify-center gap-1 w-[68px] ${getRoleBadgeClass(role)}`}
                    >
                      {getRoleIcon(role)}
                      {role}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leave group */}
          <button
            onClick={handleLeave}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Leave Group
          </button>
      </div>

      {/* Owner leave dialog */}
      <AnimatePresence>
        {showOwnerLeave && (
          <OwnerLeaveDialog
            type="group"
            members={group.members}
            ownerId={currentUser.id}
            onDelete={() => {
              deleteGroup(group.id);
              setShowOwnerLeave(false);
              onLeave();
            }}
            onTransfer={(newOwnerId) => {
              requestGroupTransfer(group.id, newOwnerId);
              setShowOwnerLeave(false);
              onLeave();
            }}
            onCancel={() => setShowOwnerLeave(false)}
          />
        )}
      </AnimatePresence>

      {/* Confirm remove member dialog */}
      <AnimatePresence>
        {confirmRemoveUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-foreground/40 flex items-center justify-center p-5"
            onClick={() => setConfirmRemoveUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-card rounded-xl p-5 space-y-4 shadow-lg text-center"
            >
              <p className="text-sm font-semibold text-foreground">
                Remove <span className="text-primary">{confirmRemoveUser.userName}</span> from{" "}
                <span className="text-primary">{group.name}</span>?
              </p>
              <p className="text-xs text-muted-foreground">They will no longer have access to this group.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmRemoveUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemove}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add member search modal */}
      <AnimatePresence>
        {showAddMembers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-foreground/40 flex items-end sm:items-center justify-center p-0 sm:p-5"
            onClick={() => setShowAddMembers(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-t-2xl sm:rounded-2xl p-5 space-y-4 shadow-lg max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Add Members</h3>
                <button
                  onClick={() => setShowAddMembers(false)}
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
                  ? availableToInvite.filter((u) => u.name.toLowerCase().includes(q))
                  : availableToInvite;
                const sectionLabel = q ? "Results" : "Suggested";
                const visible = q ? matches : matches.slice(0, 5);
                return (
                  <div className="flex-1 overflow-y-auto -mx-1 px-1">
                    {availableToInvite.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-6 text-center">
                        All your friends are already in this group.
                      </p>
                    ) : visible.length === 0 ? (
                      <div className="py-6 flex flex-col items-center gap-2 text-muted-foreground">
                        <UserSearch className="w-5 h-5" />
                        <p className="text-xs">No friends match "{memberSearch}"</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                          {sectionLabel}
                        </p>
                        <div className="space-y-1">
                          {visible.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleInvite(user)}
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
                      </>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GroupSettings;
