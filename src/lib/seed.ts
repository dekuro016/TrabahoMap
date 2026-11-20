// Demo data for the prototype. Replace towns/barangays with your real pilot areas.
// Coordinates are approximate. Phone numbers are fake.
import { STARTER } from "./prices";
import type { Account, Application, DB, Gig, Job, Quote, Review, ServiceCategory, Town, Worker } from "./types";

export const TOWNS: Town[] = [
  {
    id: "batangas-city", name: "Batangas City", lat: 13.7565, lng: 121.0583, label: { lat: 13.72, lng: 121.104 },
    barangays: [
      { name: "Alangilan", lat: 13.785, lng: 121.07 },
      { name: "Kumintang Ibaba", lat: 13.77, lng: 121.063 },
      { name: "Pallocan West", lat: 13.752, lng: 121.05 },
      { name: "Balagtas", lat: 13.775, lng: 121.082 },
      { name: "Cuta", lat: 13.749, lng: 121.061 },
      { name: "Gulod Labac", lat: 13.79, lng: 121.045 },
    ],
  },
  {
    id: "lipa", name: "Lipa City", lat: 13.9411, lng: 121.1631, label: { lat: 13.905, lng: 121.175 },
    barangays: [
      { name: "Marawoy", lat: 13.955, lng: 121.175 },
      { name: "Sabang", lat: 13.945, lng: 121.165 },
      { name: "Tambo", lat: 13.925, lng: 121.15 },
      { name: "Antipolo del Norte", lat: 13.955, lng: 121.15 },
      { name: "Banay-Banay", lat: 13.935, lng: 121.185 },
      { name: "Mataas na Lupa", lat: 13.94, lng: 121.16 },
    ],
  },
  {
    id: "tanauan", name: "Tanauan City", lat: 14.0863, lng: 121.15, label: { lat: 14.12, lng: 121.08 },
    barangays: [
      { name: "Darasa", lat: 14.075, lng: 121.14 },
      { name: "Trapiche", lat: 14.0915, lng: 121.1385 },
      { name: "Sambat", lat: 14.0983, lng: 121.1311 },
      { name: "Natatas", lat: 14.07, lng: 121.155 },
      { name: "Altura Bata", lat: 14.0858, lng: 121.1415 },
    ],
  },
  {
    id: "santo-tomas", name: "Santo Tomas", lat: 14.1079, lng: 121.1414, label: { lat: 14.045, lng: 121.2 },
    barangays: [
      { name: "San Antonio", lat: 14.1029, lng: 121.1471 },
      { name: "San Vicente", lat: 14.1, lng: 121.15 },
      { name: "Santa Anastacia", lat: 14.12, lng: 121.15 },
      { name: "San Bartolome", lat: 14.0824, lng: 121.1647 },
    ],
  },
  {
    id: "bauan", name: "Bauan", lat: 13.7917, lng: 121.0083, label: { lat: 13.8, lng: 120.972 },
    barangays: [
      { name: "Aplaya", lat: 13.785, lng: 121.0 },
      { name: "Manghinao Proper", lat: 13.8006, lng: 120.9976 },
      { name: "San Teodoro", lat: 13.7985, lng: 120.9971 },
      { name: "Bolo", lat: 13.78, lng: 121.015 },
    ],
  },
  {
    id: "rosario", name: "Rosario", lat: 13.846, lng: 121.2063, label: { lat: 13.805, lng: 121.27 },
    barangays: [
      { name: "Alupay", lat: 13.85, lng: 121.215 },
      { name: "Namunga", lat: 13.84, lng: 121.2 },
      { name: "Bagong Pook", lat: 13.855, lng: 121.195 },
      { name: "San Roque", lat: 13.835, lng: 121.21 },
    ],
  },
];

export const CURRENT_RESIDENT = "Juan Dela Cruz";
export const CURRENT_RESIDENT_HOME = { townId: "batangas-city", barangay: "Kumintang Ibaba" };
/** The demo employer account (fictional business). */
export const CURRENT_EMPLOYER = "Kumintang Hardware & Electrical";

const now = Date.now();
const ago = (hours: number) => new Date(now - hours * 3600_000).toISOString();

function place(townId: string, barangay: string) {
  const town = TOWNS.find((t) => t.id === townId)!;
  const b = town.barangays.find((x) => x.name === barangay)!;
  return { townId, barangay, lat: b.lat, lng: b.lng };
}

type WorkerInput = Omit<Worker, "id" | "lat" | "lng" | "townId" | "barangay" | "phone" | "joinedAt" | "available" | "responseRate"> &
  Partial<Pick<Worker, "available" | "responseRate">> & { at: [string, string] };

