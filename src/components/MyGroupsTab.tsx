import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  ArrowLeft,
  Pencil,
  Check,
  Trash2,
  UserPlus,
  Search,
  X,
  UserSearch,
  Users as UsersIcon,
  MoreVertical,
} from "lucide-react";
import { useAppStore } from "@/data/appState";
import { Group, User } from "@/data/mockData";
import UserAvatar from "@/components/UserAvatar";
import GroupCard from "@/components/GroupCard";
import GroupStylePicker from "@/components/GroupStylePicker";
import { usePopup } from "@/hooks/use-popup";
import { validateContent } from "@/lib/contentFilter";
import { toast } from "sonner";
import {
  parseGroupColor,
  gradientClassFor,
  gradientStyleFor,
  patternStyleFor,
} from "@/data/groupColors";

type View =
  | { kind: "list" }
  | { kind: "members"; groupId: string }
  | { kind: "settings"; groupId: string };

const MyGroupsTab = () => {
  const {
    groups,
    friends,
    updateGroup,
    inviteToGroup,
    removeMemberFromGroup,
    deleteGroup,
  } = useAppStore();
  const navigate = useNavigate();

  const [view, setView] = useState<View>({ kind: "list" });
  const selected =
    view.kind !== "list"
      ? groups.find((g) => g.id === view.groupId) || null
      : null;

  const sortedGroups = [...groups].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (view.kind === "members" && selected) {
    return (
      <GroupMembersView
        group={selected}
        friends={friends}
        onBack={() => setView({ kind: "list" })}
        onOpenSettings={() => setView({ kind: "settings", groupId: selected.id })}
        onAdd={(user) => inviteToGroup(selected.id, user)}
        onRemove={(userId) => removeMemberFromGroup(selected.id, userId)}
      />
    );
  }

  if (view.kind === "settings" && selected) {
    return (
      <GroupSettingsView
        group={selected}
        onBack={() => setView({ kind: "members", groupId: selected.id })}
        onRename={(name) => updateGroup(selected.id, { name })}
        onRestyle={(color) => updateGroup(selected.id, { color })}
        onDelete={() => {
          deleteGroup(selected.id);
          setView({ kind: "list" });
        }}
      />
    );
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        Private lists to launch sidequests to a hand-picked subset of friends.
        Only you can see them.
      </p>

      <div className="grid grid-cols-2 gap-3 items-stretch">
        {/* New group card — always first, same size as group cards */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate("/create-group")}
          className="w-full rounded-xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 hover:border-foreground/30 transition-colors flex flex-col items-center justify-center gap-2 p-5 min-h-[124px] text-muted-foreground"
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs font-semibold">New group</span>
        </motion.button>

        {sortedGroups.map((g, i) => (
          <div key={g.id} className="relative">
            <GroupCard
              group={g}
              index={i + 1}
              onClick={() => setView({ kind: "members", groupId: g.id })}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setView({ kind: "settings", groupId: g.id });
              }}
              className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-card/70 backdrop-blur-sm text-foreground hover:bg-card transition-colors"
              aria-label={`Edit ${g.name}`}
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {sortedGroups.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          <UsersIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No groups yet — tap "New group" to create one.</p>
        </div>
      )}
    </div>
  );
};

/* ───────────────────────── Members view ───────────────────────── */

interface MembersViewProps {
  group: Group;
  friends: User[];
  onBack: () => void;
  onOpenSettings: () => void;
  onAdd: (user: User) => void;
  onRemove: (userId: string) => void;
}

const GroupMembersView = ({
  group,
  friends,
  onBack,
  onOpenSettings,
  onAdd,
  onRemove,
}: MembersViewProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<User | null>(null);
  usePopup(showAdd || !!confirmRemove);

  const parsed = parseGroupColor(group.color);
  const overlay = patternStyleFor(parsed.pattern);

  const memberIds = new Set(group.members.map((m) => m.id));
  const available = friends.filter((f) => !memberIds.has(f.id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-muted text-muted-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Group settings"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Group header card */}
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
        <h2 className="relative font-display font-bold text-lg text-foreground">
          {group.name}
        </h2>
        <p className="relative text-xs text-muted-foreground mt-0.5">
          {group.members.length} {group.members.length === 1 ? "member" : "members"}
        </p>
      </div>

      {/* Members */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-foreground text-sm">Members</h3>
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
          <p className="text-xs text-muted-foreground py-4 text-center">
            No one in this group yet. Tap Add to include friends.
          </p>
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

      {/* Add members modal */}
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
                      <div className="py-6 flex flex-col items-center gap-2 text-muted-foreground">
                        <UserSearch className="w-5 h-5" />
                        <p className="text-xs">No friends match "{memberSearch}"</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {visible.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => {
                              onAdd(user);
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

      {/* Confirm remove member */}
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
                    onRemove(confirmRemove.id);
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

/* ───────────────────────── Settings view ───────────────────────── */

interface SettingsViewProps {
  group: Group;
  onBack: () => void;
  onRename: (name: string) => void;
  onRestyle: (color: string) => void;
  onDelete: () => void;
}

const GroupSettingsView = ({
  group,
  onBack,
  onRename,
  onRestyle,
  onDelete,
}: SettingsViewProps) => {
  const [name, setName] = useState(group.name);
  const [editingName, setEditingName] = useState(false);
  const [color, setColor] = useState(group.color || "sky");
  const [confirmDelete, setConfirmDelete] = useState(false);
  usePopup(confirmDelete);

  const handleSaveName = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const violation = validateContent(trimmed);
    if (violation) {
      toast.error(violation);
      return;
    }
    onRename(trimmed);
    setEditingName(false);
  };

  const handleColor = (next: string) => {
    setColor(next);
    onRestyle(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-muted text-muted-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold text-foreground">Group settings</h2>
      </div>

      {/* Name */}
      <div>
        <h3 className="font-bold text-foreground text-sm mb-2">Name</h3>
        <div className="flex items-center gap-1.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!editingName}
            className={`flex-1 px-3 py-2.5 rounded-xl border text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              editingName ? "bg-muted border-border" : "bg-transparent border-transparent"
            }`}
          />
          <button
            onClick={() => (editingName ? handleSaveName() : setEditingName(true))}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={editingName ? "Save name" : "Edit name"}
          >
            {editingName ? <Check className="w-4 h-4 text-primary" /> : <Pencil className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Style */}
      <div>
        <h3 className="font-bold text-foreground text-sm mb-2">Card style</h3>
        <GroupStylePicker value={color} onChange={handleColor} />
      </div>

      {/* Delete */}
      <button
        onClick={() => setConfirmDelete(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/5 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Delete group
      </button>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-foreground/40 flex items-center justify-center p-5"
            onClick={() => setConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-card rounded-xl p-5 space-y-4 shadow-lg text-center"
            >
              <p className="text-sm font-bold text-foreground">Delete "{group.name}"?</p>
              <p className="text-xs text-muted-foreground">
                The group and any sidequests launched only to it will be deleted. This can't be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setConfirmDelete(false);
                    onDelete();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyGroupsTab;
