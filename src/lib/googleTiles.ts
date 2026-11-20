// Google Maps 2D tiles (official "Map Tiles API") for Leaflet — no extra library needed.
// Docs: https://developers.google.com/maps/documentation/tile/2d-tiles-overview
// Requires: a Google Cloud project with BILLING enabled and the "Map Tiles API" turned on for the key.

export type GoogleMapType = "roadmap" | "satellite";

const sessions = new Map<string, { session: string; expiresAt: number }>();

/** Creates (or re-uses) a tile session. Throws an Error with a readable reason if Google refuses. */
export async function googleTileSession(key: string, mapType: GoogleMapType): Promise<string> {
  const cacheKey = `${key}|${mapType}`;
  const hit = sessions.get(cacheKey);
  if (hit && hit.expiresAt - Date.now() > 60_000) return hit.session;

  const body: Record<string, unknown> = { mapType, language: "en-US", region: "PH" };
  if (mapType === "satellite") body.layerTypes = ["layerRoadmap"]; // roads + labels on top of the photo

  const res = await fetch(`https://tile.googleapis.com/v1/createSession?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error?.message ? `${res.status}: ${j.error.message}` : msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const j = await res.json();
  const expiresAt = Number(j.expiry) * 1000 || Date.now() + 6 * 3600_000;
  sessions.set(cacheKey, { session: j.session, expiresAt });
  return j.session;
}

export const googleTileUrl = (key: string, session: string) =>
  `https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${encodeURIComponent(session)}&key=${encodeURIComponent(key)}`;

/** The copyright text Google requires for the visible area. */
export async function googleAttribution(key: string, session: string, b: { zoom: number; north: number; south: number; east: number; west: number }) {
  const q = new URLSearchParams({
    session,
    key,
    zoom: String(Math.round(b.zoom)),
    north: b.north.toFixed(4),
    south: b.south.toFixed(4),
    east: b.east.toFixed(4),
    west: b.west.toFixed(4),
  });
  const res = await fetch(`https://tile.googleapis.com/tile/v1/viewport?${q}`);
  if (!res.ok) throw new Error(String(res.status));
  const j = await res.json();
  return typeof j.copyright === "string" ? j.copyright : "Map data © Google";
}