const workerInputs: WorkerInput[] = [
  { name: "Mario Dimaculangan", categories: ["Electrician"], skills: ["house wiring", "outlet repair", "saksakan", "breaker installation", "short circuit troubleshooting"], at: ["batangas-city", "Kumintang Ibaba"], serviceRadiusKm: 20, yearsExperience: 12, bio: "Licensed-level house wiring and electrical troubleshooting. Mabilis at malinis magtrabaho.", tesdaCertified: true, verification: "Verified", responseRate: 0.95 },
  { name: "Rodel Macalintal", categories: ["Electrician", "Aircon Technician"], skills: ["wiring", "aircon installation", "outlet repair", "lighting"], at: ["lipa", "Marawoy"], serviceRadiusKm: 25, yearsExperience: 8, bio: "Electrician and aircon installer serving Lipa and nearby towns.", tesdaCertified: true, verification: "Verified", responseRate: 0.9 },
  { name: "Jun Panganiban", categories: ["Plumber"], skills: ["leaking pipe", "tubo", "faucet replacement", "clogged drain", "lababo", "toilet repair", "water pump"], at: ["batangas-city", "Alangilan"], serviceRadiusKm: 15, yearsExperience: 15, bio: "15 years in plumbing. Tulo, barado, at bagong linya ng tubig.", tesdaCertified: false, verification: "Verified", responseRate: 0.88 },
  { name: "Arnel Ilagan", categories: ["Appliance Repair"], skills: ["refrigerator repair", "washing machine", "rice cooker", "electric fan", "microwave"], at: ["lipa", "Sabang"], serviceRadiusKm: 20, yearsExperience: 10, bio: "Home appliance repair — ref, washing machine, and small appliances. Home service available.", tesdaCertified: true, verification: "Verified", responseRate: 0.92 },
  { name: "Edwin Comia", categories: ["Aircon Technician"], skills: ["aircon cleaning", "freon refill", "split type installation", "not cooling", "hindi lumalamig"], at: ["tanauan", "Darasa"], serviceRadiusKm: 30, yearsExperience: 9, bio: "Aircon cleaning, repair, and installation. Window and split type.", tesdaCertified: true, verification: "Verified", responseRate: 0.85 },
  { name: "Ronnie Atienza", categories: ["Carpenter"], skills: ["cabinet making", "doors", "ceiling repair", "termite damage", "furniture"], at: ["bauan", "Manghinao Proper"], serviceRadiusKm: 25, yearsExperience: 20, bio: "Karpintero for 20 years. Cabinets, pinto, kisame, and custom furniture.", tesdaCertified: false, verification: "Verified", responseRate: 0.8 },
  { name: "Dante Marasigan", categories: ["Mason"], skills: ["tiles", "wall crack repair", "bitak", "hollow blocks", "concrete flooring", "fence"], at: ["rosario", "Namunga"], serviceRadiusKm: 20, yearsExperience: 18, bio: "Masonry and tile work. Pader, sahig, at bakod.", tesdaCertified: true, verification: "Verified", responseRate: 0.78 },
  { name: "Noel Katigbak", categories: ["Welder"], skills: ["gate fabrication", "window grills", "rehas", "steel trusses", "metal repair"], at: ["santo-tomas", "San Antonio"], serviceRadiusKm: 25, yearsExperience: 11, bio: "Welding and metal fabrication — gates, grills, trusses.", tesdaCertified: true, verification: "Verified", responseRate: 0.86 },
  { name: "Allan Mendoza", categories: ["Painter"], skills: ["house repainting", "gate painting", "waterproofing", "peeling paint"], at: ["batangas-city", "Pallocan West"], serviceRadiusKm: 20, yearsExperience: 7, bio: "Interior and exterior painting. Free estimate.", tesdaCertified: false, verification: "Verified", responseRate: 0.9 },
  { name: "Jessie Gonzales", categories: ["Electrician"], skills: ["lighting installation", "switch repair", "wiring", "breaker"], at: ["tanauan", "Trapiche"], serviceRadiusKm: 20, yearsExperience: 5, bio: "Electrical repairs and installations around Tanauan.", tesdaCertified: false, verification: "Verified", responseRate: 0.83 },
  { name: "Bong Castillo", categories: ["Plumber"], skills: ["pipe installation", "leak repair", "inidoro", "toilet", "septic", "water heater"], at: ["lipa", "Tambo"], serviceRadiusKm: 20, yearsExperience: 13, bio: "Plumbing installation and repair. Available for emergencies.", tesdaCertified: true, verification: "Verified", responseRate: 0.94 },
  { name: "Ramil De Torres", categories: ["Appliance Repair"], skills: ["tv repair", "refrigerator", "ref", "washing machine", "karaoke", "electronics"], at: ["batangas-city", "Balagtas"], serviceRadiusKm: 15, yearsExperience: 14, bio: "Electronics and appliance technician. TV, ref, washing machine.", tesdaCertified: true, verification: "Verified", responseRate: 0.87 },
  { name: "Joel Aguila", categories: ["Aircon Technician", "Appliance Repair"], skills: ["aircon cleaning", "freon", "ref repair", "refrigerator"], at: ["batangas-city", "Cuta"], serviceRadiusKm: 20, yearsExperience: 6, bio: "Aircon and refrigeration technician.", tesdaCertified: true, verification: "Verified", responseRate: 0.91 },
  { name: "Liza Mercado", categories: ["Painter", "Carpenter"], skills: ["interior painting", "wall finishing", "furniture refinishing", "cabinet"], at: ["lipa", "Antipolo del Norte"], serviceRadiusKm: 20, yearsExperience: 6, bio: "Painting and furniture refinishing. Maingat at malinis.", tesdaCertified: false, verification: "Verified", responseRate: 0.89 },
  { name: "Ricky Landicho", categories: ["Electrician"], skills: ["wiring", "outlet", "breaker"], at: ["rosario", "Alupay"], serviceRadiusKm: 25, yearsExperience: 4, bio: "Electrical work in Rosario and nearby barangays.", tesdaCertified: false, verification: "Verified", responseRate: 0.6 },
  { name: "Wilfredo Rosales", categories: ["Mason"], skills: ["tiles", "concrete", "wall", "flooring"], at: ["tanauan", "Sambat"], serviceRadiusKm: 20, yearsExperience: 22, bio: "Experienced mason. Tiles, concrete, and renovations.", tesdaCertified: false, verification: "Verified", responseRate: 0.75 },
  { name: "Joseph Hernandez", categories: ["Plumber"], skills: ["clogged drain", "barado", "toilet", "faucet"], at: ["santo-tomas", "San Vicente"], serviceRadiusKm: 20, yearsExperience: 7, bio: "Plumbing repairs. Barado, tulo, and installations.", tesdaCertified: true, verification: "Verified", responseRate: 0.88 },
  { name: "Kevin Magpantay", categories: ["Electrician"], skills: ["wiring", "outlet repair", "lighting"], at: ["bauan", "Aplaya"], serviceRadiusKm: 15, yearsExperience: 3, bio: "New on TrabahoMap. House wiring and repairs.", tesdaCertified: false, verification: "Pending", responseRate: 0 },
  { name: "Marlon Bautista", categories: ["Plumber"], skills: ["leak repair", "pipe installation", "water pump"], at: ["lipa", "Banay-Banay"], serviceRadiusKm: 20, yearsExperience: 9, bio: "TESDA NC II plumber. Just joined TrabahoMap.", tesdaCertified: true, verification: "Pending", responseRate: 0 },
  { name: "Christian Recto", categories: ["Welder"], skills: ["gate", "grills", "metal repair"], at: ["batangas-city", "Gulod Labac"], serviceRadiusKm: 15, yearsExperience: 5, bio: "Welding services. Gates and grills.", tesdaCertified: false, verification: "Pending", responseRate: 0 },
  // Other freelance help (added with the wider Quest Board categories)
  { name: "Angelica Reyes", categories: ["Tutor"], skills: ["math tutoring", "english tutoring", "reading", "grade school", "homework help"], at: ["lipa", "Sabang"], serviceRadiusKm: 15, yearsExperience: 4, bio: "Licensed teacher. Math and English tutoring for Grades 1–6, home or online.", tesdaCertified: false, verification: "Verified", responseRate: 0.93 },
  { name: "Paolo Magsino", categories: ["Tutor"], skills: ["science", "math", "algebra", "entrance exam review", "english", "high school"], at: ["batangas-city", "Alangilan"], serviceRadiusKm: 20, yearsExperience: 3, bio: "Engineering graduate. High school Math/Science and college entrance exam review.", tesdaCertified: false, verification: "Verified", responseRate: 0.9 },
  { name: "Kevin Dimayuga", categories: ["Tech Support"], skills: ["laptop repair", "wifi setup", "router", "internet", "printer", "virus removal", "files recovery", "cellphone"], at: ["tanauan", "Natatas"], serviceRadiusKm: 25, yearsExperience: 6, bio: "Computer technician. Laptops, Wi-Fi and printers — home service.", tesdaCertified: true, verification: "Verified", responseRate: 0.88 },
  { name: "Lorna Castillo", categories: ["Home Cleaning"], skills: ["general cleaning", "deep cleaning", "sofa", "carpet", "move-out cleaning"], at: ["batangas-city", "Cuta"], serviceRadiusKm: 20, yearsExperience: 8, bio: "Home cleaning with my own team and supplies. Malinis at maayos.", tesdaCertified: true, verification: "Verified", responseRate: 0.91 },
  { name: "Mylene Aguilar", categories: ["Home Cleaning", "Event Assistance"], skills: ["general cleaning", "party cleanup", "serving", "event setup"], at: ["rosario", "Bagong Pook"], serviceRadiusKm: 20, yearsExperience: 5, bio: "Cleaning and party help — setup, serving and cleanup.", tesdaCertified: false, verification: "Verified", responseRate: 0.86 },
  { name: "Jerome Panganiban", categories: ["Event Assistance"], skills: ["event setup", "tables", "catering", "serving", "emcee", "host", "sound system", "decorations"], at: ["santo-tomas", "Santa Anastacia"], serviceRadiusKm: 30, yearsExperience: 7, bio: "Event crew and emcee for birthdays, debuts and weddings.", tesdaCertified: false, verification: "Verified", responseRate: 0.89 },
  { name: "Ria Villanueva", categories: ["Tech Support", "Tutor"], skills: ["computer lessons", "cellphone", "wifi", "printer", "ms office"], at: ["bauan", "Bolo"], serviceRadiusKm: 20, yearsExperience: 3, bio: "Tech help and basic computer lessons for kids and seniors.", tesdaCertified: false, verification: "Verified", responseRate: 0.84 },
];

