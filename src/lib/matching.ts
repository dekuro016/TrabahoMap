// Smart Matching: recommends the best workers for a gig.
// The score is a transparent formula so residents (and your panel) can see WHY a worker is recommended.
//
//   score = 0.40 × skill match + 0.25 × distance + 0.25 × rating + 0.10 × response rate

import { workerRating } from "./store";
import type { DB, Gig, Job, Worker } from "./types";

export interface Match {
  worker: Worker;
  score: number;
  distanceKm: number;
  rating: number | null;
  reasons: string[];
  inRange: boolean;
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const STOP = new Set(["repair", "the", "and", "ng", "sa", "na", "yung", "ang", "mga", "job"]);

/** Which of the worker's skills appear in the gig text? */
function matchedSkills(gig: Gig, worker: Worker): string[] {
  const text = `${gig.rawDescription} ${gig.specificIssue} ${gig.title}`.toLowerCase();
  return worker.skills.filter((skill) =>
    skill
      .toLowerCase()
      .split(/\s+/)
      .some((word) => word.length > 2 && !STOP.has(word) && text.includes(word)),
  );
}

export function matchWorkers(db: DB, gig: Gig, limit = 5): Match[] {
  return db.workers
    .filter((w) => w.categories.includes(gig.category) && w.verification === "Verified" && w.available)
    .map((w): Match => {
      const d = distanceKm(gig, w);
      const skills = matchedSkills(gig, w);
      const { avg } = workerRating(db, w.id);

      const skillScore = Math.min(1, 0.4 + 0.3 * skills.length); // category already matches → base 0.4
      const distScore = Math.max(0, 1 - d / Math.max(w.serviceRadiusKm, 1));
      const ratingScore = (avg ?? 3.5) / 5;
      const score = 0.4 * skillScore + 0.25 * distScore + 0.25 * ratingScore + 0.1 * w.responseRate;

      const reasons: string[] = [];
      if (w.barangay === gig.barangay && w.townId === gig.townId) reasons.push("Same barangay");
      else if (w.townId === gig.townId) reasons.push("Same town");
      else reasons.push(`${d.toFixed(1)} km away`);
      if (avg) reasons.push(`${avg.toFixed(1)}★`);
      if (skills.length) reasons.push(`Does ${skills.slice(0, 2).join(", ")}`);
      if (w.tesdaCertified) reasons.push("TESDA certified");

      return { worker: w, score, distanceKm: d, rating: avg, reasons, inRange: d <= w.serviceRadiusKm + 5 };
    })
    .filter((m) => m.inRange)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** For the worker dashboard: open gigs that fit this worker, best first. */
export function recommendedGigs(db: DB, worker: Worker) {
  return db.gigs
    .filter((g) => g.status === "Open" && worker.categories.includes(g.category))
    .map((g) => ({ gig: g, distanceKm: distanceKm(g, worker), skills: matchedSkills(g, worker) }))
    .filter((x) => x.distanceKm <= worker.serviceRadiusKm + 5)
    .sort((a, b) => {
      const u = { High: 0, Medium: 1, Low: 2 };
      return u[a.gig.urgency] - u[b.gig.urgency] || a.distanceKm - b.distanceKm;
    });
}

/** Steady jobs that fit a worker's services, nearest first. */
export function recommendedJobs(db: DB, worker: Worker) {
  return db.jobs
    .filter((j) => j.status === "Open" && worker.categories.includes(j.category))
    .map((j) => ({ job: j, distanceKm: distanceKm(j, worker) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Suggested candidates for a steady job (re-uses the gig matching formula). */
export function matchCandidates(db: DB, job: Job, limit = 5): Match[] {
  const asGig = {
    ...job,
    rawDescription: `${job.description} ${job.requirements.join(" ")}`,
    specificIssue: job.title,
    urgency: "Low",
    safetyTip: "",
    aiConfidence: 1,
    aiSource: "fallback",
    residentName: job.employer,
    createdAt: job.postedAt,
    status: "Open",
  } as Gig;
  return matchWorkers(db, asGig, limit);
}
