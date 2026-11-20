// Top-right profile button + dropdown. Guests see "Get started"; signed-in users see their account links.
// "Try a demo account" lets the group switch identities quickly during presentations.
import { useEffect, useRef, useState } from "react";
import { initials } from "../lib/format";
import { Link, navigate } from "../lib/router";
import { DEMO_ACCOUNTS } from "../lib/seed";
import { currentAccount, currentWorker, setSession, signIn, signOut, useDB } from "../lib/store";
import { openAuth, toast } from "../lib/ui";

const ROLE_LABEL = { guest: "Guest", resident: "Resident", worker: "Worker", employer: "Employer", admin: "Admin" } as const;

export default function ProfileMenu() {
  const db = useDB();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const acc = currentAccount(db);
  const worker = currentWorker(db);
  const role = db.session.role;
  const displayName = acc?.name ?? (role === "worker" ? worker?.name : role === "admin" ? "TrabahoMap Admin" : undefined);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const go = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };
  const demoWorkers = db.workers.filter((w) => w.verification === "Verified").slice(0, 6);

  return (
    <div className="profile-menu" ref={box}>
      {role === "guest" && (
        <button className="btn btn-ghost btn-sm get-started" onClick={() => openAuth({ mode: "login" })}>
          Sign in
        </button>
      )}
      <button className={`avatar-btn${role === "guest" ? " guest" : ""}`} aria-haspopup="menu" aria-expanded={open} aria-label="Profile menu" onClick={() => setOpen(!open)}>
        {displayName ? (
          initials(displayName)
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="menu-pop" role="menu">
          <div className="menu-head">
            <b>{displayName ?? "Browsing as guest"}</b>
            <span className={`badge role-${role}`}>{ROLE_LABEL[role]}</span>
            {acc && <span className="muted small">{acc.email}</span>}
            {!acc && role !== "guest" && <span className="muted small">Demo identity</span>}
          </div>

          {role === "guest" ? (
            <>
              <button role="menuitem" className="menu-item strong" onClick={go(() => openAuth({ mode: "signup" }))}>
                Create an account
              </button>
              <button role="menuitem" className="menu-item" onClick={go(() => openAuth({ mode: "login" }))}>
                Log in
              </button>
              <Link to="/prices" className="menu-item" onClick={() => setOpen(false)}>
                Price guide
              </Link>
            </>
          ) : (
            <>
              <Link to="/profile" className="menu-item" onClick={() => setOpen(false)}>
                My profile
              </Link>
              {role !== "admin" && (
                <Link to="/inbox" className="menu-item" onClick={() => setOpen(false)}>
                  Inbox &amp; alerts
                </Link>
              )}
              {role === "worker" && (
                <Link to="/dashboard" className="menu-item" onClick={() => setOpen(false)}>
                  My dashboard
                </Link>
              )}
              {role === "resident" && (
                <Link to="/post" className="menu-item" onClick={() => setOpen(false)}>
                  Post a problem
                </Link>
              )}
              {role === "employer" && (
                <Link to="/jobs" className="menu-item" onClick={() => setOpen(false)}>
                  My job posts
                </Link>
              )}
              {role === "admin" && (
                <Link to="/admin" className="menu-item" onClick={() => setOpen(false)}>
                  Admin panel
                </Link>
              )}
              <button
                role="menuitem"
                className="menu-item"
                onClick={go(() => {
                  signOut();
                  toast("Signed out. You can keep browsing as a guest.");
                })}
              >
                Sign out
              </button>
            </>
          )}

          <div className="menu-sep">Try a demo account</div>
          <div className="menu-demo">
            {DEMO_ACCOUNTS.map((a) => (
              <button key={a.id} className="menu-item small" onClick={go(() => signIn(a.id))}>
                {a.businessName ?? a.name} <span className="muted">· {ROLE_LABEL[a.role]}</span>
              </button>
            ))}
            {demoWorkers.map((w) => (
              <button key={w.id} className="menu-item small" onClick={go(() => setSession({ role: "worker", workerId: w.id, userId: null }))}>
                {w.name} <span className="muted">· {w.categories[0]}</span>
              </button>
            ))}
            <button
              className="menu-item small"
              onClick={go(() => {
                setSession({ role: "admin", userId: null });
                navigate("/admin");
              })}
            >
              TrabahoMap Admin <span className="muted">· Admin</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