const workers: Worker[] = workerInputs.map((w, i) => {
  const { at, ...rest } = w;
  return {
    ...rest,
    id: `w${i + 1}`,
    ...place(at[0], at[1]),
    phone: `0917 000 ${String(1000 + i + 1).slice(-4)}`,
    joinedAt: ago(24 * (200 - i * 7)),
    available: w.available ?? true,
    responseRate: w.responseRate ?? 0.8,
  };
});

type GigInput = { by: string; text: string; title: string; cat: ServiceCategory; issue: string; urgency: Gig["urgency"]; tip?: string; at: [string, string]; status: Gig["status"]; hoursAgo: number; worker?: string };

const gigInputs: GigInput[] = [
  { by: CURRENT_RESIDENT, text: "Nag-spark yung saksakan sa kusina tuwing isasaksak ko yung rice cooker, may amoy sunog na rin.", title: "Sparking kitchen outlet — urgent", cat: "Electrician", issue: "Faulty outlet / possible short circuit", urgency: "High", tip: "Turn off the breaker for that area and don't use the outlet until it's checked.", at: ["batangas-city", "Kumintang Ibaba"], status: "Open", hoursAgo: 2 },
  { by: "Maria Santos", text: "Hindi na lumalamig yung aircon namin sa kwarto, mga 3 taon na di nalilinis.", title: "Bedroom aircon not cooling", cat: "Aircon Technician", issue: "Aircon not cooling, needs cleaning", urgency: "Medium", tip: "Turn off the aircon if you notice a burning smell or water leaking inside.", at: ["lipa", "Sabang"], status: "Open", hoursAgo: 5 },
  { by: "Ana Reyes", text: "Tumutulo yung tubo sa ilalim ng lababo, basa na yung cabinet.", title: "Leaking pipe under kitchen sink", cat: "Plumber", issue: "Leaking pipe under sink", urgency: "Medium", tip: "Close the water valve under the sink to stop the leak.", at: ["batangas-city", "Alangilan"], status: "Open", hoursAgo: 26 },
  { by: "Carlo Mendoza", text: "Need repaint of our gate and front wall before the fiesta next month.", title: "Repaint gate and front wall", cat: "Painter", issue: "Exterior repainting", urgency: "Low", at: ["batangas-city", "Pallocan West"], status: "Open", hoursAgo: 50 },
  { by: "Josefa Villanueva", text: "Ayaw na umikot ng washing machine pero may tunog pa siya.", title: "Washing machine won't spin", cat: "Appliance Repair", issue: "Washing machine drum not spinning", urgency: "Medium", tip: "Unplug the washing machine until it's checked.", at: ["lipa", "Mataas na Lupa"], status: "Open", hoursAgo: 8 },
  { by: "Pedro Garcia", text: "May bitak sa pader ng kwarto, parang lumalaki na.", title: "Growing crack on bedroom wall", cat: "Mason", issue: "Wall crack getting bigger", urgency: "Medium", tip: "Keep people away from the cracked wall until it's inspected.", at: ["rosario", "Namunga"], status: "Open", hoursAgo: 75 },
  { by: "Elena Cruz", text: "Barado ang inidoro, umaapaw na yung tubig sa CR!", title: "Clogged, overflowing toilet — urgent", cat: "Plumber", issue: "Clogged and overflowing toilet", urgency: "High", tip: "Close the toilet's water valve behind the bowl to stop the overflow.", at: ["lipa", "Tambo"], status: "Open", hoursAgo: 0.5 },
  { by: "Ramon Aquino", text: "Pagawa po ng grills sa dalawang bintana sa harap ng bahay.", title: "Window grills for 2 front windows", cat: "Welder", issue: "New window grills", urgency: "Low", at: ["santo-tomas", "San Antonio"], status: "Open", hoursAgo: 96 },
  { by: "Grace Ramos", text: "Walang kuryente sa kalahati ng bahay, laging nagti-trip yung breaker.", title: "Half the house has no power — urgent", cat: "Electrician", issue: "Tripping breaker / power problem", urgency: "High", tip: "Leave the breaker off and unplug appliances in the affected rooms.", at: ["tanauan", "Trapiche"], status: "In Progress", hoursAgo: 20, worker: "w10" },
  { by: CURRENT_RESIDENT, text: "Ref is not cooling anymore, only the freezer has ice.", title: "Refrigerator not cooling", cat: "Appliance Repair", issue: "Refrigerator not cooling", urgency: "Medium", tip: "Move food to a cooler and avoid opening the ref often.", at: ["batangas-city", "Kumintang Ibaba"], status: "Done", hoursAgo: 120, worker: "w12" },
  { by: "Carmela Laurel", text: "Kailangan ko ng math tutor para sa anak ko, Grade 5, 2-3 beses kada linggo.", title: "Math tutor for Grade 5 student", cat: "Tutor", issue: "Math tutoring", urgency: "Low", tip: "For tutoring minors, keep sessions in a common area of the house with a parent or guardian at home.", at: ["lipa", "Marawoy"], status: "Open", hoursAgo: 10 },
  { by: "Ramon Bautista", text: "Looking for an English tutor for my son, may entrance exam siya sa susunod na buwan.", title: "English tutor for entrance exam review", cat: "Tutor", issue: "English / exam review", urgency: "Medium", tip: "For tutoring minors, keep sessions in a common area of the house with a parent or guardian at home.", at: ["tanauan", "Darasa"], status: "Open", hoursAgo: 30 },
  { by: "Joy Mercado", text: "Walang internet, laging nawawala yung WiFi namin, patay-sindi ang router. Work from home ako.", title: "Wi-Fi keeps disconnecting", cat: "Tech Support", issue: "Wi-Fi / router problem", urgency: "Medium", tip: "Unplug the router if it's hot or smells like burning.", at: ["batangas-city", "Balagtas"], status: "Open", hoursAgo: 4 },
  { by: "Miguel Ramos", text: "Laptop won't turn on, may importanteng files ako para sa thesis.", title: "Laptop won't turn on — thesis files", cat: "Tech Support", issue: "Laptop not powering on", urgency: "Medium", tip: "Don't keep trying to charge it if it gets hot; keep it unplugged until checked.", at: ["santo-tomas", "San Vicente"], status: "Open", hoursAgo: 14 },
  { by: "Tess Aguilar", text: "Pa-general cleaning ng bahay bago kami lumipat, 2-storey.", title: "Move-out cleaning, 2-storey house", cat: "Home Cleaning", issue: "General / move-out cleaning", urgency: "Low", tip: "Keep cleaning chemicals away from children, and never mix bleach with other cleaners.", at: ["bauan", "Aplaya"], status: "Open", hoursAgo: 40 },
  { by: "Arvin Dela Paz", text: "Need deep cleaning ng sofa at carpet pagkatapos ng party.", title: "Sofa and carpet deep cleaning", cat: "Home Cleaning", issue: "Sofa / carpet cleaning", urgency: "Low", tip: "Keep cleaning chemicals away from children, and never mix bleach with other cleaners.", at: ["rosario", "Alupay"], status: "Open", hoursAgo: 20 },
  { by: "Lea Gonzales", text: "Need 3 helpers for a 7th birthday party sa Saturday: setup ng tables, serving, at cleanup.", title: "3 helpers for a kids' birthday party", cat: "Event Assistance", issue: "Setup, serving and cleanup", urgency: "Medium", tip: "Agree on tasks, hours and pay before the event, and keep walkways and exits clear during setup.", at: ["batangas-city", "Pallocan West"], status: "Open", hoursAgo: 7 },
  { by: "Nora Villanueva", text: "Debut ng anak ko next month, kailangan ng emcee at taga-ayos ng venue.", title: "Emcee and venue setup for a debut", cat: "Event Assistance", issue: "Emcee and venue setup", urgency: "Low", tip: "Agree on tasks, hours and pay before the event.", at: ["lipa", "Tambo"], status: "Open", hoursAgo: 55 },
];

