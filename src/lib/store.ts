// The ONLY place that reads/writes app data.
// Prototype: saves to the browser's localStorage.
// To move to a real database later (e.g. Supabase), rewrite this file only — pages stay the same.

import { useSyncExternalStore } from "react";
import { CURRENT_EMPLOYER, CURRENT_RESIDENT, CURRENT_RESIDENT_HOME, TOWNS, createSeed } from "./seed";
import type { Account, Application, DB, Gig, Job, JobAlert, Message, Notification, Quote, Report, Review, ServiceCategory, Session, Worker } from "./types";

const KEY = "trabahomap-db-v3";
const listeners = new Set<() => void>();

/** Older saved data (before messages/alerts existed) gets the new lists added, so nobody loses their demo data. */
function normalize(d: DB): DB {
  d.messages ??= [];
  d.alerts ??= [];
  d.notifications ??= [];
  return d;
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.version === 3) return normalize(parsed);
    }
  } catch {
    /* storage unavailable or corrupted — use seed */
  }
  return createSeed();
}

let db: DB = load();

/** Returns false when the browser refused to save (e.g. storage full because of photos). */
function save(): boolean {
  let ok = true;
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    ok = false; // private mode or storage full — data stays in memory for this visit
  }
  listeners.forEach((l) => l());
  return ok;
}

function update(fn: (draft: DB) => void): boolean {
  const next = structuredClone(db);
  fn(next);
  db = next;
  return save();
}

const MAX_NOTIFICATIONS = 120;
function notify(d: DB, n: Omit<Notification, "id" | "createdAt" | "read">) {
  d.notifications.unshift({ ...n, id: newId("n"), createdAt: new Date().toISOString(), read: false });
  d.notifications = d.notifications.slice(0, MAX_NOTIFICATIONS);
}

export const newId = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** React hook: re-renders the component whenever data changes. */
export function useDB(): DB {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => db,
  );
}

export const getDB = () => db;

// ---------- Session (demo role switcher) ----------
export function setSession(session: Partial<Session>) {
  update((d) => {
    d.session = { ...d.session, ...session };
  });
}

/** Welcome screen: "Continue as guest" (remembered in this browser until sign-out). */
export function continueAsGuest() {
  setSession({ welcomed: true });
}
/** Show the welcome screen again (footer link, for demos). */
export function showWelcomeAgain() {
  setSession({ welcomed: false });
}

// ---------- Accounts (prototype sign-in) ----------
// Real Google / Apple / email sign-in needs a backend (e.g. Supabase Auth). The prototype keeps accounts in this browser.

export interface SignUpInput {
  name: string;
  email: string;
  provider: Account["provider"];
  role: Account["role"];
  phone: string;
  townId: string;
  barangay: string;
  bio: string;
  businessName?: string;
  worker?: { categories: ServiceCategory[]; skills: string[]; yearsExperience: number; tesdaCertified: boolean };
}

function barangayPoint(townId: string, barangay: string) {
  const town = TOWNS.find((t) => t.id === townId) ?? TOWNS[0];
  const b = town.barangays.find((x) => x.name === barangay) ?? town.barangays[0];
  return { townId: town.id, barangay: b.name, lat: b.lat, lng: b.lng };
}

export function findAccountByEmail(email: string) {
  const e = email.trim().toLowerCase();
  return db.accounts.find((a) => a.email.toLowerCase() === e);
}

export function signUp(input: SignUpInput): Account {
  const id = newId("acc");
  let workerId: string | undefined;
  update((d) => {
    if (input.role === "worker" && input.worker) {
      workerId = newId("w");
      const place = barangayPoint(input.townId, input.barangay);
      d.workers.push({
        id: workerId,
        name: input.name,
        phone: input.phone,
        categories: input.worker.categories,
        skills: input.worker.skills,
        ...place,
        serviceRadiusKm: 15,
        yearsExperience: input.worker.yearsExperience,
        bio: input.bio || `${input.worker.categories.join(", ")} based in ${place.barangay}.`,
        tesdaCertified: input.worker.tesdaCertified,
        verification: "Pending", // admin approves ID before the worker appears in matching
        available: true,
        responseRate: 0.8,
        joinedAt: new Date().toISOString(),
      });
    }
    const { worker: _w, ...rest } = input;
    d.accounts.push({ ...rest, id, workerId, createdAt: new Date().toISOString() });
    d.session = { role: input.role, userId: id, workerId: workerId ?? d.session.workerId };
  });
  return db.accounts.find((a) => a.id === id)!;
}

