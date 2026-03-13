import { currentUser } from "@/data/mockData";
import { useAppStore } from "@/data/appState";
import QuestCard from "@/components/QuestCard";
import { Settings } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const Profile = () => {
  const { quests } = useAppStore();
  const [tab, setTab] = useState<"current" | "past">("current");

  const myQuests = quests.filter(
    (q) =>
      q.createdBy.id === currentUser.id ||
      q.participants.some((p) => p.id === currentUser.id)
  );

  const current = myQuests.filter((q) => !q.isDone);
  const past = myQuests.filter((q) => q.isDone);
  const active = tab === "current" ? current : past;

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      {/* Profile Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
            {currentUser.avatar}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{currentUser.name}</h1>
            <p className="text-sm text-muted-foreground">{currentUser.bio}</p>
          </div>
        </div>
        <button className="p-2 rounded-xl bg-muted text-muted-foreground">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Active", value: current.length },
          { label: "Completed", value: past.length },
          { label: "Following", value: 6 },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl p-3 text-center border border-border/50">
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-xl p-1 mb-5">
        {(["current", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all relative ${
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t === "current" ? "Current" : "Past"}
          </button>
        ))}
      </div>

      {/* Quests */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {active.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">{tab === "current" ? "🗺️" : "📜"}</p>
            <p className="text-sm">
              {tab === "current" ? "No active quests — go start one!" : "No completed quests yet"}
            </p>
          </div>
        ) : (
          active.map((q, i) => <QuestCard key={q.id} quest={q} index={i} showGroup />)
        )}
      </motion.div>
    </div>
  );
};

export default Profile;
