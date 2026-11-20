import { useState } from "react";
import { Avatar, CategoryChip, Empty, Stars, VerifiedBadges } from "../components/Bits";
import { Icon } from "../components/Icons";
import MapView from "../components/MapView";
import { timeAgo, townName } from "../lib/format";
import { Link } from "../lib/router";
import { addReport, jobsDone, residentName, updateWorker, useDB, workerRating } from "../lib/store";
import { openAuth } from "../lib/ui";

export default function WorkerProfile({ id }: { id: string }) {
  const db = useDB();
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [reported, setReported] = useState(false);
  const w = db.workers.find((x) => x.id === id);
  if (!w) return <Empty title="Worker not found" />;

  const { avg, count } = workerRating(db, w.id);
  const reviews = db.reviews.filter((r) => r.workerId === w.id && r.status === "Visible");
  const isMe = db.session.role === "worker" && db.session.workerId === w.id;
  const isResident = db.session.role === "resident";

  return (
    <div className="profile">
      <Link to="/workers" className="back">
        ← All workers
      </Link>
      <div className="profile-grid">
        <div className="stack">
          <div className="card profile-head">
            <Avatar name={w.name} size={72} />
            <div>
              <h1>{w.name}</h1>
              <div className="badges-row">
                {w.categories.map((c) => (
                  <CategoryChip key={c} category={c} />
                ))}
              </div>
              <div className="worker-line">
                <Stars value={avg} count={count} />
                <span className="muted small">
                  <Icon name="pin" size={13} /> {w.barangay}, {townName(w.townId)} · serves up to {w.serviceRadiusKm} km
                </span>
              </div>
              <VerifiedBadges verified={w.verification === "Verified"} tesda={w.tesdaCertified} />
              {w.verification !== "Verified" && <span className="badge urg-medium">Verification {w.verification.toLowerCase()}</span>}
            </div>
          </div>

          <div className="stats-row">
            <div className="stat card">
              <b>{jobsDone(db, w.id)}</b>
              <span>jobs done</span>
            </div>
            <div className="stat card">
              <b>{w.yearsExperience}</b>
              <span>years experience</span>
            </div>
            <div className="stat card">
              <b>{Math.round(w.responseRate * 100)}%</b>
              <span>response rate</span>
            </div>
          </div>

          <div className="card">
            <h2>About</h2>
            <p>{w.bio}</p>
            <h3>Skills</h3>
            <div className="badges-row">
              {w.skills.map((s) => (
                <span key={s} className="chip static">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="muted">No reviews yet.</p>
            ) : (
              <div className="reviews">
                {reviews.map((r) => (
                  <div className="review" key={r.id}>
                    <div className="review-head">
                      <b>{r.residentName}</b>
                      <span className="rating-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                      <span className="muted small">{timeAgo(r.createdAt)}</span>
                    </div>
                    <p>{r.text}</p>
                    <span className="muted small">
                      <Icon name="check" size={12} /> Verified job through TrabahoMap
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="stack">
          <div className="card">
            {isMe ? (
              <>
                <h3>This is you</h3>
                <label className="check big">
                  <input type="checkbox" checked={w.available} onChange={(e) => updateWorker(w.id, { available: e.target.checked })} />
                  {w.available ? "Available for new gigs" : "Not available right now"}
                </label>
                <Link to="/dashboard" className="btn btn-primary full-w mt">
                  Go to my dashboard
                </Link>
              </>
            ) : (
              <>
                <h3>Contact</h3>
                <p className="muted small">To hire {w.name.split(" ")[0]}, post your problem — matched workers can send you a quote.</p>
                {isResident ? (
                  <Link to="/post" className="btn btn-primary full-w">
                    Post a problem
                  </Link>
                ) : db.session.role === "guest" ? (
                  <button className="btn btn-primary full-w" onClick={() => openAuth({ role: "resident", next: "/post", reason: "Create a free account to post a problem." })}>
                    Get started
                  </button>
                ) : (
                  <p className="muted small">Sign in with a resident account to post a problem.</p>
                )}
                <div className={`avail ${w.available ? "on" : "off"}`}>{w.available ? "● Available now" : "● Not available"}</div>
              </>
            )}
          </div>

          <div className="card map-mini">
            <MapView workers={[w]} focus={{ lat: w.lat, lng: w.lng, zoom: 13 }} height={220} />
          </div>

          {isResident && !isMe && (
            <div className="card">
              {reported ? (
                <p className="muted small">Thanks — your report was sent to the TrabahoMap admin.</p>
              ) : reporting ? (
                <>
                  <label className="field">
                    <span>What happened?</span>
                    <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Did not show up on the agreed day" />
                  </label>
                  <div className="row-btns">
                    <button className="btn btn-ghost" onClick={() => setReporting(false)}>
                      Cancel
                    </button>
                    <button
                      className="btn btn-danger"
                      disabled={reason.trim().length < 5}
                      onClick={() => {
                        addReport({ workerId: w.id, residentName: residentName(db), reason: reason.trim() });
                        setReported(true);
                      }}
                    >
                      Send report
                    </button>
                  </div>
                </>
              ) : (
                <button className="link-btn danger" onClick={() => setReporting(true)}>
                  <Icon name="alert" size={14} /> Report this worker
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
