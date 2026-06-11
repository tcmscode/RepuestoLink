export type ListingCategoryId =
  | "frenos"
  | "filtros"
  | "motor"
  | "transmision"
  | "carroceria"
  | "suspension"
  | "electrico"
  | "otro";

export type ListingCategory = {
  id: ListingCategoryId;
  label: string;
  bgClass: string;
  textClass: string;
};

export const LISTING_CATEGORIES: ListingCategory[] = [
  { id: "frenos", label: "Frenos", bgClass: "bg-red-100", textClass: "text-red-800" },
  { id: "filtros", label: "Filtros", bgClass: "bg-sky-100", textClass: "text-sky-800" },
  { id: "motor", label: "Motor", bgClass: "bg-amber-100", textClass: "text-amber-900" },
  {
    id: "transmision",
    label: "Transmisión",
    bgClass: "bg-violet-100",
    textClass: "text-violet-800",
  },
  {
    id: "carroceria",
    label: "Carrocería",
    bgClass: "bg-teal-100",
    textClass: "text-teal-800",
  },
  {
    id: "suspension",
    label: "Suspensión",
    bgClass: "bg-lime-100",
    textClass: "text-lime-800",
  },
  {
    id: "electrico",
    label: "Eléctrico",
    bgClass: "bg-yellow-100",
    textClass: "text-yellow-900",
  },
  { id: "otro", label: "Repuesto", bgClass: "bg-slate-100", textClass: "text-slate-700" },
];

const RULES: { keywords: string[]; id: ListingCategoryId }[] = [
  { keywords: ["freno", "pastilla", "disco freno", "tambor"], id: "frenos" },
  { keywords: ["filtro", "aceite", "aire", "combustible"], id: "filtros" },
  { keywords: ["motor", "pistón", "biela", "culata", "inyector"], id: "motor" },
  {
    keywords: ["diferencial", "caja", "transmis", "embrague", "corona", "piñón"],
    id: "transmision",
  },
  { keywords: ["óptica", "optica", "parabrisa", "espejo", "luneta"], id: "carroceria" },
  { keywords: ["suspens", "amortigu", "resorte", "ballesta"], id: "suspension" },
  { keywords: ["electr", "alternador", "arranque", "batería", "sensor"], id: "electrico" },
];

export function getCategoryById(id: string): ListingCategory {
  return LISTING_CATEGORIES.find((c) => c.id === id) ?? LISTING_CATEGORIES.at(-1)!;
}

export function inferCategoryId(title: string, brand?: string | null): ListingCategoryId {
  const haystack = `${title} ${brand ?? ""}`.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => haystack.includes(k))) return rule.id;
  }
  return "otro";
}

export function conditionLabel(condition: string): string {
  const map: Record<string, string> = {
    nuevo: "Nuevo",
    reacondicionado: "Reacondicionado",
    usado: "Usado",
  };
  return map[condition] ?? condition;
}

export function conditionBadgeClass(condition: string): string {
  if (condition === "nuevo") return "bg-green-100 text-green-800";
  if (condition === "reacondicionado") return "bg-amber-100 text-amber-900";
  return "bg-slate-200 text-slate-700";
}

export function parseOemCodes(oemCodes?: string | null): string[] {
  if (!oemCodes) return [];
  return oemCodes
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
