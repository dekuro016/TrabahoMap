// Keyword-based fallback for the AI features.
// Used when there is no Gemini API key, the AI call fails, or the app runs as a static preview.
// Understands common English, Filipino and Taglish words.

import { CATEGORIES } from "./categories.js";

/** Each rule: category, keywords, and the "specific issue" label shown when that keyword is found. */
const RULES = [
  // Electrician
  { category: "Electrician", issue: "Faulty outlet / possible short circuit", words: ["saksakan", "outlet", "socket", "spark", "nag-spark", "nagspark", "nag spark", "short circuit"] },
  { category: "Electrician", issue: "Tripping breaker / power problem", words: ["breaker", "fuse", "walang kuryente", "no power", "nawalan ng kuryente", "trip"] },
  { category: "Electrician", issue: "Wiring problem", words: ["wiring", "wire", "kawad", "kable", "exposed wire", "live wire", "kuryente", "nakuryente"] },
  { category: "Electrician", issue: "Lighting or switch problem", words: ["ilaw", "bumbilya", "light", "switch", "lightbulb", "kumikislap"] },
  // Plumber
  { category: "Plumber", issue: "Leaking pipe or faucet", words: ["tulo", "tumutulo", "leak", "leaking", "gripo", "faucet", "tubo", "pipe", "sumisirit"] },
  { category: "Plumber", issue: "Clogged drain or toilet", words: ["barado", "clog", "clogged", "inidoro", "toilet", "kubeta", "lababo", "sink", "drain", "kanal", "umaapaw", "overflow"] },
  { category: "Plumber", issue: "No water supply", words: ["walang tubig", "no water", "mahina ang tubig", "low water pressure", "water pump", "poso"] },
  // Appliance Repair
  { category: "Appliance Repair", issue: "Refrigerator problem", words: ["ref", "refrigerator", "fridge", "ref namin", "freezer"] },
  { category: "Appliance Repair", issue: "Washing machine problem", words: ["washing", "washer", "labahan", "washing machine"] },
  { category: "Appliance Repair", issue: "Small appliance repair", words: ["rice cooker", "microwave", "oven", "electric fan", "bentilador", "blender", "plantsa", "flat iron", "kettle", "appliance"] },
  { category: "Appliance Repair", issue: "Gas stove / LPG leak", words: ["gas stove", "kalan", "lpg", "regulator", "gas leak", "amoy gas", "tagas ng gas", "singaw ng gas", "stove"] },
  { category: "Appliance Repair", issue: "TV or electronics repair", words: ["tv", "telebisyon", "television", "speaker", "karaoke"] },
  // Aircon
  { category: "Aircon Technician", issue: "Aircon not cooling / needs service", words: ["aircon", "air con", "aircondition", "ac", "hindi lumalamig", "not cooling", "freon", "split type", "window type", "linis ng aircon"] },
  // Carpenter
  { category: "Carpenter", issue: "Door, cabinet or woodwork repair", words: ["pinto", "door", "cabinet", "aparador", "kahoy", "wood", "kisame", "ceiling", "mesa", "upuan", "furniture", "anay", "termite", "hamba"] },
  // Mason
  { category: "Mason", issue: "Concrete, wall or tile work", words: ["semento", "cement", "pader", "bitak", "crack", "tiles", "tile", "hollow block", "hollow blocks", "bakod", "fence", "concrete", "sahig", "floor"] },
  // Welder
  { category: "Welder", issue: "Gate, grills or metal work", words: ["welding", "weld", "hinang", "gate", "grills", "rehas", "bakal", "steel", "metal", "trusses", "yero"] },
  // Painter
  { category: "Painter", issue: "Painting or repainting", words: ["pintura", "paint", "repaint", "pinturahan", "nagbabakbak", "peeling", "kulay ng bahay"] },
  // Tutor
  { category: "Tutor", issue: "Math tutoring", words: ["math", "mathematics", "algebra", "geometry", "matematika"] },
  { category: "Tutor", issue: "English / reading tutoring", words: ["english", "reading", "pagbasa", "grammar", "speaking"] },
  { category: "Tutor", issue: "Academic tutoring", words: ["tutor", "tutorial", "tutoring", "magturo", "turuan", "homework", "assignment", "takdang aralin", "science", "entrance exam", "review", "reviewer", "grade", "estudyante", "student"] },
  // Tech Support
  { category: "Tech Support", issue: "Wi-Fi / internet problem", words: ["wifi", "wi-fi", "internet", "router", "modem", "walang signal", "connection", "mabagal ang net", "net"] },
  { category: "Tech Support", issue: "Computer or laptop problem", words: ["laptop", "computer", "pc", "desktop", "virus", "windows", "software", "ayaw mag-on", "ayaw magbukas", "files", "blue screen", "keyboard"] },
  { category: "Tech Support", issue: "Phone or gadget problem", words: ["cellphone", "phone", "smartphone", "cp", "tablet", "ipad", "android", "iphone"] },
  { category: "Tech Support", issue: "Printer / CCTV setup", words: ["printer", "cctv", "camera setup", "projector"] },
  // Home Cleaning
  { category: "Home Cleaning", issue: "House cleaning", words: ["cleaning", "general cleaning", "deep clean", "deep cleaning", "maglinis", "linisin", "paglilinis", "housekeeping", "alikabok", "move-out", "lilipat"] },
  { category: "Home Cleaning", issue: "Sofa / carpet cleaning", words: ["sofa", "carpet", "upholstery", "kutson", "mattress"] },
  // Event Assistance
  { category: "Event Assistance", issue: "Event setup and serving help", words: ["event", "party", "birthday", "debut", "kasal", "wedding", "binyag", "christening", "reunion", "handaan", "catering", "serving", "waiter", "emcee", "host", "decorations", "dekorasyon", "setup ng tables"] },
];

