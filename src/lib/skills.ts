import type { ServiceCategory } from "./types";

/** Suggested skills per service, shown as one-tap chips in the Skill Set editor. */
export const SKILL_SUGGESTIONS: Record<ServiceCategory, string[]> = {
  Electrician: ["house wiring", "outlet repair", "breaker installation", "lighting", "short circuit troubleshooting"],
  Plumber: ["leak repair", "clogged drain", "faucet replacement", "toilet repair", "water pump"],
  "Appliance Repair": ["refrigerator repair", "washing machine", "rice cooker", "electric fan", "microwave"],
  "Aircon Technician": ["aircon cleaning", "freon refill", "split type installation", "window type repair"],
  Carpenter: ["cabinet making", "doors", "ceiling repair", "furniture", "termite damage"],
  Mason: ["tiles", "wall crack repair", "concrete flooring", "hollow blocks", "fence"],
  Welder: ["gate fabrication", "window grills", "steel trusses", "metal repair"],
  Painter: ["house repainting", "interior painting", "waterproofing", "gate painting"],
  Tutor: ["math tutoring", "english tutoring", "science", "reading", "entrance exam review"],
  "Tech Support": ["laptop repair", "wifi setup", "printer", "virus removal", "cellphone"],
  "Home Cleaning": ["general cleaning", "deep cleaning", "sofa", "carpet", "move-out cleaning"],
  "Event Assistance": ["event setup", "serving", "emcee", "decorations", "cleanup"],
};

export function normalizeSkill(s: string) {
  return s.trim().replace(/\s+/g, " ").toLowerCase().slice(0, 40);
}
