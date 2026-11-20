// Fair price guide page: typical prices for every service, for one town or all pilot towns.
import { useState } from "react";
import { CategoryIcon, Icon } from "../components/Icons";
import { basisText } from "../components/PriceGuide";
import { CATEGORIES } from "../../shared/categories.js";
import { priceGuide, rangeText } from "../lib/prices";
import { TOWNS } from "../lib/seed";
import { useDB } from "../lib/store";
import type { ServiceCategory } from "../lib/types";

export default function Prices() {
  const db = useDB();
  const [townId, setTownId] = useState("");

  return (
    <div>
      <div className="page-head price-head">
        <div>
          <span className="eyebrow">
            <Icon name="tag" size={14} /> Fair price guide
          </span>
          <h1>How much should it cost?</h1>
          <p className="muted">
            Typical labor prices from quotes that workers sent on TrabahoMap. Use them to judge whether a quote is fair — final prices depend on the actual job and
            materials.
          </p>
        </div>
        <select value={townId} onChange={(e) => setTownId(e.target.value)} aria-label="Town">
          <option value="">All pilot towns</option>
          {TOWNS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="price-grid">
        {(CATEGORIES as ServiceCategory[]).map((c) => {
          const g = priceGuide(db, c, townId || undefined);
          return (
            <div key={c} className="card price-row">
              <span className="quest-icon">
                <CategoryIcon category={c} size={22} />
              </span>
              <div>
                <b>
                  {c}
                  {g.basis === "starter" && <span className="pg-est">estimate</span>}
                </b>
                <span className="pg-range">{rangeText(g)}</span>
                <span className="pg-basis">{basisText(g, townId || undefined)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="muted small mt">
        How it works: we take the middle (median) of the lowest and highest prices in recent quotes for that service — first in the selected town, then across all
        pilot towns. Services with fewer than 3 quotes show a starter estimate set by the team until enough quotes come in.
      </p>
    </div>
  );
}