const gigs: Gig[] = gigInputs.map((g, i) => ({
  id: `g${i + 1}`,
  residentName: g.by,
  rawDescription: g.text,
  title: g.title,
  category: g.cat,
  specificIssue: g.issue,
  urgency: g.urgency,
  safetyTip: g.tip ?? "",
  aiConfidence: 0.9,
  aiSource: "gemini",
  ...place(g.at[0], g.at[1]),
  status: g.status,
  createdAt: ago(g.hoursAgo),
  assignedWorkerId: g.worker,
}));

// Past completed jobs + reviews (gives each worker a rating history).
const reviewTemplates: { rating: Review["rating"]; text: string }[] = [
  { rating: 5, text: "Dumating on time at maayos ang trabaho. Ipinaliwanag pa kung ano ang sira. Highly recommended!" },
  { rating: 5, text: "Very professional and the price was fair. Nilinis pa niya yung area after." },
  { rating: 4, text: "Good work, medyo late lang ng 30 minutes pero okay naman ang resulta." },
  { rating: 5, text: "Mabilis kausap at mabilis matapos. Babalikan ko ulit for future repairs." },
  { rating: 4, text: "Maayos ang gawa. Medyo mahal ng konti pero sulit naman." },
  { rating: 3, text: "Natapos naman pero kinailangan bumalik kinabukasan para ayusin ulit." },
];
const pastResidents = ["Teresa Lim", "Mark Villanueva", "Rosa Mendoza", "Paolo Reyes", "Cecilia Dimayuga", "Ariel Bautista", "Jenny Castillo", "Nestor Ramos"];

