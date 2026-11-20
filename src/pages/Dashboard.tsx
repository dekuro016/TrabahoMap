import AlertsCard from "../components/AlertsCard";
import { Empty, RoleNotice, Stars, StatusBadge } from "../components/Bits";
import { GigCard, JobCard } from "../components/Cards";
import { timeAgo } from "../lib/format";
import { recommendedGigs, recommendedJobs } from "../lib/matching";
import { Link } from "../lib/router";
import { jobsDone, updateWorker, useDB, workerRating } from "../lib/store";

export default function Dashboard() {
  const db = useDB();
  if (db.session.role !== "worker") return <RoleNotice need="worker" role="worker" action="see quests and jobs that fit your skills" next="/dashboard" />;
  const me = db.workers.find((w) => w.id === db.session.workerId);
  if (!me) return <Empty title="Worker not found" />;

  const recs = recommendedGigs(db, me);
  const myQuotes = db.quotes.filter((q) => q.workerId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const active = db.gigs.filter((g) => g.assignedWorkerId === me.id && g.status === "In Progress");
  const { avg, count } = workerRating(db, me.id);
  const jobRecs = recommendedJobs(db, me).slice(0, 3);
  const myApps = db.applications.filter((a) => a.workerId === me.id);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Hi, {me.name.split(" ")[0]}!</h1>
          <p className="muted">
            {me.categories.join(" · ")} · {me.barangay} · <Link to={`/workers/${me.id}`}>View my public profile</Link>
          </p>
        </div>
        <label className={`toggle ${me.available ? "on" : ""}`}>
          <input type="checkbox" checked={me.available} onChange={(e) => updateWorker(me.id, { available: e.target.checked })} />
          <span className="toggle-track">
            <span />
          </span>
          {me.available ? "Available for gigs" : "Not available"}
        </label>
      </div>

      {me.verification !== "Verified" && (
        <div className="warn">
          Your profile is <b>waiting for ID verification</b>. Quests below are a preview; you can send quotes and appear in matching once an admin approves you.{" "}
          <Link to="/profile">Edit your Skill Set</Link>
        </div>
      )}

      <div className="stats-row four">
        <div className="stat card">
          <b>{recs.length}</b>
          <span>gigs that fit you</span>
        </div>
        <div className="stat card">
          <b>{active.length}</b>
          <span>active jobs</span>
        </div>
        <div className="stat card">
          <b>{jobsDone(db, me.id)}</b>
          <span>jobs done</span>
        </div>
        <div className="stat card">
          <b>
            <Stars value={avg} />
          </b>
          <span>{count} reviews</span>
        </div>
      </div>

      {active.length > 0 && (
        <section>
          <h2>Active jobs</h2>
          <div className="grid-cards">
            {active.map((g) => (
              <GigCard key={g.id} gig={g} />
            ))}
          </div>
        </section>
      )}

      <section>
        <AlertsCard worker={me} />
      </section>

      <section>
        <h2>Recommended gigs for you</h2>
        <p className="muted small">Open quests that match your services, within your service area. Urgent ones first.</p>
        {recs.length === 0 ? (
          <Empty title="No matching quests right now">We'll show new ones here as residents post them.</Empty>
        ) : (
          <div className="grid-cards">
            {recs.map((r) => (
              <GigCard key={r.gig.id} gig={r.gig} note={`${r.distanceKm.toFixed(1)} km from you${r.skills.length ? " · matches: " + r.skills.slice(0, 2).join(", ") : ""}`} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Steady jobs for you</h2>
        <p className="muted small">Full-time, part-time and contract work that matches your services.</p>
        {jobRecs.length === 0 ? (
          <Empty title="No matching steady jobs right now" />
        ) : (
          <div className="grid-cards">
            {jobRecs.map((r) => (
              <JobCard key={r.job.id} job={r.job} note={`${r.distanceKm.toFixed(1)} km from you`} />
            ))}
          </div>
        )}
      </section>

      {myApps.length > 0 && (
        <section>
          <h2>My job applications</h2>
          <div className="card table-card">
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Employer</th>
                  <th>Sent</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myApps.map((a) => {
                  const j = db.jobs.find((x) => x.id === a.jobId);
                  return (
                    <tr key={a.id}>
                      <td>{j ? <Link to={`/jobs/${j.id}`}>{j.title}</Link> : "—"}</td>
                      <td>{j?.employer}</td>
                      <td className="muted">{timeAgo(a.createdAt)}</td>
                      <td>
                        <span className={`badge ${a.status === "Hired" ? "status-done" : a.status === "Not selected" ? "status-cancelled" : a.status === "Shortlisted" ? "status-in-progress" : "status-open"}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2>My quotes</h2>
        {myQuotes.length === 0 ? (
          <Empty title="You haven't sent any quotes yet" />
        ) : (
          <div className="card table-card">
            <table>
              <thead>
                <tr>
                  <th>Gig</th>
                  <th>Price</th>
                  <th>Sent</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myQuotes.map((q) => {
                  const g = db.gigs.find((x) => x.id === q.gigId);
                  return (
                    <tr key={q.id}>
                      <td>{g ? <Link to={`/gigs/${g.id}`}>{g.title}</Link> : "—"}</td>
                      <td>{q.priceRange}</td>
                      <td className="muted">{timeAgo(q.createdAt)}</td>
                      <td>
                        {q.status === "Accepted" ? (
                          <span className="badge status-done">Hired</span>
                        ) : q.status === "Declined" ? (
                          <span className="badge status-cancelled">Not selected</span>
                        ) : g ? (
                          <StatusBadge status={g.status === "Open" ? "Open" : g.status} />
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
