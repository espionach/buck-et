import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  /** Stored as 12h string like "6:30 PM" */
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 60 }, (_, i) => i);   // 0..59
const PERIODS = ["AM", "PM"] as const;

function parseValue(value: string): { hour: number; minute: number; period: "AM" | "PM" } {
  const m = value?.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/);
  if (m) {
    return {
      hour: parseInt(m[1]),
      minute: parseInt(m[2]),
      period: m[3].toUpperCase() as "AM" | "PM",
    };
  }
  return { hour: 12, minute: 0, period: "AM" };
}

export function TimePicker({ value, onChange, className, placeholder = "Select time" }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = parseValue(value);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState<"AM" | "PM">(parsed.period);

  useEffect(() => {
    const p = parseValue(value);
    setHour(p.hour);
    setMinute(p.minute);
    setPeriod(p.period);
  }, [value]);

  const commit = (h: number, m: number, p: "AM" | "PM") => {
    onChange(`${h}:${String(m).padStart(2, "0")} ${p}`);
  };

  const display = value || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full pl-9 pr-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary/30 relative",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          {display}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 rounded-xl" align="start">
        <div className="flex gap-1 text-sm">
          <Column
            items={HOURS.map((h) => ({ value: h, label: String(h) }))}
            selected={hour}
            onSelect={(v) => { setHour(v); commit(v, minute, period); }}
          />
          <Column
            items={MINUTES.map((m) => ({ value: m, label: String(m).padStart(2, "0") }))}
            selected={minute}
            onSelect={(v) => { setMinute(v); commit(hour, v, period); }}
          />
          <Column
            items={PERIODS.map((p) => ({ value: p, label: p }))}
            selected={period}
            onSelect={(v) => { setPeriod(v); commit(hour, minute, v); }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ColumnProps<T extends string | number> {
  items: { value: T; label: string }[];
  selected: T;
  onSelect: (v: T) => void;
}

function Column<T extends string | number>({ items, selected, onSelect }: ColumnProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <div
      ref={ref}
      className="h-48 w-14 overflow-y-auto overscroll-contain rounded-lg bg-muted/40 scrollbar-thin"
    >
      <div className="flex flex-col py-1">
        {items.map((it) => {
          const isSel = it.value === selected;
          return (
            <button
              key={String(it.value)}
              ref={isSel ? selectedRef : undefined}
              type="button"
              onClick={() => onSelect(it.value)}
              className={cn(
                "px-3 py-1.5 mx-1 my-0.5 rounded-md text-center font-sans transition-colors",
                isSel
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
