// Job alerts for workers: "notify me when a new quest like this is posted".
import { useState } from "react";
import { townName } from "../lib/format";
import { TOWNS } from "../lib/seed";
import { addAlert, removeAlert, useDB } from "../lib/store";
import type { ServiceCategory, Worker } from "../lib/types";
import { toast } from "../lib/ui";
import { CATEGORIES } from "../../shared/categories.js";
import { Icon } from "./Icons";

export default function AlertsCard({ worker }: { worker: Worker }) {
  const db = useDB();
  const mine = db.alerts.filter((a) => a.workerId === worker.id);
  const [adding, setAdding] = useState(mine.length === 0);
  const [cats, setCats] = useState<ServiceCategory[]>(worker.categories);
  const [towns, setTowns] = useState<string[]>([worker.townId]);
  const [jobs, setJobs] = useState(true);

  const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);
  // the worker's own services first, then the rest
  const ordered = [...worker.categories, ...(CATEGORIES as ServiceCategory[]).filter((c) => !worker.categories.includes(c))];

  function save() {
    if (cats.length === 0) return;
    addAlert({ workerId: worker.id, categories: cats, townIds: towns, includeJobs: jobs });
    setAdding(false);
    toast("Job alert saved. We'll notify you in your Inbox when a matching quest is posted.");
  }

  return (
    <div className="card alerts-card">
      <h2>
        <Icon name="bell" size={18} /> Job alerts
      </h2>
      <p className="muted small">Get a notification (bell icon) the moment a resident posts a quest that fits you.</p>

      {mine.map((a) => (
        <div className="alert-row" key={a.id}>
          <div>
            <div className="chips">
              {a.categories.map((c) => (
                <span key={c} className="cat-chip">
                  {c}
                </span>
              ))}
            </div>
            <div className="muted small mt-xs">
              {a.townIds.length === 0 ? "All pilot towns" : a.townIds.map(townName).join(", ")}
              {a.includeJobs ? " · quests + steady jobs" : " · quests only"}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm icon-only" aria-label="Delete alert" onClick={() => removeAlert(a.id)}>
            <Icon name="trash" size={16} />
          </button>
        </div>
      ))}

      {!adding ? (
        <button className="btn btn-ghost btn-sm mt" onClick={() => setAdding(true)}>
          <Icon name="plus" size={15} /> New alert
        </button>
      ) : (
        <div className="alert-form">
          <div>
            <div className="label">Services</div>
            <div className="chip-row">
              {ordered.map((c) => (
                <button key={c} type="button" className={`svc-chip${cats.includes(c) ? " on" : ""}`} aria-pressed={cats.includes(c)} onClick={() => setCats(toggle(cats, c))}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="label">Towns</div>
            <div className="chip-row">
              <button type="button" className={`chip${towns.length === 0 ? " active" : ""}`} aria-pressed={towns.length === 0} onClick={() => setTowns([])}>
                All pilot towns
              </button>
              {TOWNS.map((t) => (
                <button key={t.id} type="button" className={`chip${towns.includes(t.id) ? " active" : ""}`} aria-pressed={towns.includes(t.id)} onClick={() => setTowns(toggle(towns, t.id))}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <label className="check">
            <input type="checkbox" checked={jobs} onChange={(e) => setJobs(e.target.checked)} /> Also alert me about new steady jobs
          </label>
          <div className="row-btns">
            {mine.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setAdding(false)}>
                Cancel
              </button>
            )}
            <button className="btn btn-primary btn-sm" disabled={cats.length === 0} onClick={save}>
              Save alert
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
