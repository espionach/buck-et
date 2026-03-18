import { useAppStore } from "@/data/appState";
import { currentUser, Group, User } from "@/data/mockData";
import { X, UserPlus, LogOut, Crown, Clock, Trash2, Pencil, Check } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GroupSettingsProps {
  group: Group;
  onClose: () => void;
  onLeave: () => void;
  onViewProfile: (user: User) => void;
}

const GroupSettings = ({ group, onClose, onLeave, onViewProfile }: GroupSettingsProps) => {
  const { updateGroup, removeMemberFromGroup, leaveGroup, inviteToGroup, following } = useAppStore();
  const [editName, setEditName] = useState(group.name);
  const [editEmoji, setEditEmoji] = useState(group.emoji);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);

  const isOwner = group.ownerId === currentUser.id;

  const handleSave = () => {
    if (editName.trim()) {
      updateGroup(group.id, { name: editName.trim(), emoji: editEmoji });
    }
  };

  const handleLeave = () => {
    leaveGroup(group.id);
    onLeave();
  };

  const handleRemove = (userId: string) => {
    removeMemberFromGroup(group.id, userId);
  };

  const handleInvite = (user: User) => {
    inviteToGroup(group.id, user);
    setShowAddMembers(false);
  };

  const availableToInvite = following.filter(
    (f) => !group.members.some((m) => m.id === f.id)
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
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden mb-4"
    >
      <div className="p-4 rounded-2xl bg-card border border-border space-y-4">
        {/* Edit name/emoji */}
        <div>
          <h3 className="font-bold text-foreground text-sm mb-2">Edit Board</h3>
          <div className="flex gap-2">
            <input
              value={editEmoji}
              onChange={(e) => setEditEmoji(e.target.value)}
              className="w-14 px-2 py-2.5 rounded-xl bg-muted border border-border text-center text-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Members list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-foreground text-sm">
              Members ({group.members.length})
            </h3>
            <button
              onClick={() => setShowAddMembers(!showAddMembers)}
              className="flex items-center gap-1 text-xs font-semibold text-primary"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          {/* Add members panel */}
          <AnimatePresence>
            {showAddMembers && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-2"
              >
                {availableToInvite.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    All your friends are already in this group
                  </p>
                ) : (
                  <div className="space-y-1 pb-2">
                    {availableToInvite.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleInvite(user)}
                        className="w-full flex items-center gap-2 p-2 rounded-xl bg-muted/50 border border-border/50 text-left active:scale-[0.98] transition-transform"
                      >
                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                          {user.avatar}
                        </span>
                        <span className="text-sm font-medium text-foreground flex-1">
                          {user.name}
                        </span>
                        <UserPlus className="w-4 h-4 text-primary" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

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
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                      {mr.user.avatar}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {mr.user.name}
                        {isCurrentUser && (
                          <span className="text-muted-foreground"> (you)</span>
                        )}
                      </p>
                    </div>
                  </button>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${getRoleBadgeClass(role)}`}
                  >
                    {getRoleIcon(role)}
                    {role}
                  </span>
                  {isOwner && !isCurrentUser && (
                    <button
                      onClick={() => handleRemove(mr.user.id)}
                      className="p-1.5 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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
    </motion.div>
  );
};

export default GroupSettings;
