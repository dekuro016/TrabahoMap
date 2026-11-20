// "Typical price" box for a service in a town (see lib/prices.ts for how it's worked out).
import { townName } from "../lib/format";
import { compareToGuide, priceGuide, rangeText, type Guide } from "../lib/prices";
import { Link } from "../lib/router";
import { useDB } from "../lib/store";
import type { ServiceCategory } from "../lib/types";
import { Icon } from "./Icons";

export function basisText(g: Guide, townId?: string) {
  if (g.basis === "town") return `Based on ${g.count} quotes in ${townName(townId!)}`;
  if (g.basis === "all") return `Based on ${g.count} quotes across the pilot towns`;
  return "Starter estimate by the TrabahoMap team — not enough quotes yet";
}

export default function PriceGuide({ category, townId, compact = false }: { category: ServiceCategory; townId?: string; compact?: boolean }) {
  const db = useDB();
  const g = priceGuide(db, category, townId);
  return (
    <div className="price-guide">
      <span className="pg-icon">
        <Icon name="tag" size={20} />
      </span>
      <div>
        <span className="pg-label">
          Typical price · {category}
          {g.basis === "starter" && <span className="pg-est">estimate</span>}
        </span>
        <span className="pg-range">{rangeText(g)}</span>
        <span className="pg-basis">
          {basisText(g, townId)}. Labor only — materials not included.{!compact && <> <Link to="/prices">See all prices</Link></>}
        </span>
      </div>
    </div>
  );
}

/** Small tag on a quote: within / above / below the typical price. */
export function FairTag({ priceText, category, townId }: { priceText: string; category: ServiceCategory; townId: string }) {
  const db = useDB();
  const g = priceGuide(db, category, townId);
  const c = compareToGuide(priceText, g);
  if (!c) return null;
  const label = c === "in" ? "Typical price" : c === "high" ? "Above typical" : "Below typical";
  return (
    <span className={`fair fair-${c}`} title={`Typical: ${rangeText(g)} (${basisText(g, townId).toLowerCase()})`}>
      <Icon name="tag" size={12} /> {label}
    </span>
  );
}
