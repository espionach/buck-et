import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, isSameDay, isPast, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { useAppStore } from "@/data/appState";
import UserAvatar from "@/components/UserAvatar";
import type { Quest } from "@/data/mockData";

const dateKey = (d: Date) => format(d, "yyyy-MM-dd");

const CalendarPage = () => {
  const navigate = useNavigate();
  const { quests, groups, currentUser } = useAppStore();
  const [selected, setSelected] = useState<Date>(startOfDay(new Date()));

  // User's scheduled quests (owner or participant) with a date set
  const myDatedQuests = useMemo(() => {
    if (!currentUser) return [] as Quest[];
    return quests.filter((q) => {
      if (!q.logistics?.date) return false;
      const isMine =
        q.createdBy.id === currentUser.id ||
        q.participants.some((p) => p.id === currentUser.id);
      return isMine;
    });
  }, [quests, currentUser]);

  // Map yyyy-MM-dd → quests
  const questsByDay = useMemo(() => {
    const map = new Map<string, Quest[]>();
    for (const q of myDatedQuests) {
      const key = q.logistics!.date!.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(q);
      map.set(key, arr);
    }
    return map;
  }, [myDatedQuests]);

  const daysWithQuests = useMemo(
    () =>
      Array.from(questsByDay.keys())
        .map((k) => {
          try {
            return parseISO(k);
          } catch {
            return null;
          }
        })
        .filter((d): d is Date => d !== null),
    [questsByDay],
  );

  const selectedKey = dateKey(selected);
  const selectedQuests = questsByDay.get(selectedKey) ?? [];

  const groupById = useMemo(() => {
    const m = new Map<string, (typeof groups)[number]>();
    for (const g of groups) m.set(g.id, g);
    return m;
  }, [groups]);

  const formatTime = (time?: string) => {
    if (!time) return null;
    // Accept "HH:mm" or "HH:mm:ss"
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    if (Number.isNaN(hour)) return time;
    const period = hour >= 12 ? "PM" : "AM";
    const display = hour % 12 === 0 ? 12 : hour % 12;
    return `${display}:${m ?? "00"} ${period}`;
  };

  return (
    <div className="min-h-screen pb-24 px-5 pt-14">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Your scheduled sidequests
          </p>
        </div>
        <button
          onClick={() => setSelected(startOfDay(new Date()))}
          className="text-xs font-semibold text-primary px-3 py-1.5 rounded-lg border border-border hover:bg-muted/40 transition-colors mt-2"
        >
          Today
        </button>
      </div>

      <div className="mt-4 bg-card border border-border rounded-[var(--radius)] overflow-hidden">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => d && setSelected(startOfDay(d))}
          month={selected}
          onMonthChange={(m) => setSelected(startOfDay(m))}
          modifiers={{ hasQuest: daysWithQuests }}
          modifiersClassNames={{
            hasQuest:
              "relative after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-1 after:w-1 after:h-1 after:rounded-full after:bg-primary",
          }}
          className="p-3 pointer-events-auto mx-auto"
        />
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-bold text-foreground mb-3">
          {format(selected, "EEEE, MMM d")}
        </h2>

        {selectedQuests.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10 border border-dashed border-border rounded-[var(--radius)]">
            <CalendarIcon className="w-6 h-6 mb-2 opacity-40" />
            <p className="text-xs">Nothing scheduled</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedQuests.map((q) => {
              const group = q.groupId ? groupById.get(q.groupId) : undefined;
              const time = formatTime(q.logistics?.time);
              const location = q.logistics?.location;
              const past = isPast(selected) && !isSameDay(selected, new Date());

              return (
                <button
                  key={q.id}
                  onClick={() => navigate(`/quest/${q.id}`)}
                  className={`w-full text-left bg-card border border-border rounded-[var(--radius)] p-3 flex items-start gap-3 active:scale-[0.99] transition-transform ${
                    past ? "opacity-60" : ""
                  }`}
                >
                  <div
                    className="w-2 self-stretch rounded-full shrink-0"
                    style={{
                      backgroundColor: group?.color || "hsl(var(--primary))",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-foreground truncate">
                        {q.title}
                      </p>
                      {time && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {time}
                        </span>
                      )}
                    </div>
                    {group && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {group.name}
                      </p>
                    )}
                    {location && (
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{location}</span>
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <UserAvatar user={q.createdBy} size="sm" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {myDatedQuests.length === 0 && (
          <p className="text-[11px] text-muted-foreground mt-4 text-center">
            Sidequests with a date will appear here.
          </p>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