export function signIn(accountId: string) {
  update((d) => {
    const a = d.accounts.find((x) => x.id === accountId);
    if (a) d.session = { role: a.role, userId: a.id, workerId: a.workerId ?? d.session.workerId };
  });
}

export function signOut() {
  update((d) => {
    d.session = { role: "guest", userId: null, workerId: d.session.workerId };
  });
}

export function updateAccount(accountId: string, patch: Partial<Account>) {
  update((d) => {
    const a = d.accounts.find((x) => x.id === accountId);
    if (!a) return;
    Object.assign(a, patch);
    // keep the linked worker profile in sync
    const w = a.workerId ? d.workers.find((x) => x.id === a.workerId) : undefined;
    if (w) {
      w.name = a.name;
      w.phone = a.phone;
      Object.assign(w, barangayPoint(a.townId, a.barangay));
    }
  });
}

/** Deletes the signed-in account (Data Privacy Act: users can ask for deletion). */
export function deleteAccount(accountId: string) {
  update((d) => {
    const a = d.accounts.find((x) => x.id === accountId);
    if (!a) return;
    d.accounts = d.accounts.filter((x) => x.id !== accountId);
    if (a.workerId) {
      const w = d.workers.find((x) => x.id === a.workerId);
      if (w) {
        w.available = false;
        w.verification = "Rejected";
        w.name = "Deleted account";
        w.phone = "";
      }
    }
    d.session = { role: "guest", userId: null, workerId: d.session.workerId };
  });
}

/** Who is using the site right now. */
export function currentAccount(d: DB): Account | undefined {
  return d.session.userId ? d.accounts.find((a) => a.id === d.session.userId) : undefined;
}
export function residentName(d: DB) {
  return currentAccount(d)?.name ?? CURRENT_RESIDENT;
}
export function residentHome(d: DB) {
  const a = currentAccount(d);
  return a ? { townId: a.townId, barangay: a.barangay } : CURRENT_RESIDENT_HOME;
}
export function employerName(d: DB) {
  const a = currentAccount(d);
  return a?.businessName || a?.name || CURRENT_EMPLOYER;
}
export function currentWorker(d: DB): Worker | undefined {
  return d.session.role === "worker" ? d.workers.find((w) => w.id === d.session.workerId) : undefined;
}

// ---------- Gigs ----------
function alertMatches(a: JobAlert, category: ServiceCategory, townId: string) {
  return a.categories.includes(category) && (a.townIds.length === 0 || a.townIds.includes(townId));
}

/**
 * Posts a quest and notifies workers whose job alerts match it.
 * If the browser can't store the photos (storage full), the quest is saved without them — check `photos` on the result.
 */
export function createGig(gig: Omit<Gig, "id" | "createdAt" | "status">): Gig {
  const full: Gig = { ...gig, id: newId("g"), createdAt: new Date().toISOString(), status: "Open" };
  const before = db;
  const write = (g: Gig) =>
    update((d) => {
      d.gigs.unshift(g);
      for (const a of d.alerts) {
        if (!alertMatches(a, g.category, g.townId)) continue;
        notify(d, { to: { workerId: a.workerId }, kind: "alert", title: `New ${g.category.toLowerCase()} quest near you`, body: `${g.title} · ${g.barangay}`, link: `/gigs/${g.id}` });
      }
    });
  if (write(full) || !full.photos?.length) return full;
  db = before; // roll back and try again without photos
  const lighter = { ...full, photos: [] };
  write(lighter);
  return lighter;
}

export function setGigStatus(gigId: string, status: Gig["status"]) {
  update((d) => {
    const g = d.gigs.find((x) => x.id === gigId);
    if (g) g.status = status;
  });
}

// ---------- Quotes ----------
export function addQuote(q: Omit<Quote, "id" | "createdAt" | "status">) {
  update((d) => {
    const updating = d.quotes.some((x) => x.gigId === q.gigId && x.workerId === q.workerId);
    d.quotes = d.quotes.filter((x) => !(x.gigId === q.gigId && x.workerId === q.workerId));
    d.quotes.push({ ...q, id: newId("q"), createdAt: new Date().toISOString(), status: "Pending" });
    const g = d.gigs.find((x) => x.id === q.gigId);
    const w = d.workers.find((x) => x.id === q.workerId);
    if (g && w)
      notify(d, { to: { residentName: g.residentName }, kind: "quote", title: `${updating ? "Updated quote" : "New quote"} from ${w.name}`, body: `${q.priceRange} · ${g.title}`, link: `/gigs/${g.id}` });
  });
}

