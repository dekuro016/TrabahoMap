import { useState } from "react";
import { Empty, CategoryOptions } from "../components/Bits";
import { WorkerCard } from "../components/Cards";
import { Icon } from "../components/Icons";
import { TOWNS } from "../lib/seed";
import { useDB, workerRating } from "../lib/store";

export default function Workers() {
  const db = useDB();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [town, setTown] = useState("");
  const [tesdaOnly, setTesdaOnly] = useState(false);

  const list = db.workers
    .filter((w) => w.verification === "Verified")
    .filter((w) => !category || w.categories.includes(category as never))
    .filter((w) => !town || w.townId === town)
    .filter((w) => !tesdaOnly || w.tesdaCertified)
    .filter((w) => {
      const s = q.trim().toLowerCase();
      return !s || `${w.name} ${w.skills.join(" ")} ${w.barangay} ${w.categories.join(" ")}`.toLowerCase().includes(s);
    })
    .map((w) => ({ w, r: workerRating(db, w.id).avg ?? 0 }))
    .sort((a, b) => b.r - a.r);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Verified workers</h1>
          <p className="muted">Every worker here submitted a valid ID. Ratings come only from residents who actually hired them.</p>
        </div>
      </div>
      <div className="filters card">
        <label className="search">
          <Icon name="search" size={16} />
          <input placeholder="Search name, skill, barangay…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">All services</option>
          <CategoryOptions />
        </select>
        <select value={town} onChange={(e) => setTown(e.target.value)} aria-label="Town">
          <option value="">All towns</option>
          {TOWNS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <label className="check">
          <input type="checkbox" checked={tesdaOnly} onChange={(e) => setTesdaOnly(e.target.checked)} /> TESDA certified only
        </label>
      </div>
      {list.length === 0 ? (
        <Empty title="No workers found">Try removing a filter.</Empty>
      ) : (
        <div className="grid-workers">
          {list.map(({ w }) => (
            <WorkerCard key={w.id} worker={w} />
          ))}
        </div>
      )}
    </div>
  );
}
