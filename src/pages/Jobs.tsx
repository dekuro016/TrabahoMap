import { useState } from "react";
import { Empty, CategoryOptions } from "../components/Bits";
import { JobCard } from "../components/Cards";
import { recommendedJobs } from "../lib/matching";
import { Link } from "../lib/router";
import { TOWNS } from "../lib/seed";
import { employerName, useDB } from "../lib/store";
import { openAuth } from "../lib/ui";

export default function Jobs() {
  const db = useDB();
  const [category, setCategory] = useState("");
  const [town, setTown] = useState("");
  const [type, setType] = useState("");

  const role = db.session.role;
  const me = role === "worker" ? db.workers.find((w) => w.id === db.session.workerId) : undefined;
  const recs = me ? recommendedJobs(db, me).slice(0, 3) : [];
  const myEmployer = employerName(db);
  const mine = role === "employer" ? db.jobs.filter((j) => j.employer === myEmployer) : [];

  const list = db.jobs
    .filter((j) => j.status === "Open")
    .filter((j) => (!category || j.category === category) && (!town || j.townId === town) && (!type || j.type === type))
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Steady jobs</h1>
          <p className="muted">Full-time, part-time and contract work from local businesses — for workers who want regular income, not just one-time gigs.</p>
        </div>
        {role === "employer" && (
          <Link to="/jobs/new" className="btn btn-primary">
            + Post a job
          </Link>
        )}
        {role === "guest" && (
          <button className="btn btn-ghost" onClick={() => openAuth({ role: "employer", next: "/jobs/new", reason: "Create a free employer account to post steady jobs." })}>
            Hiring? Post a job
          </button>
        )}
      </div>

      {role === "employer" && (
        <section className="recs">
          <h2>Your job posts · {myEmployer}</h2>
          {mine.length === 0 ? (
            <Empty title="You haven't posted a job yet" />
          ) : (
            <div className="grid-cards">
              {mine.map((j) => {
                const n = db.applications.filter((a) => a.jobId === j.id).length;
                return <JobCard key={j.id} job={j} note={n ? `${n} applicant${n > 1 ? "s" : ""} — open to review` : "No applicants yet"} />;
              })}
            </div>
          )}
        </section>
      )}

      {me && recs.length > 0 && (
        <section className="recs">
          <h2>Jobs that fit you, {me.name.split(" ")[0]}</h2>
          <div className="grid-cards">
            {recs.map((r) => (
              <JobCard key={r.job.id} job={r.job} note={`${r.distanceKm.toFixed(1)} km from you · matches your ${r.job.category.toLowerCase()} skills`} />
            ))}
          </div>
        </section>
      )}

      <div className="filters card">
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Service">
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
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Job type">
          <option value="">Any type</option>
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Contract</option>
        </select>
      </div>

      {list.length === 0 ? (
        <Empty title="No jobs match these filters" />
      ) : (
        <div className="grid-cards">
          {list.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      )}
    </div>
  );
}