export function acceptQuote(quoteId: string) {
  update((d) => {
    const q = d.quotes.find((x) => x.id === quoteId);
    if (!q) return;
    d.quotes.forEach((x) => {
      if (x.gigId === q.gigId) x.status = x.id === quoteId ? "Accepted" : "Declined";
    });
    const g = d.gigs.find((x) => x.id === q.gigId);
    if (g) {
      g.status = "In Progress";
      g.assignedWorkerId = q.workerId;
      notify(d, { to: { workerId: q.workerId }, kind: "hired", title: `You're hired by ${g.residentName.split(" ")[0]}!`, body: `${g.title} · ${g.barangay}`, link: `/gigs/${g.id}` });
    }
  });
}

// ---------- Reviews ----------
export function addReview(r: Omit<Review, "id" | "createdAt">) {
  update((d) => {
    d.reviews.unshift({ ...r, id: newId("rv"), createdAt: new Date().toISOString() });
  });
}

export function setReviewStatus(reviewId: string, status: Review["status"]) {
  update((d) => {
    const r = d.reviews.find((x) => x.id === reviewId);
    if (r) {
      r.status = status;
      if (status === "Visible") r.flagged = false;
    }
  });
}

// ---------- Workers ----------
export function updateWorker(workerId: string, patch: Partial<Worker>) {
  update((d) => {
    const w = d.workers.find((x) => x.id === workerId);
    if (w) Object.assign(w, patch);
  });
}

// ---------- Reports ----------
export function addReport(r: Omit<Report, "id" | "createdAt" | "resolved">) {
  update((d) => {
    d.reports.unshift({ ...r, id: newId("rp"), createdAt: new Date().toISOString(), resolved: false });
  });
}

export function resolveReport(reportId: string, suspendWorker: boolean) {
  update((d) => {
    const r = d.reports.find((x) => x.id === reportId);
    if (!r) return;
    r.resolved = true;
    if (suspendWorker) {
      const w = d.workers.find((x) => x.id === r.workerId);
      if (w) {
        w.verification = "Rejected";
        w.available = false;
      }
    }
  });
}

// ---------- Steady jobs ----------
export function createJob(job: Omit<Job, "id" | "postedAt" | "status">): Job {
  const full: Job = { ...job, id: newId("j"), postedAt: new Date().toISOString(), status: "Open" };
  update((d) => {
    d.jobs.unshift(full);
    for (const a of d.alerts) {
      if (!a.includeJobs || !alertMatches(a, full.category, full.townId)) continue;
      notify(d, { to: { workerId: a.workerId }, kind: "alert", title: `New steady job: ${full.title}`, body: `${full.employer} · ${full.barangay}`, link: `/jobs/${full.id}` });
    }
  });
  return full;
}

export function setJobStatus(jobId: string, status: Job["status"]) {
  update((d) => {
    const j = d.jobs.find((x) => x.id === jobId);
    if (j) j.status = status;
  });
}

export function applyToJob(a: Omit<Application, "id" | "createdAt" | "status">) {
  update((d) => {
    if (d.applications.some((x) => x.jobId === a.jobId && x.workerId === a.workerId)) return;
    d.applications.push({ ...a, id: newId("a"), createdAt: new Date().toISOString(), status: "Submitted" });
    const j = d.jobs.find((x) => x.id === a.jobId);
    const w = d.workers.find((x) => x.id === a.workerId);
    if (j && w) notify(d, { to: { employer: j.employer }, kind: "application", title: `${w.name} applied`, body: j.title, link: `/jobs/${j.id}` });
  });
}

export function setApplicationStatus(appId: string, status: Application["status"]) {
  update((d) => {
    const a = d.applications.find((x) => x.id === appId);
    if (a) a.status = status;
  });
}

// ---------- Messages (quest chat) ----------
// A thread = one quest + one worker who quoted on it. Contact details stay hidden until that worker is hired.

