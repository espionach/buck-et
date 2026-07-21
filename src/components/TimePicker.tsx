import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  /** Stored as 12h string like "6:30 PM" */
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Parse a variety of user inputs into a normalized "h:mm AM/PM" string.
 * Accepts: "6", "6pm", "6 pm", "630pm", "6:30", "6:30pm", "18:30", "1830", etc.
 * Returns null when it can't confidently parse.
 */
function normalizeTime(input: string): string | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;

  // Extract am/pm suffix if present
  let period: "am" | "pm" | null = null;
  let body = raw.replace(/\s+/g, "");
  const suffixMatch = body.match(/(a\.?m\.?|p\.?m\.?)$/);
  if (suffixMatch) {
    period = suffixMatch[1].startsWith("a") ? "am" : "pm";
    body = body.slice(0, suffixMatch.index).trim();
  }

  let hour: number;
  let minute: number;

  if (body.includes(":")) {
    const [h, m] = body.split(":");
    hour = parseInt(h, 10);
    minute = parseInt(m, 10);
  } else {
    const digits = body.replace(/\D/g, "");
    if (!digits) return null;
    if (digits.length <= 2) {
      hour = parseInt(digits, 10);
      minute = 0;
    } else if (digits.length === 3) {
      hour = parseInt(digits.slice(0, 1), 10);
      minute = parseInt(digits.slice(1), 10);
    } else if (digits.length === 4) {
      hour = parseInt(digits.slice(0, 2), 10);
      minute = parseInt(digits.slice(2), 10);
    } else {
      return null;
    }
  }

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  if (minute < 0 || minute > 59) return null;

  // 24h -> 12h
  if (period == null) {
    if (hour === 0) {
      hour = 12;
      period = "am";
    } else if (hour === 12) {
      period = "pm";
    } else if (hour > 12 && hour <= 23) {
      hour -= 12;
      period = "pm";
    } else if (hour >= 1 && hour <= 11) {
      // Ambiguous — default to AM
      period = "am";
    } else {
      return null;
    }
  } else {
    if (hour === 0 || hour > 12) return null;
    if (hour === 12 && period === "am") hour = 12;
  }

  return `${hour}:${String(minute).padStart(2, "0")} ${period.toUpperCase()}`;
}

export function TimePicker({ value, onChange, className, placeholder = "e.g. 6:30 PM" }: TimePickerProps) {
  const [text, setText] = useState(value ?? "");

  useEffect(() => {
    setText(value ?? "");
  }, [value]);

  const commit = () => {
    if (!text.trim()) {
      if (value) onChange("");
      return;
    }
    const normalized = normalizeTime(text);
    if (normalized) {
      setText(normalized);
      if (normalized !== value) onChange(normalized);
    } else {
      // Revert to last valid value
      setText(value ?? "");
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        inputMode="text"
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
