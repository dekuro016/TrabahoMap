import type { ReactNode } from "react";
import { jobsDone, useDB, workerRating } from "../lib/store";
import { Link } from "../lib/router";
import { timeAgo, townName } from "../lib/format";
import type { Gig, Job, Worker } from "../lib/types";
import { Avatar, CategoryChip, StatusBadge, Stars, UrgencyBadge, VerifiedBadges } from "./Bits";
import { CategoryIcon, Icon } from "./Icons";

/** A gig shown as a "quest card" on the quest board. */
export function GigCard({ gig, note }: { gig: Gig; note?: string }) {
  const db = useDB();
  const quotes = db.quotes.filter((q) => q.gigId === gig.id).length;
  return (
    <Link to={`/gigs/${gig.id}`} className={`quest-card urg-edge-${gig.urgency.toLowerCase()}`}>
      {gig.photos && gig.photos.length > 0 && (
        <div className="quest-cover">
          <img src={gig.photos[0]} alt="" loading="lazy" />
          {gig.photos.length > 1 && (
            <span className="cover-count">
              <Icon name="camera" size={12} /> {gig.photos.length}
            </span>
          )}
        </div>
      )}
      <div className="quest-top">
        <span className="quest-icon">
          <CategoryIcon category={gig.category} size={22} />
        </span>
        <div className="quest-badges">
          <UrgencyBadge urgency={gig.urgency} />
          {gig.status !== "Open" && <StatusBadge status={gig.status} />}
        </div>
      </div>
      <h3 className="quest-title">{gig.title}</h3>
      <p className="quest-desc">“{gig.rawDescription}”</p>
      <div className="quest-meta">
        <span>
          <Icon name="pin" size={14} /> {gig.barangay}, {townName(gig.townId)}
        </span>
        <span>
          <Icon name="clock" size={14} /> {timeAgo(gig.createdAt)}
        </span>
      </div>
      <div className="quest-foot">
        <CategoryChip category={gig.category} />
        <span className="muted small">{quotes === 0 ? "No quotes yet" : `${quotes} quote${quotes > 1 ? "s" : ""}`}</span>
      </div>
      {note && <div className="quest-note">{note}</div>}
    </Link>
  );
}

export function WorkerCard({ worker, extra }: { worker: Worker; extra?: ReactNode }) {
  const db = useDB();
  const { avg, count } = workerRating(db, worker.id);
  return (
    <Link to={`/workers/${worker.id}`} className="worker-card">
      <Avatar name={worker.name} />
      <div className="worker-main">
        <div className="worker-name">{worker.name}</div>
        <div className="muted small">
          {worker.categories.join(" · ")} · {worker.yearsExperience} yrs
        </div>
        <div className="worker-line">
          <Stars value={avg} count={count} />
          <span className="muted small">
            <Icon name="pin" size={13} /> {worker.barangay}, {townName(worker.townId)}
          </span>
        </div>
        <VerifiedBadges verified={worker.verification === "Verified"} tesda={worker.tesdaCertified} />
        {extra}
      </div>
      <div className="worker-side muted small">{jobsDone(db, worker.id)} jobs</div>
    </Link>
  );
}

export function peso(n: number) {
  return "₱" + n.toLocaleString("en-PH");
}

export function payText(job: Job) {
  const range = job.payMin === job.payMax ? peso(job.payMin) : `${peso(job.payMin)} – ${peso(job.payMax)}`;
  return `${range} / ${job.payPeriod}`;
}

/** A steady job listing card. */
export function JobCard({ job, note }: { job: Job; note?: string }) {
  const db = useDB();
  const applicants = db.applications.filter((a) => a.jobId === job.id).length;
  return (
    <Link to={`/jobs/${job.id}`} className="job-card">
      <div className="quest-top">
        <span className="quest-icon job-icon">
          <CategoryIcon category={job.category} size={22} />
        </span>
        <div className="quest-badges">
          <span className={`badge jobtype-${job.type.toLowerCase()}`}>{job.type}</span>
          {job.status === "Closed" && <span className="badge status-cancelled">Closed</span>}
        </div>
      </div>
      <h3 className="quest-title">{job.title}</h3>
      <div className="job-employer">{job.employer}</div>
      <div className="job-pay">{payText(job)}</div>
      <div className="quest-meta">
        <span>
          <Icon name="pin" size={14} /> {job.barangay}, {townName(job.townId)}
        </span>
        <span>
          <Icon name="clock" size={14} /> {timeAgo(job.postedAt)}
        </span>
      </div>
      <div className="quest-foot">
        <CategoryChip category={job.category} />
        <span className="muted small">
          {job.slots} slot{job.slots > 1 ? "s" : ""} · {applicants} applied
        </span>
      </div>
      {note && <div className="quest-note">{note}</div>}
    </Link>
  );
}
