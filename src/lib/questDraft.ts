// Hands the AI Assistant's summary over to the "Post a problem" form.
// Nothing is posted automatically — the form only gets pre-filled for the resident to review.
import type { AssistantSummary } from "./assistant";

const KEY = "trabahomap-quest-draft";

export function saveQuestDraft(s: AssistantSummary) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    memory = s;
  }
}

let memory: AssistantSummary | null = null;

export function hasQuestDraft() {
  try {
    return Boolean(sessionStorage.getItem(KEY)) || Boolean(memory);
  } catch {
    return Boolean(memory);
  }
}

export function takeQuestDraft(): AssistantSummary | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (raw) return JSON.parse(raw) as AssistantSummary;
  } catch {
    /* ignore */
  }
  const m = memory;
  memory = null;
  return m;
}

// ---------- Plain problem text from the home page search ("What do you need help with?") ----------
const TEXT_KEY = "trabahomap-problem-text";
let memoryText: string | null = null;

export function saveProblemText(text: string) {
  try {
    sessionStorage.setItem(TEXT_KEY, text);
  } catch {
    memoryText = text;
  }
}

export function hasProblemText() {
  try {
    return Boolean(sessionStorage.getItem(TEXT_KEY)) || Boolean(memoryText);
  } catch {
    return Boolean(memoryText);
  }
}

export function takeProblemText(): string | null {
  try {
    const t = sessionStorage.getItem(TEXT_KEY);
    sessionStorage.removeItem(TEXT_KEY);
    if (t) return t;
  } catch {
    /* ignore */
  }
  const m = memoryText;
  memoryText = null;
  return m;
}
