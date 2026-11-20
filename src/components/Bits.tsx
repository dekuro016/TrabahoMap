// Small reusable UI pieces.
import type { ReactNode } from "react";
import { CATEGORIES, TRADE_CATEGORIES } from "../../shared/categories.js";
import { initials } from "../lib/format";
import { useDB } from "../lib/store";
import { openAuth } from "../lib/ui";
import type { GigStatus, ServiceCategory, Urgency } from "../lib/types";
import { CategoryIcon, Icon } from "./Icons";

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return <span className={`badge urg-${urgency.toLowerCase()}`}>{urgency === "High" ? "Urgent" : urgency}</span>;
}

export function StatusBadge({ status }: { status: GigStatus }) {
  return <span className={`badge status-${status.replace(" ", "-").toLowerCase()}`}>{status}</span>;
}

export function CategoryChip({ category }: { category: ServiceCategory }) {
  return (
    <span className="cat-chip">
      <CategoryIcon category={category} size={15} />
      {category}
    </span>
  );
}

export function Stars({ value, count }: { value: number | null; count?: number }) {
  if (value == null) return <span className="muted small">New · no reviews yet</span>;
  return (
    <span className="stars">
      <span className="star-icon">
        <Icon name="star" size={15} />
      </span>
      <b>{value.toFixed(1)}</b>
      {count != null && <span className="muted">({count})</span>}
    </span>
  );
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials(name)}
    </span>
  );
}

export function VerifiedBadges({ verified, tesda }: { verified: boolean; tesda: boolean }) {
  return (
    <span className="badges-row">
      {verified && (
        <span className="badge verified">
          <Icon name="shield" size={13} /> ID verified
        </span>
      )}
      {tesda && <span className="badge tesda">TESDA certified</span>}
    </span>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-title">{title}</div>
      {children && <div className="muted">{children}</div>}
    </div>
  );
}

/**
 * Shown when a page needs a specific account type.
 * Guests get a friendly "sign up" card; signed-in users with another role get a short explanation.
 */
export function RoleNotice({ need, role, action, next }: { need: string; role?: "resident" | "worker" | "employer"; action?: string; next?: string }) {
  const db = useDB();
  if (db.session.role === "guest") {
    return (
      <div className="card signin-card">
        <Icon name="user" size={28} />
        <h2>{action ? `Sign up to ${action}` : "Sign in to continue"}</h2>
        <p className="muted">Browsing the map, quests and jobs is free. You need a free {need.replace(/^the /, "")} account for this step.</p>
        <div className="row-btns center-btns">
          <button className="btn btn-primary" onClick={() => openAuth({ role, next, reason: action ? `Create a free account to ${action}.` : undefined })}>
            Get started
          </button>
          <button className="btn btn-ghost" onClick={() => openAuth({ mode: "login", next })}>
            Log in
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="card notice">
      <Icon name="user" /> This page is for <b>{need}</b>. Switch accounts from the profile menu at the top right.
    </div>
  );
}

/** <option>s for every service category, grouped into skilled trades and other help. */
export function CategoryOptions() {
  const other = CATEGORIES.filter((c) => !TRADE_CATEGORIES.includes(c));
  return (
    <>
      <optgroup label="Skilled trades">
        {TRADE_CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </optgroup>
      <optgroup label="Other help">
        {other.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </optgroup>
    </>
  );
}
