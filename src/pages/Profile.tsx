// Profile Dashboard: edit personal details; workers also manage services and their Skill Set.
import { useEffect, useState } from "react";
import { Avatar, RoleNotice } from "../components/Bits";
import SkillSetEditor, { ServicePicker } from "../components/SkillSetEditor";
import { timeAgo } from "../lib/format";
import { Link, navigate } from "../lib/router";
import { TOWNS } from "../lib/seed";
import { currentAccount, currentWorker, deleteAccount, updateAccount, updateWorker, useDB } from "../lib/store";
import type { ServiceCategory } from "../lib/types";
import { toast } from "../lib/ui";

const PROVIDER = { google: "Google (simulated)", apple: "Apple (simulated)", email: "Email", demo: "Demo account" } as const;

export default function Profile() {
  const db = useDB();
  const acc = currentAccount(db);
  const worker = currentWorker(db);
  const role = db.session.role;

  // personal details (account, or the worker record for demo workers)
  const base = acc ?? (worker ? { name: worker.name, phone: worker.phone, townId: worker.townId, barangay: worker.barangay, bio: worker.bio, email: "", businessName: undefined } : undefined);
  const [form, setForm] = useState(() => ({
    name: base?.name ?? "",
    phone: base?.phone ?? "",
    townId: base?.townId ?? TOWNS[0].id,
    barangay: base?.barangay ?? TOWNS[0].barangays[0].name,
    bio: base?.bio ?? "",
    businessName: acc?.businessName ?? "",
  }));
  const [wForm, setWForm] = useState(() => ({
    categories: (worker?.categories ?? []) as ServiceCategory[],
    skills: worker?.skills ?? [],
    yearsExperience: String(worker?.yearsExperience ?? 0),
    serviceRadiusKm: worker?.serviceRadiusKm ?? 15,
    tesdaCertified: worker?.tesdaCertified ?? false,
  }));
  const [confirmDelete, setConfirmDelete] = useState(false);

  // reload the form when the signed-in identity changes
  const identity = `${db.session.userId}|${db.session.role}|${db.session.workerId}`;
  useEffect(() => {
    setForm({
      name: base?.name ?? "",
      phone: base?.phone ?? "",
      townId: base?.townId ?? TOWNS[0].id,
      barangay: base?.barangay ?? TOWNS[0].barangays[0].name,
      bio: base?.bio ?? "",
      businessName: acc?.businessName ?? "",
    });
    setWForm({
      categories: (worker?.categories ?? []) as ServiceCategory[],
      skills: worker?.skills ?? [],
      yearsExperience: String(worker?.yearsExperience ?? 0),
      serviceRadiusKm: worker?.serviceRadiusKm ?? 15,
      tesdaCertified: worker?.tesdaCertified ?? false,
    });
    setConfirmDelete(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity]);

  if (role === "guest") return <RoleNotice need="registered" action="create your profile" next="/profile" />;
  if (role === "admin" && !acc)
    return (
      <div className="page-narrow">
        <h1>Admin</h1>
        <p className="muted">The admin is a demo identity with nothing to edit. Go to the <Link to="/admin">Admin panel</Link>.</p>
      </div>
    );

  const town = TOWNS.find((t) => t.id === form.townId) ?? TOWNS[0];
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  function savePersonal() {
    if (form.name.trim().length < 2) return toast("Please enter your name.");
    if (acc) {
      updateAccount(acc.id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        townId: form.townId,
        barangay: form.barangay,
        bio: form.bio.trim(),
        businessName: acc.role === "employer" ? form.businessName.trim() || acc.businessName : undefined,
      });
    } else if (worker) {
      const b = town.barangays.find((x) => x.name === form.barangay) ?? town.barangays[0];
      updateWorker(worker.id, { name: form.name.trim(), phone: form.phone.trim(), townId: town.id, barangay: b.name, lat: b.lat, lng: b.lng, bio: form.bio.trim() });
    }
    toast("Profile saved.");
  }

  function saveWorker() {
    if (!worker) return;
    if (wForm.categories.length === 0) return toast("Choose at least one service.");
    if (wForm.skills.length === 0) return toast("Add at least one skill.");
    updateWorker(worker.id, {
      categories: wForm.categories,
      skills: wForm.skills,
      yearsExperience: Math.max(0, Number(wForm.yearsExperience) || 0),
      serviceRadiusKm: wForm.serviceRadiusKm,
      tesdaCertified: wForm.tesdaCertified,
      bio: form.bio.trim() || worker.bio,
    });
    toast("Skill Set saved — matching now uses your updated skills.");
  }

  const roleLabel = role[0].toUpperCase() + role.slice(1);

  return (
    <div className="profile-page">
      <div className="card profile-head">
        <Avatar name={form.name || "?"} size={72} />
        <div className="grow">
          <h1>{acc?.name ?? worker?.name}</h1>
          <div className="badges-row">
            <span className={`badge role-${role}`}>{roleLabel}</span>
            {worker && <span className={`badge ${worker.verification === "Verified" ? "verified" : "urg-medium"}`}>{worker.verification === "Verified" ? "ID verified" : `Verification ${worker.verification.toLowerCase()}`}</span>}
            {acc?.businessName && <span className="badge tesda">{acc.businessName}</span>}
          </div>
          <p className="muted small">
            {acc ? (
              <>
                {acc.email} · Signed in with {PROVIDER[acc.provider]} · joined {timeAgo(acc.createdAt)}
              </>
            ) : (
              "Demo identity (no account). Changes are saved to the worker profile."
            )}
          </p>
        </div>
        {worker && (
          <Link to={`/workers/${worker.id}`} className="btn btn-ghost btn-sm">
            View public profile
          </Link>
        )}
      </div>

      {worker?.verification === "Pending" && (
        <div className="warn">
          Your worker profile is <b>waiting for ID verification</b>. You'll appear in Smart Matching once an admin approves it. (Demo: switch to the Admin demo account to approve.)
        </div>
      )}

      <div className="profile-cols">
        <section className="card">
          <h2>Personal details</h2>
          <label className="field">
            <span>Full name</span>
            <input value={form.name} onChange={set("name")} />
          </label>
          {acc?.role === "employer" && (
            <label className="field">
              <span>Business name</span>
              <input value={form.businessName} onChange={set("businessName")} />
            </label>
          )}
          {acc && (
            <label className="field">
              <span>Email</span>
              <input value={acc.email} disabled />
            </label>
          )}
          <label className="field">
            <span>Mobile number</span>
            <input inputMode="tel" value={form.phone} onChange={set("phone")} placeholder="09XX XXX XXXX" />
          </label>
          <div className="row-2">
            <label className="field">
              <span>Town / City</span>
              <select value={form.townId} onChange={(e) => setForm({ ...form, townId: e.target.value, barangay: TOWNS.find((t) => t.id === e.target.value)!.barangays[0].name })}>
                {TOWNS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Barangay</span>
              <select value={form.barangay} onChange={set("barangay")}>
                {town.barangays.map((b) => (
                  <option key={b.name}>{b.name}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span>About {role === "worker" ? "your work" : "you"}</span>
            <textarea rows={3} value={form.bio} onChange={set("bio")} placeholder={role === "worker" ? "Experience, tools, areas you serve…" : "Optional"} />
          </label>
          <button className="btn btn-primary" onClick={savePersonal}>
            Save details
          </button>
        </section>

        {worker && (
          <section className="card">
            <h2>Services & Skill Set</h2>
            <div className="field">
              <span>Services you offer</span>
              <ServicePicker value={wForm.categories} onChange={(categories) => setWForm({ ...wForm, categories })} />
            </div>
            <div className="field">
              <span>Skill Set</span>
              <SkillSetEditor skills={wForm.skills} categories={wForm.categories} onChange={(skills) => setWForm({ ...wForm, skills })} />
            </div>
            <div className="row-2">
              <label className="field">
                <span>Years of experience</span>
                <input type="number" min="0" max="60" value={wForm.yearsExperience} onChange={(e) => setWForm({ ...wForm, yearsExperience: e.target.value })} />
              </label>
              <label className="field">
                <span>Service area: {wForm.serviceRadiusKm} km</span>
                <input type="range" min="5" max="40" step="5" value={wForm.serviceRadiusKm} onChange={(e) => setWForm({ ...wForm, serviceRadiusKm: Number(e.target.value) })} />
              </label>
            </div>
            <label className="check consent">
              <input type="checkbox" checked={wForm.tesdaCertified} onChange={(e) => setWForm({ ...wForm, tesdaCertified: e.target.checked })} />
              <span>I have a TESDA National Certificate</span>
            </label>
            <button className="btn btn-primary mt" onClick={saveWorker}>
              Save Skill Set
            </button>
          </section>
        )}

        {acc && (
          <section className="card danger-zone">
            <h2>Account</h2>
            <p className="muted small">Under the Data Privacy Act you can delete your account at any time. This removes your profile from TrabahoMap.</p>
            {confirmDelete ? (
              <div className="row-btns">
                <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    deleteAccount(acc.id);
                    toast("Your account was deleted.");
                    navigate("/");
                  }}
                >
                  Yes, delete my account
                </button>
              </div>
            ) : (
              <button className="btn btn-ghost danger-text" onClick={() => setConfirmDelete(true)}>
                Delete my account
              </button>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
