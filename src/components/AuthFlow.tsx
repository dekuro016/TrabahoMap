// The sign up / log in steps, shared by the pop-up (AuthModal) and the welcome screen (Welcome).
// Keeping one copy means both places always behave the same.
//
// PROTOTYPE NOTE: Google and Apple buttons are SIMULATED — no real OAuth happens and no password is stored.
// For launch, connect a real auth provider (e.g. Supabase Auth / Firebase Auth) in place of signUp/signIn.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { navigate } from "../lib/router";
import { TOWNS } from "../lib/seed";
import { findAccountByEmail, signIn, signUp } from "../lib/store";
import type { Account, ServiceCategory } from "../lib/types";
import { toast, type AuthOptions } from "../lib/ui";
import SkillSetEditor, { ServicePicker } from "./SkillSetEditor";

type Step = "start" | "account" | "role" | "details";
type Provider = Account["provider"];

const ROLES: { id: Account["role"]; title: string; desc: string }[] = [
  { id: "resident", title: "Resident", desc: "I need help at home — post problems and hire nearby workers." },
  { id: "worker", title: "Worker", desc: "I offer skills or services — get quests and steady jobs near me." },
  { id: "employer", title: "Employer", desc: "I run a business — post steady jobs and hire local workers." },
];

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

interface Props {
  initial: AuthOptions;
  variant: "modal" | "page";
  /** Called after a successful sign up / log in. */
  onDone: (acc: Account) => void;
  /** Called when the person follows a link that leaves the flow (e.g. Terms of Use) — the modal closes itself. */
  onLeave?: () => void;
  /** Extra content under the provider buttons on the first step (the welcome screen puts "Continue as guest" here). */
  startExtra?: ReactNode;
}

