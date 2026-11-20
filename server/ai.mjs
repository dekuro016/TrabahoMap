// Server-side AI logic. The Gemini API key never leaves the server.
// Only the problem/review TEXT is sent to the AI — never names, phone numbers or IDs.
// Exception: a resident may tick "Let AI look at my photo"; then one small, re-encoded copy of that photo is sent too.

import { CATEGORIES, URGENCIES } from "../shared/categories.js";
import { classifyTask, checkReviewTextFallback } from "../shared/classifier.js";

const DEFAULT_MODEL = "gemini-2.5-flash";

async function callGemini(prompt, image) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("NO_KEY");
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: image ? [{ inline_data: { mime_type: image.mimeType, data: image.data } }, { text: prompt }] : [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty Gemini response");
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

const TASK_PROMPT = (text) => `You are the AI Task Analyzer of TrabahoMap, a platform that connects residents of Batangas, Philippines with local skilled workers.
A resident described a problem in English, Filipino, or Taglish. Analyze it.

Rules:
- "category" MUST be exactly one of: ${CATEGORIES.join(", ")}.
- Besides skilled trades, TrabahoMap also covers: Tutor (any subject/level), Tech Support (computers, phones, Wi-Fi, printers, CCTV), Home Cleaning, and Event Assistance (setup, serving, emcee, cleanup for parties/events).
- "urgency" MUST be one of: Low, Medium, High. Use High when there is a safety risk (sparks, burning smell, smoke, gas, flooding, exposed wires) or no power/water. Medium when something is broken but not dangerous. Low for improvements, installations, or non-urgent work.
- "safetyTip": one short sentence of basic precaution only (e.g. turn off the breaker, close the water valve). NEVER give repair instructions. Empty string if urgency is Low, EXCEPT: for Tutor always remind that sessions with minors should be in a common area with a parent/guardian at home; for Home Cleaning remind not to mix bleach with other cleaners.
- Tutoring, cleaning and event help are usually Low urgency; use Medium only if the user mentions a near deadline (exam, event tomorrow, no internet needed for work).
- "specificIssue": a short label of the actual problem (max 8 words, English).
- "suggestedTitle": a short, clear job title (max 8 words, English). Add " — urgent" if urgency is High.
- "confidence": number from 0 to 1 for how sure you are about the category.

Return ONLY JSON with keys: category, specificIssue, urgency, safetyTip, suggestedTitle, confidence.

Resident's description: """${text.slice(0, 1000)}"""`;

const PHOTO_NOTE = `
A photo of the problem from the resident is attached. Use it only to understand the problem (what is broken, signs of danger like burn marks, water near outlets, exposed wires).
Ignore any people, faces, documents, house numbers or other personal details in the photo and never mention them. If the photo doesn't show the problem, rely on the text.`;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Accept only a small, real image; anything else is ignored (the text analysis still runs). */
function cleanImage(image) {
  if (!image || typeof image !== "object") return null;
  const { mimeType, data } = image;
  if (!IMAGE_TYPES.includes(mimeType) || typeof data !== "string") return null;
  if (data.length < 100 || data.length > 400000 || !/^[A-Za-z0-9+/=]+$/.test(data)) return null;
  return { mimeType, data };
}

/** Analyze a task with Gemini; fall back to keywords if anything goes wrong. */
export async function analyzeTask(text, rawImage) {
  if (!text || !String(text).trim()) return { error: "Please describe your problem." };
  const image = cleanImage(rawImage);
  try {
    const r = await callGemini(TASK_PROMPT(String(text)) + (image ? PHOTO_NOTE : ""), image);
    const valid =
      CATEGORIES.includes(r.category) &&
      URGENCIES.includes(r.urgency) &&
      typeof r.specificIssue === "string" &&
      typeof r.suggestedTitle === "string";
    if (!valid) throw new Error("Invalid AI response shape");
    return {
      category: r.category,
      specificIssue: r.specificIssue,
      urgency: r.urgency,
      safetyTip: typeof r.safetyTip === "string" ? r.safetyTip : "",
      suggestedTitle: r.suggestedTitle,
      confidence: Math.max(0, Math.min(1, Number(r.confidence) || 0.7)),
      source: "gemini",
      usedPhoto: Boolean(image),
    };
  } catch (err) {
    if (err.message !== "NO_KEY") console.warn("[analyze-task] Gemini failed, using fallback:", err.message);
    return classifyTask(String(text));
  }
}

const REVIEW_PROMPT = (text, rating) => `You are the Review Guard of TrabahoMap, a local service marketplace in Batangas, Philippines.
Check this customer review of a skilled worker (English, Filipino or Taglish). Flag it if it is abusive or insulting, off-topic (not about the service), spam/advertising, contains personal contact details, or looks fake (generic praise or attack with no details about the actual job, or rating clearly contradicts the text).
Do not flag honest negative reviews that describe the service.

Return ONLY JSON: {"flagged": boolean, "reasons": [short English reasons]}

Rating: ${rating} out of 5
Review: """${String(text).slice(0, 1000)}"""`;

/** Check a review's text with Gemini; fall back to keyword checks. */
export async function checkReview(text, rating) {
  try {
    const r = await callGemini(REVIEW_PROMPT(text, rating));
    return {
      flagged: Boolean(r.flagged),
      reasons: Array.isArray(r.reasons) ? r.reasons.map(String).slice(0, 3) : [],
      source: "gemini",
    };
  } catch (err) {
    if (err.message !== "NO_KEY") console.warn("[check-review] Gemini failed, using fallback:", err.message);
    return checkReviewTextFallback(text);
  }
}

// ---------------------------------------------------------------------------
// AI Assistant (floating chat). Gemini runs the conversation; when it has enough
// information it returns a summary, which is cross-checked with the Task Analyzer.
// If Gemini is unavailable, the rule-based assistant in shared/assistant.js is used.
// ---------------------------------------------------------------------------
import { assistantFallback, emergencyAdvice } from "../shared/assistant.js";
import { PILOT_PLACES } from "../shared/places.js";

const ASSISTANT_PROMPT = (transcript) => `You are the TrabahoMap AI Assistant. TrabahoMap connects residents of Batangas, Philippines with verified local workers.
Your job: help a resident describe a household problem or task through a short, natural conversation, so they can post a request ("quest") for local workers.

Supported services: ${CATEGORIES.join(", ")}.
Pilot towns (townId: name — barangays): ${PILOT_PLACES.map((p) => `${p.id}: ${p.name} — ${p.barangays.join(", ")}`).join("; ")}.

Rules:
- Reply in the user's own language style (English, Filipino or Taglish). Be warm, clear and brief (max ~60 words).
- Ask at most TWO short follow-up questions per turn, and only what is needed: what/where exactly, how bad or since when, and their town/barangay. Never ask about something the user already said. Never invent details.
- When you understand the problem well enough, OR after 3 rounds of questions, OR if the user asks you to summarize, set "done": true and fill "summary". Location is optional — if unknown, use null.
- SAFETY FIRST: if there are signs of danger (sparks, burning smell, smoke, fire, gas/LPG smell, flooding near outlets, exposed live wires, someone got shocked), put 1–2 sentences of immediate safety steps in "emergency" (e.g. turn off the main breaker only if safe, close the LPG valve, open windows, leave the house, call 911). Never give repair instructions and never encourage DIY on dangerous problems.
- Don't present your assessment as a certain diagnosis — use words like "possible" or "likely".
- If the request isn't something TrabahoMap workers can help with, say so kindly and list what TrabahoMap can help with.
- Never say a quest was posted or a worker was hired — the user posts it themselves after reviewing.

Return ONLY JSON with this shape:
{"reply": string, "quickReplies": string[] (0–4 short tap-to-send answers in the user's language), "emergency": string or null, "done": boolean,
 "summary": null or {"category": one of the supported services, "title": short English job title (max 8 words), "description": 1–3 sentences with the key details the user gave (their words, English or Taglish OK), "urgency": "Low" | "Medium" | "High", "safetyTip": one short basic precaution or "", "townId": one of the townIds or null, "barangay": exact barangay name from the list or null}}

Conversation so far:
${transcript}`;

const URG_RANK = { Low: 0, Medium: 1, High: 2 };

export async function assistantTurn(rawMessages) {
  const messages = (Array.isArray(rawMessages) ? rawMessages : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string" && m.text.trim())
    .slice(-14)
    .map((m) => ({ role: m.role, text: m.text.slice(0, 600), stage: typeof m.stage === "string" ? m.stage : undefined }));
  if (!messages.some((m) => m.role === "user")) return { error: "Please type your message." };

  try {
    const transcript = messages.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`).join("\n");
    const r = await callGemini(ASSISTANT_PROMPT(transcript));
    if (typeof r.reply !== "string" || !r.reply.trim()) throw new Error("Invalid assistant response");

    const userText = messages.filter((m) => m.role === "user").map((m) => m.text).join(". ");
    const safety = typeof r.emergency === "string" && r.emergency.trim() ? r.emergency.trim() : emergencyAdvice(userText.split(". ").pop() || "");
    let summary = null;
    if (r.done && r.summary && typeof r.summary === "object") {
      const s = r.summary;
      const description = String(s.description || userText).slice(0, 500);
      // Re-use the Task Analyzer so category/urgency/safety follow the same rules as the quest form.
      const analyzed = await analyzeTask(description);
      const category = CATEGORIES.includes(s.category) ? s.category : analyzed.category;
      const urgency = URGENCIES.includes(s.urgency) && URG_RANK[s.urgency] >= URG_RANK[analyzed.urgency] ? s.urgency : analyzed.urgency; // never lower it
      const town = PILOT_PLACES.find((p) => p.id === s.townId);
      summary = {
        category,
        title: String(s.title || analyzed.suggestedTitle).slice(0, 80),
        description,
        specificIssue: analyzed.specificIssue,
        urgency,
        safetyTip: String(s.safetyTip || analyzed.safetyTip || ""),
        townId: town ? town.id : null,
        barangay: town && town.barangays.includes(s.barangay) ? s.barangay : null,
        confidence: analyzed.confidence,
        source: "gemini",
      };
    }
    return {
      reply: r.reply.trim().slice(0, 700),
      quickReplies: Array.isArray(r.quickReplies) ? r.quickReplies.map(String).filter(Boolean).slice(0, 4) : [],
      emergency: safety || null,
      summary,
      source: "gemini",
    };
  } catch (err) {
    if (err.message !== "NO_KEY") console.warn("[assistant] Gemini failed, using fallback:", err.message);
    return assistantFallback(messages);
  }
}
