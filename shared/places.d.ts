export const PILOT_PLACES: { id: string; name: string; aliases: string[]; barangays: string[] }[];
export function detectLocation(text: string): { townId: string | null; barangay: string | null };
