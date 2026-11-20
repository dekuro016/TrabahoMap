import { useState } from "react";
import { Avatar } from "../components/Bits";
import { GigCard, JobCard } from "../components/Cards";
import { Icon } from "../components/Icons";
import MapExplorer from "../components/MapExplorer";
import { timeAgo, townName } from "../lib/format";
import { saveProblemText } from "../lib/questDraft";
import { Link, navigate } from "../lib/router";
import { TOWNS } from "../lib/seed";
import { useDB } from "../lib/store";
import { openAuth } from "../lib/ui";

const TEAM = [
  { name: "Rannie Jan M. Baon", role: "Founder · Hacker" },
  { name: "Lydon Dhax M. Sumiog", role: "Hacker" },
  { name: "Marco Jian B. Nohay", role: "Connector" },
  { name: "Myra Veronica M. Maligalig", role: "Connector" },
  { name: "Ralph Cristian Y. Roxas", role: "Scrum Master" },
];

const POPULAR = ["Aircon not cooling", "Leaking pipe under the sink", "Sparking outlet", "Math tutor for Grade 5", "Deep cleaning"];

/** "What do you need help with?" — hands the text to Post a problem (residents) or asks guests to sign up first. */
function HeroSearch() {
  const db = useDB();
  const role = db.session.role;
  const [text, setText] = useState("");

  function go(value = text) {
    const v = value.trim();
    if (v.length < 3) return;
    saveProblemText(v);
    if (role === "resident") navigate("/post");
    else openAuth({ role: "resident", next: "/post", reason: "Create a free resident account — your problem is saved and will be filled in for you." });
  }

  if (role === "worker")
    return (
      <div className="hero-cta">
        <Link to="/dashboard" className="btn btn-light btn-lg">
          <Icon name="grid" /> Find work for me
        </Link>
        <Link to="/inbox" className="btn btn-outline-light btn-lg">
          <Icon name="bell" /> Job alerts
        </Link>
      </div>
    );
  if (role === "employer")
    return (
      <div className="hero-cta">
        <Link to="/jobs/new" className="btn btn-light btn-lg">
          <Icon name="plus" /> Post a steady job
        </Link>
        <Link to="/workers" className="btn btn-outline-light btn-lg">
          <Icon name="users" /> Browse workers
        </Link>
      </div>
    );
  if (role === "admin")
    return (
      <div className="hero-cta">
        <Link to="/admin" className="btn btn-light btn-lg">
          <Icon name="shield" /> Open admin panel
        </Link>
      </div>
    );

  return (
    <>
      <form
        className="hero-search"
        onSubmit={(e) => {
          e.preventDefault();
          go();
        }}
      >
        <Icon name="search" size={20} />
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="What do you need help with? e.g. “Hindi lumalamig ang aircon”" aria-label="Describe your problem" />
        <button className="btn btn-primary" disabled={text.trim().length < 3}>
          Find help <Icon name="arrow" size={16} />
        </button>
      </form>
      <div className="hero-chips">
        <span>Popular:</span>
        {POPULAR.map((p) => (
          <button key={p} className="chip-glass" onClick={() => go(p)}>
            {p}
          </button>
        ))}
      </div>
    </>
  );
}

