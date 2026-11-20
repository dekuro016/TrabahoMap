// Browser side of the AI features.
// Calls our own server (/api/...), which holds the Gemini key.
// If the server isn't reachable (e.g. static preview), it falls back to the keyword classifier.

import { classifyTask, checkReviewTextFallback } from "../../shared/classifier.js";
import type { AIAnalysis, DB, Review } from "./types";

async function postJson<T>(url: string, body: unknown, timeoutMs = 20000): Promise<T> {
  // Opened as a plain file (no server) → skip straight to the fallback.
  if (window.location.protocol === "file:") throw new Error("No server");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) throw new Error("Not JSON");
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * AI Task Analyzer: plain-language problem → category, urgency, safety tip, title.
 * `image` is sent only when the resident ticked "Let AI look at my photo".
 */
export async function analyzeTask(text: string, image?: { mimeType: string; data: string }): Promise<AIAnalysis> {
  try {
    const r = await postJson<AIAnalysis>("/api/analyze-task", image ? { text, image } : { text }, image ? 30000 : 20000);
    if (r && r.category) return r;
    throw new Error("bad response");
  } catch {
    return classifyTask(text) as AIAnalysis;
  }
}

/** Review Guard: rule checks (here) + AI text check (server). */
export async function checkReview(
  db: DB,
  draft: { workerId: string; gigId: string; residentName: string; rating: Review["rating"]; text: string },
): Promise<{ flagged: boolean; reasons: string[]; source: string }> {
  const reasons: string[] = [];

  // Rule 1: only the resident who posted a completed gig may review it.
  const gig = db.gigs.find((g) => g.id === draft.gigId);
  if (!gig || gig.status !== "Done" || gig.residentName !== draft.residentName || gig.assignedWorkerId !== draft.workerId) {
    reasons.push("Review is not linked to a completed job by this resident");
  }

  // Rule 2: near-duplicate of another review for the same worker.
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
  const mine = norm(draft.text);
  const dup = db.reviews.some((r) => {
    if (r.workerId !== draft.workerId || !mine) return false;
    const other = norm(r.text);
    if (!other) return false;
    if (other === mine) return true;
    const a = new Set(mine.split(" "));
    const b = new Set(other.split(" "));
    const overlap = [...a].filter((x) => b.has(x)).length / Math.max(a.size, b.size);
    return overlap > 0.8;
  });
  if (dup) reasons.push("Near-duplicate of another review for this worker");

  // Rule 3: extreme rating with almost no detail.
  if ((draft.rating === 5 || draft.rating === 1) && draft.text.trim().split(/\s+/).length < 4) {
    reasons.push("Extreme rating with almost no details about the job");
  }

  // AI text check
  let source = "fallback";
  try {
    const ai = await postJson<{ flagged: boolean; reasons: string[]; source: string }>("/api/check-review", {
      text: draft.text,
      rating: draft.rating,
    });
    source = ai.source;
    if (ai.flagged) reasons.push(...ai.reasons);
  } catch {
    const fb = checkReviewTextFallback(draft.text);
    if (fb.flagged) reasons.push(...fb.reasons);
  }

  return { flagged: reasons.length > 0, reasons: [...new Set(reasons)], source };
}
