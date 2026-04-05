import { useAppStore } from "@/data/appState";
import { Group, GroupMember } from "@/data/mockData";
import { ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import UserAvatar from "@/components/UserAvatar";

const CreateGroup = () => {
  const navigate = useNavigate();
  const { addGroup, friends: friendsList, currentUser } = useAppStore();
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
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {friendsList.map((user) => (
              <button
                key={user.id}
                onClick={() => toggleMember(user.id)}
                className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
              >
                <UserAvatar user={user} size="sm" />
                <span className="text-sm font-semibold text-foreground flex-1 text-left">{user.name}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedMembers.includes(user.id)
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/40 bg-transparent"
                }`}>
                  {selectedMembers.includes(user.id) && (
                    <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
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