export default function Home() {
  const db = useDB();
  const open = db.gigs.filter((g) => g.status === "Open");
  const urgentFirst = [...open].sort((a, b) => (a.urgency === "High" ? -1 : 0) - (b.urgency === "High" ? -1 : 0) || b.createdAt.localeCompare(a.createdAt));
  const newest = [...open].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const openJobs = db.jobs.filter((j) => j.status === "Open");
  const verified = db.workers.filter((w) => w.verification === "Verified").length;

  return (
    <div className="home">
      {/* 1. HERO */}
      <section className="hero-x">
        <div className="hero-x-text">
          <span className="pill-glass">
            <Icon name="pin" size={14} /> Batangas · {TOWNS.length} pilot towns
          </span>
          <h1>
            The right help, <span className="mint">right in your barangay.</span>
          </h1>
          <p className="hero-x-lead">Describe the problem in English, Filipino or Taglish. We'll show the right service, how urgent it is, and ID-verified workers nearby.</p>
          <HeroSearch />
        </div>
        <div className="hero-x-side">
          <Link to="/board" className="stat-glass">
            <span className="si">
              <Icon name="list" size={20} />
            </span>
            <div>
              <b>{open.length}</b>
              <span>open quests</span>
            </div>
          </Link>
          <Link to="/workers" className="stat-glass">
            <span className="si">
              <Icon name="shield" size={20} />
            </span>
            <div>
              <b>{verified}</b>
              <span>verified workers</span>
            </div>
          </Link>
          <Link to="/jobs" className="stat-glass">
            <span className="si">
              <Icon name="briefcase" size={20} />
            </span>
            <div>
              <b>{openJobs.length}</b>
              <span>steady jobs</span>
            </div>
          </Link>
          {newest && (
            <Link to={`/gigs/${newest.id}`} className="live-card">
              <span className="live-dot" aria-hidden="true" />
              <div>
                <span className="live-label">Just posted · {timeAgo(newest.createdAt)}</span>
                <b>{newest.title}</b>
                <span className="live-where">
                  {newest.barangay}, {townName(newest.townId)}
                </span>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* 2. MAP */}
      <section className="map-hero">
        <div className="section-head">
          <div>
            <span className="eyebrow">
              <Icon name="map" size={14} /> Live map
            </span>
            <h2 className="big-h2">Explore what's happening near you</h2>
          </div>
          <Link to="/map" className="btn btn-ghost">
            Full map <Icon name="arrow" size={16} />
          </Link>
        </div>
        <MapExplorer height="min(60vh, 540px)" flyIn />
      </section>

      {/* 3. AI */}
      <section className="hero">
        <div className="hero-text">
          <span className="eyebrow">
            <Icon name="spark" size={14} /> AI-assisted
          </span>
          <h2 className="big-h2">Describe the problem. We'll find who can fix it.</h2>
          <p className="lead">
            Sparking outlet? Leaking pipe? Aircon not cooling? Type it like you'd tell a neighbor — or add a photo. Our AI figures out the service you need, how urgent it
            is, and the best verified workers nearby.
          </p>
          <div className="steps compact">
            {[
              ["1", "Post your problem", "Type it, add a photo if it helps."],
              ["2", "AI finds the right help", "Service, urgency, fair price range and best matches nearby."],
              ["3", "Chat, compare & hire", "Message workers, compare quotes, ratings and TESDA badges."],
            ].map(([n, t, d]) => (
              <div className="step" key={n}>
                <span className="step-n">{n}</span>
                <div>
                  <b>{t}</b>
                  <div className="muted small">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-demo card">
          <div className="demo-label">
            <Icon name="spark" size={16} /> AI Task Analyzer
          </div>
          <div className="demo-bubble">“Nag-spark yung saksakan sa kusina, may amoy sunog na rin.”</div>
          <div className="demo-arrow">↓</div>
          <dl className="demo-result">
            <div>
              <dt>Service</dt>
              <dd>Electrician</dd>
            </div>
            <div>
              <dt>Issue</dt>
              <dd>Faulty outlet / possible short circuit</dd>
            </div>
            <div>
              <dt>Urgency</dt>
              <dd>
                <span className="badge urg-high">Urgent</span>
              </dd>
            </div>
            <div>
              <dt>Typical price</dt>
              <dd>₱500 – ₱1,000</dd>
            </div>
            <div className="full">
              <dt>Safety tip</dt>
              <dd>Turn off the breaker for that area until an electrician checks it.</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 4. Quests + Jobs */}
      <section>
        <div className="section-head">
          <h2>Open quests right now</h2>
          <Link to="/board" className="btn btn-ghost">
            Quest board <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="grid-cards">
          {urgentFirst.slice(0, 3).map((g) => (
            <GigCard key={g.id} gig={g} />
          ))}
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>Steady jobs</h2>
          <Link to="/jobs" className="btn btn-ghost">
            All jobs <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="grid-cards">
          {openJobs.slice(0, 3).map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      </section>

      <section className="ai-band card">
        <h2>How TrabahoMap uses AI</h2>
        <div className="ai-grid">
          <div>
            <h3>Task Analyzer</h3>
            <p className="muted">Turns a plain-language problem (and, if you allow it, a photo) into a service category, urgency level and a basic safety tip.</p>
          </div>
          <div>
            <h3>Smart Matching</h3>
            <p className="muted">Ranks nearby verified workers by skill match, distance, rating and response rate — and shows why.</p>
          </div>
          <div>
            <h3>Review Guard</h3>
            <p className="muted">Flags fake, duplicate or abusive reviews for an admin to check, so ratings stay trustworthy.</p>
          </div>
        </div>
        <p className="small muted">
          Privacy: only the problem text is sent to the AI — never names, phone numbers or IDs. Photos are sent only when you tick the box.{" "}
          <Link to="/policies/ai" className="on-dark">
            Read our AI Use policy
          </Link>
        </p>
      </section>

      <section className="team">
        <h2>Group 7</h2>
        <div className="team-grid">
          {TEAM.map((t) => (
            <div className="team-card" key={t.name}>
              <Avatar name={t.name} size={38} />
              <div>
                <b>{t.name}</b>
                <span className="muted small">{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
