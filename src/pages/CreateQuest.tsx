import { useAppStore } from "@/data/appState";
import { currentUser, Quest } from "@/data/mockData";
import { ArrowLeft, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";

const CreateQuest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedGroup = searchParams.get("groupId");
  const { groups, addQuest } = useAppStore();

  const isInBoardCreation = !!preselectedGroup;
  const [step, setStep] = useState(isInBoardCreation ? 1 : 1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(preselectedGroup);
  const [isFollowerOnly, setIsFollowerOnly] = useState(false);

  // Logistics fields
  const [showLogistics, setShowLogistics] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [meetupSpot, setMeetupSpot] = useState("");
  const [transportation, setTransportation] = useState<string>("");
  const [carpoolSlots, setCarpoolSlots] = useState("");
  const [customNotes, setCustomNotes] = useState("");

  const handleCreate = () => {
    if (!title.trim()) return;
    const quest: Quest = {
      id: `q${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      createdBy: currentUser,
      groupId: selectedGroup || undefined,
      isFollowerOnly: isInBoardCreation ? false : isFollowerOnly,
      participants: [currentUser],
      isDone: false,
      createdAt: new Date().toISOString().split("T")[0],
      comments: [],
      logistics: (date || time || location || meetupSpot || transportation || customNotes) ? {
        date: date || undefined,
        time: time || undefined,
        location: location || undefined,
        meetupSpot: meetupSpot || undefined,
        transportation: (transportation as any) || undefined,
        carpoolSlots: carpoolSlots ? parseInt(carpoolSlots) : undefined,
        volunteers: [],
        customNotes: customNotes || undefined,
      } : undefined,
    };
    addQuest(quest);

    if (selectedGroup) {
      navigate(`/boards?open=${selectedGroup}`, { replace: true });
    } else {
      navigate("/profile", { replace: true });
    }
  };

  const logisticsSection = (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setShowLogistics(!showLogistics)}
        className="flex items-center justify-between w-full text-sm font-semibold text-foreground"
      >
        <span>📋 Quest Details (optional)</span>
        {showLogistics ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {showLogistics && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 overflow-hidden">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Time</label>
              <input type="text" value={time} onChange={(e) => setTime(e.target.value)} placeholder="e.g. 6:00 PM"
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where's this happening?"
              className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Meetup Spot</label>
            <input type="text" value={meetupSpot} onChange={(e) => setMeetupSpot(e.target.value)} placeholder="Where should everyone meet?"
              className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Transportation</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "car", label: "🚗 Car" },
                { id: "bike", label: "🚲 Bike" },
                { id: "transit", label: "🚇 Transit" },
                { id: "walk", label: "🚶 Walk" },
              ].map((t) => (
                <button key={t.id} type="button"
                  onClick={() => setTransportation(transportation === t.id ? "" : t.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    transportation === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {transportation === "car" && (
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Carpool Seats Available</label>
              <input type="number" value={carpoolSlots} onChange={(e) => setCarpoolSlots(e.target.value)} placeholder="e.g. 4"
                className="w-24 px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          )}

          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Additional Notes</label>
            <textarea value={customNotes} onChange={(e) => setCustomNotes(e.target.value)} placeholder="Anything else everyone should know?"
              rows={2} className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
        </motion.div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen px-5 pt-14 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => (step === 1 || isInBoardCreation ? navigate(-1) : setStep(1))}
          className="p-2 rounded-xl bg-muted text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">New Quest</h1>
          {isInBoardCreation && (
            <p className="text-xs text-muted-foreground">
              For {groups.find((g) => g.id === preselectedGroup)?.emoji}{" "}
              {groups.find((g) => g.id === preselectedGroup)?.name}
            </p>
          )}
        </div>
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

            {logisticsSection}

            {isInBoardCreation ? (
              <button
                onClick={handleCreate}
                disabled={!title.trim()}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform"
              >
                <Sparkles className="w-5 h-5" />
                Launch Quest
              </button>
            ) : (
              <button
                onClick={() => title.trim() && setStep(2)}
                disabled={!title.trim()}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base disabled:opacity-40 active:scale-[0.98] transition-transform"
              >
                Next — Choose Audience →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">Who should see this quest?</p>

            <button
              onClick={() => {
                setIsFollowerOnly(true);
                setSelectedGroup(null);
              }}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                isFollowerOnly
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <p className="font-bold text-foreground">🌍 Friends Only</p>
              <p className="text-sm text-muted-foreground mt-1">
                Visible to all your friends
              </p>
            </button>

            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  setSelectedGroup(g.id);
                  setIsFollowerOnly(false);
                }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
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
