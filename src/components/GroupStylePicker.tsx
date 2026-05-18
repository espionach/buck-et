import { Check } from "lucide-react";
import {
  GROUP_COLORS,
  GROUP_PATTERNS,
  PatternId,
  parseGroupColor,
  encodeGroupColor,
  patternStyleFor,
} from "@/data/groupColors";

interface GroupStylePickerProps {
  value?: string;
  onChange: (encoded: string) => void;
}

/**
 * Card-style picker: preset gradient swatches + custom gradient (two color inputs)
 * + optional decorative pattern overlay (none / plaid / stars / hearts / confetti).
 */
const GroupStylePicker = ({ value, onChange }: GroupStylePickerProps) => {
  const parsed = parseGroupColor(value);
  const isCustom = parsed.kind === "custom";

  const selectPreset = (presetId: string) => {
    onChange(encodeGroupColor("preset", { presetId, pattern: parsed.pattern }));
  };

  const enableCustom = () => {
    onChange(
      encodeGroupColor("custom", {
        hexA: parsed.hexA,
        hexB: parsed.hexB,
        pattern: parsed.pattern,
      }),
    );
  };

  const updateCustom = (which: "hexA" | "hexB", hex: string) => {
    onChange(
      encodeGroupColor("custom", {
        hexA: which === "hexA" ? hex : parsed.hexA,
        hexB: which === "hexB" ? hex : parsed.hexB,
        pattern: parsed.pattern,
      }),
    );
  };

  const setPattern = (pattern: PatternId) => {
    onChange(
      encodeGroupColor(parsed.kind, {
        presetId: parsed.presetId,
        hexA: parsed.hexA,
        hexB: parsed.hexB,
        pattern,
      }),
    );
  };

  return (
    <div className="space-y-3">
      {/* Preset gradients */}
      <div className="grid grid-cols-5 gap-2">
        {GROUP_COLORS.map((c) => {
          const selected = !isCustom && parsed.presetId === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => selectPreset(c.id)}
              aria-label={c.label}
              title={c.label}
              className={`relative h-12 rounded-xl border bg-gradient-to-br ${c.gradient} overflow-hidden transition-transform active:scale-95 ${
                selected ? "ring-2 ring-foreground border-transparent" : "border-border/50"
              }`}
            >
              {selected && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-4 h-4 text-foreground drop-shadow" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom gradient */}
      <div
        className={`rounded-xl border p-3 transition-colors ${
          isCustom ? "border-foreground bg-muted/40" : "border-border/60 bg-muted/20"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-foreground">Custom gradient</p>
          {!isCustom && (
            <button
              type="button"
              onClick={enableCustom}
              className="text-[11px] font-semibold text-primary"
            >
              Use custom
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex-1 h-10 rounded-lg border border-border/60"
            style={{ backgroundImage: `linear-gradient(135deg, ${parsed.hexA}, ${parsed.hexB})` }}
          />
          <label className="flex flex-col items-center gap-1">
            <input
              type="color"
              value={parsed.hexA}
              onChange={(e) => updateCustom("hexA", e.target.value)}
              className="w-8 h-8 rounded-md border border-border/60 cursor-pointer bg-transparent"
              aria-label="Start color"
            />
            <span className="text-[10px] text-muted-foreground">Start</span>
          </label>
          <label className="flex flex-col items-center gap-1">
            <input
              type="color"
              value={parsed.hexB}
              onChange={(e) => updateCustom("hexB", e.target.value)}
              className="w-8 h-8 rounded-md border border-border/60 cursor-pointer bg-transparent"
              aria-label="End color"
            />
            <span className="text-[10px] text-muted-foreground">End</span>
          </label>
        </div>
      </div>

      {/* Pattern overlay */}
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Pattern (optional)</p>
        <div className="grid grid-cols-5 gap-2">
          {GROUP_PATTERNS.map((p) => {
            const selected = parsed.pattern === p.id;
            const overlay = patternStyleFor(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPattern(p.id)}
                aria-label={p.label}
                title={p.label}
                className={`relative h-12 rounded-xl border overflow-hidden transition-transform active:scale-95 bg-muted/40 ${
                  selected ? "ring-2 ring-foreground border-transparent" : "border-border/50"
                }`}
              >
                {overlay && (
                  <span className="absolute inset-0 opacity-80" style={overlay} aria-hidden />
                )}
                {!overlay && (
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                    None
                  </span>
                )}
                {selected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-4 h-4 text-foreground drop-shadow" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GroupStylePicker;
