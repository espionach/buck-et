import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Check, Trash2 } from "lucide-react";
import { useAppStore } from "@/data/appState";
import GroupStylePicker from "@/components/GroupStylePicker";
import GroupDeleteDialog from "@/components/GroupDeleteDialog";
import { usePopup } from "@/hooks/use-popup";
import { validateContent } from "@/lib/contentFilter";
import { toast } from "sonner";
import { DUPLICATE_NAME_MESSAGE } from "@/lib/groupLimits";


const GroupSettings = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { groups, quests, updateGroup, deleteGroup } = useAppStore();
  const group = groups.find((g) => g.id === groupId);


  const [name, setName] = useState(group?.name ?? "");
  const [editingName, setEditingName] = useState(false);
  const [color, setColor] = useState(group?.color ?? "sky");
  const [confirmDelete, setConfirmDelete] = useState(false);
  usePopup(confirmDelete);

  if (!group) {
    return (
      <div className="min-h-screen p-5 space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
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

  const handleSaveName = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const violation = validateContent(trimmed);
    if (violation) {
      toast.error(violation);
      return;
    }
    const normalized = trimmed.toLowerCase();
    const clash = groups.some(
      (g) => g.id !== group.id && g.ownerId === group.ownerId && g.name.trim().toLowerCase() === normalized
    );
    if (clash) {
      toast.error(DUPLICATE_NAME_MESSAGE);
      return;
    }
    updateGroup(group.id, { name: trimmed });
    setEditingName(false);
  };


  const handleColor = (next: string) => {
    setColor(next);
    updateGroup(group.id, { color: next });
  };

  return (
    <div className="min-h-screen p-5 space-y-5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-foreground">Friend list settings</h1>
      </div>

      <div>
        <h2 className="font-bold text-foreground text-sm mb-2">Name</h2>
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
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={editingName ? "Save name" : "Edit name"}
          >
            {editingName ? <Check className="w-4 h-4 text-primary" /> : <Pencil className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <h2 className="font-bold text-foreground text-sm mb-2">Card style</h2>
        <GroupStylePicker value={color} onChange={handleColor} />
      </div>

      <button
        onClick={() => setConfirmDelete(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/5 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Delete group
      </button>

      <AnimatePresence>
        {confirmDelete && (
          <GroupDeleteDialog
            group={group}
            otherGroups={groups.filter((g) => g.id !== group.id)}
            questCount={quests.filter((q) => q.groupId === group.id).length}
            onCancel={() => setConfirmDelete(false)}
            onConfirm={(action) => {
              setConfirmDelete(false);
              deleteGroup(group.id, action);
              navigate("/profile?tab=groups");
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default GroupSettings;
