import { Quest, isQuestCompleted } from "@/data/mockData";
import { useAppStore } from "@/data/appState";
import { ALL_CONTRIBUTION_ROLES } from "@/data/contributionRoles";
import UserAvatar from "@/components/UserAvatar";
import GroupSwatch from "@/components/GroupSwatch";
import SidequestPhoto from "@/components/SidequestPhoto";
import MapPreview from "@/components/MapPreview";
import CommentThread from "@/components/CommentThread";
import EmptyState from "@/components/EmptyState";
import {
  ArrowLeft,
  Bike,
  Calendar,
  Car,
  ExternalLink,
  Flag,
  Footprints,
  Globe,
  HandMetal,
  Info,
  MapPin,
  MoreVertical,
  Share2,
  StickyNote,
  Train,
} from "lucide-react";

const transportIcons = {
  car: Car,
  bike: Bike,
  transit: Train,
  walk: Footprints,
  other: Car,
};
const transportLabels = {
  car: "Driving",
  bike: "Biking",
  transit: "Public Transit",
  walk: "Walking",
  other: "Other",
};

/**
 * Non-interactive mirror of the QuestDetail page used as a peek-preview
 * while the user swipes between sidequests. Visually identical to the
 * real page so neighbors don't read as "extra cards in the way".
 */
