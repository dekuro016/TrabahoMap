import { useEffect, useMemo, useState } from "react";
import { RoleNotice, CategoryOptions } from "../components/Bits";
import { WorkerCard } from "../components/Cards";
import { Icon } from "../components/Icons";
import { PhotoPicker } from "../components/Photos";
import PriceGuide from "../components/PriceGuide";
import { URGENCIES } from "../../shared/categories.js";
import { analyzeTask } from "../lib/ai";
import { photoForAI } from "../lib/photos";
import { matchWorkers } from "../lib/matching";
import { Link, navigate } from "../lib/router";
import { TOWNS } from "../lib/seed";
import { createGig, residentHome, residentName, useDB } from "../lib/store";
import { hasProblemText, hasQuestDraft, takeProblemText, takeQuestDraft } from "../lib/questDraft";
import { toast } from "../lib/ui";
import type { AIAnalysis, Gig, ServiceCategory, Urgency } from "../lib/types";

const EXAMPLES = [
  "Nag-spark yung saksakan sa kusina tuwing isasaksak ko yung rice cooker, may amoy sunog na rin.",
  "Hindi na lumalamig yung aircon sa kwarto namin.",
  "Barado ang lababo at umaapaw na yung tubig.",
  "Pagawa po ng cabinet sa kusina, kahoy sana.",
];

