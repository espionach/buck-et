import { Quest } from "@/data/mockData";
import { useAppStore } from "@/data/appState";
import UserAvatar from "@/components/UserAvatar";
import GroupSwatch from "@/components/GroupSwatch";
import SidequestPhoto from "@/components/SidequestPhoto";
import { ArrowLeft, Calendar, Globe, MapPin } from "lucide-react";

/**
 * Lightweight, non-interactive preview of a sidequest. Rendered off-screen
 * to the left/right of the live QuestDetail so users see a peek of the
 * neighboring sidequest while swiping between them.
 */
const QuestDetailPreview = ({ quest }: { quest: Quest }) => {
  const { groups } = useAppStore();
  const group = quest.groupId ? groups.find((g) => g.id === quest.groupId) : null;
  const logistics = quest.logistics;
  const firstPhoto = quest.photos?.[0];

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
        </div>
      </div>

      <div className="px-5 space-y-4 mt-2">
        <div className="p-4 rounded-xl border border-border/50 bg-card space-y-4">
          <div className="flex items-center gap-2">
            <UserAvatar user={quest.createdBy} size="sm" />
            <div>
              <span className="text-sm font-bold text-foreground">{quest.createdBy.name}</span>
              <p className="text-[11px] text-muted-foreground">Sidequest Owner</p>
            </div>
          </div>

          {(logistics?.date || logistics?.location) && (
            <div className="space-y-2">
              {logistics?.date && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-foreground">{logistics.date}</span>
                  {logistics.time && (
                    <span className="text-muted-foreground">at {logistics.time}</span>
                  )}
                </div>
              )}
              {logistics?.location && (
                <div className="flex items-center gap-2.5 text-sm">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-foreground truncate">{logistics.location}</span>
                </div>
              )}
            </div>
          )}

          {quest.description && (
            <p className="text-sm text-muted-foreground line-clamp-4">{quest.description}</p>
          )}

          {firstPhoto && (
            <div className="rounded-xl overflow-hidden border border-border/30 aspect-[4/3]">
              <SidequestPhoto
                src={firstPhoto}
                alt={quest.title}
                thumbnail
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestDetailPreview;