const reviews: Review[] = [];
let ri = 0;
workers
  .filter((w) => w.verification === "Verified" && w.id !== "w15")
  .forEach((w, wi) => {
    const count = 2 + (wi % 2);
    for (let k = 0; k < count; k++) {
      const t = reviewTemplates[(wi + k * 2) % reviewTemplates.length];
      const gigId = `p${ri + 1}`;
      gigs.push({
        id: gigId,
        residentName: pastResidents[ri % pastResidents.length],
        rawDescription: `${w.categories[0]} job (past)`,
        title: `${w.skills[k % w.skills.length].replace(/\b\w/g, (c) => c.toUpperCase())} job`,
        category: w.categories[0],
        specificIssue: w.skills[k % w.skills.length],
        urgency: "Low",
        safetyTip: "",
        aiConfidence: 0.9,
        aiSource: "gemini",
        townId: w.townId,
        barangay: w.barangay,
        lat: w.lat,
        lng: w.lng,
        status: "Done",
        createdAt: ago(24 * (30 + ri * 3)),
        assignedWorkerId: w.id,
      });
      reviews.push({
        id: `rv${ri + 1}`,
        gigId,
        workerId: w.id,
        residentName: pastResidents[ri % pastResidents.length],
        rating: t.rating,
        text: t.text,
        createdAt: ago(24 * (29 + ri * 3)),
        flagged: false,
        flagReasons: [],
        status: "Visible",
      });
      ri++;
    }
  });

