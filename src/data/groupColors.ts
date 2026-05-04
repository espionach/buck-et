export interface GroupColorOption {
  id: string;
  label: string;
  /** Tailwind gradient classes used by GroupCard */
  gradient: string;
  /** Solid swatch color used in the picker */
  swatch: string;
  /** Optional inline style for a decorative pattern overlay (CSS background). */
  patternStyle?: React.CSSProperties;
}

// A reusable set of decorative pattern overlays (rendered as a second layer
// on top of the gradient). Kept lightweight so cards stay fast to render.
const stripes = (color: string): React.CSSProperties => ({
  backgroundImage: `repeating-linear-gradient(45deg, ${color} 0 6px, transparent 6px 14px)`,
});
const dots = (color: string): React.CSSProperties => ({
  backgroundImage: `radial-gradient(${color} 1.4px, transparent 1.6px)`,
  backgroundSize: "12px 12px",
});
const grid = (color: string): React.CSSProperties => ({
  backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
  backgroundSize: "16px 16px",
});
const waves = (color: string): React.CSSProperties => ({
  backgroundImage: `radial-gradient(circle at 10px 10px, ${color} 2px, transparent 2.5px), radial-gradient(circle at 0 0, ${color} 2px, transparent 2.5px)`,
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0, 10px 10px",
});

export const GROUP_COLORS: GroupColorOption[] = [
  { id: "sky", label: "Sky", gradient: "from-sky-200/60 to-blue-100/40", swatch: "bg-sky-300" },
  { id: "rose", label: "Rose", gradient: "from-rose-200/60 to-pink-100/40", swatch: "bg-rose-300" },
  { id: "amber", label: "Amber", gradient: "from-amber-200/60 to-yellow-100/40", swatch: "bg-amber-300" },
  { id: "emerald", label: "Emerald", gradient: "from-emerald-200/60 to-green-100/40", swatch: "bg-emerald-300" },
  { id: "violet", label: "Violet", gradient: "from-violet-200/60 to-purple-100/40", swatch: "bg-violet-300" },
  { id: "slate", label: "Slate", gradient: "from-slate-200/60 to-zinc-100/40", swatch: "bg-slate-300" },
  { id: "sunset", label: "Sunset", gradient: "from-orange-200/70 via-rose-200/60 to-fuchsia-200/50", swatch: "bg-gradient-to-br from-orange-300 to-fuchsia-300" },
  { id: "ocean", label: "Ocean", gradient: "from-cyan-200/70 via-sky-200/60 to-indigo-200/50", swatch: "bg-gradient-to-br from-cyan-300 to-indigo-300" },
  { id: "meadow", label: "Meadow", gradient: "from-lime-200/70 via-emerald-200/60 to-teal-200/50", swatch: "bg-gradient-to-br from-lime-300 to-teal-300" },
  { id: "berry", label: "Berry", gradient: "from-pink-200/70 via-fuchsia-200/60 to-purple-200/50", swatch: "bg-gradient-to-br from-pink-300 to-purple-300" },
  // Pattern variants — each layers a subtle pattern over a gradient base.
  { id: "stripes-sky", label: "Sky stripes", gradient: "from-sky-200/60 to-blue-100/40", swatch: "bg-sky-300", patternStyle: stripes("rgba(2,132,199,0.18)") },
  { id: "dots-rose", label: "Rose dots", gradient: "from-rose-200/60 to-pink-100/40", swatch: "bg-rose-300", patternStyle: dots("rgba(190,18,60,0.22)") },
  { id: "grid-amber", label: "Amber grid", gradient: "from-amber-200/60 to-yellow-100/40", swatch: "bg-amber-300", patternStyle: grid("rgba(180,83,9,0.18)") },
  { id: "waves-emerald", label: "Emerald waves", gradient: "from-emerald-200/60 to-green-100/40", swatch: "bg-emerald-300", patternStyle: waves("rgba(4,120,87,0.22)") },
  { id: "stripes-violet", label: "Violet stripes", gradient: "from-violet-200/60 to-purple-100/40", swatch: "bg-violet-300", patternStyle: stripes("rgba(91,33,182,0.18)") },
  { id: "dots-slate", label: "Slate dots", gradient: "from-slate-200/60 to-zinc-100/40", swatch: "bg-slate-300", patternStyle: dots("rgba(51,65,85,0.22)") },
];

export interface GroupIconColorOption {
  id: string;
  label: string;
  /** Tailwind text color class for icon stroke */
  text: string;
  /** Solid swatch color used in the picker */
  swatch: string;
}

/**
 * Darker, saturated color options for the group icon itself,
 * intended to read clearly against the lighter card gradients.
 */
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
