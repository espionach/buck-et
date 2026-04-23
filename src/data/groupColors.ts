export interface GroupColorOption {
  id: string;
  label: string;
  /** Tailwind gradient classes used by GroupCard */
  gradient: string;
  /** Solid swatch color used in the picker */
  swatch: string;
}

export const GROUP_COLORS: GroupColorOption[] = [
  { id: "sky", label: "Sky", gradient: "from-sky-200/60 to-blue-100/40", swatch: "bg-sky-300" },
  { id: "rose", label: "Rose", gradient: "from-rose-200/60 to-pink-100/40", swatch: "bg-rose-300" },
  { id: "amber", label: "Amber", gradient: "from-amber-200/60 to-yellow-100/40", swatch: "bg-amber-300" },
  { id: "emerald", label: "Emerald", gradient: "from-emerald-200/60 to-green-100/40", swatch: "bg-emerald-300" },
  { id: "violet", label: "Violet", gradient: "from-violet-200/60 to-purple-100/40", swatch: "bg-violet-300" },
  { id: "slate", label: "Slate", gradient: "from-slate-200/60 to-zinc-100/40", swatch: "bg-slate-300" },
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
