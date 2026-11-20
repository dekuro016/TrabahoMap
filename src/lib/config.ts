// Public runtime settings served by our own server (/api/config), read once.
// The Google Maps key lives in .env on the server (GOOGLE_MAPS_API_KEY), never in the source code.
// Note: a Maps key for map tiles is always visible to browsers — protect it with HTTP-referrer
// and API restrictions in Google Cloud Console (see README).

export interface PublicConfig {
  googleMapsKey: string | null;
  ai: "gemini" | "fallback";
}

let cached: Promise<PublicConfig> | null = null;

export function getConfig(): Promise<PublicConfig> {
  if (!cached) {
    cached = (async () => {
      if (window.location.protocol === "file:") return { googleMapsKey: null, ai: "fallback" };
      try {
        const res = await fetch("/api/config");
        if (!res.ok || !(res.headers.get("content-type") || "").includes("json")) throw new Error();
        const c = await res.json();
        return { googleMapsKey: typeof c.googleMapsKey === "string" && c.googleMapsKey ? c.googleMapsKey : null, ai: c.ai === "gemini" ? "gemini" : "fallback" };
      } catch {
        return { googleMapsKey: null, ai: "fallback" };
      }
    })();
  }
  return cached;
}
