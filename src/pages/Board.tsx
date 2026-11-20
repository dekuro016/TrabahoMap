import { useState } from "react";
import { Empty, CategoryOptions } from "../components/Bits";
import { GigCard } from "../components/Cards";
import { recommendedGigs } from "../lib/matching";
import { Link } from "../lib/router";
import { TOWNS } from "../lib/seed";
import { useDB } from "../lib/store";

const URG_ORDER = { High: 0, Medium: 1, Low: 2 } as const;

export default function Board() {
  const db = useDB();
  const [category, setCategory] = useState("");
  const [town, setTown] = useState("");
  const [urgency, setUrgency] = useState("");
  const [status, setStatus] = useState("Open");

  const me = db.session.role === "worker" ? db.workers.find((w) => w.id === db.session.workerId) : undefined;
  const recs = me ? recommendedGigs(db, me).slice(0, 3) : [];

  const gigs = db.gigs
    .filter((g) => !g.id.startsWith("p")) // hide seeded past jobs (used only for review history)
    .filter((g) => (!category || g.category === category) && (!town || g.townId === town) && (!urgency || g.urgency === urgency) && (!status || g.status === status))
    .sort((a, b) => URG_ORDER[a.urgency] - URG_ORDER[b.urgency] || b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Quest Board</h1>
          <p className="muted">Problems posted by residents. Urgent quests are shown first.</p>
        </div>
        <div className="row-btns">
          <Link to="/prices" className="btn btn-ghost">
            Price guide
          </Link>
          {(db.session.role === "resident" || db.session.role === "guest") && (
            <Link to="/post" className="btn btn-primary">
              + Post a problem
            </Link>
          )}
        </div>
      </div>

      {me && recs.length > 0 && (
        <section className="recs">
          <h2>Recommended for you, {me.name.split(" ")[0]}</h2>
          <div className="grid-cards">
            {recs.map((r) => (
              <GigCard key={r.gig.id} gig={r.gig} note={`${r.distanceKm.toFixed(1)} km away${r.skills.length ? " · matches: " + r.skills.slice(0, 2).join(", ") : ""}`} />
            ))}
          </div>
        </section>
      )}

      <div className="filters card">
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
        <select value={urgency} onChange={(e) => setUrgency(e.target.value)} aria-label="Urgency">
          <option value="">Any urgency</option>
          <option value="High">Urgent</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="Open">Open</option>
          <option value="In Progress">In progress</option>
          <option value="Done">Done</option>
          <option value="">Any status</option>
        </select>
      </div>

      {gigs.length === 0 ? (
        <Empty title="No quests match these filters">Try another town or service.</Empty>
      ) : (
        <div className="grid-cards">
          {gigs.map((g) => (
            <GigCard key={g.id} gig={g} />
          ))}
        </div>
      )}
    </div>
  );
}
