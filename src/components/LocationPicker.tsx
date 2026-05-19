import { useEffect, useRef, useState } from "react";
import { MapPin, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface LocationValue {
  text: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

interface Suggestion {
  place_id: string;
  primary_text: string;
  secondary_text: string;
}

interface Props {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  placeholder?: string;
}

function makeSessionToken() {
  return crypto.randomUUID();
}

const LocationPicker = ({ value, onChange, placeholder }: Props) => {
  const [text, setText] = useState(value.text);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const sessionTokenRef = useRef<string>(makeSessionToken());
  const debounceRef = useRef<number | undefined>(undefined);
  const hasResolved = !!(value.latitude && value.longitude);

  // Keep input in sync if parent value changes (edit flows etc.)
  useEffect(() => {
    setText(value.text);
  }, [value.text]);

  const fetchSuggestions = async (input: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("places-proxy", {
        body: { action: "autocomplete", input, sessionToken: sessionTokenRef.current },
      });
      if (error) throw error;
      setSuggestions(data?.suggestions || []);
      setOpen(true);
    } catch (e) {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (next: string) => {
    setText(next);
    // Typing invalidates the previous resolved place.
    onChange({ text: next });
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (next.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = window.setTimeout(() => fetchSuggestions(next.trim()), 300);
  };

  const handlePick = async (s: Suggestion) => {
    setOpen(false);
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("places-proxy", {
        body: {
          action: "details",
          placeId: s.place_id,
          sessionToken: sessionTokenRef.current,
        },
      });
      if (error || !data) throw error || new Error("No data");
      const address = data.formatted_address || `${s.primary_text}, ${s.secondary_text}`;
      setText(address);
      onChange({
        text: address,
        latitude: data.latitude,
        longitude: data.longitude,
        placeId: data.place_id,
      });
      // New session token for the next selection
      sessionTokenRef.current = makeSessionToken();
    } catch (e) {
      // fall back to the suggestion text without coords
      const address = `${s.primary_text}${s.secondary_text ? ", " + s.secondary_text : ""}`;
      setText(address);
      onChange({ text: address });
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setText("");
    setSuggestions([]);
    setOpen(false);
    onChange({ text: "" });
  };

  const staticMapSrc =
    hasResolved && value.latitude !== undefined && value.longitude !== undefined
      ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/static-map?lat=${value.latitude}&lng=${value.longitude}&zoom=15&w=600&h=200`
      : null;

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder || "Search for an address or place"}
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {loading ? (
          <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
        ) : text ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear location"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted text-muted-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              key={s.place_id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handlePick(s)}
              className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors"
            >
              <div className="text-sm font-medium text-foreground truncate">{s.primary_text}</div>
              {s.secondary_text && (
                <div className="text-[11px] text-muted-foreground truncate">{s.secondary_text}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {staticMapSrc && (
        <div className="mt-2 rounded-xl overflow-hidden border border-border bg-muted">
          <img
            src={staticMapSrc}
            alt="Map preview"
            className="w-full h-[140px] object-cover"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
};

export default LocationPicker;