// Suspicious reviews for the Review Guard demo.
function suspicious(workerId: string, name: string, rating: Review["rating"], text: string, reasons: string[], daysAgo: number) {
  const w = workers.find((x) => x.id === workerId)!;
  const gigId = `p${ri + 1}`;
  gigs.push({
    id: gigId, residentName: name, rawDescription: "past job", title: "Electrical repair job", category: w.categories[0],
    specificIssue: w.skills[0], urgency: "Low", safetyTip: "", aiConfidence: 0.9, aiSource: "gemini",
    townId: w.townId, barangay: w.barangay, lat: w.lat, lng: w.lng, status: "Done", createdAt: ago(24 * (daysAgo + 1)), assignedWorkerId: w.id,
  });
  reviews.push({ id: `rv${ri + 1}`, gigId, workerId, residentName: name, rating, text, createdAt: ago(24 * daysAgo), flagged: true, flagReasons: reasons, status: "Under Review" });
  ri++;
}
suspicious("w15", "Kim Santos", 5, "Very good worker!!! Highly recommended!!! Best in Batangas!!!", ["Near-duplicate of another review for this worker", "Generic praise with no details about the job"], 3);
suspicious("w15", "Kimberly S.", 5, "Very good worker!!! Highly recommended!!! Best in Batangas!!", ["Near-duplicate of another review for this worker", "Posted within a day of a similar review"], 2);
suspicious("w7", "Anonymous Buyer", 1, "Bobo gumawa, scammer to wag nyo kunin", ["Contains abusive or insulting language", "No details about the actual job"], 4);

// Note: Juan's completed fridge job (g10) is intentionally left un-reviewed so you can demo leaving a review.


