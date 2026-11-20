import { useState } from "react";
import { Avatar, CategoryChip, Empty, Stars } from "../components/Bits";
import { payText, WorkerCard } from "../components/Cards";
import { Icon } from "../components/Icons";
import LocationCard from "../components/LocationCard";
import { timeAgo, townName } from "../lib/format";
import { distanceKm, matchCandidates } from "../lib/matching";
import { Link } from "../lib/router";
import { applyToJob, employerName, setApplicationStatus, setJobStatus, useDB, workerRating } from "../lib/store";
import { openAuth } from "../lib/ui";
import type { Application } from "../lib/types";

const STATUS_CLASS: Record<Application["status"], string> = {
  Submitted: "status-open",
  Shortlisted: "status-in-progress",
  Hired: "status-done",
  "Not selected": "status-cancelled",
};

export default function JobDetail({ id }: { id: string }) {
  const db = useDB();
  const [msg, setMsg] = useState("");
  const [agree, setAgree] = useState(false);
  const job = db.jobs.find((j) => j.id === id);
  if (!job) return <Empty title="Job not found" />;

  const role = db.session.role;
  const isOwner = role === "employer" && job.employer === employerName(db);
  const me = role === "worker" ? db.workers.find((w) => w.id === db.session.workerId) : undefined;
  const apps = db.applications.filter((a) => a.jobId === job.id);
  const myApp = me && apps.find((a) => a.workerId === me.id);
  const candidates = isOwner ? matchCandidates(db, job, 5).filter((m) => !apps.some((a) => a.workerId === m.worker.id)) : [];

  return (
    <div>
      <Link to="/jobs" className="back">
        ← Steady jobs
      </Link>
      <div className="profile-grid">
        <div className="stack">
          <div className="card gig-head job-head">
            <div className="badges-row">
              <span className={`badge jobtype-${job.type.toLowerCase()}`}>{job.type}</span>
              {job.status === "Closed" && <span className="badge status-cancelled">Closed</span>}
              <CategoryChip category={job.category} />
            </div>
            <h1>{job.title}</h1>
            <div className="job-employer big">{job.employer}</div>
            <div className="job-pay big">{payText(job)}</div>
            <div className="quest-meta">
              <span>
                <Icon name="pin" size={14} /> {job.barangay}, {townName(job.townId)}
              </span>
              <span>
                <Icon name="clock" size={14} /> posted {timeAgo(job.postedAt)}
              </span>
              <span>
                <Icon name="user" size={14} /> {job.slots} slot{job.slots > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="card">
            <h2>About the job</h2>
            <p>{job.description}</p>
            <div className="two-col">
              <div>
                <h3>Requirements</h3>
                <ul className="ticks">
                  {job.requirements.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Benefits</h3>
                <ul className="ticks">
                  {job.benefits.length ? job.benefits.map((b) => <li key={b}>{b}</li>) : <li className="muted">Not specified</li>}
                </ul>
              </div>
            </div>
            <p className="muted small mt">
              <Icon name="shield" size={13} /> Legit employers never ask applicants to pay a fee. Report suspicious job posts — see our{" "}
              <Link to="/policies/community">Community Guidelines</Link>.
            </p>
          </div>

          <LocationCard
            lat={job.lat}
            lng={job.lng}
            barangay={job.barangay}
            townId={job.townId}
            jobs={[job]}
            note={`Work location of ${job.employer}. Use Directions or Street View to see the area before you apply.`}
          />
        </div>

        <aside className="stack">
          {/* Worker: apply */}
          {me && (
            <div className="card">
              {myApp ? (
                <>
                  <h3>Your application</h3>
                  <span className={`badge ${STATUS_CLASS[myApp.status]}`}>{myApp.status}</span>
                  <p className="small mt">“{myApp.message}”</p>
                  <p className="muted small">Sent {timeAgo(myApp.createdAt)}</p>
                </>
              ) : job.status === "Closed" ? (
                <p className="muted">This job is no longer accepting applications.</p>
              ) : (
                <>
                  <h3>Apply for this job</h3>
                  <p className="muted small">Your TrabahoMap profile (skills, ratings, TESDA badge) is sent with your application.</p>
                  <label className="field">
                    <span>Short message to {job.employer}</span>
                    <textarea rows={4} value={msg} placeholder="Ilang taon ka na sa trabahong ito? Kailan ka pwedeng magsimula?" onChange={(e) => setMsg(e.target.value)} />
                  </label>
                  <label className="check consent">
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                    <span>
                      I agree to share my profile with this employer, per the <Link to="/policies/privacy">Privacy Policy</Link>.
                    </span>
                  </label>
                  <button
                    className="btn btn-primary full-w mt"
                    disabled={!msg.trim() || !agree}
                    onClick={() => applyToJob({ jobId: job.id, workerId: me.id, message: msg.trim() })}
                  >
                    Send application
                  </button>
                </>
              )}
            </div>
          )}

          {/* Employer: applicants */}
          {isOwner && (
            <div className="card">
              <div className="side-head">
                <h2>Applicants ({apps.length})</h2>
                <button className="link-btn" onClick={() => setJobStatus(job.id, job.status === "Open" ? "Closed" : "Open")}>
                  {job.status === "Open" ? "Close listing" : "Reopen listing"}
                </button>
              </div>
              {apps.length === 0 && <p className="muted small">No applications yet.</p>}
              <div className="stack">
                {apps.map((a) => {
                  const w = db.workers.find((x) => x.id === a.workerId);
                  if (!w) return null;
                  const r = workerRating(db, w.id);
                  return (
                    <div className="quote" key={a.id}>
                      <div className="quote-head">
                        <Avatar name={w.name} size={36} />
                        <div>
                          <Link to={`/workers/${w.id}`}>
                            <b>{w.name}</b>
                          </Link>
                          <div className="small">
                            <Stars value={r.avg} count={r.count} /> · {w.yearsExperience} yrs · {distanceKm(job, w).toFixed(0)} km
                          </div>
                        </div>
                        <span className={`badge ${STATUS_CLASS[a.status]}`}>{a.status}</span>
                      </div>
                      <p className="small">“{a.message}”</p>
                      {w.tesdaCertified && <span className="badge tesda">TESDA certified</span>}
                      <div className="row-btns mt">
                        {a.status !== "Not selected" && a.status !== "Hired" && (
                          <button className="btn btn-ghost btn-sm" onClick={() => setApplicationStatus(a.id, "Not selected")}>
                            Not selected
                          </button>
                        )}
                        {a.status === "Submitted" && (
                          <button className="btn btn-ghost btn-sm" onClick={() => setApplicationStatus(a.id, "Shortlisted")}>
                            Shortlist
                          </button>
                        )}
                        {a.status !== "Hired" && (
                          <button className="btn btn-primary btn-sm" onClick={() => setApplicationStatus(a.id, "Hired")}>
                            Hire
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isOwner && candidates.length > 0 && (
            <div className="card">
              <h3>Suggested candidates</h3>
              <p className="muted small">Verified workers nearby whose skills match this job. Invite them by sharing the listing.</p>
              <div className="stack">
                {candidates.slice(0, 3).map((m) => (
                  <WorkerCard key={m.worker.id} worker={m.worker} extra={<div className="why">Why: {m.reasons.join(" · ")}</div>} />
                ))}
              </div>
            </div>
          )}

          {!me && !isOwner && (
            <div className="card">
              <h3>Interested?</h3>
              <p className="muted small">Workers apply with their TrabahoMap profile — skills, ratings and TESDA badge.</p>
              {role === "guest" && (
                <button className="btn btn-primary full-w" onClick={() => openAuth({ role: "worker", next: `/jobs/${job.id}`, reason: "Create a free worker account to apply." })}>
                  Sign up to apply
                </button>
              )}
              <p className="muted small">{apps.length} people have applied so far.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
