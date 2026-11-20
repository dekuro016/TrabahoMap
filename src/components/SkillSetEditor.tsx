// Dynamic "Skill Set" editor for workers: add/remove skills, with suggestions for the chosen services.
import { useState } from "react";
import { CATEGORIES, TRADE_CATEGORIES } from "../../shared/categories.js";
import { normalizeSkill, SKILL_SUGGESTIONS } from "../lib/skills";
import type { ServiceCategory } from "../lib/types";
import { CategoryIcon } from "./Icons";

const MAX_SKILLS = 15;

export function ServicePicker({ value, onChange }: { value: ServiceCategory[]; onChange: (v: ServiceCategory[]) => void }) {
  const toggle = (c: ServiceCategory) => onChange(value.includes(c) ? value.filter((x) => x !== c) : [...value, c].slice(0, 4));
  const group = (title: string, list: string[]) => (
    <div className="svc-group">
      <span className="muted small">{title}</span>
      <div className="svc-grid">
        {(list as ServiceCategory[]).map((c) => (
          <button type="button" key={c} className={`svc-chip${value.includes(c) ? " on" : ""}`} onClick={() => toggle(c)} aria-pressed={value.includes(c)}>
            <CategoryIcon category={c} size={16} /> {c}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div className="svc-picker">
      {group("Skilled trades", TRADE_CATEGORIES)}
      {group("Other help", CATEGORIES.filter((c) => !TRADE_CATEGORIES.includes(c)))}
      <p className="muted small">Pick up to 4 services.</p>
    </div>
  );
}

export default function SkillSetEditor({ skills, categories, onChange }: { skills: string[]; categories: ServiceCategory[]; onChange: (s: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const s = normalizeSkill(raw);
    if (!s || skills.includes(s) || skills.length >= MAX_SKILLS) return;
    onChange([...skills, s]);
  };
  const suggestions = [...new Set(categories.flatMap((c) => SKILL_SUGGESTIONS[c] ?? []))].filter((s) => !skills.includes(s));

  return (
    <div className="skillset">
      <div className="skill-chips" aria-live="polite">
        {skills.length === 0 && <span className="muted small">No skills yet — add a few so residents and the AI can match you.</span>}
        {skills.map((s) => (
          <span className="skill-chip" key={s}>
            {s}
            <button type="button" aria-label={`Remove ${s}`} onClick={() => onChange(skills.filter((x) => x !== s))}>
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="skill-add">
        <input
          value={draft}
          placeholder={skills.length >= MAX_SKILLS ? "Maximum reached" : "Type a skill, e.g. outlet repair"}
          disabled={skills.length >= MAX_SKILLS}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
              setDraft("");
            }
          }}
        />
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          disabled={!draft.trim()}
          onClick={() => {
            add(draft);
            setDraft("");
          }}
        >
          Add
        </button>
      </div>
      {suggestions.length > 0 && (
        <div className="skill-suggest">
          <span className="muted small">Suggestions:</span>
          {suggestions.slice(0, 10).map((s) => (
            <button type="button" key={s} className="chip" onClick={() => add(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}
      <p className="muted small">
        {skills.length}/{MAX_SKILLS} skills · Smart Matching compares these with what residents describe.
      </p>
    </div>
  );
}
