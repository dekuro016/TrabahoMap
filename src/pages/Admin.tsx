import { useState } from "react";
import { Avatar, Empty } from "../components/Bits";
import { Icon } from "../components/Icons";
import { timeAgo, townName } from "../lib/format";
import { Link } from "../lib/router";
import { resetDemoData, resolveReport, setReviewStatus, updateWorker, useDB } from "../lib/store";

type Tab = "verify" | "reviews" | "reports" | "overview";

export default function Admin() {
  const db = useDB();
  const [tab, setTab] = useState<Tab>("verify");
  if (db.session.role !== "admin")
    return (
      <div className="card notice">
        This page is for the TrabahoMap admin. For the demo, choose <b>TrabahoMap Admin</b> under “Try a demo account” in the profile menu (top right).
      </div>
    );

  const pending = db.workers.filter((w) => w.verification === "Pending");
  const flagged = db.reviews.filter((r) => r.status === "Under Review");
  const reports = db.reports.filter((r) => !r.resolved);
  const live = db.gigs.filter((g) => !g.id.startsWith("p"));
  const bySource = { gemini: live.filter((g) => g.aiSource === "gemini").length, fallback: live.filter((g) => g.aiSource === "fallback").length };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Admin panel</h1>
          <p className="muted">Keep TrabahoMap trustworthy: verify workers, check flagged reviews, handle reports.</p>
        </div>
      </div>

      <div className="tabs big">
        <button className={tab === "verify" ? "active" : ""} onClick={() => setTab("verify")}>
          Verifications {pending.length > 0 && <span className="count">{pending.length}</span>}
        </button>
        <button className={tab === "reviews" ? "active" : ""} onClick={() => setTab("reviews")}>
          Flagged reviews {flagged.length > 0 && <span className="count">{flagged.length}</span>}
        </button>
        <button className={tab === "reports" ? "active" : ""} onClick={() => setTab("reports")}>
          Reports {reports.length > 0 && <span className="count">{reports.length}</span>}
        </button>
        <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>
          Overview
        </button>
      </div>

      {tab === "verify" &&
        (pending.length === 0 ? (
          <Empty title="No pending verifications" />
        ) : (
          <div className="stack">
            {pending.map((w) => (
              <div className="card admin-row" key={w.id}>
                <Avatar name={w.name} />
                <div className="grow">
                  <b>{w.name}</b>
                  <div className="muted small">
                    {w.categories.join(", ")} · {w.barangay}, {townName(w.townId)} · {w.yearsExperience} yrs · applied {timeAgo(w.joinedAt)}
                  </div>
                  <div className="docs">
                    <span className="doc ok">
                      <Icon name="check" size={13} /> Valid ID submitted
                    </span>
                    <span className={`doc ${w.tesdaCertified ? "ok" : "none"}`}>{w.tesdaCertified ? "✓ TESDA certificate submitted" : "No TESDA certificate"}</span>
                  </div>
                </div>
                <div className="row-btns">
                  <button className="btn btn-ghost" onClick={() => updateWorker(w.id, { verification: "Rejected" })}>
                    Reject
                  </button>
                  <button className="btn btn-primary" onClick={() => updateWorker(w.id, { verification: "Verified", responseRate: 0.8 })}>
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

      {tab === "reviews" &&
        (flagged.length === 0 ? (
          <Empty title="No flagged reviews">Review Guard hasn't flagged anything new.</Empty>
        ) : (
          <div className="stack">
            {flagged.map((r) => {
              const w = db.workers.find((x) => x.id === r.workerId);
              return (
                <div className="card" key={r.id}>
                  <div className="review-head">
                    <b>{r.residentName}</b> → <Link to={`/workers/${r.workerId}`}>{w?.name}</Link>
                    <span className="rating-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    <span className="muted small">{timeAgo(r.createdAt)}</span>
                  </div>
                  <blockquote>“{r.text}”</blockquote>
                  <div className="warn">
                    <Icon name="alert" size={16} /> <b>Review Guard reasons:</b>
                    <ul>
                      {r.flagReasons.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="row-btns">
                    <button className="btn btn-ghost" onClick={() => setReviewStatus(r.id, "Visible")}>
                      Looks fine — publish
                    </button>
                    <button className="btn btn-danger" onClick={() => setReviewStatus(r.id, "Removed")}>
                      Remove review
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {tab === "reports" &&
        (reports.length === 0 ? (
          <Empty title="No open reports" />
        ) : (
          <div className="stack">
            {reports.map((r) => {
              const w = db.workers.find((x) => x.id === r.workerId);
              const count = db.reports.filter((x) => x.workerId === r.workerId).length;
              return (
                <div className="card admin-row" key={r.id}>
                  <div className="grow">
                    <b>
                      {r.residentName} reported <Link to={`/workers/${r.workerId}`}>{w?.name}</Link>
                    </b>
                    <p>{r.reason}</p>
                    <div className="muted small">
                      {timeAgo(r.createdAt)} · {count} total report{count > 1 ? "s" : ""} for this worker
                    </div>
                  </div>
                  <div className="row-btns">
                    <button className="btn btn-ghost" onClick={() => resolveReport(r.id, false)}>
                      Dismiss
                    </button>
                    <button className="btn btn-danger" onClick={() => resolveReport(r.id, true)}>
                      Suspend worker
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {tab === "overview" && (
        <div className="stack">
          <div className="stats-row four">
            <div className="stat card">
              <b>{db.workers.filter((w) => w.verification === "Verified").length}</b>
              <span>verified workers</span>
            </div>
            <div className="stat card">
              <b>{live.filter((g) => g.status === "Open").length}</b>
              <span>open quests</span>
            </div>
            <div className="stat card">
              <b>{live.filter((g) => g.status === "Done").length}</b>
              <span>completed (live)</span>
            </div>
            <div className="stat card">
              <b>{db.jobs.filter((j) => j.status === "Open").length}</b>
              <span>open steady jobs</span>
            </div>
            <div className="stat card">
              <b>{db.applications.length}</b>
              <span>job applications</span>
            </div>
            <div className="stat card">
              <b>{db.reviews.filter((r) => r.flagReasons.length > 0).length}</b>
              <span>reviews flagged by AI</span>
            </div>
          </div>
          <div className="card">
            <h3>AI Task Analyzer usage</h3>
            <p className="muted small">How each posted quest was analyzed (Gemini AI vs. keyword fallback when AI is offline).</p>
            <div className="bars">
              <div>
                <span>Gemini AI</span>
                <div className="bar">
                  <span style={{ width: `${(bySource.gemini / Math.max(1, live.length)) * 100}%` }} />
                </div>
                <b>{bySource.gemini}</b>
              </div>
              <div>
                <span>Fallback</span>
                <div className="bar alt">
                  <span style={{ width: `${(bySource.fallback / Math.max(1, live.length)) * 100}%` }} />
                </div>
                <b>{bySource.fallback}</b>
              </div>
            </div>
          </div>
          <div className="card">
            <h3>Demo controls</h3>
            <p className="muted small">Restore all the original demo data (workers, quests, reviews).</p>
            <button className="btn btn-danger" onClick={() => resetDemoData()}>
              Reset demo data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
