// Google Maps via the Maps JavaScript API — works with the free Google Maps Platform "Maps Demo Key"
// (no billing) as well as normal keys that have "Maps JavaScript API" enabled.
// The real Google map is drawn underneath the Leaflet map (boundaries, pins, popups stay in Leaflet)
// and kept in sync with it. Google's own logo and terms stay visible, as Google requires.
import L from "leaflet";

/* eslint-disable @typescript-eslint/no-explicit-any */
type GMaps = any;

let loader: Promise<GMaps> | null = null;
let authFailed = false;
const authListeners = new Set<() => void>();

/** True once Google rejected the key on this page (wrong key, API not enabled, address not allowed, demo limit). */
export const googleJsRejected = () => authFailed;

export function loadGoogleMaps(key: string): Promise<GMaps> {
  const w = window as any;
  if (w.google?.maps?.Map) return Promise.resolve(w.google.maps);
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    // Google calls this global when the key is refused
    w.gm_authFailure = () => {
      authFailed = true;
      authListeners.forEach((f) => f());
    };
    const timer = setTimeout(() => fail("Google Maps didn't respond"), 15000);
    const fail = (msg: string) => {
      clearTimeout(timer);
      loader = null;
      s.remove();
      reject(new Error(msg));
    };
    w.__trabahomapGoogleReady = () => {
      clearTimeout(timer);
      const g = w.google?.maps;
      if (!g) return fail("Google Maps didn't load");
      if (typeof g.importLibrary === "function" && !g.Map) g.importLibrary("maps").then(() => resolve(g), () => fail("Google Maps didn't load"));
      else resolve(g);
    };
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=__trabahomapGoogleReady`;
    s.async = true;
    s.onerror = () => fail("couldn't reach Google Maps");
    document.head.appendChild(s);
  });
  return loader;
}

export interface GoogleUnderlay {
  /** resolves true when the first Google tiles are drawn, false if Google refuses or times out */
  ready: Promise<boolean>;
  /** called if Google refuses the key later (e.g. the demo key's daily limit) */
  onRejected: (f: () => void) => void;
  remove: () => void;
}

/** Puts a Google map under a Leaflet map and keeps both in sync. */
export function addGoogleUnderlay(m: L.Map, g: GMaps, mapType: "roadmap" | "hybrid"): GoogleUnderlay {
  const container = m.getContainer();
  const div = document.createElement("div");
  div.className = "gmaps-layer";
  container.insertBefore(div, container.firstChild);

  const c = m.getCenter();
  const gmap = new g.Map(div, {
    center: { lat: c.lat, lng: c.lng },
    zoom: Math.floor(m.getZoom()),
    mapTypeId: mapType,
    disableDefaultUI: true,
    gestureHandling: "none",
    keyboardShortcuts: false,
    clickableIcons: false,
    isFractionalZoomEnabled: false,
  });

  // Leaflet uses half zoom levels (e.g. 9.5); Google raster maps use whole levels.
  // Draw Google at the whole level and scale it with CSS so both line up exactly.
  const sync = (center: L.LatLng = m.getCenter(), zoom: number = m.getZoom()) => {
    const size = m.getSize();
    const z0 = Math.floor(zoom + 1e-6);
    const s = Math.pow(2, zoom - z0);
    div.style.width = size.x / s + "px";
    div.style.height = size.y / s + "px";
    div.style.transform = s === 1 ? "" : `scale(${s})`;
    const cam = { center: { lat: center.lat, lng: center.lng }, zoom: z0 };
    if (typeof gmap.moveCamera === "function") gmap.moveCamera(cam);
    else {
      gmap.setZoom(cam.zoom);
      gmap.setCenter(cam.center);
    }
  };
  const onMove = () => sync();
  const onZoomAnim = (e: L.ZoomAnimEvent) => sync(e.center, e.zoom);
  m.on("move zoom viewreset resize", onMove);
  m.on("zoomanim", onZoomAnim);
  sync();

  let rejectedCb: (() => void) | null = null;
  let resolveReady: (v: boolean) => void = () => {};
  const ready = new Promise<boolean>((r) => (resolveReady = r));
  const onAuth = () => {
    resolveReady(false);
    rejectedCb?.();
  };
  authListeners.add(onAuth);
  if (authFailed) onAuth();
  g.event?.addListenerOnce?.(gmap, "tilesloaded", () => setTimeout(() => !authFailed && resolveReady(true), 400));
  const timeout = setTimeout(() => resolveReady(false), 12000);

  return {
    ready,
    onRejected: (f) => (rejectedCb = f),
    remove: () => {
      clearTimeout(timeout);
      authListeners.delete(onAuth);
      m.off("move zoom viewreset resize", onMove);
      m.off("zoomanim", onZoomAnim);
      g.event?.clearInstanceListeners?.(gmap);
      div.remove();
    },
  };
}