export default function AuthFlow({ initial, variant, onDone, onLeave, startExtra }: Props) {
  const [mode, setMode] = useState<"signup" | "login">(initial.mode ?? "signup");
  const [step, setStep] = useState<Step>("start");
  const [provider, setProvider] = useState<Provider>("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Account["role"]>(initial.role ?? "resident");
  const [phone, setPhone] = useState("");
  const [townId, setTownId] = useState(TOWNS[0].id);
  const [barangay, setBarangay] = useState(TOWNS[0].barangays[0].name);
  const [businessName, setBusinessName] = useState("");
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [years, setYears] = useState("1");
  const [tesda, setTesda] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  // Move keyboard focus to the first field of each new step (not on the very first render of the welcome page).
  useEffect(() => {
    if (firstRender.current && variant === "page") {
      firstRender.current = false;
      return;
    }
    firstRender.current = false;
    const t = setTimeout(() => box.current?.querySelector<HTMLElement>("input, select, button.provider-btn")?.focus(), 40);
    return () => clearTimeout(t);
  }, [step, variant]);

  const town = TOWNS.find((t) => t.id === townId)!;

  function finish(acc: Account, welcome: string) {
    toast(welcome);
    const roleHome = acc.role === "worker" ? "/dashboard" : acc.role === "employer" ? "/jobs" : undefined;
    // only follow the requested page if it suits the account type that was chosen
    const next = initial.next && (!initial.role || initial.role === acc.role) ? initial.next : roleHome;
    onDone(acc);
    if (next) navigate(next);
  }

  function chooseProvider(p: Provider) {
    setProvider(p);
    setError("");
    setStep("account");
  }

  function continueAccount() {
    if (!emailOk(email)) return setError("Please enter a valid email address.");
    const existing = findAccountByEmail(email);
    if (mode === "login" || existing) {
      if (!existing) return setError("No account uses that email yet. Switch to “Create account”.");
      signIn(existing.id);
      return finish(existing, `Welcome back, ${existing.name.split(" ")[0]}!`);
    }
    if (name.trim().length < 2) return setError("Please enter your full name.");
    setError("");
    setStep("role");
  }

  function create() {
    if (role === "worker" && categories.length === 0) return setError("Choose at least one service you offer.");
    if (role === "worker" && skills.length === 0) return setError("Add at least one skill to your Skill Set.");
    if (role === "employer" && businessName.trim().length < 2) return setError("Please enter your business name.");
    if (!agree) return setError("Please agree to the Terms of Use and Privacy Policy.");
    const acc = signUp({
      name: name.trim(),
      email: email.trim(),
      provider,
      role,
      phone: phone.trim(),
      townId,
      barangay,
      bio: "",
      businessName: role === "employer" ? businessName.trim() : undefined,
      worker: role === "worker" ? { categories, skills, yearsExperience: Math.max(0, Number(years) || 0), tesdaCertified: tesda } : undefined,
    });
    finish(acc, role === "worker" ? "Account created! Your worker profile is waiting for ID verification." : `Welcome to TrabahoMap, ${acc.name.split(" ")[0]}!`);
  }

  const providerLabel = provider === "google" ? "Google" : provider === "apple" ? "Apple" : "Email";
  const stepNo = { start: 1, account: 1, role: 2, details: 3 }[step];
  // On the welcome page, policy links open in a new tab so the person doesn't lose their place.
  const policyLink = (to: string, label: string) =>
    variant === "page" ? (
      <a href={`#${to}`} target="_blank" rel="noopener">
        {label}
      </a>
    ) : (
      <a href={`#${to}`} onClick={() => onLeave?.()}>
        {label}
      </a>
    );

  return (
    <div className={`auth-flow auth-flow-${variant}`} ref={box}>
      {mode === "signup" && step !== "start" && (
        <div className="auth-steps" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={n <= stepNo ? "on" : ""} />
          ))}
        </div>
      )}

      {step === "start" && (
        <div className="step-in">
          <div className="seg auth-tabs" role="tablist" aria-label="Sign in or create an account">
            <button role="tab" aria-selected={mode === "login"} className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>
              Sign in
            </button>
            <button role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "on" : ""} onClick={() => setMode("signup")}>
              Create account
            </button>
          </div>
          <h2 id="auth-title">{mode === "signup" ? (variant === "page" ? "Create your free account" : "Join TrabahoMap") : "Welcome back"}</h2>
          <p className="muted center auth-sub">
            {initial.reason ?? (mode === "signup" ? "Post problems, get quotes, or find work near your barangay." : "Log in to see your quests, messages and alerts.")}
          </p>
          <div className="auth-providers">
            <button className="provider-btn" onClick={() => chooseProvider("google")}>
              <span className="prov-icon g">G</span> Continue with Google
            </button>
            <button className="provider-btn" onClick={() => chooseProvider("apple")}>
              <span className="prov-icon a">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                  <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.8zM14.2 5.8c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3z" />
                </svg>
              </span>
              Continue with Apple
            </button>
            <button className="provider-btn" onClick={() => chooseProvider("email")}>
              <span className="prov-icon e">@</span> Continue with Email
            </button>
          </div>
          {startExtra}
          <p className="proto-note">Prototype: Google and Apple sign-in are simulated. No password or real Google/Apple account is used.</p>
        </div>
      )}

      {step === "account" && (
        <div className="step-in" key="account">
          <h2 id="auth-title">{mode === "signup" ? `Sign up with ${providerLabel}` : `Log in with ${providerLabel}`}</h2>
          {provider !== "email" && <p className="proto-note">Simulated {providerLabel} sign-in — enter the name and email you'd use.</p>}
          {mode === "signup" && (
            <label className="field">
              <span>Full name</span>
              <input value={name} autoComplete="name" onChange={(e) => setName(e.target.value)} placeholder="e.g. Maria Santos" />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={(e) => e.key === "Enter" && continueAccount()} />
          </label>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setStep("start")}>
              Back
            </button>
            <button className="btn btn-primary" onClick={continueAccount}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === "role" && (
        <div className="step-in" key="role">
          <h2 id="auth-title">How will you use TrabahoMap?</h2>
          <p className="muted center">You can change this later by creating another account.</p>
          <div className="role-cards" role="radiogroup" aria-label="Account type">
            {ROLES.map((r) => (
              <button key={r.id} role="radio" aria-checked={role === r.id} className={`role-card${role === r.id ? " on" : ""}`} onClick={() => setRole(r.id)}>
                <b>{r.title}</b>
                <span className="muted small">{r.desc}</span>
              </button>
            ))}
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setStep("account")}>
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setError("");
                setStep("details");
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === "details" && (
        <div className="step-in" key="details">
          <h2 id="auth-title">{role === "worker" ? "Set up your worker profile" : role === "employer" ? "About your business" : "Almost done"}</h2>
          <div className="auth-scroll">
            {role === "employer" && (
              <label className="field">
                <span>Business name</span>
                <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Lipa Hardware & Supply" />
              </label>
            )}
            <div className="row-2">
              <label className="field">
                <span>Town / City</span>
                <select
                  value={townId}
                  onChange={(e) => {
                    setTownId(e.target.value);
                    setBarangay(TOWNS.find((t) => t.id === e.target.value)!.barangays[0].name);
                  }}
                >
                  {TOWNS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Barangay</span>
                <select value={barangay} onChange={(e) => setBarangay(e.target.value)}>
                  {town.barangays.map((b) => (
                    <option key={b.name}>{b.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span>Mobile number {role === "resident" && <em className="muted">(optional)</em>}</span>
              <input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09XX XXX XXXX" />
            </label>

            {role === "worker" && (
              <>
                <div className="field">
                  <span>Services you offer</span>
                  <ServicePicker value={categories} onChange={setCategories} />
                </div>
                <div className="field">
                  <span>Skill Set</span>
                  <SkillSetEditor skills={skills} categories={categories} onChange={setSkills} />
                </div>
                <div className="row-2">
                  <label className="field">
                    <span>Years of experience</span>
                    <input type="number" min="0" max="60" value={years} onChange={(e) => setYears(e.target.value)} />
                  </label>
                  <label className="check consent tesda-check">
                    <input type="checkbox" checked={tesda} onChange={(e) => setTesda(e.target.checked)} />
                    <span>I have a TESDA National Certificate (an admin will check it)</span>
                  </label>
                </div>
                <p className="muted small">After sign-up, upload a valid ID. Workers appear in matching once an admin verifies them.</p>
              </>
            )}

            <label className="check consent">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>
                I agree to the {policyLink("/policies/terms", "Terms of Use")} and {policyLink("/policies/privacy", "Privacy Policy")}.
              </span>
            </label>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={() => setStep("role")}>
              Back
            </button>
            <button className="btn btn-primary" onClick={create}>
              Create account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
