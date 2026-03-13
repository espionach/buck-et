import { useAppStore } from "@/data/appState";
import { currentUser } from "@/data/mockData";
import GroupCard from "@/components/GroupCard";
import QuestCard from "@/components/QuestCard";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Home = () => {
  const { groups, quests } = useAppStore();
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const groupQuests = selectedGroup
    ? quests.filter((q) => q.groupId === selectedGroup && !q.isDone)
    : [];

  const selectedGroupData = groups.find((g) => g.id === selectedGroup);

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">Hey, {currentUser.name.split(" ")[0]} 👋</p>
        <h1 className="text-2xl font-bold text-foreground">Your Quest Boards</h1>
      </div>

      <AnimatePresence mode="wait">
        {!selectedGroup ? (
          <motion.div
            key="groups"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Group Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {groups.map((group, i) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  index={i}
                  onClick={() => setSelectedGroup(group.id)}
                />
              ))}
            </div>

            {/* New Group Button */}
            <button
              onClick={() => {/* TODO: create group flow */}}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold text-sm">New Group</span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="board"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            {/* Board Header */}
            <button
              onClick={() => setSelectedGroup(null)}
              className="text-sm text-primary font-semibold mb-4"
            >
              ← All Boards
            </button>

            <div className="flex items-center gap-3 mb-5">
              <span className="text-4xl">{selectedGroupData?.emoji}</span>
              <div>
                <h2 className="text-xl font-bold text-foreground">{selectedGroupData?.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedGroupData?.members.length} members • {groupQuests.length} active
                </p>
              </div>
            </div>

            {/* Quest list */}
            <div className="space-y-3">
              {groupQuests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg mb-1">No active quests yet</p>
                  <p className="text-sm">Start one for the crew! 🚀</p>
                </div>
              ) : (
                groupQuests.map((q, i) => <QuestCard key={q.id} quest={q} index={i} />)
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
