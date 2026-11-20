// The main map experience: filters + interactive Batangas map + list of what's in the selected town.
// Used at the top of the Home page and on the Map page.
import { useMemo, useState } from "react";
import { TOWNS } from "../lib/seed";
import { useDB } from "../lib/store";
import { Empty, CategoryOptions } from "./Bits";
import { GigCard, JobCard, WorkerCard } from "./Cards";
import MapView from "./MapView";

type Tab = "gigs" | "jobs" | "workers";

export default function MapExplorer({ height = "min(68vh, 600px)", flyIn = false }: { height?: string | number; flyIn?: boolean }) {
  const db = useDB();
  const [townId, setTownId] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [show, setShow] = useState({ gigs: true, jobs: true, workers: true });
  const [tab, setTab] = useState<Tab>("gigs");

  const gigs = useMemo(() => db.gigs.filter((g) => g.status === "Open" && (!category || g.category === category)), [db, category]);
  const jobs = useMemo(() => db.jobs.filter((j) => j.status === "Open" && (!category || j.category === category)), [db, category]);
  const workers = useMemo(
    () => db.workers.filter((w) => w.verification === "Verified" && w.available && (!category || w.categories.includes(category as never))),
    [db, category],
  );
  const townCounts = useMemo(
    () => Object.fromEntries(TOWNS.map((t) => [t.id, gigs.filter((g) => g.townId === t.id).length + jobs.filter((j) => j.townId === t.id).length])),
    [gigs, jobs],
  );

  const town = TOWNS.find((t) => t.id === townId);
  const inTown = <T extends { townId: string }>(xs: T[]) => xs.filter((x) => !townId || x.townId === townId);
  const listGigs = inTown(gigs);
  const listJobs = inTown(jobs);
  const listWorkers = inTown(workers);

  return (
    <div className="explorer">
      <div className="filters card explorer-filters">
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Service">
          <option value="">All services</option>
          <CategoryOptions />
        </select>
        <label className="check">
          <input type="checkbox" checked={show.gigs} onChange={(e) => setShow({ ...show, gigs: e.target.checked })} /> <span className="legend gig high" /> Quests
        </label>
        <label className="check">
          <input type="checkbox" checked={show.jobs} onChange={(e) => setShow({ ...show, jobs: e.target.checked })} /> <span className="legend job" /> Steady jobs
        </label>
        <label className="check">
          <input type="checkbox" checked={show.workers} onChange={(e) => setShow({ ...show, workers: e.target.checked })} /> <span className="legend worker" /> Workers
        </label>
        <div className="town-buttons">
          <button className={`chip${!townId ? " active" : ""}`} onClick={() => setTownId(null)}>
            All pilot towns
          </button>
          {TOWNS.map((t) => (
            <button key={t.id} className={`chip${townId === t.id ? " active" : ""}`} onClick={() => setTownId(t.id)}>
              {t.name} <span className="chip-count">{townCounts[t.id]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="map-layout">
        <div className="card map-card">
          <MapView
            flyIn={flyIn}
            gigs={show.gigs ? gigs : []}
            jobs={show.jobs ? jobs : []}
            workers={show.workers ? workers : []}
            showTowns
            townCounts={townCounts}
            selectedTownId={townId}
            onTownClick={setTownId}
            height={height}
          />
          <div className="map-legend small muted">
            <span>
              <span className="legend gig high" /> Urgent quest
            </span>
            <span>
              <span className="legend gig medium" /> Medium
            </span>
            <span>
              <span className="legend gig low" /> Low
            </span>
            <span>
              <span className="legend job" /> Steady job
            </span>
            <span>
              <span className="legend worker" /> Worker
            </span>
            <span>
              <span className="legend area" /> Pilot town (click it)
            </span>
          </div>
        </div>

        <aside className="card side-panel">
          <div className="side-head">
            <h2>{town ? town.name : "All pilot towns"}</h2>
            {town && (
              <button className="link-btn" onClick={() => setTownId(null)}>
                Show all
              </button>
            )}
          </div>
          <div className="tabs">
            <button className={tab === "gigs" ? "active" : ""} onClick={() => setTab("gigs")}>
              Quests ({listGigs.length})
            </button>
            <button className={tab === "jobs" ? "active" : ""} onClick={() => setTab("jobs")}>
              Jobs ({listJobs.length})
            </button>
            <button className={tab === "workers" ? "active" : ""} onClick={() => setTab("workers")}>
              Workers ({listWorkers.length})
            </button>
          </div>
          <div className="side-list">
            {tab === "gigs" &&
              (listGigs.length ? listGigs.map((g) => <GigCard key={g.id} gig={g} />) : <Empty title="No open quests here">Try another town or service.</Empty>)}
            {tab === "jobs" &&
              (listJobs.length ? listJobs.map((j) => <JobCard key={j.id} job={j} />) : <Empty title="No steady jobs here yet">Try another town or service.</Empty>)}
            {tab === "workers" &&
              (listWorkers.length ? listWorkers.map((w) => <WorkerCard key={w.id} worker={w} />) : <Empty title="No workers here yet" />)}
          </div>
        </aside>
      </div>
    </div>
  );
}
