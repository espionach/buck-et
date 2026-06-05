import { useAppStore } from "@/data/appState";
import { useAuth } from "@/contexts/AuthContext";
import { completeOnboarding } from "@/hooks/useOnboarding";
import { Quest } from "@/data/mockData";
import { ALL_CONTRIBUTION_ROLES } from "@/data/contributionRoles";
import { ArrowLeft, Sparkles, ChevronDown, ImagePlus, Link as LinkIcon, X, Globe, Check, Clock, Rocket, FileText } from "lucide-react";
import GroupSwatch from "@/components/GroupSwatch";
import LocationPicker, { type LocationValue } from "@/components/LocationPicker";
import { TimePicker } from "@/components/TimePicker";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { uploadSidequestPhotos } from "@/lib/uploads";
import { toast } from "sonner";
import { getUserFriendlyError } from "@/lib/errorMapping";
import { deleteDraft, getDraft, newDraftId, saveDraft, draftHasContent } from "@/lib/drafts";

const CreateQuest = () => {
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const fromPath = (routeLocation.state as { from?: string } | null)?.from;
  const [searchParams] = useSearchParams();
  const preselectedGroup = searchParams.get("groupId");
  const isOnboarding = searchParams.get("onboarding") === "1";
  const { user } = useAuth();
  const { groups, addQuest, currentUser } = useAppStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(preselectedGroup);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  // Logistics fields
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState<LocationValue>({ text: "" });
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [meetupOpen, setMeetupOpen] = useState(false);

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

  // Draft tracking — stable id, hydration on mount, autosave on unmount
  const draftIdRef = useRef<string>(searchParams.get("draftId") || newDraftId());
  const submittedRef = useRef(false);
  const hydratedRef = useRef(false);

  // Hydrate from existing draft (once)
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const id = searchParams.get("draftId");
    if (!id || !currentUser?.id) return;
    const d = getDraft(currentUser.id, id);
    if (!d) return;
    setTitle(d.title);
    setDescription(d.description);
    setSelectedGroup(d.groupId);
    setDate(d.date);
    setTime(d.time);
    setLocation(d.location);
    setMeetupSpot(d.meetupSpot);
    if (d.meetupSpot) setMeetupOpen(true);
    setTransportation(d.transportation);
    setCarpoolSlots(d.carpoolSlots);
    setCustomNotes(d.customNotes);
    setLinks(d.links);
    setContributionRoles(d.contributionRoles);
    if (d.transportation || d.carpoolSlots || d.customNotes || d.links.length || d.contributionRoles.length) {
      setDetailsOpen(true);
    }
    if (d.photoPlaceholderCount > 0) {
      toast(`${d.photoPlaceholderCount} photo${d.photoPlaceholderCount > 1 ? "s" : ""} from your draft need to be re-added.`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Keep a live ref of all field values for the unmount autosave
  const stateRef = useRef({
    title, description, selectedGroup, date, time, location, meetupSpot,
    transportation, carpoolSlots, customNotes, links, contributionRoles,
    pendingPhotosCount: pendingPhotos.length,
  });
  stateRef.current = {
    title, description, selectedGroup, date, time, location, meetupSpot,
    transportation, carpoolSlots, customNotes, links, contributionRoles,
    pendingPhotosCount: pendingPhotos.length,
  };

  // Autosave on exit
  useEffect(() => {
    return () => {
      if (!currentUser?.id) return;
      const id = draftIdRef.current;
      if (submittedRef.current) {
        deleteDraft(currentUser.id, id);
        return;
      }
      const s = stateRef.current;
      const payload = {
        id,
        userId: currentUser.id,
        updatedAt: new Date().toISOString(),
        title: s.title,
        description: s.description,
        groupId: s.selectedGroup,
        date: s.date,
        time: s.time,
        location: s.location,
        meetupSpot: s.meetupSpot,
        transportation: s.transportation,
        carpoolSlots: s.carpoolSlots,
        customNotes: s.customNotes,
        links: s.links,
        contributionRoles: s.contributionRoles,
        photoPlaceholderCount: s.pendingPhotosCount,
      };
      if (draftHasContent(payload)) {
        saveDraft(payload);
      } else {
        deleteDraft(currentUser.id, id);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

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
    if (!user?.id) {
      toast.error("Still signing you in. Try again in a moment.");
      return;
    }
    const { validateContent } = await import("@/lib/contentFilter");
    const violation = validateContent(title, description, customNotes, ...links);
    if (violation) {
      toast.error(violation);
      return;
    }
    setSubmitting(true);
    const hasDate = !!(date || time || location.text || meetupSpot || transportation || customNotes || contributionRoles.length > 0);
    try {
      // 1. Insert the sidequest row first so we get a real id and storage RLS allows uploads.
      const { data: inserted, error: insertErr } = await supabase
        .from("sidequests")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          created_by: user.id,
          group_id: selectedGroup || null,
          is_friends_only: !selectedGroup,
          photos: [],
          links: links.length > 0 ? links : [],
          logistics_date: date || null,
          logistics_time: time || null,
          logistics_location: location.text || null,
          logistics_latitude: location.latitude ?? null,
          logistics_longitude: location.longitude ?? null,
          logistics_place_id: location.placeId ?? null,
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
        user_id: user.id,
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
          location: location.text || undefined,
          latitude: location.latitude,
          longitude: location.longitude,
          placeId: location.placeId,
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

      // If we're finishing onboarding via this quest, mark it complete first.
      if (isOnboarding && user) {
        await completeOnboarding(user.id);
      }
      submittedRef.current = true;
      if (isOnboarding) {
        // After their first sidequest, send them to their profile so they
        // can see it sitting in their Active list.
        navigate("/profile", { replace: true, state: { justAddedQuestId: questId } });
      } else {
        navigate("/profile", { replace: true, state: { justAddedQuestId: questId } });
      }
    } catch (err: any) {
      console.error("[CreateQuest]", err);
      toast.error(getUserFriendlyError("sidequest", err?.message || ""));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-5 pt-14 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() =>
            isOnboarding
              ? navigate("/onboarding/tour", { replace: true })
              : searchParams.get("draftId")
                ? navigate("/drafts")
                : fromPath
                  ? navigate(fromPath)
                  : navigate(-1)
          }
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          {isOnboarding && (
            <div className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-1">
              Last step
            </div>
          )}
          <h1 className="text-xl font-bold text-foreground">
            {isOnboarding ? "Create your first sidequest" : "New Sidequest"}
          </h1>
        </div>
        {isOnboarding && user && (
          <button
            onClick={async () => {
              await completeOnboarding(user.id);
              navigate("/", { replace: true });
            }}
            className="text-xs font-medium text-muted-foreground active:text-foreground"
          >
            Skip
          </button>
        )}
      </div>

      {isOnboarding && (
        <p className="text-sm text-muted-foreground -mt-4 mb-6">
          Even just a title works — you can add details later. Or skip and head to the app.
        </p>
      )}

      {/* Group selector dropdown */}
      <div className="relative mb-5">
        <button
          type="button"
          onClick={() => setShowGroupDropdown(!showGroupDropdown)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border text-sm"
        >
          <span className="text-foreground font-medium">
            {selectedGroupData
              ? <span className="flex items-center gap-1.5"><GroupSwatch color={selectedGroupData.color} size={16} />{selectedGroupData.name}</span>
              : <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" />All Friends</span>}
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
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" />All Friends</span>
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
                <span className="flex items-center gap-1.5"><GroupSwatch color={g.color} size={14} />{g.name}</span>
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
              What's the sidequest? <span className="text-destructive">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Beach trip, cafe hopping, etc."
              className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-base"
              autoFocus
            />
          </div>

          {/* Date / Time / Location — always visible between title and description */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="relative">
                <label className="text-[11px] text-muted-foreground mb-1 block">Time</label>
                <TimePicker value={time} onChange={setTime} />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Location</label>
              <LocationPicker
                value={location}
                onChange={setLocation}
                placeholder="Where's this happening?"
              />
            </div>
            <div className="ml-2">
              {!meetupOpen ? (
                <button
                  type="button"
                  onClick={() => setMeetupOpen(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  + Add meetup spot
                </button>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-muted-foreground">Meetup Spot</label>
                    <button
                      type="button"
                      onClick={() => setMeetupOpen(false)}
                      className="text-[11px] text-muted-foreground hover:text-primary font-medium"
                    >
                      − Hide
                    </button>
                  </div>
                  <input
                    type="text"
                    value={meetupSpot}
                    onChange={(e) => setMeetupSpot(e.target.value)}
                    placeholder="Where should everyone meet?"
                    autoFocus
                    className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes, meetup spot..."
              rows={3}
              className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none"
            />
          </div>

          {/* Photos & Videos — right after description for a more visual feel */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Photos & Videos</label>
            <div className="flex flex-wrap gap-2">
              {photoPreviews.map((preview, i) => {
                const file = pendingPhotos[i];
                const isVideo = file?.type?.startsWith("video/");
                return (
                  <div key={i} className="relative w-28 h-28 rounded-xl overflow-hidden">
                    {isVideo ? (
                      <video src={preview} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => removePendingPhoto(i)}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-foreground/60 text-background"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="w-28 h-28 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ImagePlus className="w-6 h-6" />
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

          {/* Quest Details - collapsible (date/time/location now live above) */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-sm font-semibold text-foreground">Sidequest Details</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {detailsOpen ? "Hide" : "Optional"}
                <ChevronDown className={`w-4 h-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
              </span>
            </button>
            {detailsOpen && (<>

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
                  className="flex-1 px-3 py-2 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
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

            {/* Additional Notes — last */}
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Additional Notes</label>
              <textarea value={customNotes} onChange={(e) => setCustomNotes(e.target.value)} placeholder="Anything else everyone should know?"
                rows={2} className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
            </div>
            </>)}
          </div>
        </div>
      </motion.div>

      {/* Floating action buttons */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-6 pt-3 bg-background">
        <div className="max-w-md mx-auto flex gap-3">
          <button
            onClick={() => navigate(-1)}
            disabled={submitting}
            className="flex-1 py-4 rounded-xl bg-muted text-foreground font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform shadow-sm"
          >
            <FileText className="w-5 h-5" />
            Drafts
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || submitting}
            className="flex-1 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform shadow-lg"
          >
            <Rocket className="w-5 h-5" />
            {submitting ? "Launching…" : "Launch"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateQuest;
