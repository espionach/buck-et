import { useAppStore } from "@/data/appState";
import { Quest } from "@/data/mockData";
import { ALL_CONTRIBUTION_ROLES } from "@/data/contributionRoles";
import { ArrowLeft, Sparkles, ChevronDown, ImagePlus, Link as LinkIcon, X, Globe, Check } from "lucide-react";
import { GroupIconDisplay } from "@/components/GroupIcon";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { uploadSidequestPhotos } from "@/lib/uploads";
import { toast } from "sonner";

const CreateQuest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedGroup = searchParams.get("groupId");
  const { groups, addQuest, currentUser } = useAppStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(preselectedGroup);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  // Logistics fields
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [meetupSpot, setMeetupSpot] = useState("");
  const [transportation, setTransportation] = useState<string>("");
  const [carpoolSlots, setCarpoolSlots] = useState("");
  const [customNotes, setCustomNotes] = useState("");

  // Photos & links — keep raw Files until the sidequest row exists, then upload
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  // Revoke object URLs when component unmounts or list changes
  useEffect(() => {
    return () => {
      photoPreviews.forEach((u) => {
        if (u.startsWith("blob:")) URL.revokeObjectURL(u);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Contributions the creator wants to open up for sign-ups
  const [contributionRoles, setContributionRoles] = useState<string[]>([]);

  const toggleContributionRole = (id: string) => {
    setContributionRoles((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const selectedGroupData = groups.find((g) => g.id === selectedGroup);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (!files.length) return;
    setPendingPhotos((prev) => [...prev, ...files]);
    setPhotoPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removePendingPhoto = (idx: number) => {
    setPhotoPreviews((prev) => {
      const removed = prev[idx];
      if (removed?.startsWith("blob:")) URL.revokeObjectURL(removed);
      return prev.filter((_, i) => i !== idx);
    });
    setPendingPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddLink = () => {
    if (!newLink.trim()) return;
    setLinks((prev) => [...prev, newLink.trim()]);
    setNewLink("");
  };

  const handleCreate = async () => {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    const hasDate = !!(date || time || location || meetupSpot || transportation || customNotes || contributionRoles.length > 0);
    try {
      // 1. Insert the sidequest row first so we get a real id and storage RLS allows uploads.
      const { data: inserted, error: insertErr } = await supabase
        .from("sidequests")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          created_by: currentUser.id,
          group_id: selectedGroup || null,
          is_friends_only: !selectedGroup,
          photos: [],
          links: links.length > 0 ? links : [],
          logistics_date: date || null,
          logistics_time: time || null,
          logistics_location: location || null,
          logistics_meetup_spot: meetupSpot || null,
          logistics_transportation: transportation || null,
          logistics_carpool_slots: carpoolSlots ? parseInt(carpoolSlots) : null,
          logistics_custom_notes: customNotes || null,
          contribution_roles: contributionRoles,
        })
        .select()
        .single();

      if (insertErr || !inserted) throw insertErr || new Error("Could not create sidequest");
      const questId = inserted.id as string;

      // 2. Add creator as participant.
      await supabase.from("sidequest_participants").insert({
        sidequest_id: questId,
        user_id: currentUser.id,
      });

      // 3. Upload any pending photos under the new quest id.
      let uploadedPaths: string[] = [];
      if (pendingPhotos.length > 0) {
        try {
          uploadedPaths = await uploadSidequestPhotos(questId, pendingPhotos);
          if (uploadedPaths.length > 0) {
            await supabase
              .from("sidequests")
              .update({ photos: uploadedPaths })
              .eq("id", questId);
          }
        } catch (err: any) {
          toast.error("Sidequest created, but photos failed to upload.");
        }
      }

      // 4. Sync local store so the new quest shows up immediately.
      const localQuest: Quest = {
        id: questId,
        title: title.trim(),
        description: description.trim() || undefined,
        createdBy: currentUser,
        groupId: selectedGroup || undefined,
        isFollowerOnly: !selectedGroup,
        participants: [currentUser],
        completedByUserIds: [],
        createdAt: new Date().toISOString().split("T")[0],
        comments: [],
        photos: uploadedPaths.length > 0 ? uploadedPaths : undefined,
        links: links.length > 0 ? links : undefined,
        logistics: hasDate ? {
          date: date || undefined,
          time: time || undefined,
          location: location || undefined,
          meetupSpot: meetupSpot || undefined,
          transportation: (transportation as any) || undefined,
          carpoolSlots: carpoolSlots ? parseInt(carpoolSlots) : undefined,
          volunteers: [],
          customNotes: customNotes || undefined,
          contributionRoles: contributionRoles.length > 0 ? contributionRoles : undefined,
        } : undefined,
      };
      // Push directly into the store without re-inserting in the DB.
      const { quests, _invalidate } = useAppStore.getState() as any;
      useAppStore.setState({ quests: [localQuest, ...quests] });
      _invalidate?.(["quests"]);

      if (selectedGroup) {
        navigate(`/groups?open=${selectedGroup}`, { replace: true, state: { justAddedQuestId: questId } });
      } else {
        navigate("/profile", { replace: true, state: { justAddedQuestId: questId } });
      }
    } catch (err: any) {
      toast.error(err?.message || "Couldn't create sidequest. Try again?");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-5 pt-14 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-muted text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-foreground">New Sidequest</h1>
      </div>

      {/* Group selector dropdown */}
      <div className="relative mb-5">
        <button
          type="button"
          onClick={() => setShowGroupDropdown(!showGroupDropdown)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border text-sm"
        >
          <span className="text-foreground font-medium">
            {selectedGroupData
              ? <span className="flex items-center gap-1.5"><GroupIconDisplay icon={selectedGroupData.emoji} size={16} className="text-foreground" />{selectedGroupData.name}</span>
              : <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" />Friends Only</span>}
          </span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showGroupDropdown ? "rotate-180" : ""}`} />
        </button>

        {showGroupDropdown && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setSelectedGroup(null);
                setShowGroupDropdown(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                !selectedGroup ? "bg-primary/5 text-primary font-semibold" : "text-foreground hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" />Friends Only</span>
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  setSelectedGroup(g.id);
                  setShowGroupDropdown(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  selectedGroup === g.id ? "bg-primary/5 text-primary font-semibold" : "text-foreground hover:bg-muted"
                }`}
              >
                <span className="flex items-center gap-1.5"><GroupIconDisplay icon={g.emoji} size={14} className="text-foreground" />{g.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">
              What's the sidequest?
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
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes, time, meetup spot..."
              rows={3}
              className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none"
            />
          </div>

          {/* Quest Details - always visible */}
          <div className="space-y-3">
            <span className="text-sm font-semibold text-foreground">Sidequest Details (optional)</span>

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
                  { id: "car", label: "Car" },
                  { id: "bike", label: "Bike" },
                  { id: "transit", label: "Transit" },
                  { id: "walk", label: "Walk" },
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

            {/* Contributions — let other users sign up to help */}
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">
                Contributions {contributionRoles.length > 0 && (
                  <span className="text-muted-foreground/70">· {contributionRoles.length} selected</span>
                )}
              </label>
              <p className="text-[11px] text-muted-foreground mb-2">
                Pick what others can sign up to bring or do.
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_CONTRIBUTION_ROLES.map((role) => {
                  const selected = contributionRoles.includes(role.id);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleContributionRole(role.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" />}
                      {role.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photos & Videos */}
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Photos & Videos</label>
              <div className="flex flex-wrap gap-2">
                {photoPreviews.map((preview, i) => {
                  const file = pendingPhotos[i];
                  const isVideo = file?.type?.startsWith("video/");
                  return (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden">
                      {isVideo ? (
                        <video src={preview} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removePendingPhoto(i)}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-foreground/60 text-background"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-16 h-16 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ImagePlus className="w-5 h-5" />
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Links */}
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Links</label>
              {links.map((link, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-primary truncate flex-1">{link}</span>
                  <button type="button" onClick={() => setLinks((prev) => prev.filter((_, idx) => idx !== i))}>
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddLink())}
                  placeholder="Paste a URL..."
                  className="flex-1 px-3 py-2 rounded-xl bg-muted border-none text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={handleAddLink}
                  disabled={!newLink.trim()}
                  className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Launch Quest button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-6 pt-3 bg-background">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            Launch Sidequest
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateQuest;
