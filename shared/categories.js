// Shared between the browser app and the Node server.

/** The only service categories TrabahoMap supports. The AI must pick one of these. */
export const CATEGORIES = [
  "Electrician",
  "Plumber",
  "Appliance Repair",
  "Aircon Technician",
  "Carpenter",
  "Mason",
  "Welder",
  "Painter",
  "Tutor",
  "Tech Support",
  "Home Cleaning",
  "Event Assistance",
];

/** Skilled trades vs. other freelance help (used for grouping in filters). */
export const TRADE_CATEGORIES = CATEGORIES.slice(0, 8);

export const URGENCIES = ["Low", "Medium", "High"];