// ---------- Steady jobs (fictional local employers) ----------
type JobInput = Omit<Job, "id" | "lat" | "lng" | "townId" | "barangay" | "postedAt" | "status"> & { at: [string, string]; daysAgo: number };
const jobInputs: JobInput[] = [
  { title: "House & Shop Electrician", employer: CURRENT_EMPLOYER, category: "Electrician", type: "Full-time", payMin: 16000, payMax: 20000, payPeriod: "month", at: ["batangas-city", "Kumintang Ibaba"], daysAgo: 2, slots: 2,
    description: "Install and repair electrical wiring for our customers' homes and small shops around Batangas City. You'll also help customers choose the right materials at our store.",
    requirements: ["At least 2 years of electrical work experience", "TESDA Electrical Installation & Maintenance NC II preferred", "Can work Monday to Saturday"], benefits: ["SSS, PhilHealth, Pag-IBIG", "Free tools and uniform", "13th month pay"] },
  { title: "Aircon Service Technician", employer: "CoolBreeze Aircon Services", category: "Aircon Technician", type: "Full-time", payMin: 15000, payMax: 18000, payPeriod: "month", at: ["lipa", "Marawoy"], daysAgo: 4, slots: 3,
    description: "Clean, repair and install window and split-type aircon units for households and offices in Lipa and nearby towns.",
    requirements: ["Experience with split-type installation", "RAC Servicing NC II is a plus", "Willing to travel within Batangas"], benefits: ["Government benefits", "Service vehicle provided", "Commission per installation"] },
  { title: "Building Maintenance Plumber", employer: "Darasa Commercial Center", category: "Plumber", type: "Full-time", payMin: 14000, payMax: 17000, payPeriod: "month", at: ["tanauan", "Darasa"], daysAgo: 6, slots: 1,
    description: "Handle daily plumbing maintenance for a 3-storey commercial building: leaks, clogged drains, pumps and water tanks.",
    requirements: ["1+ year plumbing experience", "Can respond to emergencies within the building"], benefits: ["Government benefits", "Free lunch on duty days"] },
  { title: "Weekend Appliance Repair Technician", employer: "Sabang Appliance Center", category: "Appliance Repair", type: "Part-time", payMin: 600, payMax: 800, payPeriod: "day", at: ["lipa", "Sabang"], daysAgo: 1, slots: 2,
    description: "Repair refrigerators, washing machines and small appliances at our service counter every Saturday and Sunday.",
    requirements: ["Knows basic appliance troubleshooting", "Available on weekends"], benefits: ["Daily pay", "Can become full-time"] },
  { title: "Mason for 3-Month Housing Project", employer: "Rosario Home Builders", category: "Mason", type: "Contract", payMin: 650, payMax: 750, payPeriod: "day", at: ["rosario", "Namunga"], daysAgo: 3, slots: 5,
    description: "Join our crew building six two-storey houses in Rosario. Tile work, hollow block walls and concrete finishing.",
    requirements: ["Experience in hollow block and tile work", "Can work 6 days a week for 3 months"], benefits: ["Daily pay released weekly", "Possible extension for next project"] },
  { title: "Welder / Metal Fabricator", employer: "Sto. Tomas Steelworks", category: "Welder", type: "Full-time", payMin: 17000, payMax: 22000, payPeriod: "month", at: ["santo-tomas", "San Antonio"], daysAgo: 5, slots: 2,
    description: "Fabricate gates, grills and steel trusses in our shop. Some on-site installation.",
    requirements: ["SMAW NC I or NC II preferred", "Can read simple drawings"], benefits: ["Government benefits", "Overtime pay", "Free safety gear"] },
  { title: "Painter for Resort Renovation", employer: "Bauan Seaside Resort", category: "Painter", type: "Contract", payMin: 600, payMax: 700, payPeriod: "day", at: ["bauan", "Aplaya"], daysAgo: 7, slots: 4,
    description: "Repaint cottages, walls and railings before the summer season. About 6 weeks of work.",
    requirements: ["Experience in exterior painting", "Careful and clean work"], benefits: ["Free meals on site", "Daily pay"] },
  { title: "Part-time Math & English Tutor", employer: "Bright Minds Learning Center", category: "Tutor", type: "Part-time", payMin: 250, payMax: 350, payPeriod: "day", at: ["lipa", "Mataas na Lupa"], daysAgo: 3, slots: 3,
    description: "Tutor Grades 1–6 in Math and English at our learning center, weekday afternoons and Saturdays.",
    requirements: ["Education student or graduate, or strong Math/English skills", "Patient with kids", "NBI clearance"], benefits: ["Paid per session (pay shown per hour)", "Training provided"] },
  { title: "IT Support Staff", employer: "Kumintang Hardware & Electrical", category: "Tech Support", type: "Full-time", payMin: 15000, payMax: 18000, payPeriod: "month", at: ["batangas-city", "Kumintang Ibaba"], daysAgo: 1, slots: 1,
    description: "Maintain our store computers, POS, printers, CCTV and Wi-Fi. Help staff with basic tech problems.",
    requirements: ["Computer hardware/networking skills", "Computer Systems Servicing NC II preferred"], benefits: ["SSS, PhilHealth, Pag-IBIG", "13th month pay"] },
];

const jobs: Job[] = jobInputs.map((j, i) => {
  const { at, daysAgo, ...rest } = j;
  return { ...rest, id: `j${i + 1}`, ...place(at[0], at[1]), postedAt: ago(24 * daysAgo), status: "Open" };
});

const applications: Application[] = [
  { id: "a1", jobId: "j1", workerId: "w10", message: "5 years as electrician in Tanauan. Willing to relocate to Batangas City.", createdAt: ago(20), status: "Submitted" },
  { id: "a2", jobId: "j1", workerId: "w15", message: "Interested po. Available to start next week.", createdAt: ago(12), status: "Submitted" },
  { id: "a3", jobId: "j2", workerId: "w5", message: "TESDA certified aircon technician, 9 years experience.", createdAt: ago(40), status: "Shortlisted" },
];

/** Ready-made demo accounts (shown under "Try a demo account" in the profile menu). */
// Accepted quotes for the past (completed) jobs, so the Fair Price Guide has demo data to work with.
const pastQuotes: Quote[] = gigs
  .filter((g) => g.id.startsWith("p"))
  .map((g, i) => {
    const band = STARTER[g.category];
    const f = 0.85 + ((i * 37) % 30) / 100; // small, repeatable variation between jobs
    const r50 = (n: number) => Math.round((n * f) / 50) * 50;
    return {
      id: `pq${i + 1}`,
      gigId: g.id,
      workerId: g.assignedWorkerId!,
      priceRange: `₱${r50(band.min).toLocaleString("en-PH")} – ₱${r50(band.max).toLocaleString("en-PH")}${band.unit ? ` / ${band.unit}` : ""}`,
      message: "Past job (demo data).",
      createdAt: g.createdAt,
      status: "Accepted" as const,
    };
  });

