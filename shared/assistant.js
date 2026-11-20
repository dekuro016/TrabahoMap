// AI Assistant — rule-based fallback conversation (used when Gemini is unavailable).
// Shared by the server and the browser. Never posts anything; it only builds a summary
// that the resident reviews and edits in the quest form.

import { classifyTask } from "./classifier.js";
import { CATEGORIES } from "./categories.js";
import { PILOT_PLACES, detectLocation } from "./places.js";

/** Immediate safety guidance for dangerous situations (shown before anything else). */
const EMERGENCIES = [
  { re: /\b(gas|lpg|singaw ng gas|amoy gas|tagas ng gas)\b/, text: "Possible gas leak: don't switch lights or appliances on or off, close the LPG valve only if it's safe, open windows and doors, and get everyone outside. If the smell is strong, call 911 from outside." },
  { re: /\b(apoy|fire|usok|smoke|nasusunog|may sunog|umuusok)\b/, text: "If there's fire or smoke, get everyone out first and call 911 or the Bureau of Fire Protection. Never use water on an electrical fire." },
  { re: /\b(nakuryente|nakoryente|nakuryente siya|electrocuted|got shocked|na-shock)\b/, text: "If someone was shocked, don't touch them while they may still be touching the source. Turn off the main breaker first, then call 911." },
  { re: /\b(spark|nag-spark|nagspark|nag spark|amoy sunog|burning smell|exposed wire|live wire|kumikislap)\b/, text: "Turn off the main breaker if you can do it safely, and don't touch or use the outlet, switch or wires until a qualified electrician checks them." },
  { re: /\b(baha|flood|flooding|umaapaw)\b/, text: "If water is near outlets or appliances, switch off the main power only if you can do it from a dry spot, and keep everyone away from the water." },
];

export function emergencyAdvice(text) {
  const t = " " + String(text || "").toLowerCase() + " ";
  const hits = EMERGENCIES.filter((e) => e.re.test(t)).map((e) => e.text);
  return hits.length ? hits.slice(0, 2).join(" ") : null;
}

/** One focused follow-up question per service (Taglish, short). */
const FOLLOW_UPS = {
  Electrician: { q: "May spark, usok o amoy sunog ba? At saan banda — outlet, ilaw, switch o breaker?", quick: ["Outlet / saksakan", "Ilaw o switch", "Breaker", "May amoy sunog"] },
  Plumber: { q: "Saan galing ang tulo o bara, at gaano kalala — patak-patak lang o tuloy-tuloy?", quick: ["Patak-patak lang", "Tuloy-tuloy na", "Barado / umaapaw", "Walang tubig"] },
  "Appliance Repair": { q: "Anong appliance ito, at ano ang nangyayari — ayaw mag-on, maingay, o hindi gumagana nang tama?", quick: ["Ayaw mag-on", "Maingay", "Hindi lumalamig", "May amoy sunog"] },
  "Aircon Technician": { q: "Window type o split type? Hindi ba lumalamig, tumutulo, o maingay?", quick: ["Hindi lumalamig", "Tumutulo", "Maingay", "Kailangan ng linis"] },
  Carpenter: { q: "Ano ang ipapaayos o ipapagawa — pinto, cabinet, kisame o furniture? Mga gaano kalaki?", quick: ["Pinto", "Cabinet", "Kisame", "Furniture"] },
  Mason: { q: "Gaano kalaki ang bitak o area, at nasaan — pader, sahig o bakod?", quick: ["Maliit na bitak", "Malaking bitak", "Tiles", "Bakod"] },
  Welder: { q: "Ano ang ipapagawa — gate, grills o repair? Mga ilang piraso o gaano kalaki?", quick: ["Bagong gate", "Window grills", "Repair lang"] },
  Painter: { q: "Gaano kalaki ang area, at loob o labas ng bahay?", quick: ["Loob ng bahay", "Labas / gate", "Buong bahay"] },
  Tutor: { q: "Anong subject at grade level, at ilang beses kada linggo?", quick: ["Math", "English / reading", "Science", "Entrance exam review"] },
  "Tech Support": { q: "Anong device ito (laptop, phone, Wi-Fi/router, printer) at ano ang nangyayari?", quick: ["Laptop / computer", "Wi-Fi / internet", "Cellphone", "Printer"] },
  "Home Cleaning": { q: "Gaano kalaki ang bahay o area, at anong klaseng linis — general, deep clean o sofa/carpet?", quick: ["General cleaning", "Deep cleaning", "Sofa / carpet", "Move-out cleaning"] },
  "Event Assistance": { q: "Anong event at kailan, at ilang tao ang kailangan mo (setup, serving, cleanup)?", quick: ["Birthday", "Debut / wedding", "Setup at cleanup", "Emcee"] },
};

