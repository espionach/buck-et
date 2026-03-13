import { useAppStore } from "@/data/appState";
import { currentUser, Quest } from "@/data/mockData";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const CreateQuest = () => {
  const navigate = useNavigate();
  const { groups, addQuest } = useAppStore();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isFollowerOnly, setIsFollowerOnly] = useState(false);

  const handleCreate = () => {
    if (!title.trim()) return;
    const quest: Quest = {
      id: `q${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      createdBy: currentUser,
      groupId: selectedGroup || undefined,
      isFollowerOnly,
      participants: [currentUser],
      isDone: false,
      createdAt: new Date().toISOString().split("T")[0],
    };
    addQuest(quest);
    navigate(-1);
  };

  return (
    <div className="min-h-screen px-5 pt-14 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => (step === 1 ? navigate(-1) : setStep(1))}
          className="p-2 rounded-xl bg-muted text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">New Quest</h1>
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: step === 1 ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                What's the quest?
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Road trip to the coast 🏖️"
                className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-base"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Details (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes, time, meetup spot..."
                rows={3}
                className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none"
              />
            </div>

            <button
              onClick={() => title.trim() && setStep(2)}
              disabled={!title.trim()}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              Next — Choose Audience →
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">Who should see this quest?</p>

            {/* Follower only option */}
            <button
              onClick={() => {
                setIsFollowerOnly(true);
                setSelectedGroup(null);
              }}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                isFollowerOnly
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <p className="font-bold text-foreground">🌍 Followers Only</p>
              <p className="text-sm text-muted-foreground mt-1">
                Visible to all your approved followers
              </p>
            </button>

            {/* Group options */}
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setSelectedGroup(g.id);
                  setIsFollowerOnly(false);
                }}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                  selectedGroup === g.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <p className="font-bold text-foreground">
                  {g.emoji} {g.name}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {g.members.length} members
                </p>
              </button>
            ))}

            <button
              onClick={handleCreate}
              disabled={!isFollowerOnly && !selectedGroup}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform"
            >
              <Sparkles className="w-5 h-5" />
              Launch Quest
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CreateQuest;