export default function Post() {
  const db = useDB();
  const [text, setText] = useState("");
  const [townId, setTownId] = useState(() => residentHome(db).townId);
  const [barangay, setBarangay] = useState(() => residentHome(db).barangay);
  const [loading, setLoading] = useState(false);
  const [ai, setAi] = useState<AIAnalysis | null>(null);
  const [edit, setEdit] = useState<{ category: ServiceCategory; urgency: Urgency; title: string } | null>(null);
  const [fromAssistant, setFromAssistant] = useState(false);
  const [draftTick, setDraftTick] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [aiPhoto, setAiPhoto] = useState(false); // resident allows the AI to look at the first photo
  const [autoRun, setAutoRun] = useState(false);

  // Pre-fill from the AI Assistant chat ("Use details for my quest"). The resident still reviews everything.
  useEffect(() => {
    const on = () => setDraftTick((n) => n + 1);
    window.addEventListener("trabahomap:draft", on);
    return () => window.removeEventListener("trabahomap:draft", on);
  }, []);
  useEffect(() => {
    if (db.session.role !== "resident" || !hasQuestDraft()) return;
    const d = takeQuestDraft();
    if (!d) return;
    setText(d.description);
    const t = TOWNS.find((x) => x.id === d.townId);
    if (t) {
      setTownId(t.id);
      setBarangay(t.barangays.find((b) => b.name === d.barangay)?.name ?? t.barangays[0].name);
    }
    setAi({ category: d.category as ServiceCategory, specificIssue: d.specificIssue, urgency: d.urgency, safetyTip: d.safetyTip, suggestedTitle: d.title, confidence: d.confidence, source: d.source });
    setEdit({ category: d.category as ServiceCategory, urgency: d.urgency, title: d.title });
    setFromAssistant(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db.session.role, draftTick]);

  // Pre-fill from the home page search box ("What do you need help with?") and analyze it right away.
  useEffect(() => {
    if (db.session.role !== "resident" || !hasProblemText()) return;
    const t = takeProblemText();
    if (!t) return;
    setText(t);
    setAi(null);
    setAutoRun(true);
  }, [db.session.role]);
  useEffect(() => {
    if (!autoRun || !text.trim()) return;
    setAutoRun(false);
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, text]);

  const town = TOWNS.find((t) => t.id === townId)!;
  const brgy = town.barangays.find((b) => b.name === barangay) ?? town.barangays[0];

  const previewGig: Gig | null = useMemo(() => {
    if (!ai || !edit) return null;
    return {
      id: "preview", residentName: residentName(db), rawDescription: text, title: edit.title, category: edit.category,
      specificIssue: ai.specificIssue, urgency: edit.urgency, safetyTip: ai.safetyTip, aiConfidence: ai.confidence, aiSource: ai.source,
      townId, barangay: brgy.name, lat: brgy.lat, lng: brgy.lng, status: "Open", createdAt: new Date().toISOString(),
    };
  }, [ai, edit, text, townId, brgy]);

  const matches = useMemo(() => (previewGig ? matchWorkers(db, previewGig, 3) : []), [db, previewGig]);

  if (db.session.role !== "resident")
    return (
      <>
        {db.session.role === "guest" && (hasQuestDraft() || hasProblemText()) && (
          <div className="ok page-narrow">Your problem description is saved. Create a free resident account and it will be filled in for you.</div>
        )}
        <RoleNotice need="resident" role="resident" action="post a problem" next="/post" />
      </>
    );

  async function run() {
    if (text.trim().length < 5) return;
    setLoading(true);
    let image: { mimeType: string; data: string } | undefined;
    if (aiPhoto && photos[0]) {
      try {
        image = await photoForAI(photos[0]);
      } catch {
        image = undefined; // text-only analysis still works
      }
    }
    const r = await analyzeTask(text, image);
    setAi(r);
    setEdit({ category: r.category, urgency: r.urgency, title: r.suggestedTitle });
    setLoading(false);
  }

  function post() {
    if (!previewGig) return;
    const { id: _id, createdAt: _c, status: _s, ...rest } = previewGig;
    const g = createGig({ ...rest, photos });
    if (photos.length && !g.photos?.length) toast("Posted — but this browser's storage is full, so the photos weren't saved.");
    navigate(`/gigs/${g.id}`);
  }

  return (
    <div className="page-narrow">
      <h1>Post a problem</h1>
      <p className="muted">Describe it like you would to a neighbor. Our AI will figure out what kind of worker you need.</p>
      {fromAssistant && (
        <div className="ok">
          <Icon name="spark" size={14} /> Filled in from your chat with the AI Assistant. Please review and edit anything below before posting — nothing has been posted yet.
        </div>
      )}

      <div className="card form-card">
        <label className="field">
          <span>What's the problem?</span>
          <textarea
            rows={4}
            value={text}
            placeholder="Hal. “Tumutulo yung tubo sa ilalim ng lababo, basa na yung cabinet.”"
            onChange={(e) => {
              setText(e.target.value);
              setAi(null);
              setFromAssistant(false);
            }}
          />
        </label>
        <div className="examples">
          <span className="muted small">Try an example:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              className="chip"
              onClick={() => {
                setText(ex);
                setAi(null);
              }}
            >
              {ex.length > 42 ? ex.slice(0, 42) + "…" : ex}
            </button>
          ))}
        </div>

        <div className="field">
          <span>
            Photos <em className="muted">(optional)</em>
          </span>
          <PhotoPicker
            photos={photos}
            onChange={(p) => {
              setPhotos(p);
              if (p.length === 0) setAiPhoto(false);
            }}
          />
          {photos.length > 0 && (
            <label className="check consent ai-photo-consent">
              <input
                type="checkbox"
                checked={aiPhoto}
                onChange={(e) => {
                  setAiPhoto(e.target.checked);
                  setAi(null);
                }}
              />
              <span>
                Also let the AI look at my first photo to suggest the right service. A small copy is sent to our AI service (Google Gemini) — see <Link to="/policies/ai">AI Use</Link>.
              </span>
            </label>
          )}
        </div>

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
            <select value={brgy.name} onChange={(e) => setBarangay(e.target.value)}>
              {town.barangays.map((b) => (
                <option key={b.name}>{b.name}</option>
              ))}
            </select>
          </label>
        </div>

        <button className="btn btn-primary btn-lg full-w" disabled={loading || text.trim().length < 5} onClick={run}>
          <Icon name="spark" /> {loading ? "Analyzing…" : ai ? "Analyze again" : "Analyze with AI"}
        </button>
      </div>

      {ai && edit && (
        <div className="card ai-card">
          <div className="ai-card-head">
            <div>
              <div className="eyebrow">AI analysis</div>
              <div className="muted small">
                {ai.source === "gemini" ? (ai.usedPhoto ? "Analyzed by Gemini AI (text + photo)" : "Analyzed by Gemini AI") : aiPhoto ? "Analyzed by keyword fallback (AI offline — photo not checked)" : "Analyzed by keyword fallback (AI offline)"} · confidence{" "}
                {Math.round(ai.confidence * 100)}%
              </div>
            </div>
            <div className="conf-bar" title="Confidence">
              <span style={{ width: `${Math.round(ai.confidence * 100)}%` }} />
            </div>
          </div>

          {ai.confidence < 0.6 && (
            <div className="warn">
              <Icon name="alert" size={16} /> Not sure about this one — please confirm the service you need.
            </div>
          )}

          <div className="row-2">
            <label className="field">
              <span>Service needed</span>
              <select value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value as ServiceCategory })}>
                <CategoryOptions />
              </select>
            </label>
            <label className="field">
              <span>Urgency</span>
              <select value={edit.urgency} onChange={(e) => setEdit({ ...edit, urgency: e.target.value as Urgency })}>
                {URGENCIES.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Job title</span>
            <input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
          </label>
          <div className="kv">
            <span>Specific issue</span>
            <b>{ai.specificIssue}</b>
          </div>
          {ai.safetyTip && (
            <div className="safety">
              <Icon name="shield" size={18} />
              <div>
                <b>Safety first</b>
                <div>{ai.safetyTip}</div>
              </div>
            </div>
          )}

          <PriceGuide category={edit.category} townId={townId} />

          <h3 className="mt">Top matches near {brgy.name}</h3>
          {matches.length === 0 ? (
            <p className="muted">No verified {edit.category.toLowerCase()} nearby yet — your post will still be visible on the quest board.</p>
          ) : (
            <div className="stack">
              {matches.map((m) => (
                <WorkerCard key={m.worker.id} worker={m.worker} extra={<div className="why">Why: {m.reasons.join(" · ")}</div>} />
              ))}
            </div>
          )}

          <button className="btn btn-primary btn-lg full-w mt" onClick={post} disabled={!edit.title.trim()}>
            Post to Quest Board
          </button>
          <p className="muted small mt center">
            By posting, you agree to the <Link to="/policies/terms">Terms of Use</Link> and <Link to="/policies/community">Community Guidelines</Link>. Only
            your problem text is sent to the AI — see <Link to="/policies/ai">AI Use</Link>.
          </p>
        </div>
      )}
    </div>
  );
}