const QuestDetailPreview = ({ quest }: { quest: Quest }) => {
  const { groups, currentUser } = useAppStore();
  if (isQuestCompleted(quest)) return null;

  const group = quest.groupId ? groups.find((g) => g.id === quest.groupId) : null;
  const isOwner = quest.createdBy.id === currentUser.id;
  const isIn = quest.participants.some((p) => p.id === currentUser.id);
  const logistics = quest.logistics || { volunteers: [] };
  const TransportIcon = logistics.transportation ? transportIcons[logistics.transportation] : null;

  const selectedRoleIds = logistics.contributionRoles || [];
  const isCar = logistics.transportation === "car";
  const offeredRoles = ALL_CONTRIBUTION_ROLES.filter((r) => {
    if (r.id === "driver") return isCar;
    return selectedRoleIds.includes(r.id);
  });
  const showContributions = offeredRoles.length > 0 || logistics.volunteers.length > 0;
  const contributionsHeading = isCar ? "Carpool & Contributions" : "Contributions";

  const commentCount = (() => {
    const tally = (list: typeof quest.comments): number =>
      list.reduce((n, c) => n + 1 + (c.replies ? tally(c.replies) : 0), 0);
    return tally(quest.comments);
  })();

  return (
    <div className="min-h-screen pb-28 pointer-events-none select-none">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg px-5 pt-14 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 -ml-2 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">{quest.title}</h1>
            <p className="text-xs text-muted-foreground">
              {group ? (
                <span className="flex items-center gap-1">
                  <GroupSwatch color={group.color} size={12} />
                  {group.name}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Friends
                </span>
              )}
            </p>
          </div>

          {isOwner ? (
            <span className="shrink-0 flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
              Owner
            </span>
          ) : (
            <span
              className={`shrink-0 flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                isIn
                  ? "bg-background text-primary border border-primary"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {isIn ? "Joined" : "Join"}
            </span>
          )}

          <div className="p-1 -m-1 text-muted-foreground">
            <Share2 className="w-5 h-5" />
          </div>
          <div className="p-1 -m-1 text-muted-foreground">
            {isOwner ? <MoreVertical className="w-5 h-5" /> : <Flag className="w-5 h-5" />}
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4 mt-2">
        {/* Quest Card */}
        <div className="p-4 rounded-xl border border-border/50 bg-card space-y-4">
          <div className="flex items-center gap-2">
            <UserAvatar user={quest.createdBy} size="sm" />
            <div>
              <span className="text-sm font-bold text-foreground">{quest.createdBy.name}</span>
              <p className="text-[11px] text-muted-foreground">Sidequest Owner</p>
            </div>
          </div>

          {(logistics.date || logistics.location) && (
            <div className="space-y-2">
              {logistics.date && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{logistics.date}</span>
                  {logistics.time && <span className="text-muted-foreground">at {logistics.time}</span>}
                </div>
              )}
              {logistics.location && (
                <div className="flex items-center gap-2.5 text-sm flex-wrap">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-foreground flex-1 min-w-0">{logistics.location}</span>
                  {logistics.latitude != null && logistics.longitude != null && (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-muted text-foreground">
                      Open in Maps
                    </span>
                  )}
                </div>
              )}
              {logistics.location && logistics.latitude != null && logistics.longitude != null && (
                <MapPreview lat={logistics.latitude} lng={logistics.longitude} />
              )}
              {logistics.meetupSpot && (
                <div className="flex items-start gap-2.5 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Meet at: {logistics.meetupSpot}</span>
                </div>
              )}
            </div>
          )}

          {quest.description && (
            <p className="text-sm text-muted-foreground">{quest.description}</p>
          )}

          {quest.photos && quest.photos.length > 0 && (
            <div className="flex gap-2 overflow-x-hidden pb-1 -mx-4 px-4">
              {quest.photos.map((photo, i) => (
                <div
                  key={i}
                  className={`${quest.photos!.length === 1 ? "w-full aspect-[4/3]" : "w-64 h-64"} shrink-0 rounded-xl overflow-hidden border border-border/30`}
                >
                  <SidequestPhoto
                    src={photo}
                    alt={`Quest photo ${i + 1}`}
                    thumbnail
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {quest.links && quest.links.length > 0 && (
            <div className="space-y-1">
              {quest.links.map((link, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-primary truncate">
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{link}</span>
                </div>
              ))}
            </div>
          )}

          {/* Participants */}
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">
              Who's In ({quest.participants.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {quest.participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted text-xs"
                >
                  <UserAvatar user={p} size="xs" />
                  <span className="text-foreground font-medium">{p.name}</span>
                </div>
              ))}
            </div>
            {isOwner && (
              <div className="mt-3 w-full flex items-center justify-between gap-3 p-2.5 rounded-lg border border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2 min-w-0">
                  <HandMetal className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">Send a nudge</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Give friends a friendly poke to join or remember this quest.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-primary shrink-0">Nudge →</span>
              </div>
            )}
            {!isOwner && (
              <p className="mt-3 text-[11px] text-muted-foreground italic">
                Only {quest.createdBy.name.split(" ")[0]} can nudge people about this sidequest.
              </p>
            )}
          </div>
        </div>

        {/* Logistics */}
        <div className="p-4 rounded-xl border border-border/50 bg-card space-y-3">
          <h3 className="text-sm font-bold text-foreground">Sidequest Details</h3>
          <div className="space-y-2.5">
            {logistics.transportation && TransportIcon && (
              <div className="flex items-center gap-2.5 text-sm">
                <TransportIcon className="w-4 h-4 text-primary" />
                <span className="text-foreground">{transportLabels[logistics.transportation]}</span>
                {logistics.carpoolSlots && logistics.transportation === "car" && (
                  <span className="text-muted-foreground text-xs">
                    ({logistics.carpoolSlots} seats available)
                  </span>
                )}
              </div>
            )}
            {logistics.customNotes && (
              <p className="text-xs text-muted-foreground mt-2 p-2.5 rounded-lg bg-muted/50 flex items-start gap-1.5">
                <StickyNote className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {logistics.customNotes}
              </p>
            )}
            {!logistics.date &&
              !logistics.location &&
              !logistics.transportation &&
              !logistics.customNotes && (
                <EmptyState
                  icon={Info}
                  title="No details yet"
                  description={isOwner ? "Add a time, place, or anything people should know." : undefined}
                  size="sm"
                />
              )}
          </div>
        </div>

        {/* Contributions */}
        {showContributions && (
          <div className="p-4 rounded-xl border border-border/50 bg-card space-y-3">
            <h3 className="text-sm font-bold text-foreground">{contributionsHeading}</h3>
            {logistics.volunteers.length > 0 && (
              <div className="space-y-2">
                {logistics.volunteers.map((v) => (
                  <div key={v.userId} className="flex items-center gap-2 p-2 rounded-xl bg-muted/50">
                    <UserAvatar user={v.user} size="xs" />
                    <span className="text-xs font-medium text-foreground">{v.user.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/20 text-secondary ml-auto">
                      {ALL_CONTRIBUTION_ROLES.find((r) => r.id === v.role)?.label || v.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {offeredRoles.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">How can you help?</p>
                <div className="flex flex-wrap gap-2">
                  {offeredRoles.map((role) => (
                    <span
                      key={role.id}
                      className="px-3 py-1.5 rounded-full bg-muted text-xs text-foreground"
                    >
                      {role.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comments */}
        <div className="p-4 rounded-xl border border-border/50 bg-card space-y-3">
          <h3 className="text-sm font-bold text-foreground">
            Comments {commentCount > 0 ? `(${commentCount})` : ""}
          </h3>
          <CommentThread quest={quest} />
        </div>
      </div>
    </div>
  );
};

export default QuestDetailPreview;
