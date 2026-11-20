import { useState } from "react";
import { RoleNotice, CategoryOptions } from "../components/Bits";
import { Link, navigate } from "../lib/router";
import { TOWNS } from "../lib/seed";
import { createJob, employerName, useDB } from "../lib/store";
import type { JobType, ServiceCategory } from "../lib/types";

const lines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

export default function PostJob() {
  const db = useDB();
  const [f, setF] = useState({
    title: "",
    category: "Electrician" as ServiceCategory,
    type: "Full-time" as JobType,
    payMin: "",
    payMax: "",
    payPeriod: "month" as "month" | "day",
    townId: "batangas-city",
    barangay: "Kumintang Ibaba",
    slots: "1",
    description: "",
    requirements: "",
    benefits: "",
  });
  const [agree, setAgree] = useState(false);
  if (db.session.role !== "employer") return <RoleNotice need="employer" role="employer" action="post a steady job" next="/jobs/new" />;

  const town = TOWNS.find((t) => t.id === f.townId)!;
  const brgy = town.barangays.find((b) => b.name === f.barangay) ?? town.barangays[0];
  const min = Number(f.payMin);
  const max = Number(f.payMax || f.payMin);
  const valid = f.title.trim() && f.description.trim() && min > 0 && max >= min && agree;
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  function submit() {
    const job = createJob({
      title: f.title.trim(),
      employer: employerName(db),
      category: f.category,
      type: f.type,
      payMin: min,
      payMax: max,
      payPeriod: f.payPeriod,
      townId: f.townId,
      barangay: brgy.name,
      lat: brgy.lat,
      lng: brgy.lng,
      description: f.description.trim(),
      requirements: lines(f.requirements),
      benefits: lines(f.benefits),
      slots: Math.max(1, Number(f.slots) || 1),
    });
    navigate(`/jobs/${job.id}`);
  }

  return (
    <div className="page-narrow">
      <h1>Post a steady job</h1>
      <p className="muted">Posting as {employerName(db)}. Listings must show the real pay range — see the Community Guidelines.</p>
      <div className="card form-card">
        <label className="field">
          <span>Job title</span>
          <input value={f.title} onChange={set("title")} placeholder="e.g. Shop Electrician" />
        </label>
        <div className="row-2">
          <label className="field">
            <span>Service</span>
            <select value={f.category} onChange={set("category")}>
              <CategoryOptions />
            </select>
          </label>
          <label className="field">
            <span>Type</span>
            <select value={f.type} onChange={set("type")}>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
            </select>
          </label>
        </div>
        <div className="row-3">
          <label className="field">
            <span>Pay from (₱)</span>
            <input type="number" min="0" value={f.payMin} onChange={set("payMin")} placeholder="15000" />
          </label>
          <label className="field">
            <span>Pay up to (₱)</span>
            <input type="number" min="0" value={f.payMax} onChange={set("payMax")} placeholder="18000" />
          </label>
          <label className="field">
            <span>Per</span>
            <select value={f.payPeriod} onChange={set("payPeriod")}>
              <option value="month">month</option>
              <option value="day">day</option>
            </select>
          </label>
        </div>
        <div className="row-3">
          <label className="field">
            <span>Town / City</span>
            <select value={f.townId} onChange={(e) => setF({ ...f, townId: e.target.value, barangay: TOWNS.find((t) => t.id === e.target.value)!.barangays[0].name })}>
              {TOWNS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Barangay</span>
            <select value={brgy.name} onChange={set("barangay")}>
              {town.barangays.map((b) => (
                <option key={b.name}>{b.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Slots</span>
            <input type="number" min="1" value={f.slots} onChange={set("slots")} />
          </label>
        </div>
        <label className="field">
          <span>Job description</span>
          <textarea rows={4} value={f.description} onChange={set("description")} placeholder="What will the worker do? Schedule? Where?" />
        </label>
        <div className="row-2">
          <label className="field">
            <span>Requirements (one per line)</span>
            <textarea rows={4} value={f.requirements} onChange={set("requirements")} placeholder={"2 years experience\nTESDA NC II preferred"} />
          </label>
          <label className="field">
            <span>Benefits (one per line)</span>
            <textarea rows={4} value={f.benefits} onChange={set("benefits")} placeholder={"SSS, PhilHealth, Pag-IBIG\n13th month pay"} />
          </label>
        </div>
        {max > 0 && min > 0 && max < min && <div className="warn">“Pay up to” must be the same or higher than “Pay from”.</div>}
        <label className="check consent">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>
            This is a real job with the pay shown, and I won't charge applicants any fee. I agree to the <Link to="/policies/terms">Terms of Use</Link> and{" "}
            <Link to="/policies/community">Community Guidelines</Link>.
          </span>
        </label>
        <button className="btn btn-primary btn-lg full-w mt" disabled={!valid} onClick={submit}>
          Publish job
        </button>
      </div>
    </div>
  );
}
