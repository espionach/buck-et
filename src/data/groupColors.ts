import type { CSSProperties } from "react";

export interface GroupColorOption {
  id: string;
  label: string;
  /** Tailwind gradient classes used by GroupCard */
  gradient: string;
  /** Solid swatch color used in the picker */
  swatch: string;
  /** Two hex colors approximating the gradient, used for custom-picker seeding & inline rendering. */
  hexA: string;
  hexB: string;
}

export const GROUP_COLORS: GroupColorOption[] = [
  { id: "sky",     label: "Sky",     gradient: "from-sky-200/60 to-blue-100/40",          swatch: "bg-sky-300",     hexA: "#bae6fd", hexB: "#dbeafe" },
  { id: "rose",    label: "Rose",    gradient: "from-rose-200/60 to-pink-100/40",         swatch: "bg-rose-300",    hexA: "#fecdd3", hexB: "#fce7f3" },
  { id: "amber",   label: "Amber",   gradient: "from-amber-200/60 to-yellow-100/40",      swatch: "bg-amber-300",   hexA: "#fde68a", hexB: "#fef9c3" },
  { id: "emerald", label: "Emerald", gradient: "from-emerald-200/60 to-green-100/40",     swatch: "bg-emerald-300", hexA: "#a7f3d0", hexB: "#dcfce7" },
  { id: "violet",  label: "Violet",  gradient: "from-violet-200/60 to-purple-100/40",     swatch: "bg-violet-300",  hexA: "#ddd6fe", hexB: "#f3e8ff" },
  { id: "slate",   label: "Slate",   gradient: "from-slate-200/60 to-zinc-100/40",        swatch: "bg-slate-300",   hexA: "#e2e8f0", hexB: "#f4f4f5" },
  { id: "sunset",  label: "Sunset",  gradient: "from-orange-200/70 via-rose-200/60 to-fuchsia-200/50", swatch: "bg-gradient-to-br from-orange-300 to-fuchsia-300", hexA: "#fed7aa", hexB: "#f5d0fe" },
  { id: "ocean",   label: "Ocean",   gradient: "from-cyan-200/70 via-sky-200/60 to-indigo-200/50",     swatch: "bg-gradient-to-br from-cyan-300 to-indigo-300",    hexA: "#a5f3fc", hexB: "#c7d2fe" },
  { id: "meadow",  label: "Meadow",  gradient: "from-lime-200/70 via-emerald-200/60 to-teal-200/50",   swatch: "bg-gradient-to-br from-lime-300 to-teal-300",      hexA: "#d9f99d", hexB: "#99f6e4" },
  { id: "berry",   label: "Berry",   gradient: "from-pink-200/70 via-fuchsia-200/60 to-purple-200/50", swatch: "bg-gradient-to-br from-pink-300 to-purple-300",    hexA: "#fbcfe8", hexB: "#e9d5ff" },
];

// ---------- Patterns ----------

export type PatternId = "none" | "plaid" | "stars" | "hearts" | "confetti";

export interface PatternOption {
  id: PatternId;
  label: string;
}

export const GROUP_PATTERNS: PatternOption[] = [
  { id: "none",     label: "None" },
  { id: "plaid",    label: "Plaid" },
  { id: "stars",    label: "Stars" },
  { id: "hearts",   label: "Hearts" },
  { id: "confetti", label: "Confetti" },
];

const svgUrl = (svg: string) =>
  `url("data:image/svg+xml;utf8,${svg.replace(/#/g, "%23").replace(/"/g, "'")}")`;

const starSvg = (c: string) =>
  `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24'><path fill='${c}' d='M12 2l2.6 6.2L21 9l-5 4.4L17.2 20 12 16.8 6.8 20 8 13.4 3 9l6.4-.8z'/></svg>`;
const heartSvg = (c: string) =>
  `<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 24 24'><path fill='${c}' d='M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z'/></svg>`;
const confettiSvg = (c: string) =>
  `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'>` +
  `<rect x='4' y='6' width='7' height='2.5' rx='1' transform='rotate(20 7.5 7.25)' fill='${c}'/>` +
  `<rect x='24' y='14' width='7' height='2.5' rx='1' transform='rotate(-35 27.5 15.25)' fill='${c}'/>` +
  `<rect x='10' y='30' width='7' height='2.5' rx='1' transform='rotate(60 13.5 31.25)' fill='${c}'/>` +
  `<rect x='30' y='34' width='7' height='2.5' rx='1' transform='rotate(-10 33.5 35.25)' fill='${c}'/>` +
  `</svg>`;

