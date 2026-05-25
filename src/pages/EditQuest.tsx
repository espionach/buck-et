import { useAppStore } from "@/data/appState";
import { useAuth } from "@/contexts/AuthContext";
import { Quest, User } from "@/data/mockData";
import { ALL_CONTRIBUTION_ROLES } from "@/data/contributionRoles";
import { ArrowLeft, ChevronDown, ImagePlus, Link as LinkIcon, X, Globe, Check, Trash2 } from "lucide-react";
import GroupSwatch from "@/components/GroupSwatch";
import LocationPicker, { type LocationValue } from "@/components/LocationPicker";
import { TimePicker } from "@/components/TimePicker";
import UserAvatar from "@/components/UserAvatar";
import SidequestPhoto from "@/components/SidequestPhoto";
import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { uploadSidequestPhotos } from "@/lib/uploads";
import { toast } from "sonner";
import { validateContent } from "@/lib/contentFilter";
import { usePopup } from "@/hooks/use-popup";

const EditQuest = () => {
  const navigate = useNavigate();
  const { questId } = useParams<{ questId: string }>();
  const { user: authUser } = useAuth();
  const {
    quests,
    groups,
    currentUser,
    updateQuest,
    deleteQuest,
    removeParticipant,
    setHideGlobalFab,
  } = useAppStore();

  const quest = useMemo(() => quests.find((q) => q.id === questId), [quests, questId]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState<User[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState<LocationValue>({ text: "" });
  const [meetupSpot, setMeetupSpot] = useState("");
  const [meetupOpen, setMeetupOpen] = useState(false);
  const [transportation, setTransportation] = useState<string>("");
  const [carpoolSlots, setCarpoolSlots] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [contributionRoles, setContributionRoles] = useState<string[]>([]);

  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmRemoveUser, setConfirmRemoveUser] = useState<{ userId: string; userName: string } | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);

  // Seed state from quest once loaded
  useEffect(() => {
    if (!quest) return;
    setTitle(quest.title);
    setDescription(quest.description || "");
    setParticipants([...quest.participants]);
    setPhotos(quest.photos || []);
    setLinks(quest.links || []);
    const lg = quest.logistics;
    setDate(lg?.date || "");
    setTime(lg?.time || "");
    setLocation({
      text: lg?.location || "",
      latitude: lg?.latitude,
      longitude: lg?.longitude,
      placeId: lg?.placeId,
    });
    setMeetupSpot(lg?.meetupSpot || "");
    setMeetupOpen(!!lg?.meetupSpot);
    setTransportation(lg?.transportation || "");
    setCarpoolSlots(lg?.carpoolSlots?.toString() || "");
    setCustomNotes(lg?.customNotes || "");
    setContributionRoles(lg?.contributionRoles || []);
    setSelectedGroup(quest.groupId || null);
  }, [quest?.id]);

  useEffect(() => {
    setHideGlobalFab(true);
    return () => setHideGlobalFab(false);
  }, [setHideGlobalFab]);

  usePopup(!!showDeleteConfirm || !!confirmRemoveUser);

  if (!quest) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Sidequest not found.
      </div>
    );
  }

  // Permission: only owner can edit
  if (quest.createdBy.id !== currentUser.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-3">
        <p className="text-sm text-muted-foreground">Only the owner can edit this sidequest.</p>
        <button onClick={() => navigate(-1)} className="text-sm text-primary font-semibold">Go back</button>
      </div>
    );
  }

  const selectedGroupData = groups.find((g) => g.id === selectedGroup);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (!files.length) return;
    setUploadingPhotos(true);
    try {
      const paths = await uploadSidequestPhotos(quest.id, files);
      setPhotos((prev) => [...prev, ...paths]);
    } catch (err: any) {
      toast.error(err?.message || "Couldn't upload photos. Try again?");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleAddLink = () => {
    if (!newLink.trim()) return;
    setLinks((prev) => [...prev, newLink.trim()]);
    setNewLink("");
  };

  const toggleContributionRole = (id: string) => {
    setContributionRoles((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    const violation = validateContent(title, description, customNotes, ...links);
    if (violation) {
      toast.error(violation);
      return;
    }
    const removedUsers = quest.participants.filter(
      (p) => !participants.some((ep) => ep.id === p.id)
    );
    removedUsers.forEach((u) => removeParticipant(quest.id, u.id));

    const hasLogistics =
      date || time || location.text || meetupSpot || transportation || customNotes || contributionRoles.length > 0;

    updateQuest(quest.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      links: links.length > 0 ? links : undefined,
      photos: photos.length > 0 ? photos : undefined,
      groupId: selectedGroup || undefined,
      isFollowerOnly: !selectedGroup,
      logistics: hasLogistics
        ? {
            ...(quest.logistics || {}),
            date: date || undefined,
            time: time || undefined,
            location: location.text || undefined,
            latitude: location.latitude,
            longitude: location.longitude,
            placeId: location.placeId,
            meetupSpot: meetupSpot || undefined,
            transportation: (transportation as any) || undefined,
            carpoolSlots: carpoolSlots ? parseInt(carpoolSlots) : undefined,
            volunteers: quest.logistics?.volunteers || [],
            customNotes: customNotes || undefined,
            contributionRoles: contributionRoles.length > 0 ? contributionRoles : undefined,
          }
        : undefined,
    });
    navigate(`/quest/${quest.id}`);
  };

  const handleDelete = () => {
    deleteQuest(quest.id);
    setShowDeleteConfirm(false);
    navigate("/profile");
  };

  return (
    <div className="min-h-screen px-5 pt-14 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-muted text-muted-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Edit Sidequest</h1>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
          aria-label="Delete sidequest"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Group selector dropdown */}
      <div className="relative mb-5">
        <button
          type="button"
          onClick={() => setShowGroupDropdown(!showGroupDropdown)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border text-sm"
        >
          <span className="text-foreground font-medium">
            {selectedGroupData ? (
              <span className="flex items-center gap-1.5">
                <GroupSwatch color={selectedGroupData.color} size={16} />
                {selectedGroupData.name}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                All Friends
              </span>
            )}
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

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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
            />
          </div>

          {/* Date / Time / Location */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
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

          {/* Participants — only differs from CreateQuest. Sits right under date/time/location. */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Participants</label>
            <div className="space-y-1.5">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={p} size="xs" />
                    <span className="text-sm text-foreground">{p.name}</span>
                    {p.id === quest.createdBy.id && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Owner</span>
                    )}
                  </div>
                  {p.id !== quest.createdBy.id && (
                    <button
                      onClick={() =>
                        setConfirmRemoveUser({ userId: p.id, userName: p.name })
                      }
                      className="p-1 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label={`Remove ${p.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {participants.length === 0 && (
                <p className="text-xs text-muted-foreground">No participants yet.</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes, meetup spot..."
              rows={3}
              className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none"
            />
          </div>

          {/* Photos & Videos */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">Photos & Videos</label>
            <div className="flex flex-wrap gap-2">
              {photos.map((photo, i) => (
                <div key={i} className="relative group">
                  <SidequestPhoto
                    src={photo}
                    alt={`Photo ${i + 1}`}
                    className="w-28 h-28 rounded-xl object-cover border border-border/30"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-foreground/60 text-background"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhotos}
                className="w-28 h-28 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
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

          {/* Sidequest Details — collapsible */}
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
            {detailsOpen && (
              <>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Transportation</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "car", label: "Car" },
                      { id: "bike", label: "Bike" },
                      { id: "transit", label: "Transit" },
                      { id: "walk", label: "Walk" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
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
                    <input
                      type="number"
                      value={carpoolSlots}
                      onChange={(e) => setCarpoolSlots(e.target.value)}
                      placeholder="e.g. 4"
                      className="w-24 px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                )}

                {/* Contributions */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">
                    Contributions{" "}
                    {contributionRoles.length > 0 && (
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
                      <button
                        type="button"
                        onClick={() => setLinks((prev) => prev.filter((_, idx) => idx !== i))}
                      >
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

                {/* Additional Notes — last */}
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Additional Notes</label>
                  <textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Anything else everyone should know?"
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Floating Save button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-6 pt-3 bg-background">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base disabled:opacity-40 active:scale-[0.98] transition-transform shadow-lg"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-foreground/40 flex items-center justify-center p-5"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowDeleteConfirm(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xs bg-card rounded-xl p-5 space-y-4 shadow-lg text-center"
            >
              <p className="text-sm font-bold text-foreground">Delete this sidequest?</p>
              <p className="text-xs text-muted-foreground">
                This sidequest will be permanently deleted for everyone. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm remove participant */}
      <AnimatePresence>
        {confirmRemoveUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-foreground/40 flex items-center justify-center p-5"
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmRemoveUser(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-xs bg-card rounded-xl p-5 space-y-4 shadow-lg text-center"
            >
              <p className="text-sm font-semibold text-foreground">
                Remove <span className="text-primary">{confirmRemoveUser.userName}</span> from{" "}
                <span className="text-primary">{quest.title}</span>?
              </p>
              <p className="text-xs text-muted-foreground">
                They'll be removed from this sidequest but can rejoin later.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmRemoveUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setParticipants((prev) => prev.filter((p) => p.id !== confirmRemoveUser.userId));
                    setConfirmRemoveUser(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EditQuest;
