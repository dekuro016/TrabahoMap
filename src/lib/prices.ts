// Fair price guide: the typical price range for a service in a town, worked out from the quotes
// workers sent on TrabahoMap. With fewer than MIN_QUOTES quotes in the town it uses all pilot towns;
// with fewer than that overall it shows a STARTER estimate set by the team (clearly labeled in the UI —
// the team should check these numbers with local workers before launch).
import type { DB, ServiceCategory } from "./types";

export type PriceUnit = "session" | "day" | "hour" | null; // null = per job / per visit
export interface PriceRange {
  min: number;
  max: number;
  unit: PriceUnit;
}
export interface Guide extends PriceRange {
  basis: "town" | "all" | "starter";
  count: number; // quotes used (0 for starter estimates)
}

export const MIN_QUOTES = 3;

/** Starter estimates (labor only, materials not included). Placeholders — verify with local workers. */
export const STARTER: Record<ServiceCategory, PriceRange> = {
  Electrician: { min: 500, max: 1200, unit: null },
  Plumber: { min: 500, max: 1200, unit: null },
  "Appliance Repair": { min: 600, max: 1500, unit: null },
  "Aircon Technician": { min: 800, max: 1800, unit: null },
  Carpenter: { min: 1500, max: 4000, unit: null },
  Mason: { min: 2000, max: 5000, unit: null },
  Welder: { min: 2500, max: 6000, unit: null },
  Painter: { min: 2500, max: 6000, unit: null },
  Tutor: { min: 250, max: 450, unit: "session" },
  "Tech Support": { min: 400, max: 1000, unit: null },
  "Home Cleaning": { min: 1000, max: 2500, unit: null },
  "Event Assistance": { min: 1500, max: 3500, unit: null },
};

const UNIT_RE: [RegExp, Exclude<PriceUnit, null>][] = [
  [/(\/|per|kada|bawat)\s*(session|sesyon|class|klase)/i, "session"],
  [/(\/|per|kada|bawat)\s*(day|araw)/i, "day"],
  [/(\/|per|kada|bawat)\s*(hour|hr|oras)/i, "hour"],
];

/** "₱500 – ₱900" → 500–900 · "₱1.5k" → 1500 · "₱300 – ₱400 / session" → per session. Numbers under 50 (e.g. "3 helpers") are ignored. */
export function parsePriceRange(text: string): PriceRange | null {
  const nums: number[] = [];
  for (const m of text.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(k\b)?/gi)) {
    let n = Number(m[1].replace(/,/g, ""));
    if (m[2]) n *= 1000;
    if (n >= 50 && n <= 500000) nums.push(n);
  }
  if (nums.length === 0) return null;
  const unit = UNIT_RE.find(([re]) => re.test(text))?.[1] ?? null;
  return { min: Math.min(...nums), max: Math.max(...nums), unit };
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
const round50 = (n: number) => Math.max(50, Math.round(n / 50) * 50);

function quotePrices(d: DB, category: ServiceCategory, unit: PriceUnit, townId?: string): PriceRange[] {
  const out: PriceRange[] = [];
  for (const q of d.quotes) {
    const g = d.gigs.find((x) => x.id === q.gigId);
    if (!g || g.category !== category || (townId && g.townId !== townId)) continue;
    const p = parsePriceRange(q.priceRange);
    if (p && p.unit === unit) out.push(p);
  }
  return out;
}

/** Typical price for a service: this town → all pilot towns → starter estimate. */
export function priceGuide(d: DB, category: ServiceCategory, townId?: string): Guide {
  const unit = STARTER[category].unit;
  const tryBasis = (basis: "town" | "all", pts: PriceRange[]): Guide | null =>
    pts.length >= MIN_QUOTES ? { min: round50(median(pts.map((p) => p.min))), max: round50(median(pts.map((p) => p.max))), unit, basis, count: pts.length } : null;
  return (
    (townId ? tryBasis("town", quotePrices(d, category, unit, townId)) : null) ??
    tryBasis("all", quotePrices(d, category, unit)) ?? { ...STARTER[category], basis: "starter", count: 0 }
  );
}

/** Is a quote inside, above or below the typical range? null if it can't be compared (different unit, unreadable). */
export function compareToGuide(priceText: string, guide: Guide): "in" | "high" | "low" | null {
  const p = parsePriceRange(priceText);
  if (!p || p.unit !== guide.unit) return null;
  const mid = (p.min + p.max) / 2;
  if (mid > guide.max * 1.15) return "high";
  if (mid < guide.min * 0.85) return "low";
  return "in";
}

export function peso(n: number) {
  return "₱" + n.toLocaleString("en-PH");
}

export function rangeText(r: PriceRange) {
  const range = r.min === r.max ? peso(r.min) : `${peso(r.min)} – ${peso(r.max)}`;
  return r.unit ? `${range} / ${r.unit}` : range;
}