const KIND_QUICK = ["Electrical problem", "Plumbing / water leak", "Appliance or aircon", "Tutoring", "Home cleaning", "Tech / Wi-Fi", "Event help"];
const TOWN_QUICK = PILOT_PLACES.map((p) => p.name);
const LOCATION_Q = "Saang barangay at bayan ka? (Bukas na kami sa Batangas City, Lipa, Tanauan, Santo Tomas, Bauan at Rosario.)";
const DONE_WORDS = /(summar|that'?s all|that is all|yan lang|iyan lang|yun lang|tapos na|okay na|ok na|gawin mo na|go ahead|done)/i;

const FILLER = /^(help|help po|hi|hello|hello po|tulong|tulong po|pa-help|paki-help)[.!?]*$/i;

function cleanDescription(userTexts) {
  const parts = userTexts.filter((t) => {
    const x = t.trim();
    if (!x || FILLER.test(x) || TOWN_QUICK.includes(x) || KIND_QUICK.includes(x) || DONE_WORDS.test(x)) return false;
    // answers that only give a location are kept in the location fields, not the description
    if (detectLocation(x).townId && classifyTask(x).confidence < 0.5 && x.split(/\s+/).length <= 5) return false;
    return true;
  });
  return parts.join(". ").replace(/\.\.+/g, ".").replace(/\s+/g, " ").trim().slice(0, 500);
}

/** Builds the structured summary from what the user said (reuses the keyword Task Analyzer). */
export function buildSummary(userTexts, overrides = {}) {
  const all = userTexts.join(". ");
  const cls = classifyTask(all);
  const loc = detectLocation(all);
  const emergency = emergencyAdvice(all);
  const urgency = emergency ? "High" : cls.urgency;
  return {
    category: cls.category,
    title: cls.suggestedTitle.replace(/ — urgent$/, "") + (urgency === "High" ? " — urgent" : ""),
    description: cleanDescription(userTexts) || all.slice(0, 500),
    specificIssue: cls.specificIssue,
    urgency,
    safetyTip: cls.safetyTip || (emergency ? emergency.split(". ")[0] + "." : ""),
    townId: loc.townId,
    barangay: loc.barangay,
    confidence: cls.confidence,
    source: "fallback",
    ...overrides,
  };
}

/**
 * messages: [{ role: "user" | "assistant", text }]
 * returns { reply, quickReplies, emergency, summary, source }
 */
export function assistantFallback(messages) {
  const userTexts = messages.filter((m) => m.role === "user").map((m) => String(m.text || ""));
  const stages = messages.filter((m) => m.role === "assistant").map((m) => m.stage || "");
  const all = userTexts.join(". ");
  const last = userTexts[userTexts.length - 1] || "";
  const cls = classifyTask(all);
  const loc = detectLocation(all);
  const emergency = emergencyAdvice(last) || (stages.length === 0 ? emergencyAdvice(all) : null);
  const wantsSummary = DONE_WORDS.test(last);
  const knowsKind = cls.confidence >= 0.5;
  const count = (st) => stages.filter((x) => x.includes(st)).length;

  const base = { quickReplies: [], emergency, summary: null, source: "fallback" };

  if (!wantsSummary) {
    // 1) What kind of help? (asked at most twice)
    if (!knowsKind && count("kind") < 2) {
      return { ...base, stage: "kind", reply: "Gusto kong mahanap ang tamang tutulong sa iyo. Anong klaseng tulong ang kailangan mo?", quickReplies: KIND_QUICK };
    }
    // 2) One service-specific detail question (plus location if we don't have it yet)
    if (count("detail") === 0) {
      const f = FOLLOW_UPS[cls.category];
      return {
        ...base,
        stage: loc.townId ? "detail" : "detail+location",
        reply: `Got it — mukhang kailangan mo ng ${cls.category.toLowerCase()}. ${f.q}${loc.townId ? "" : " " + LOCATION_Q}`,
        quickReplies: loc.townId ? f.quick : TOWN_QUICK,
      };
    }
    // 3) Location (asked at most twice in total)
    if (!loc.townId && count("location") < 2) {
      return { ...base, stage: "location", reply: `Salamat! ${LOCATION_Q}`, quickReplies: TOWN_QUICK };
    }
  }
  const summary = buildSummary(userTexts);
  return {
    ...base,
    stage: "summary",
    reply:
      "Salamat! Here's a summary of your request. Check it, then tap “Use details for my quest” — you can still edit everything before posting." +
      (summary.townId ? "" : " (Location: you can choose your barangay in the form.)"),
    summary,
  };
}

export const ASSISTANT_CATEGORIES = CATEGORIES;