export const patternStyleFor = (pattern: PatternId, color = "rgba(255,255,255,0.5)"): CSSProperties | undefined => {
  switch (pattern) {
    case "plaid":
      return {
        backgroundImage:
          `repeating-linear-gradient(0deg, ${color} 0 2px, transparent 2px 14px),` +
          `repeating-linear-gradient(90deg, ${color} 0 2px, transparent 2px 14px),` +
          `repeating-linear-gradient(0deg, ${color} 0 1px, transparent 1px 7px),` +
          `repeating-linear-gradient(90deg, ${color} 0 1px, transparent 1px 7px)`,
      };
    case "stars":
      return { backgroundImage: svgUrl(starSvg(color)), backgroundSize: "28px 28px" };
    case "hearts":
      return { backgroundImage: svgUrl(heartSvg(color)), backgroundSize: "26px 26px" };
    case "confetti":
      return { backgroundImage: svgUrl(confettiSvg(color)), backgroundSize: "44px 44px" };
    default:
      return undefined;
  }
};

// ---------- Encoded color value ----------
// Stored in `group.color`. Backwards compatible.
// Formats:
//   "sky"                              preset
//   "sky|stars"                        preset + pattern
//   "custom:aabbcc-ddeeff"             custom gradient
//   "custom:aabbcc-ddeeff|hearts"      custom gradient + pattern

export interface ParsedGroupColor {
  kind: "preset" | "custom";
  presetId?: string;
  hexA?: string;
  hexB?: string;
  pattern: PatternId;
}

const normalizeHex = (h: string) => {
  const v = h.startsWith("#") ? h.slice(1) : h;
  return /^[0-9a-fA-F]{6}$/.test(v) ? `#${v.toLowerCase()}` : "#cccccc";
};

export const parseGroupColor = (raw?: string): ParsedGroupColor => {
  const value = raw || "sky";
  const [base, patternRaw] = value.split("|");
  const pattern = (GROUP_PATTERNS.find((p) => p.id === patternRaw)?.id || "none") as PatternId;
  if (base.startsWith("custom:")) {
    const [a, b] = base.slice(7).split("-");
    return {
      kind: "custom",
      hexA: normalizeHex(a || "bae6fd"),
      hexB: normalizeHex(b || "dbeafe"),
      pattern,
    };
  }
  const preset = GROUP_COLORS.find((c) => c.id === base) || GROUP_COLORS[0];
  return { kind: "preset", presetId: preset.id, hexA: preset.hexA, hexB: preset.hexB, pattern };
};

export const encodeGroupColor = (
  kind: "preset" | "custom",
  opts: { presetId?: string; hexA?: string; hexB?: string; pattern?: PatternId },
): string => {
  const base =
    kind === "preset"
      ? opts.presetId || "sky"
      : `custom:${(opts.hexA || "#bae6fd").replace("#", "")}-${(opts.hexB || "#dbeafe").replace("#", "")}`;
  return opts.pattern && opts.pattern !== "none" ? `${base}|${opts.pattern}` : base;
};

/** Returns inline background style for a card given the encoded color value. */
export const gradientStyleFor = (raw?: string): CSSProperties => {
  const p = parseGroupColor(raw);
  if (p.kind === "custom") {
    return { backgroundImage: `linear-gradient(135deg, ${p.hexA}, ${p.hexB})` };
  }
  // For presets, the Tailwind gradient classes still apply; no inline style needed.
  return {};
};

/** Returns the Tailwind gradient class string for a preset, or "" for custom. */
export const gradientClassFor = (raw?: string): string => {
  const p = parseGroupColor(raw);
  if (p.kind === "preset") {
    const preset = GROUP_COLORS.find((c) => c.id === p.presetId) || GROUP_COLORS[0];
    return `bg-gradient-to-br ${preset.gradient}`;
  }
  return "";
};

// ---------- Icon colors (unchanged) ----------

export interface GroupIconColorOption {
  id: string;
  label: string;
  text: string;
  swatch: string;
}

export const GROUP_ICON_COLORS: GroupIconColorOption[] = [
  { id: "sky", label: "Sky", text: "text-sky-700", swatch: "bg-sky-700" },
  { id: "rose", label: "Rose", text: "text-rose-700", swatch: "bg-rose-700" },
  { id: "amber", label: "Amber", text: "text-amber-700", swatch: "bg-amber-700" },
  { id: "emerald", label: "Emerald", text: "text-emerald-700", swatch: "bg-emerald-700" },
  { id: "violet", label: "Violet", text: "text-violet-700", swatch: "bg-violet-700" },
  { id: "slate", label: "Slate", text: "text-slate-700", swatch: "bg-slate-700" },
  { id: "black", label: "Black", text: "text-neutral-900", swatch: "bg-neutral-900" },
  { id: "white", label: "White", text: "text-white", swatch: "bg-white border border-border" },
];

export const iconColorClassFor = (id?: string) =>
  GROUP_ICON_COLORS.find((c) => c.id === id)?.text || GROUP_ICON_COLORS[0].text;
