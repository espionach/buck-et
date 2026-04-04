import { useAppStore } from "@/data/appState";
import { currentUser, Group, GroupMember } from "@/data/mockData";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const CreateGroup = () => {
  const navigate = useNavigate();
  const { addGroup, friends: friendsList } = useAppStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (!name.trim()) return;
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
      description: description.trim() || undefined,
      members,
      memberRoles,
      ownerId: currentUser.id,
      activeQuests: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    addGroup(group);
    navigate("/boards", { replace: true });
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
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-16 h-14 rounded-xl bg-card border border-border text-center text-2xl focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
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
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Add Members ({selectedMembers.length} selected)
          </label>
          <div className="space-y-2">
            {following.map((user) => (
              <button
                key={user.id}
                onClick={() => toggleMember(user.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selectedMembers.includes(user.id)
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <span className="text-lg">{user.avatar}</span>
                <span className="text-sm font-semibold text-foreground flex-1 text-left">{user.name}</span>
                {selectedMembers.includes(user.id) && (
                  <X className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          <Plus className="w-5 h-5" />
          Create Group
        </button>
      </div>
    </div>
  );
};

export default CreateGroup;
