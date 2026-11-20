export type ServiceCategory =
  | "Electrician"
  | "Plumber"
  | "Appliance Repair"
  | "Aircon Technician"
  | "Carpenter"
  | "Mason"
  | "Welder"
  | "Painter"
  | "Tutor"
  | "Tech Support"
  | "Home Cleaning"
  | "Event Assistance";

export type Urgency = "Low" | "Medium" | "High";
export type Role = "resident" | "worker" | "employer" | "admin";

export interface Town {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** Where the town's name label sits on the map (middle of the town's area). */
  label: { lat: number; lng: number };
  barangays: { name: string; lat: number; lng: number }[];
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  categories: ServiceCategory[];
  skills: string[];
  townId: string;
  barangay: string;
  lat: number;
  lng: number;
  serviceRadiusKm: number;
  yearsExperience: number;
  bio: string;
  tesdaCertified: boolean;
  verification: "Verified" | "Pending" | "Rejected";
  available: boolean;
  responseRate: number; // 0–1
  joinedAt: string;
}

export interface AIAnalysis {
  category: ServiceCategory;
  specificIssue: string;
  urgency: Urgency;
  safetyTip: string;
  suggestedTitle: string;
  confidence: number;
  source: "gemini" | "fallback";
  /** True when Gemini also looked at the resident's photo (only if they allowed it). */
  usedPhoto?: boolean;
}

export type GigStatus = "Open" | "In Progress" | "Done" | "Cancelled";

export interface Gig {
  id: string;
  residentName: string;
  rawDescription: string;
  title: string;
  category: ServiceCategory;
  specificIssue: string;
  urgency: Urgency;
  safetyTip: string;
  aiConfidence: number;
  aiSource: "gemini" | "fallback";
  townId: string;
  barangay: string;
  lat: number;
  lng: number;
  status: GigStatus;
  createdAt: string;
  assignedWorkerId?: string;
  /** Up to 3 compressed JPEG photos of the problem (data URLs; prototype keeps them in this browser). */
  photos?: string[];
}

export interface Quote {
  id: string;
  gigId: string;
  workerId: string;
  priceRange: string;
  message: string;
  createdAt: string;
  status: "Pending" | "Accepted" | "Declined";
}

export interface Review {
  id: string;
  gigId: string;
  workerId: string;
  residentName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
  createdAt: string;
  flagged: boolean;
  flagReasons: string[];
  status: "Visible" | "Under Review" | "Removed";
}

export interface Report {
  id: string;
  workerId: string;
  residentName: string;
  reason: string;
  createdAt: string;
  resolved: boolean;
}

/** What the visitor is browsing as. "guest" = not signed in (can browse everything). */
export type SessionRole = Role | "guest";

export interface Session {
  role: SessionRole;
  workerId: string; // which worker you are when role = worker
  userId: string | null; // signed-in account, if any (demo identities may have none)
  /** Guest chose "Continue as guest" on the welcome screen. Cleared on sign-out, so the welcome screen shows again. */
  welcomed?: boolean;
}

/** A chat message inside one quest, between the resident who posted it and one worker who quoted. */
export interface Message {
  id: string;
  gigId: string;
  workerId: string; // the thread is (gig, worker)
  from: "resident" | "worker";
  text: string;
  createdAt: string;
  seen: boolean; // has the other person opened it?
  masked?: boolean; // a phone number / email was hidden because nobody was hired yet
}

/** A worker's saved search: "tell me when a new quest like this is posted". */
export interface JobAlert {
  id: string;
  workerId: string;
  categories: ServiceCategory[];
  townIds: string[]; // empty = all pilot towns
  includeJobs: boolean; // also alert on new steady jobs
  createdAt: string;
}

/** An in-app notification (bell). Residents are identified by name in this prototype; workers by id. */
export interface Notification {
  id: string;
  to: { workerId?: string; residentName?: string; employer?: string };
  kind: "alert" | "quote" | "hired" | "application";
  title: string;
  body: string;
  link: string; // hash route, e.g. "/gigs/g1"
  createdAt: string;
  read: boolean;
}

/** A user account (prototype: stored in this browser; real sign-in comes later). */
export interface Account {
  id: string;
  name: string;
  email: string;
  provider: "google" | "apple" | "email" | "demo";
  role: "resident" | "worker" | "employer";
  phone: string;
  townId: string;
  barangay: string;
  bio: string;
  businessName?: string; // employers
  workerId?: string; // workers: linked worker profile
  createdAt: string;
}

/** A steady / permanent job posted by a business or household (separate from one-time gigs). */
export type JobType = "Full-time" | "Part-time" | "Contract";

export interface Job {
  id: string;
  title: string;
  employer: string;
  category: ServiceCategory;
  type: JobType;
  payMin: number;
  payMax: number;
  payPeriod: "month" | "day";
  townId: string;
  barangay: string;
  lat: number;
  lng: number;
  description: string;
  requirements: string[];
  benefits: string[];
  slots: number;
  postedAt: string;
  status: "Open" | "Closed";
}

export interface Application {
  id: string;
  jobId: string;
  workerId: string;
  message: string;
  createdAt: string;
  status: "Submitted" | "Shortlisted" | "Hired" | "Not selected";
}

export interface DB {
  version: number;
  workers: Worker[];
  gigs: Gig[];
  quotes: Quote[];
  reviews: Review[];
  reports: Report[];
  jobs: Job[];
  applications: Application[];
  accounts: Account[];
  messages: Message[];
  alerts: JobAlert[];
  notifications: Notification[];
  session: Session;
}
