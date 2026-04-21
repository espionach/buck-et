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