const HIGH_WORDS = [
  "spark", "nag-spark", "nagspark", "nag spark", "apoy", "fire", "sunog", "nasusunog", "amoy sunog", "burning",
  "usok", "smoke", "gas", "lpg", "singaw", "baha", "flood", "umaapaw", "overflow", "walang kuryente", "no power",
  "walang tubig", "no water", "nakuryente", "exposed wire", "live wire", "emergency", "asap", "ngayon na",
  "urgent", "delikado", "dangerous", "sumisirit",
];
const MEDIUM_WORDS = [
  "sira", "broken", "hindi gumagana", "not working", "ayaw", "tulo", "tumutulo", "leak", "barado", "clog",
  "hindi lumalamig", "not cooling", "mahina", "maingay", "noisy", "kumikislap",
  "bukas na", "tomorrow", "won t turn on", "not turning on", "mamaya", "this week", "ngayong linggo", "exam", "deadline", "walang internet", "ayaw mag-on",
];

const SAFETY_TIPS = {
  gas: "Open the windows, don't switch any lights or appliances on or off, and close the LPG valve. Leave the area if the smell is strong.",
  Electrician: "Turn off the breaker for that area and don't touch or use the outlet until a qualified electrician checks it.",
  Plumber: "If water is leaking, close the main water valve and keep plugs and appliances away from wet areas.",
  "Appliance Repair": "Unplug the appliance and don't use it until it has been checked.",
  "Aircon Technician": "Turn off and unplug the aircon if you notice a burning smell, sparks, or water dripping inside.",
  Carpenter: "Keep children away from loose or broken wood and nails until it is repaired.",
  Mason: "Keep people away from cracked walls or loose tiles until they are inspected.",
  Welder: "Keep away from loose or sharp metal parts until they are repaired.",
  Painter: "Keep the area ventilated and away from children until the work is done.",
  Tutor: "For tutoring minors, keep sessions in a common area of the house with a parent or guardian at home.",
  "Tech Support": "Unplug the device if it's hot, smoking or smells like burning, and back up important files if you still can.",
  "Home Cleaning": "Keep cleaning chemicals away from children, and never mix bleach with other cleaners.",
  "Event Assistance": "Agree on tasks, hours and pay before the event, and keep walkways and exits clear during setup.",
};

/** Categories that always show their safety note, even when urgency is Low. */
const ALWAYS_TIP = new Set(["Tutor", "Home Cleaning"]);

/** Lowercase, remove punctuation, collapse spaces, and pad so we can match whole words. */
function normalize(text) {
  return " " + String(text || "").toLowerCase().replace(/[^a-z0-9ñ\s-]/g, " ").replace(/\s+/g, " ").trim() + " ";
}

function has(norm, word) {
  return norm.includes(" " + word + " ") || (word.length > 4 && norm.includes(word));
}

function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Classify a resident's problem description.
 * Returns the same shape as the Gemini-powered analyzer.
 */
export function classifyTask(text) {
  const norm = normalize(text);
  const scores = {};
  const issues = {};
  for (const rule of RULES) {
    const hits = rule.words.filter((w) => has(norm, w)).length;
    if (hits > 0) {
      scores[rule.category] = (scores[rule.category] || 0) + hits;
      if (!issues[rule.category] || hits > issues[rule.category].hits) {
        issues[rule.category] = { issue: rule.issue, hits };
      }
    }
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const found = ranked.length > 0;
  const category = found ? ranked[0][0] : CATEGORIES[0];
  const topScore = found ? ranked[0][1] : 0;

  let urgency = "Low";
  if (HIGH_WORDS.some((w) => has(norm, w))) urgency = "High";
  else if (MEDIUM_WORDS.some((w) => has(norm, w))) urgency = "Medium";

  const isGas = has(norm, "gas") || has(norm, "lpg");
  let safetyTip = "";
  if (urgency !== "Low" || ALWAYS_TIP.has(category)) safetyTip = isGas ? SAFETY_TIPS.gas : SAFETY_TIPS[category];

  const specificIssue = found ? issues[category].issue : "Unclear — please confirm the service needed";
  const suggestedTitle =
    (found ? specificIssue.split(" / ")[0] : titleCase(String(text).trim().split(/\s+/).slice(0, 6).join(" "))) +
    (urgency === "High" ? " — urgent" : "");

  return {
    category,
    specificIssue,
    urgency,
    safetyTip,
    suggestedTitle,
    confidence: found ? Math.min(0.8, 0.5 + 0.1 * topScore) : 0.25,
    source: "fallback",
  };
}

const ABUSIVE_WORDS = ["bobo", "tanga", "gago", "ulol", "tarantado", "putang", "stupid", "idiot", "scammer", "manloloko"];

/** Fallback text check for reviews (used when AI is unavailable). */
export function checkReviewTextFallback(text) {
  const norm = normalize(text);
  const reasons = [];
  if (ABUSIVE_WORDS.some((w) => has(norm, w))) reasons.push("Contains abusive or insulting language");
  if (/(https?:\/\/|www\.|09\d{9})/.test(String(text))) reasons.push("Contains links or phone numbers");
  return { flagged: reasons.length > 0, reasons, source: "fallback" };
}