export const DEMO_ACCOUNTS: Account[] = [
  { id: "acc-juan", name: CURRENT_RESIDENT, email: "juan.delacruz@example.com", provider: "demo", role: "resident", phone: "0917 000 2001", townId: CURRENT_RESIDENT_HOME.townId, barangay: CURRENT_RESIDENT_HOME.barangay, bio: "Homeowner in Kumintang Ibaba.", createdAt: ago(24 * 90) },
  { id: "acc-kumintang", name: "Liza Ramos", email: "owner@kumintang-hardware.example.com", provider: "demo", role: "employer", phone: "0917 000 3001", townId: "batangas-city", barangay: "Kumintang Ibaba", bio: "Owner of a hardware and electrical supply store.", businessName: CURRENT_EMPLOYER, createdAt: ago(24 * 120) },
];

export function createSeed(): DB {
  return {
    version: 3,
    workers: structuredClone(workers),
    gigs: structuredClone(gigs),
    quotes: [
      { id: "q1", gigId: "g1", workerId: "w1", priceRange: "₱500 – ₱900", message: "Pwede po ako mamayang hapon. Titingnan ko muna ang wiring bago palitan ang outlet.", createdAt: ago(1.5), status: "Pending" },
      { id: "q2", gigId: "g1", workerId: "w13", priceRange: "₱600 – ₱1,000", message: "Available tomorrow morning. May dala akong replacement outlet.", createdAt: ago(1), status: "Pending" },
      { id: "q3", gigId: "g2", workerId: "w2", priceRange: "₱800 – ₱1,200", message: "Cleaning plus check ng freon. Pwede bukas.", createdAt: ago(4), status: "Pending" },
      { id: "q4", gigId: "g3", workerId: "w3", priceRange: "₱400 – ₱700", message: "Malapit lang ako sa Alangilan, pwede today.", createdAt: ago(20), status: "Pending" },
      { id: "q5", gigId: "g5", workerId: "w4", priceRange: "₱700 – ₱1,500", message: "Baka belt o motor. Titingnan ko muna.", createdAt: ago(6), status: "Pending" },
      { id: "q6", gigId: "g10", workerId: "w12", priceRange: "₱1,000 – ₱1,800", message: "Possible thermostat issue.", createdAt: ago(118), status: "Accepted" },
      { id: "q7", gigId: "g9", workerId: "w10", priceRange: "₱800 – ₱1,200", message: "On the way po.", createdAt: ago(19), status: "Accepted" },
      { id: "q8", gigId: "g11", workerId: "w21", priceRange: "₱300 – ₱400 / session", message: "Licensed teacher po ako, malapit lang sa Marawoy.", createdAt: ago(8), status: "Pending" },
      { id: "q9", gigId: "g13", workerId: "w23", priceRange: "₱500 – ₱800", message: "Pwede ko pong i-check mamaya ang router at wiring.", createdAt: ago(3), status: "Pending" },
      { id: "q10", gigId: "g17", workerId: "w26", priceRange: "₱1,500 for 3 helpers", message: "Kasama na ang setup at cleanup.", createdAt: ago(5), status: "Pending" },
      ...structuredClone(pastQuotes),
    ],
    reviews: structuredClone(reviews),
    reports: [
      { id: "rp1", workerId: "w15", residentName: "Lorna Perez", reason: "Did not show up on the agreed schedule and stopped replying.", createdAt: ago(30), resolved: false },
    ],
    jobs: structuredClone(jobs),
    applications: structuredClone(applications),
    accounts: structuredClone(DEMO_ACCOUNTS),
    // Demo chat on the "Sparking kitchen outlet" quest between Juan (resident) and Mario (electrician)
    messages: [
      { id: "m1", gigId: "g1", workerId: "w1", from: "resident", text: "Hi Mario, salamat sa quote. Pwede po ba kayo bukas ng umaga?", createdAt: ago(1.2), seen: true },
      { id: "m2", gigId: "g1", workerId: "w1", from: "worker", text: "Opo, mga 9 AM po. Patayin muna po natin ang breaker ng kusina hanggang makarating ako.", createdAt: ago(1.1), seen: false },
    ],
    alerts: [{ id: "al1", workerId: "w1", categories: ["Electrician"], townIds: ["batangas-city"], includeJobs: true, createdAt: ago(24 * 10) }],
    notifications: [
      { id: "n1", to: { residentName: CURRENT_RESIDENT }, kind: "quote", title: "New quote from Joel Aguila", body: "₱600 – ₱1,000 · Sparking kitchen outlet — urgent", link: "/gigs/g1", createdAt: ago(1), read: false },
      { id: "n2", to: { residentName: CURRENT_RESIDENT }, kind: "quote", title: "New quote from Mario Dimaculangan", body: "₱500 – ₱900 · Sparking kitchen outlet — urgent", link: "/gigs/g1", createdAt: ago(1.5), read: true },
      { id: "n3", to: { workerId: "w1" }, kind: "alert", title: "New electrician quest near you", body: "Sparking kitchen outlet — urgent · Kumintang Ibaba", link: "/gigs/g1", createdAt: ago(2), read: true },
    ],
    session: { role: "guest", workerId: "w1", userId: null },
  };
}
