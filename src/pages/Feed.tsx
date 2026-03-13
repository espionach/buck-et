import { useAppStore } from "@/data/appState";
import QuestCard from "@/components/QuestCard";
import { Search } from "lucide-react";
import { useState } from "react";

const Feed = () => {
  const { quests } = useAppStore();
  const [search, setSearch] = useState("");

  const followerQuests = quests.filter(
    (q) => q.isFollowerOnly && !q.isDone
  );

  const filtered = search
    ? followerQuests.filter(
        (q) =>
          q.title.toLowerCase().includes(search.toLowerCase()) ||
          q.createdBy.name.toLowerCase().includes(search.toLowerCase())
      )
    : followerQuests;

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <h1 className="text-2xl font-bold text-foreground mb-1">Feed</h1>
      <p className="text-sm text-muted-foreground mb-5">See what your friends are up to</p>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search quests or people..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Quest Feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">🔭</p>
            <p className="font-semibold">No quests to show</p>
            <p className="text-sm">Follow more friends to see their side quests!</p>
          </div>
        ) : (
          filtered.map((q, i) => <QuestCard key={q.id} quest={q} index={i} />)
        )}
      </div>
    </div>
  );
};

export default Feed;
