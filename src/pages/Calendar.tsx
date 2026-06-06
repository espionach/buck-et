import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { format, parseISO, isSameDay, isPast, startOfDay, addMonths, subMonths } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { useAppStore } from "@/data/appState";
import UserAvatar from "@/components/UserAvatar";
import EmptyState from "@/components/EmptyState";
import NotificationBell from "@/components/NotificationBell";
import type { Quest } from "@/data/mockData";


const dateKey = (d: Date) => format(d, "yyyy-MM-dd");

const CalendarPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { quests, groups, currentUser } = useAppStore();
  const [selected, setSelected] = useState<Date | undefined>(() => startOfDay(new Date()));
  const [month, setMonth] = useState<Date>(startOfDay(new Date()));
  const activeDate = selected ?? startOfDay(new Date());

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

  const selectedKey = dateKey(activeDate);
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
        <NotificationBell />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-lg font-bold text-foreground">
            {format(month, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const today = startOfDay(new Date());
                setMonth(today);
                setSelected(today);
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setMonth((m) => subMonths(m, 1))}
              aria-label="Previous month"
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div data-spotlight="calendar-grid">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => setSelected(d ? startOfDay(d) : undefined)}
          month={month}
          onMonthChange={setMonth}
          modifiers={{ hasQuest: daysWithQuests }}
          modifiersClassNames={{
            hasQuest:
              "relative after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-1 after:w-1 after:h-1 after:rounded-full after:bg-primary",
          }}
          classNames={{
            caption: "hidden",
            nav: "hidden",
            months: "w-full",
            month: "w-full space-y-2",
            table: "w-full border-collapse",
            head_row: "flex w-full justify-between",
            head_cell: "text-muted-foreground font-normal text-[0.8rem] flex-1 text-center",
            row: "flex w-full justify-between mt-2",
            cell: "flex-1 flex justify-center p-0 relative",
            day: "h-10 w-10 p-0 font-normal text-base text-foreground hover:bg-muted/60 rounded-full transition-colors aria-selected:opacity-100 inline-flex items-center justify-center",
            day_outside: "text-muted-foreground opacity-50",
            day_selected:
              "!rounded-full bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "!rounded-full bg-muted text-foreground",
          }}
          className="p-0 pointer-events-auto w-full"
        />
        </div>
      </div>


      <div className="mt-6">
        <h2 className="text-sm font-bold text-foreground mb-3">
          {format(activeDate, "EEEE, MMM d")}
        </h2>

        {myDatedQuests.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title="Your calendar is waiting"
            description="Sidequests with dates will appear here."
            cta={{ label: "Create sidequest", onClick: () => navigate("/create", { state: { from: location.pathname + location.search } }) }}
          />
        ) : selectedQuests.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title="Nothing planned for this day"
            description="Looks like you've got a little breathing room."
          />
        ) : (
          <div className="space-y-2">
            {selectedQuests.map((q) => {
              const group = q.groupId ? groupById.get(q.groupId) : undefined;
              const time = formatTime(q.logistics?.time);
              const location = q.logistics?.location;
              const past = isPast(activeDate) && !isSameDay(activeDate, new Date());

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
      </div>
    </div>
  );
};

export default CalendarPage;
