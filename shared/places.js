// Pilot towns and barangays (names only) — shared by the browser and the server.
// Keep in sync with TOWNS in src/lib/seed.ts.
export const PILOT_PLACES = [
  {
    "id": "batangas-city",
    "name": "Batangas City",
    "aliases": [
      "batangas city",
      "lungsod ng batangas"
    ],
    "barangays": [
      "Alangilan",
      "Kumintang Ibaba",
      "Pallocan West",
      "Balagtas",
      "Cuta",
      "Gulod Labac"
    ]
  },
  {
    "id": "lipa",
    "name": "Lipa City",
    "aliases": [
      "lipa city",
      "lipa"
    ],
    "barangays": [
      "Marawoy",
      "Sabang",
      "Tambo",
      "Antipolo del Norte",
      "Banay-Banay",
      "Mataas na Lupa"
    ]
  },
  {
    "id": "tanauan",
    "name": "Tanauan City",
    "aliases": [
      "tanauan city",
      "tanauan"
    ],
    "barangays": [
      "Darasa",
      "Trapiche",
      "Sambat",
      "Natatas",
      "Altura Bata"
    ]
  },
  {
    "id": "santo-tomas",
    "name": "Santo Tomas",
    "aliases": [
      "santo tomas",
      "sto. tomas",
      "sto tomas",
      "sto.tomas"
    ],
    "barangays": [
      "San Antonio",
      "San Vicente",
      "Santa Anastacia",
      "San Bartolome"
    ]
  },
  {
    "id": "bauan",
    "name": "Bauan",
    "aliases": [
      "bauan"
    ],
    "barangays": [
      "Aplaya",
      "Manghinao Proper",
      "San Teodoro",
      "Bolo"
    ]
  },
  {
    "id": "rosario",
    "name": "Rosario",
    "aliases": [
      "rosario"
    ],
    "barangays": [
      "Alupay",
      "Namunga",
      "Bagong Pook",
      "San Roque"
    ]
  }
];

/** Finds a pilot town / barangay mentioned in free text (English, Filipino or Taglish). */
export function detectLocation(text) {
  const t = " " + String(text || "").toLowerCase().replace(/[^a-z0-9ñ.\s-]/g, " ").replace(/\s+/g, " ") + " ";
  for (const town of PILOT_PLACES) {
    for (const b of town.barangays) {
      if (t.includes(" " + b.toLowerCase() + " ") || t.includes(" " + b.toLowerCase() + ".")) return { townId: town.id, barangay: b };
    }
  }
  for (const town of PILOT_PLACES) {
    if (town.aliases.some((a) => t.includes(" " + a + " ") || t.includes(" " + a + "."))) return { townId: town.id, barangay: null };
  }
  return { townId: null, barangay: null };
}
