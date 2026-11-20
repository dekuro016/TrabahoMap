// Website policies. DRAFT for a student prototype — have your adviser (or a lawyer) review before real launch.
import type { ReactNode } from "react";
import { Icon } from "../components/Icons";
import { Link } from "../lib/router";

const EFFECTIVE = "October 2026";
const CONTACT = "trabahomap.group7@example.com"; // ← replace with your group's real email

type Section = { id: string; title: string; summary: string; body: ReactNode };

const SECTIONS: Section[] = [
  {
    id: "terms",
    title: "Terms of Use",
    summary: "The rules for using TrabahoMap.",
    body: (
      <>
        <h3>1. What TrabahoMap is</h3>
        <p>
          TrabahoMap is an online platform that helps residents of Batangas find local skilled workers for one-time tasks (“quests”) and helps workers find
          steady jobs. <b>TrabahoMap is not an employer, contractor or recruitment agency.</b> Agreements, prices and payments are made directly between
          residents, employers and workers.
        </p>
        <h3>2. Who can use it</h3>
        <ul>
          <li>You must be at least 18 years old to create an account, post a quest, apply for a job, or offer services.</li>
          <li>Information you give us (name, location, skills, credentials) must be true and up to date.</li>
          <li>One person, one account. Don't use another person's identity or ID.</li>
        </ul>
        <h3>3. Your responsibilities</h3>
        <ul>
          <li>
            <b>Residents</b> describe problems honestly, treat workers with respect, and pay the agreed amount.
          </li>
          <li>
            <b>Workers</b> only accept work they are skilled and, where required, licensed to do, show up as agreed, and quote fairly.
          </li>
          <li>
            <b>Employers</b> post real jobs with the real pay range and never charge applicants any fee.
          </li>
        </ul>
        <h3>4. Fees</h3>
        <p>
          Posting a quest, listing a basic worker profile and applying for jobs are free. Optional paid features (such as Featured Worker or Urgent Boost) will
          always show the price before you pay. TrabahoMap does not take a commission from workers' pay.
        </p>
        <h3>5. Things you must not do</h3>
        <ul>
          <li>Post fake quests, fake jobs, fake reviews, or misleading information.</li>
          <li>Harass, threaten, discriminate against or scam other users.</li>
          <li>Ask for or offer payment outside an agreed job in exchange for “guaranteed” work.</li>
          <li>Try to break, overload or copy the platform.</li>
        </ul>
        <h3>6. Suspension</h3>
        <p>
          We may hide content or suspend accounts that break these Terms or the <Link to="/policies/community">Community Guidelines</Link>, especially after
          repeated reports.
        </p>
        <h3>7. Limits of responsibility</h3>
        <p>
          We verify IDs and check credentials when submitted, but we cannot guarantee the quality or safety of every job. Use ratings, ask questions, and follow
          our <Link to="/policies/safety">Safety Tips</Link>. Disputes are between the resident/employer and the worker; we will help by reviewing reports.
        </p>
        <h3>8. Changes</h3>
        <p>We may update these Terms. We'll show the new effective date and notify users of major changes.</p>
      </>
    ),
  },
  {
    id: "privacy",
    title: "Privacy Policy",
    summary: "What data we collect and how we protect it (Data Privacy Act of 2012).",
    body: (
      <>
        <p>
          TrabahoMap respects your privacy and follows the <b>Data Privacy Act of 2012 (Republic Act No. 10173)</b> and the rules of the National Privacy
          Commission (NPC).
        </p>
        <h3>1. Data we collect</h3>
        <ul>
          <li>
            <b>Account info:</b> name, email, mobile number, town and barangay, and your role (resident, worker or employer). If you sign up with Google or
            Apple, we receive only your name and email from them — never your password.
          </li>
          <li>
            <b>Worker profile:</b> skills, years of experience, service area, photo, and, for verification, a valid government ID and TESDA certificate (if any).
          </li>
          <li>
            <b>Activity:</b> quests you post, quotes, job applications, reviews and reports.
          </li>
          <li>
            <b>Quest photos (optional):</b> up to 3 photos you add to a quest. They are shrunk and re-saved before upload, which removes hidden camera data such
            as the GPS location. Anyone who opens the quest can see them, so don't include faces, IDs or your house number.
          </li>
          <li>
            <b>Messages:</b> chats between a resident and the workers who quoted on their quest. Phone numbers and emails typed in a chat are hidden until that
            worker is hired. We don't read chats; if you report a worker, an admin may look at the related chat to decide.
          </li>
          <li>
            <b>Job alerts and notifications:</b> the services and towns a worker chose for alerts, and the in-app notifications we create (new quotes, hires,
            matching quests, job applications).
          </li>
          <li>
            <b>Approximate location</b> of quests and workers (barangay level) to show them on the map.
          </li>
          <li>
            <b>Your device location — only when you tap “Near me”.</b> It is used once, in your browser, to center the map and find your town. It is not saved
            or sent to us.
          </li>
          <li>
            <b>AI Assistant chats:</b> the messages you type to the assistant are sent to the AI service to understand your problem. They are not saved to your
            account; closing or starting a new conversation clears them.
          </li>
        </ul>
        <h3>2. Why we use it</h3>
        <ul>
          <li>To match residents with nearby workers and show listings on the map.</li>
          <li>To verify workers and keep the platform safe (ID checks, reports, Review Guard).</li>
          <li>To improve the service using anonymous, combined statistics.</li>
        </ul>
        <h3>3. What we share — and what we don't</h3>
        <ul>
          <li>Your public profile (name, skills, barangay, ratings) is visible to other users.</li>
          <li>Your phone number is shown only to the person you agreed to work with.</li>
          <li>
            <b>ID documents are never shown publicly</b> and are used only for verification.
          </li>
          <li>
            Our AI features receive <b>only the problem, chat or review text</b> — never your name, phone number or ID. Please don't type personal details
            (full address, phone number) into the AI Assistant. A quest photo is sent to the AI <b>only if you tick</b> “Also let the AI look at my first photo”.
          </li>
          <li>
            Street and satellite maps are loaded from <b>Google Maps</b> (or CARTO/Esri as a backup), which receive the map area you are viewing, like any map
            website.
          </li>
          <li>We never sell your personal data.</li>
        </ul>
        <h3>4. How long we keep it</h3>
        <p>
          We keep your data while your account is active. ID images are deleted after verification is complete, keeping only the result (“verified”). You can delete
          your account yourself from your Profile page, or ask us to delete your data at any time.
        </p>
        <h3>5. Your rights</h3>
        <p>
          Under RA 10173, you have the right to be informed, to access, to correct, to object, to erasure or blocking, to data portability, and to file a complaint
          with the National Privacy Commission. Email us at <b>{CONTACT}</b> to use any of these rights.
        </p>
        <h3>6. Security</h3>
        <p>We use access controls and encrypted connections to protect your data. If a breach happens, we will notify affected users and the NPC as required.</p>
        <div className="note">
          <b>About this prototype:</b> the demo website stores demo data only in your own browser (localStorage). The Google and Apple sign-up buttons are
          simulated — no real account is contacted. Nothing you type in the demo is sent to us, except problem, chat and review text sent to the AI service
          for analysis.
        </div>
      </>
    ),
  },
  {
    id: "community",
    title: "Community Guidelines",
    summary: "How we keep TrabahoMap respectful and trustworthy.",
    body: (
      <>
        <h3>Be honest</h3>
        <ul>
          <li>Describe problems, skills and jobs truthfully. Show real prices and pay ranges.</li>
          <li>Only review workers you actually hired through TrabahoMap.</li>
        </ul>
        <h3>Be respectful</h3>
        <ul>
          <li>No insults, threats, harassment or discrimination based on gender, religion, ethnicity, age, disability or any other characteristic.</li>
          <li>Negative reviews are allowed — keep them about the work, not the person.</li>
          <li>Messages are for the job only: schedule, materials and price. No spam, selling or pressuring someone to pay outside the platform.</li>
        </ul>
        <h3>Be safe and fair</h3>
        <ul>
          <li>Employers must never ask applicants to pay fees for an application, training or “slot”.</li>
          <li>Workers should only take jobs they are qualified for, especially electrical and gas work.</li>
          <li>Show up on time or cancel early. Repeated no-shows lead to suspension.</li>
          <li>
            <b>Tutoring minors:</b> a parent or guardian must be present or nearby during every session, preferably in a common area of the home. Online lessons
            stay on the platform the parent agreed to.
          </li>
          <li>Home cleaners and event helpers: agree on the tasks, hours and pay before the day, and never handle valuables you weren't asked to.</li>
        </ul>
        <h3>Reporting</h3>
        <p>
          Use “Report this worker” on a profile, or report a job listing to our team. An admin reviews every report. Accounts with repeated valid reports are
          suspended.
        </p>
      </>
    ),
  },
  {
    id: "trust",
    title: "Verification & Reviews",
    summary: "How workers get verified and how ratings stay honest.",
    body: (
      <>
        <h3>Worker verification</h3>
        <ul>
          <li>
            Every worker submits a <b>valid government ID</b>. An admin approves it before the worker appears in search and matching. Approved workers get the{" "}
            <b>ID verified</b> badge.
          </li>
          <li>
            Workers can also submit a <b>TESDA National Certificate</b>. If it checks out, they get the <b>TESDA certified</b> badge.
          </li>
          <li>Verification confirms identity and credentials, not the quality of every job — that's what reviews are for.</li>
        </ul>
        <h3>Reviews</h3>
        <ul>
          <li>Only the resident who hired a worker for a completed quest can review that worker. One review per quest.</li>
          <li>
            <b>Review Guard</b> automatically checks new reviews for duplicates, abusive language, spam and fake-looking patterns.
          </li>
          <li>Flagged reviews are held for an admin to check. Reviews are never deleted automatically, and honest negative reviews are kept.</li>
          <li>Workers cannot pay to remove or hide reviews.</li>
        </ul>
      </>
    ),
  },
  {
    id: "ai",
    title: "AI Use",
    summary: "What our AI does, what it doesn't, and your control over it.",
    body: (
      <>
        <p>TrabahoMap uses AI to make finding help faster and to keep ratings trustworthy. We want you to know exactly how.</p>
        <h3>What the AI does</h3>
        <ul>
          <li>
            <b>Task Analyzer:</b> reads your problem description (English, Filipino or Taglish) and suggests the service type, urgency and a basic safety
            precaution. If you tick “Also let the AI look at my first photo”, a small copy of that one photo is sent too, so the AI can see the problem. It is
            told to ignore people, documents and house numbers. Photos are never sent without that tick.
          </li>
          <li>
            <b>Smart Matching:</b> ranks nearby verified workers using a published formula — 40% skill match, 25% distance, 25% rating, 10% response rate.
          </li>
          <li>
            <b>Review Guard:</b> flags possibly fake or abusive reviews for a human admin to check.
          </li>
          <li>
            <b>AI Assistant (chat):</b> the “Ask AI” button lets you describe a problem in a conversation. It asks only the questions it needs, gives basic safety
            steps for emergencies, and prepares a summary. Tapping “Use details for my quest” only fills in the Post a problem form — you review and edit
            everything, and nothing is posted until you press Post.
          </li>
        </ul>
        <h3>What the AI does NOT do</h3>
        <ul>
          <li>It does not give repair instructions — only basic safety precautions.</li>
          <li>It does not diagnose problems with certainty — a qualified worker should inspect.</li>
          <li>It never posts a quest, contacts a worker or hires anyone on your behalf.</li>
          <li>It does not make final decisions: you can change the category and urgency, and admins decide on flagged reviews.</li>
          <li>It never receives your name, phone number or ID — and it never sees your photos unless you tick the box.</li>
        </ul>
        <h3>Accuracy</h3>
        <p>
          AI can be wrong. Always check the suggested category before posting. If the AI service is unavailable, a simpler keyword-based system is used and is
          labeled “keyword fallback”.
        </p>
      </>
    ),
  },
  {
    id: "safety",
    title: "Safety Tips",
    summary: "Simple ways to stay safe when hiring or working.",
    body: (
      <>
        <h3>For residents</h3>
        <ul>
          <li>Check ratings, the ID verified badge and TESDA certification before hiring.</li>
          <li>Agree on the price and what's included before work starts.</li>
          <li>Have someone else at home when a worker visits for the first time.</li>
          <li>For sparks, burning smells, gas leaks or flooding: turn off the breaker or valve and keep away. In an emergency, call 911.</li>
          <li>For tutoring, stay home or nearby during the lesson. For cleaning or events, put away cash and valuables first.</li>
        </ul>
        <h3>For workers</h3>
        <ul>
          <li>Confirm the address and job details before going. Share your schedule with family.</li>
          <li>Only do work you are trained and equipped for, especially electrical and gas work.</li>
          <li>Never pay an “employer” to get a job — report it to us.</li>
        </ul>
      </>
    ),
  },
];

