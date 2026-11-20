// Welcome screen shown right after the intro animation: sign in, create an account, or continue as a guest.
// Shown once per browser (until sign-out), only on the home page — shared links to a quest or job open directly.
import { useEffect, useRef, useState } from "react";
import { intro } from "../lib/intro";
import { TOWNS } from "../lib/seed";
import { continueAsGuest, useDB } from "../lib/store";
import AuthFlow from "./AuthFlow";
import { Icon, type IconName } from "./Icons";

const POINTS: { icon: IconName; title: string; text: string }[] = [
  { icon: "map", title: "See it on the map", text: "Open quests, steady jobs and verified workers in your town." },
  { icon: "spark", title: "AI that understands Taglish", text: "Describe the problem — we find the right service and how urgent it is." },
  { icon: "shield", title: "Verified and safer", text: "ID checks, TESDA badges, and Review Guard against fake reviews." },
];

export default function Welcome({ route }: { route: string }) {
  const db = useDB();
  // People who arrive through a shared link (e.g. #/gigs/g1) are already browsing — don't interrupt them later.
  const [enteredAtHome, setEnteredAtHome] = useState(() => route === "/");
  useEffect(() => {
    const again = () => setEnteredAtHome(true); // footer "Show welcome screen" (for demos)
    window.addEventListener("trabahomap:welcome", again);
    return () => window.removeEventListener("trabahomap:welcome", again);
  }, []);
  const want = enteredAtHome && db.session.role === "guest" && !db.session.welcomed && route === "/";
  const [visible, setVisible] = useState(() => {
    if (want) intro.start(); // keep the map's fly-in waiting until the welcome screen closes
    return want;
  });
  const [leaving, setLeaving] = useState(false);
  const held = useRef(want);

  // Open again after sign-out; play the exit animation after "Continue as guest" or a successful sign-in.
  useEffect(() => {
    if (want) {
      if (!held.current) {
        intro.start();
        held.current = true;
      }
      setLeaving(false);
      setVisible(true);
    } else if (visible) {
      setLeaving(true);
    }
  }, [want, visible]);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => {
      setVisible(false);
      setLeaving(false);
      if (held.current) {
        held.current = false;
        intro.finish();
      }
    }, 420);
    return () => clearTimeout(t);
  }, [leaving]);

  // No page scrolling behind the welcome screen
  useEffect(() => {
    if (!visible) return;
    document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [visible]);

  if (!visible) return null;

  const open = db.gigs.filter((g) => g.status === "Open").length;
  const verified = db.workers.filter((w) => w.verification === "Verified").length;
  const jobs = db.jobs.filter((j) => j.status === "Open").length;

  return (
    <div className={`welcome${leaving ? " leaving" : ""}`} role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <section className="welcome-brand">
        <div className="welcome-logo">
          <span className="logo-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s7-6.3 7-12a7 7 0 0 0-14 0c0 5.7 7 12 7 12z" />
              <path d="M9.5 10.5 11.5 12.5 15 9" />
            </svg>
          </span>
          <span>
            Trabaho<b>Map</b>
          </span>
        </div>

        <span className="pill-glass">
          <Icon name="pin" size={14} /> Batangas · {TOWNS.length} pilot towns
        </span>
        <h1 id="welcome-title">
          Find trusted help — and work — <span className="mint">right in your barangay.</span>
        </h1>
        <p className="welcome-lead">Post a problem in Taglish, get quotes from ID-verified workers nearby, or find gigs and steady jobs close to home.</p>

        <ul className="welcome-points">
          {POINTS.map((p) => (
            <li key={p.title}>
              <span className="point-icon">
                <Icon name={p.icon} size={18} />
              </span>
              <div>
                <b>{p.title}</b>
                <span>{p.text}</span>
              </div>
            </li>
          ))}
        </ul>

        <div className="welcome-stats">
          <div>
            <b>{open}</b>
            <span>open quests</span>
          </div>
          <div>
            <b>{verified}</b>
            <span>verified workers</span>
          </div>
          <div>
            <b>{jobs}</b>
            <span>steady jobs</span>
          </div>
        </div>

        <MiniMap />
      </section>

      <section className="welcome-panel">
        <div className="welcome-card">
          <AuthFlow
            initial={{ mode: "signup" }}
            variant="page"
            onDone={() => undefined /* the screen closes by itself once someone is signed in */}
            startExtra={
              <>
                <div className="or-line">
                  <span>or</span>
                </div>
                <button className="btn btn-guest btn-lg full-w" onClick={continueAsGuest}>
                  Continue as guest <Icon name="arrow" size={18} />
                </button>
                <p className="muted small center guest-note">Browse the map, quests and jobs — no account needed.</p>
              </>
            }
          />
        </div>
      </section>
    </div>
  );
}

/** Decorative map with contour lines and pins (pure SVG, no map library). */
function MiniMap() {
  return (
    <div className="mini-map" aria-hidden="true">
      <svg viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="rgba(160,240,205,.18)" strokeWidth="1.2">
          <path d="M-10 120C40 90 70 130 120 100s80-60 130-30 70 10 90-10" />
          <path d="M-10 95C45 70 80 105 125 78s75-55 125-28 60 8 90-12" />
          <path d="M-10 70C50 48 90 80 130 56s70-44 120-22 55 6 85-14" />
          <path d="M-10 45C55 26 95 55 135 34s65-34 110-16 55 4 90-14" />
          <path d="M40 150c10-25 40-30 60-20s45 5 55-15" />
        </g>
      </svg>
      <span className="mm-pin red" style={{ left: "22%", top: "38%" }} />
      <span className="mm-pin amber" style={{ left: "58%", top: "26%" }} />
      <span className="mm-dot" style={{ left: "40%", top: "60%" }} />
      <span className="mm-dot" style={{ left: "72%", top: "56%" }} />
      <span className="mm-job" style={{ left: "84%", top: "30%" }} />
      <span className="mm-you" style={{ left: "48%", top: "40%" }} />
    </div>
  );
}
