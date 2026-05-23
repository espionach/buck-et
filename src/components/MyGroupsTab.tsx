import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Users as UsersIcon, MoreVertical } from "lucide-react";
import { useAppStore } from "@/data/appState";
import GroupCard from "@/components/GroupCard";
import EmptyState from "@/components/EmptyState";

/**
 * Owner-only "launch lists" — grid of the current user's private groups.
 * Tapping a card opens the members page; the three-dots opens settings.
 */
const MyGroupsTab = () => {
  const { groups } = useAppStore();
  const navigate = useNavigate();

  const sortedGroups = [...groups].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        Private lists to launch sidequests to a hand-picked subset of friends.
        Only you can see them.
      </p>

      <div className="grid grid-cols-2 gap-3 items-stretch">
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
              onClick={() => navigate(`/groups/${g.id}`)}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/groups/${g.id}/settings`);
              }}
              className="absolute top-2 right-2 z-10 p-1 text-foreground hover:opacity-70 transition-opacity"
              aria-label={`Edit ${g.name}`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {sortedGroups.length === 0 && (
        <EmptyState
          icon={UsersIcon}
          title="No groups yet"
          description='Tap "New group" to create one and get started.'
          cta={{ label: "New group", onClick: () => navigate("/create-group") }}
        />
      )}
    </div>
  );
};

export default MyGroupsTab;