export default function Policies({ section }: { section?: string }) {
  const current = SECTIONS.find((s) => s.id === section);

  return (
    <div className="policies">
      <div className="page-head">
        <div>
          <h1>Policies</h1>
          <p className="muted">Effective {EFFECTIVE}. Plain-language rules for residents, workers and employers.</p>
        </div>
      </div>

      <div className="policy-layout">
        <nav className="policy-nav card">
          <Link to="/policies" className={!current ? "active" : ""}>
            Overview
          </Link>
          {SECTIONS.map((s) => (
            <Link key={s.id} to={`/policies/${s.id}`} className={current?.id === s.id ? "active" : ""}>
              {s.title}
            </Link>
          ))}
        </nav>

        <article className="card policy-body">
          {current ? (
            <>
              <h2>{current.title}</h2>
              <p className="muted">{current.summary}</p>
              {current.body}
            </>
          ) : (
            <>
              <h2>Our policies at a glance</h2>
              <div className="policy-cards">
                {SECTIONS.map((s) => (
                  <Link key={s.id} to={`/policies/${s.id}`} className="policy-card">
                    <b>{s.title}</b>
                    <span className="muted small">{s.summary}</span>
                  </Link>
                ))}
              </div>
              <div className="key-points">
                <h3>Key points</h3>
                <ul className="ticks">
                  <li>Free for residents; basic worker profiles and job applications are free.</li>
                  <li>Workers are ID-verified before they appear in matching.</li>
                  <li>Only real clients can leave reviews; AI flags suspicious ones for a human to check.</li>
                  <li>The AI only sees your problem text — never your name, number or ID. Photos only if you tick the box.</li>
                  <li>Phone numbers in chats stay hidden until a worker is hired.</li>
                  <li>We follow the Data Privacy Act of 2012 (RA 10173). You can ask us to delete your data.</li>
                  <li>Employers must never charge applicants a fee.</li>
                </ul>
              </div>
            </>
          )}
          <p className="draft-note small">
            <Icon name="alert" size={13} /> Draft prepared by Group 7 for a student prototype. To be reviewed before public launch.
          </p>
        </article>
      </div>
    </div>
  );
}
