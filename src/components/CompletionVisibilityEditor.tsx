import { useState } from "react";
import { Lock, Users, Globe, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/data/appState";
import { Quest } from "@/data/mockData";
import GroupSwatch from "@/components/GroupSwatch";
import { toast } from "sonner";
import type { VisibilityChoice } from "@/components/CompletionCelebration";

interface Props {
  quest: Quest;
  userId: string;
}

/**
 * Lets a user change who can see a sidequest they've completed.
 * Owners can also scope it back to the friend list it was launched to.
 */
const CompletionVisibilityEditor = ({ quest, userId }: Props) => {
  const { groups, _invalidate } = useAppStore();
  const isOwner = quest.createdBy.id === userId;
  const group = quest.groupId ? groups.find((g) => g.id === quest.groupId) : undefined;

  const initial: VisibilityChoice = quest.completionVisibility?.[userId] === "private"
    ? "private"
    : isOwner && quest.groupId
      ? "group"
      : "friends";

  const [choice, setChoice] = useState<VisibilityChoice>(initial);
  const [saving, setSaving] = useState(false);

  const options: { key: VisibilityChoice; label: string; hint: string; icon: JSX.Element }[] = [
    {
      key: "private",
      label: "Private",
      hint: "Only you can see this completed sidequest.",
      icon: <Lock className="w-4 h-4" />,
    },
    ...(isOwner && group
      ? [
          {
            key: "group" as VisibilityChoice,
            label: group.name,
            hint: "Only this friend list can see it.",
            icon: group.color ? <GroupSwatch color={group.color} size={16} /> : <Users className="w-4 h-4" />,
          },
        ]
      : []),
    {
      key: "friends",
      label: "All friends",
      hint: "Everyone you're friends with can see it.",
      icon: <Globe className="w-4 h-4" />,
    },
  ];

  const save = async (next: VisibilityChoice) => {
    setChoice(next);
    setSaving(true);
    try {
      await supabase
        .from("sidequest_completions")
        .update({ visibility: next === "private" ? "private" : "all_friends" })
        .eq("sidequest_id", quest.id)
        .eq("user_id", userId);

      if (isOwner) {
        if (next === "private") {
          await supabase.from("sidequests").update({ is_private: true }).eq("id", quest.id);
        } else if (next === "friends") {
          await supabase
            .from("sidequests")
            .update({ is_private: false, group_id: null, is_friends_only: true })
            .eq("id", quest.id);
        } else {
          await supabase.from("sidequests").update({ is_private: false }).eq("id", quest.id);
        }
      }
      _invalidate(["quests"]);
      toast.success("Visibility updated");
    } catch {
      toast.error("Couldn't update visibility");
      setChoice(initial);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <label className="text-sm font-semibold text-foreground mb-1.5 block">Who can see this</label>
      <div className="space-y-2">
        {options.map((o) => {
          const selected = choice === o.key;
          return (
            <button
              key={o.key}
              disabled={saving}
              onClick={() => save(o.key)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors disabled:opacity-60 ${
                selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              }`}
            >
              <span className={selected ? "text-primary" : "text-muted-foreground"}>{o.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{o.label}</span>
                <span className="block text-[11px] text-muted-foreground">{o.hint}</span>
              </span>
              {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CompletionVisibilityEditor;
