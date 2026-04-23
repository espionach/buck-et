import { useAppStore } from "@/data/appState";
import { Group, GroupMember } from "@/data/mockData";
import { ArrowLeft, Plus, Check, Search, UserSearch, UserPlus } from "lucide-react";
import GroupIconPicker from "@/components/GroupIconPicker";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import UserAvatar from "@/components/UserAvatar";
import { GROUP_COLORS, GROUP_ICON_COLORS } from "@/data/groupColors";

const CreateGroup = () => {
  const navigate = useNavigate();
  const { addGroup, friends: friendsList, currentUser } = useAppStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("target");
  const [color, setColor] = useState("sky");
  const [iconColor, setIconColor] = useState("slate");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    const members = [
      currentUser,
      ...friendsList.filter((f) => selectedMembers.includes(f.id)),
    ];
    const memberRoles: GroupMember[] = [
      { user: currentUser, role: "owner" },
      ...friendsList
        .filter((f) => selectedMembers.includes(f.id))
        .map((u) => ({ user: u, role: "invited" as const })),
    ];
    const group: Group = {
      id: `g${Date.now()}`,
      name: name.trim(),
      emoji,
      color,
      iconColor,
      description: description.trim() || undefined,
      members,
      memberRoles,
      ownerId: currentUser.id,
      activeQuests: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const realId = await addGroup(group);
    setSubmitting(false);
    navigate(`/groups?open=${realId ?? group.id}`, { replace: true });
  };

  return (
    <div className="min-h-screen px-5 pt-14 pb-10">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-muted text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">New Group</h1>
      </div>

      <div className="space-y-5">
        <div className="flex gap-3">
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Icon</label>
            <GroupIconPicker value={emoji} onChange={setEmoji} size="md" iconColor={iconColor} />
          </div>
          <div className="flex-1">
            <label className="text-sm font-semibold text-foreground mb-2 block">Group Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Adventure Squad"
              className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-base"
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this group about?"
            rows={2}
            className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Card Color</label>
          <div className="flex flex-wrap gap-2">
            {GROUP_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                aria-label={c.label}
                className={`w-9 h-9 rounded-full ${c.swatch} flex items-center justify-center transition-transform active:scale-90 ${
                  color === c.id ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
                }`}
              >
                {color === c.id && <Check className="w-4 h-4 text-foreground" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Add Members ({selectedMembers.length} selected)
          </label>

          <div className="relative mb-3">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search friends by name"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {(() => {
            const q = memberSearch.trim().toLowerCase();
            const matches = q
              ? friendsList.filter((u) => u.name.toLowerCase().includes(q))
              : friendsList;
            const sectionLabel = q ? "Results" : "Suggested";
            const visible = q ? matches : matches.slice(0, 5);
            return (
              <div>
                {friendsList.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    You don't have any friends yet to add.
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
                      {visible.map((user) => {
                        const isSelected = selectedMembers.includes(user.id);
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => toggleMember(user.id)}
                            className="w-full flex items-center gap-2 p-2 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/50 text-left active:scale-[0.98] transition-all"
                          >
                            <UserAvatar user={user} size="sm" />
                            <span className="text-sm font-medium text-foreground flex-1 truncate">
                              {user.name}
                            </span>
                            {isSelected ? (
                              <Check className="w-4 h-4 text-primary" />
                            ) : (
                              <UserPlus className="w-4 h-4 text-primary" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>

        <button
          onClick={handleCreate}
          disabled={!name.trim() || submitting}
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          <Plus className="w-5 h-5" />
          {submitting ? "Creating..." : "Create Group"}
        </button>
      </div>
    </div>
  );
};

export default CreateGroup;