const PHONE = /(\+?63[\s.-]?|0)9\d{2}[\s.-]?\d{3}[\s.-]?\d{4}/g;
const LANDLINE = /\(?0\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/gi;

/** Hides phone numbers and emails. Returns the cleaned text and whether anything was hidden. */
export function maskContacts(text: string): { text: string; masked: boolean } {
  const out = text.replace(EMAIL, "[email hidden until hired]").replace(PHONE, "[number hidden until hired]").replace(LANDLINE, "[number hidden until hired]");
  return { text: out, masked: out !== text };
}

export function isHired(d: DB, gigId: string, workerId: string) {
  const g = d.gigs.find((x) => x.id === gigId);
  return Boolean(g && g.assignedWorkerId === workerId);
}

export function sendMessage(gigId: string, workerId: string, from: Message["from"], raw: string): Message | null {
  const clean = raw.trim().slice(0, 1000);
  if (!clean) return null;
  const { text, masked } = isHired(db, gigId, workerId) ? { text: clean, masked: false } : maskContacts(clean);
  const m: Message = { id: newId("m"), gigId, workerId, from, text, createdAt: new Date().toISOString(), seen: false, masked };
  update((d) => {
    d.messages.push(m);
  });
  return m;
}

/** Marks the other person's messages in this thread as seen. */
export function markThreadSeen(gigId: string, workerId: string, viewer: Message["from"]) {
  const unseen = db.messages.some((m) => m.gigId === gigId && m.workerId === workerId && m.from !== viewer && !m.seen);
  if (!unseen) return;
  update((d) => {
    d.messages.forEach((m) => {
      if (m.gigId === gigId && m.workerId === workerId && m.from !== viewer) m.seen = true;
    });
  });
}

export function threadMessages(d: DB, gigId: string, workerId: string) {
  return d.messages.filter((m) => m.gigId === gigId && m.workerId === workerId);
}

/** Who the current visitor is, for messages and notifications. */
export type Viewer = { kind: "resident"; name: string } | { kind: "worker"; id: string } | { kind: "employer"; name: string } | null;
export function currentViewer(d: DB): Viewer {
  if (d.session.role === "resident") return { kind: "resident", name: residentName(d) };
  if (d.session.role === "worker") return { kind: "worker", id: d.session.workerId };
  if (d.session.role === "employer") return { kind: "employer", name: employerName(d) };
  return null;
}

export interface Thread {
  gig: Gig;
  worker: Worker;
  last?: Message;
  unread: number;
}

/** All quest chats the visitor is part of (a thread exists once a worker has quoted). */
export function threadsFor(d: DB): Thread[] {
  const v = currentViewer(d);
  if (!v || v.kind === "employer") return [];
  const out: Thread[] = [];
  for (const q of d.quotes) {
    const gig = d.gigs.find((g) => g.id === q.gigId);
    const worker = d.workers.find((w) => w.id === q.workerId);
    if (!gig || !worker) continue;
    if (v.kind === "resident" && gig.residentName !== v.name) continue;
    if (v.kind === "worker" && worker.id !== v.id) continue;
    const msgs = threadMessages(d, gig.id, worker.id);
    if (msgs.length === 0 && (gig.status === "Done" || gig.status === "Cancelled")) continue; // old jobs with no chat
    const other = v.kind === "resident" ? "worker" : "resident";
    out.push({ gig, worker, last: msgs[msgs.length - 1], unread: msgs.filter((m) => m.from === other && !m.seen).length });
  }
  return out.sort((a, b) => (b.last?.createdAt ?? "").localeCompare(a.last?.createdAt ?? ""));
}

// ---------- Job alerts ----------
export function addAlert(a: Omit<JobAlert, "id" | "createdAt">) {
  update((d) => {
    d.alerts.push({ ...a, id: newId("al"), createdAt: new Date().toISOString() });
  });
}

export function removeAlert(alertId: string) {
  update((d) => {
    d.alerts = d.alerts.filter((a) => a.id !== alertId);
  });
}

// ---------- Notifications ----------
export function notificationsFor(d: DB): Notification[] {
  const v = currentViewer(d);
  if (!v) return [];
  return d.notifications.filter((n) =>
    v.kind === "worker" ? n.to.workerId === v.id : v.kind === "resident" ? n.to.residentName === v.name : n.to.employer === v.name,
  );
}

export function markNotificationsRead(ids: string[]) {
  if (!ids.length) return;
  update((d) => {
    d.notifications.forEach((n) => {
      if (ids.includes(n.id)) n.read = true;
    });
  });
}

/** Number on the bell: unread notifications + unread chat messages. */
export function unreadCount(d: DB) {
  return notificationsFor(d).filter((n) => !n.read).length + threadsFor(d).reduce((s, t) => s + t.unread, 0);
}

// ---------- Demo ----------
export function resetDemoData() {
  db = createSeed();
  save();
}

// ---------- Derived helpers ----------
export function workerRating(d: DB, workerId: string): { avg: number | null; count: number } {
  const rs = d.reviews.filter((r) => r.workerId === workerId && r.status === "Visible");
  if (rs.length === 0) return { avg: null, count: 0 };
  return { avg: rs.reduce((s, r) => s + r.rating, 0) / rs.length, count: rs.length };
}

export function jobsDone(d: DB, workerId: string) {
  return d.gigs.filter((g) => g.assignedWorkerId === workerId && g.status === "Done").length;
}
