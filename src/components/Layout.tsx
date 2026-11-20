import { useState, type ReactNode } from "react";
import { Link, navigate } from "../lib/router";
import Intro, { replayIntro } from "./Intro";
import AuthModal from "./AuthModal";
import { GetStartedNudge, Toaster } from "./Nudges";
import ProfileMenu from "./ProfileMenu";
import AssistantChat from "./AssistantChat";
import Welcome from "./Welcome";
import { Icon, type IconName } from "./Icons";
import { resetDemoData, showWelcomeAgain, unreadCount, useDB } from "../lib/store";
import { openWelcome } from "../lib/ui";
import type { SessionRole } from "../lib/types";

type NavItem = { to: string; label: string; short: string; icon: IconName; roles?: SessionRole[] };

const NAV: NavItem[] = [
  { to: "/map", label: "Map", short: "Map", icon: "map" },
  { to: "/board", label: "Quest Board", short: "Quests", icon: "list" },
  { to: "/jobs", label: "Steady Jobs", short: "Jobs", icon: "briefcase" },
  { to: "/workers", label: "Workers", short: "Workers", icon: "users" },
];

/** The main action for each account type (highlighted button on desktop, raised center button on phones). */
const CTA: Record<SessionRole, NavItem> = {
  guest: { to: "/post", label: "Post a problem", short: "Post", icon: "plus" },
  resident: { to: "/post", label: "Post a problem", short: "Post", icon: "plus" },
  employer: { to: "/jobs/new", label: "Post a job", short: "Post job", icon: "plus" },
  worker: { to: "/dashboard", label: "My Dashboard", short: "For me", icon: "grid" },
  admin: { to: "/admin", label: "Admin", short: "Admin", icon: "shield" },
};

const NOTICE_KEY = "trabahomap-notice-ok";

function readNotice() {
  try {
    return localStorage.getItem(NOTICE_KEY) === "1";
  } catch {
    return false;
  }
}

const isActive = (to: string, route: string) => to === route || (to === "/board" && route === "/gigs");

export default function Layout({ route, children }: { route: string; children: ReactNode }) {
  const db = useDB();
  const { role } = db.session;
  const [noticeOk, setNoticeOk] = useState(readNotice);
  const cta = CTA[role];
  const unread = unreadCount(db);
  const signedIn = role === "resident" || role === "worker" || role === "employer";

  return (
    <>
      <Intro />
      <Welcome route={route} />

      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="logo">
            <span className="logo-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s7-6.3 7-12a7 7 0 0 0-14 0c0 5.7 7 12 7 12z" />
                <path d="M9.5 10.5 11.5 12.5 15 9" />
              </svg>
            </span>
            <span>
              Trabaho<b>Map</b>
            </span>
          </Link>

          <nav className="nav" aria-label="Main">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className={`nav-link${isActive(n.to, route) ? " active" : ""}`}>
                <Icon name={n.icon} size={16} />
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="top-actions">
            <Link to={cta.to} className={`btn btn-primary btn-sm nav-cta${isActive(cta.to, route) ? " active" : ""}`}>
              <Icon name={cta.icon} size={16} />
              {cta.label}
            </Link>
            {signedIn && (
              <Link to="/inbox" className={`icon-btn${route === "/inbox" ? " active" : ""}`} aria-label={unread ? `Inbox, ${unread} unread` : "Inbox"}>
                <Icon name="bell" size={20} />
                {unread > 0 && <span className="dot-count">{unread > 9 ? "9+" : unread}</span>}
              </Link>
            )}
            <ProfileMenu />
          </div>
        </div>
      </header>

      <main className="container">
        <div key={route} className="page-anim">
          {children}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="logo-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s7-6.3 7-12a7 7 0 0 0-14 0c0 5.7 7 12 7 12z" />
                <path d="M9.5 10.5 11.5 12.5 15 9" />
              </svg>
            </span>
            <div>
              <b>TrabahoMap</b>
              <div className="small">The right help, right in your barangay.</div>
            </div>
          </div>
          <nav className="footer-links small" aria-label="Policies and tools">
            <Link to="/prices">Price guide</Link>
            <Link to="/policies/terms">Terms of Use</Link>
            <Link to="/policies/privacy">Privacy Policy</Link>
            <Link to="/policies/community">Community Guidelines</Link>
            <Link to="/policies/ai">AI Use</Link>
            <Link to="/policies/safety">Safety Tips</Link>
          </nav>
          <div className="footer-meta small">
            Group 7 · Prototype — demo data is saved in this browser only.{" "}
            <button
              className="link-btn"
              onClick={() => {
                resetDemoData();
                try {
                  sessionStorage.removeItem("trabahomap-quest-draft");
                } catch {
                  /* ignore */
                }
                window.location.hash = "/";
              }}
            >
              Reset demo data
            </button>{" "}
            ·{" "}
            <button className="link-btn" onClick={replayIntro}>
              Replay intro
            </button>
            {role === "guest" && (
              <>
                {" "}
                ·{" "}
                <button
                  className="link-btn"
                  onClick={() => {
                    showWelcomeAgain();
                    openWelcome();
                    navigate("/");
                  }}
                >
                  Show welcome screen
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Phone navigation: app-style bottom tab bar */}
      <nav className="tabbar" aria-label="Main (mobile)">
        {NAV.slice(0, 2).map((n) => (
          <Link key={n.to} to={n.to} className={`tab${isActive(n.to, route) ? " active" : ""}`}>
            <Icon name={n.icon} size={20} />
            <span>{n.short}</span>
          </Link>
        ))}
        <Link to={cta.to} className={`tab tab-cta${isActive(cta.to, route) ? " active" : ""}`}>
          <span className="tab-cta-ring">
            <Icon name={cta.icon} size={22} />
          </span>
          <span>{cta.short}</span>
        </Link>
        {NAV.slice(2).map((n) => (
          <Link key={n.to} to={n.to} className={`tab${isActive(n.to, route) ? " active" : ""}`}>
            <Icon name={n.icon} size={20} />
            <span>{n.short}</span>
          </Link>
        ))}
      </nav>

      <AssistantChat raised={!noticeOk} />
      <AuthModal />
      <Toaster />
      {/* Guests who already chose "Continue as guest" on the welcome screen aren't asked again */}
      <GetStartedNudge blocked={!noticeOk || Boolean(db.session.welcomed)} />

      {!noticeOk && (
        <div className="cookie-bar" role="region" aria-label="Privacy notice">
          <span>
            This prototype saves demo data in your browser only. Problem and review text may be sent to our AI service — never your name or ID.{" "}
            <Link to="/policies/privacy">Privacy Policy</Link>
          </span>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              try {
                localStorage.setItem(NOTICE_KEY, "1");
              } catch {
                /* ignore */
              }
              setNoticeOk(true);
            }}
          >
            Got it
          </button>
        </div>
      )}
    </>
  );
}
