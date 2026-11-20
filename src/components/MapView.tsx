// Interactive map: the whole Philippines (provinces) with Batangas drawn in detail.
//
// Layers, bottom to top:
//   1. Street / Satellite tiles (CARTO, Esri) — loaded from the internet when allowed.
//   2. Philippine provinces (src/data/philippines-provinces.json) — "Coming soon" areas.
//   3. Batangas municipalities (src/data/batangas-municipalities.json) — pilot towns are clickable.
//   4. Markers: quests, steady jobs, workers.
// Layers 2–4 are built into the site, so the map ALWAYS works — even offline or where outside
// map images are blocked. Boundaries: PSGC 2023 via github.com/faeldon/philippines-json-maps (MIT).

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import municipalities from "../data/batangas-municipalities.json";
import provinces from "../data/philippines-provinces.json";
import { getConfig } from "../lib/config";
import { googleMapsUrl } from "../lib/geo";
import { googleAttribution, googleTileSession, googleTileUrl, type GoogleMapType } from "../lib/googleTiles";
import { addGoogleUnderlay, googleJsRejected, loadGoogleMaps, type GoogleUnderlay } from "../lib/googleJs";
import { intro } from "../lib/intro";
import { navigate } from "../lib/router";
import { TOWNS } from "../lib/seed";
import type { Gig, Job, Worker } from "../lib/types";

interface Props {
  gigs?: Gig[];
  workers?: Worker[];
  jobs?: Job[];
  showTowns?: boolean;
  selectedTownId?: string | null;
  onTownClick?: (townId: string | null) => void;
  height?: number | string;
  focus?: { lat: number; lng: number; zoom?: number };
  /** Count shown on each pilot-town label (e.g. open quests + jobs). */
  townCounts?: Record<string, number>;
  /** Start zoomed out on the whole Philippines, then fly into Batangas. */
  flyIn?: boolean;
}

type Mode = "street" | "satellite" | "simple";
type MunProps = { name: string; townId: string | null };
type MunFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, MunProps>;
const MUN = municipalities as unknown as GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, MunProps>;
const PROV = provinces as unknown as GeoJSON.FeatureCollection<GeoJSON.MultiPolygon, { name: string }>;

const PH_BOUNDS = L.latLngBounds([4.4, 116.8], [21.2, 126.8]);
const HOME = { center: L.latLng(13.93, 121.1), zoom: 9.5 }; // Batangas, zoomed out a little
const BATANGAS_CENTER = L.latLng(13.9, 121.1);
const PH_VIEW = { center: L.latLng(12.3, 122.3), zoom: 5.5 };

// Tile providers, tried in order for each style. When GOOGLE_MAPS_API_KEY is set in .env, Google is tried first:
//   1) Maps JavaScript API (works with the free Maps Demo Key), 2) Map Tiles API (billing-enabled keys).
// Free fallbacks (no key): CARTO (street) and Esri (street/satellite).
// OpenStreetMap's own tile server is NOT used: its usage policy blocks apps like this ("Access blocked").
type Provider =
  | { name: string; kind: "googlejs"; mapType: "roadmap" | "hybrid" }
  | { name: string; kind: "google"; mapType: GoogleMapType }
  | { name: string; kind: "url"; url: string; attribution: string; overlays?: string[] };

const FREE: Record<Exclude<Mode, "simple">, Provider[]> = {
  street: [
    { name: "CARTO", kind: "url", url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>' },
    { name: "Esri", kind: "url", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", attribution: "Tiles &copy; Esri" },
  ],
  satellite: [
    {
      name: "Esri",
      kind: "url",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
      overlays: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      ],
    },
  ],
};

function providersFor(mode: Exclude<Mode, "simple">, googleKey: string | null): Provider[] {
  const google: Provider[] = googleKey
    ? [
        { name: "Google Maps JS", kind: "googlejs", mapType: mode === "street" ? "roadmap" : "hybrid" },
        { name: "Google Maps", kind: "google", mapType: mode === "street" ? "roadmap" : "satellite" },
      ]
    : [];
  return [...google, ...FREE[mode]];
}

/** The most useful Google error to show (a refusal reason beats "couldn't reach"). */
function pickGoogleReason(failures: string[]) {
  const g = failures.filter((f) => f.startsWith("Google"));
  return g.find((f) => !f.includes("couldn't reach")) ?? g[0];
}

/** Point-in-polygon for GeoJSON (lng/lat), used for "You are here". */
function inFeature(f: { geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon }, lng: number, lat: number) {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const inRing = (ring: number[][]) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  return polys.some((p) => inRing(p[0]) && !p.slice(1).some(inRing));
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function townStyle(f: MunFeature | undefined, selected: string | null | undefined, tiles: Mode | null): L.PathOptions {
  const pilot = Boolean(f?.properties.townId);
  const sel = pilot && f?.properties.townId === selected;
  if (!tiles) {
    return { color: pilot ? "#13865f" : "#ffffff", weight: sel ? 3 : pilot ? 1.6 : 0.9, fillColor: sel ? "#9fdcbe" : pilot ? "#d9f0e4" : "#dfe4e1", fillOpacity: 1 };
  }
  const sat = tiles === "satellite";
  return {
    color: pilot ? (sat ? "#7ff0be" : "#13865f") : sat ? "#ffffff" : "#8e9a94",
    weight: sel ? 3.5 : pilot ? 2 : 0.8,
    opacity: pilot ? 1 : 0.6,
    fillColor: pilot ? "#13865f" : "#000",
    fillOpacity: sel ? 0.18 : pilot ? 0.06 : 0,
    dashArray: pilot ? undefined : "3 4",
  };
}

function provinceStyle(tiles: Mode | null): L.PathOptions {
  return tiles
    ? { color: tiles === "satellite" ? "#ffffff" : "#8e9a94", weight: 0.7, opacity: 0.5, fillOpacity: 0, dashArray: "3 4" }
    : { color: "#ffffff", weight: 0.8, fillColor: "#c9d0cc", fillOpacity: 1 };
}

export default function MapView({ gigs = [], workers = [], jobs = [], showTowns = false, selectedTownId, onTownClick, height = 420, focus, townCounts, flyIn = false }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const munLayer = useRef<L.GeoJSON | null>(null);
  const provLayer = useRef<L.GeoJSON | null>(null);
  const tileLayers = useRef<L.TileLayer[]>([]);
  const tilesOk = useRef<Mode | null>(null); // which tile mode actually loaded
  const clickRef = useRef(onTownClick);
  clickRef.current = onTownClick;
  const selectedRef = useRef(selectedTownId);
  selectedRef.current = selectedTownId;
  const firstSelect = useRef(true);

  const [mode, setMode] = useState<Mode>("street");
  const [notice, setNotice] = useState<{ text: string; retry?: Mode } | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [reload, setReload] = useState(0); // bumps when Google refuses the key after loading
  const underlay = useRef<GoogleUnderlay | null>(null);
  const youLayer = useRef<L.LayerGroup | null>(null);

  const restyle = () => {
    munLayer.current?.setStyle((f) => townStyle(f as MunFeature, selectedRef.current, tilesOk.current));
    provLayer.current?.setStyle(() => provinceStyle(tilesOk.current));
    el.current?.classList.toggle("has-tiles", Boolean(tilesOk.current));
    el.current?.classList.toggle("is-satellite", tilesOk.current === "satellite");
  };

  // ---------- Create the map once ----------
  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      minZoom: 5,
      zoomSnap: 0.5,
      maxBounds: PH_BOUNDS.pad(0.3),
    });
    m.attributionControl.setPrefix(false);
    m.attributionControl.addAttribution("Boundaries: PSGC 2023");

    // Provinces of the Philippines (coming soon)
    m.createPane("country");
    m.getPane("country")!.style.zIndex = "300";
    const prov = L.geoJSON(PROV, {
      pane: "country",
      style: () => provinceStyle(tilesOk.current),
      onEachFeature: (f, layer) => {
        (layer as L.Path).options.className = "nonpilot";
        layer.bindTooltip(`<b>${esc(f.properties.name)}</b><br>Coming soon to TrabahoMap`, { sticky: true, className: "town-tip" });
        layer.on({
          mouseover: (e) => (e.target as L.Path).setStyle(tilesOk.current ? { fillColor: "#ffffff", fillOpacity: 0.15 } : { fillColor: "#b3bcb7" }),
          mouseout: (e) => prov.resetStyle(e.target),
        });
      },
    }).addTo(m);
    provLayer.current = prov;

    // Batangas municipalities
    m.createPane("towns");
    m.getPane("towns")!.style.zIndex = "350";
    const mun = L.geoJSON(MUN, {
      pane: "towns",
      style: (f) => townStyle(f as MunFeature, selectedRef.current, tilesOk.current),
      onEachFeature: (f, layer) => {
        const p = (f as MunFeature).properties;
        if (!p.townId) (layer as L.Path).options.className = "nonpilot";
        layer.bindTooltip(p.townId ? `<b>${esc(p.name)}</b><br>Pilot town · click to explore` : `<b>${esc(p.name)}, Batangas</b><br>Coming soon`, { sticky: true, className: "town-tip" });
        layer.on({
          mouseover: (e) => (e.target as L.Path).setStyle(p.townId ? { weight: 3.5, color: "#0f7050" } : { fillColor: tilesOk.current ? "#ffffff" : "#d0d6d3", fillOpacity: tilesOk.current ? 0.15 : 1 }),
          mouseout: (e) => mun.resetStyle(e.target),
          click: () => {
            if (p.townId) clickRef.current?.(p.townId);
          },
        });
      },
    }).addTo(m);
    munLayer.current = mun;

    // Small name labels for the other Batangas towns (only when zoomed in, to avoid clutter)
    const labels = L.layerGroup();
    mun.eachLayer((l) => {
      const f = (l as L.Polygon).feature as MunFeature;
      if (f.properties.townId) return;
      const icon = L.divIcon({ className: "", html: `<div class="mun-label">${esc(f.properties.name)}</div>`, iconSize: [0, 0] });
      L.marker((l as L.Polygon).getBounds().getCenter(), { icon, interactive: false, pane: "towns" }).addTo(labels);
    });
    const syncLabels = () => (m.getZoom() >= 10.5 ? labels.addTo(m) : labels.remove());
    m.on("zoomend", syncLabels);

    // Town labels: full near Batangas, smaller when zoomed out, one "Batangas" label far out.
    const syncPills = () => {
      const pts = TOWNS.map((t) => m.latLngToContainerPoint([t.label.lat, t.label.lng]));
      let minD = Infinity;
      for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) minD = Math.min(minD, pts[a].distanceTo(pts[b]));
      el.current?.classList.toggle("pills-compact", minD < 95 && minD >= 28);
      el.current?.classList.toggle("pills-agg", minD < 28);
    };
    m.on("zoomend", syncPills);
    m.whenReady(syncPills);

    // Initial view
    if (focus) m.setView([focus.lat, focus.lng], focus.zoom ?? 14);
    else if (flyIn) {
      m.setView(PH_VIEW.center, PH_VIEW.zoom);
      intro.whenDone(() => setTimeout(() => map.current?.flyTo(HOME.center, HOME.zoom, { duration: 2.2 }), 350));
    } else m.setView(HOME.center, HOME.zoom);
    syncLabels();
    syncPills();

    markers.current = L.layerGroup().addTo(m);
    map.current = m;

    // Links inside popups use the hash router
    m.on("popupopen", (e) => {
      e.popup.getElement()?.querySelectorAll("a[data-to]").forEach((a) =>
        a.addEventListener("click", (ev) => {
          ev.preventDefault();
          navigate((a as HTMLElement).dataset.to!);
        }),
      );
    });
    return () => {
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-hide the "can't load" notice after a few seconds
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 12000);
    return () => clearTimeout(t);
  }, [notice]);

  // ---------- Street / Satellite / Simple ----------
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    let cancelled = false;
    const clear = () => {
      tileLayers.current.forEach((t) => m.removeLayer(t));
      tileLayers.current = [];
      underlay.current?.remove();
      underlay.current = null;
    };
    clear();
    tilesOk.current = null;
    setProvider(null);
    restyle();
    if (mode === "simple") return;

    const failures: string[] = [];
    let stopAttribution: (() => void) | null = null;

    const markLoaded = (name: string) => {
      if (tilesOk.current || cancelled) return;
      tilesOk.current = mode;
      setProvider(name);
      restyle();
      setNotice(null);
    };

    const run = async () => {
      const { googleMapsKey } = await getConfig();
      const list = providersFor(mode, googleMapsKey);
      for (const p of list) {
        if (cancelled) return;
        clear();
        const ok = await new Promise<boolean>((resolve) => {
          let errors = 0;
          let settled = false;
          const done = (v: boolean) => {
            if (!settled) {
              settled = true;
              resolve(v);
            }
          };
          const attach = (t: L.TileLayer, main: boolean) => {
            if (main) {
              t.on("tileload", () => {
                markLoaded(p.name);
                done(true);
              });
              t.on("tileerror", () => ++errors >= 4 && !tilesOk.current && done(false));
            }
            t.addTo(m);
            tileLayers.current.push(t);
          };
          if (p.kind === "googlejs") {
            if (googleJsRejected()) {
              failures.push("Google Maps (the key was refused — check that Maps JavaScript API is allowed for it and this address is in its website list)");
              return done(false);
            }
            loadGoogleMaps(googleMapsKey!)
              .then((g) => {
                if (cancelled) return done(false);
                const u = addGoogleUnderlay(m, g, p.mapType);
                underlay.current = u;
                u.onRejected(() => {
                  // refused after it had already loaded (e.g. daily demo limit): switch to the next provider
                  if (tilesOk.current && !cancelled) setReload((n) => n + 1);
                });
                u.ready.then((ok) => {
                  if (ok) {
                    markLoaded(p.name);
                    return done(true);
                  }
                  failures.push(
                    googleJsRejected()
                      ? "Google Maps (the key was refused — check that Maps JavaScript API is allowed for it and this address is in its website list)"
                      : "Google Maps (it didn't load in time)",
                  );
                  done(false);
                });
              })
              .catch((err: Error) => {
                failures.push(`Google Maps (${err.message})`);
                done(false);
              });
          } else if (p.kind === "google") {
            googleTileSession(googleMapsKey!, p.mapType)
              .then((session) => {
                if (cancelled) return done(false);
                attach(L.tileLayer(googleTileUrl(googleMapsKey!, session), { maxZoom: 20, attribution: "Map data &copy; Google" }), true);
                // Google requires showing its copyright text for the visible area
                const update = () =>
                  googleAttribution(googleMapsKey!, session, { zoom: m.getZoom(), north: m.getBounds().getNorth(), south: m.getBounds().getSouth(), east: m.getBounds().getEast(), west: m.getBounds().getWest() })
                    .then((c) => {
                      const t = tileLayers.current[0];
                      if (t && !cancelled) {
                        m.attributionControl.removeAttribution(t.getAttribution?.() ?? "");
                        t.options.attribution = esc(c);
                        m.attributionControl.addAttribution(esc(c));
                      }
                    })
                    .catch(() => {});
                let timer: number | undefined;
                const onMove = () => {
                  clearTimeout(timer);
                  timer = window.setTimeout(update, 500);
                };
                m.on("moveend", onMove);
                stopAttribution = () => m.off("moveend", onMove);
                update();
              })
              .catch((err: Error) => {
                failures.push(`Google Maps (${err.message})`);
                console.warn("[map] Google Maps tiles refused:", err.message);
                done(false);
              });
          } else {
            attach(L.tileLayer(p.url, { maxZoom: 19, attribution: p.attribution, subdomains: "abcd" }), true);
            for (const o of p.overlays ?? []) attach(L.tileLayer(o, { maxZoom: 19 }), false);
          }
          setTimeout(() => done(Boolean(tilesOk.current)), 12000); // give up on a provider after 12 s
        });
        if (ok) {
          const gf = pickGoogleReason(failures);
          if (gf && p.kind === "url" && !focus && !cancelled)
            setNotice({ text: `Showing the free ${p.name} map instead of Google Maps. Google said: ${gf.replace(/^Google Maps \(|\)$/g, "").replace(/\.+$/, "")}.` });
          return;
        }
        if (p.kind === "url") failures.push(p.name);
        if (p.kind === "googlejs") console.warn("[map] Google Maps JavaScript API:", failures[failures.length - 1]);
        stopAttribution?.();
        stopAttribution = null;
      }
      if (cancelled) return;
      clear();
      console.warn("[map] No tile provider loaded for", mode, failures);
      const googleFail = pickGoogleReason(failures);
      const what = mode === "street" ? "Street map" : "Satellite view";
      setNotice({
        text: focus
          ? `${what} can't load here — use Directions or Street View below.`
          : `${what} couldn't load (${[...new Set(failures.map((f) => f.split(" (")[0]))].join(", ") || "no provider"}), so we switched to the simple map.` +
            (googleFail ? " Google said: " + googleFail.replace(/^Google Maps \(|\)$/g, "").replace(/\.+$/, "") + "." : " Check your internet connection or ad-blocker.") +
            " Street View on any quest or job still opens Google Maps.",
        retry: mode,
      });
      setMode("simple");
    };
    run();
    return () => {
      cancelled = true;
      stopAttribution?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, reload]);

  // ---------- "You are here" ----------
  function locateMe() {
    const m = map.current;
    if (!m) return;
    if (!("geolocation" in navigator) || !window.isSecureContext) {
      setNotice({ text: "Your browser can't share your location on this page (it needs https or localhost)." });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        youLayer.current?.remove();
        const g = L.layerGroup().addTo(m);
        if (accuracy < 3000) L.circle([lat, lng], { radius: accuracy, color: "#2f6fed", weight: 1, fillColor: "#2f6fed", fillOpacity: 0.12, interactive: false }).addTo(g);
        L.marker([lat, lng], {
          icon: L.divIcon({ className: "", html: '<div class="you-pin"><span></span></div>', iconSize: [22, 22], iconAnchor: [11, 11] }),
          zIndexOffset: 2000,
          title: "You are here",
        })
          .bindTooltip("You are here", { permanent: true, direction: "top", offset: [0, -12], className: "you-tip" })
          .addTo(g);
        youLayer.current = g;

        const town = MUN.features.find((f) => inFeature(f, lng, lat));
        if (town?.properties.townId && onTownClick) {
          onTownClick(town.properties.townId);
          setNotice({ text: `You're in ${town.properties.name}. Showing quests, jobs and workers near you.` });
          setTimeout(() => map.current?.flyTo([lat, lng], 13, { duration: 1 }), 900);
        } else {
          m.flyTo([lat, lng], town ? 12 : PH_BOUNDS.contains([lat, lng]) ? 10 : 6, { duration: 1.2 });
          setNotice({
            text: town
              ? `You're in ${town.properties.name}, Batangas — TrabahoMap is coming there soon. The green towns are open now.`
              : PH_BOUNDS.contains([lat, lng])
                ? "You're outside our pilot towns. TrabahoMap starts in Batangas and is coming to more areas soon."
                : "You seem to be outside the Philippines. TrabahoMap currently serves Batangas.",
          });
        }
      },
      (err) => {
        setLocating(false);
        setNotice({
          text:
            err.code === err.PERMISSION_DENIED
              ? "Location permission was denied. You can allow it in your browser's site settings and try again."
              : err.code === err.TIMEOUT
                ? "Finding your location took too long. Please try again."
                : "Your location isn't available right now.",
        });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  // ---------- Highlight selected town + zoom to it ----------
  useEffect(() => {
    munLayer.current?.setStyle((f) => townStyle(f as MunFeature, selectedTownId, tilesOk.current));
    const m = map.current;
    if (!m || focus) return;
    if (firstSelect.current) {
      firstSelect.current = false;
      if (!selectedTownId) return; // keep the initial view / fly-in
    }
    const layer = munLayer.current
      ?.getLayers()
      .find((l) => ((l as L.Polygon).feature as MunFeature | undefined)?.properties.townId === selectedTownId) as L.Polygon | undefined;
    if (layer && selectedTownId) m.flyToBounds(layer.getBounds(), { duration: 0.8, padding: [30, 30] });
    else m.flyTo(HOME.center, HOME.zoom, { duration: 0.8 });
  }, [selectedTownId, focus]);

  // ---------- Markers ----------
  useEffect(() => {
    const g = markers.current;
    if (!g) return;
    g.clearLayers();

    if (showTowns) {
      const total = TOWNS.reduce((n, t) => n + (townCounts?.[t.id] ?? 0), 0);
      const agg = L.divIcon({ className: "", html: `<div class="town-pill agg-pill">Batangas<span>${total}</span></div>`, iconSize: [0, 0] });
      L.marker(BATANGAS_CENTER, { icon: agg, zIndexOffset: 1100, title: "Zoom to Batangas" })
        .on("click", () => map.current?.flyTo(HOME.center, HOME.zoom, { duration: 1.4 }))
        .addTo(g);
      for (const t of TOWNS) {
        const count = townCounts?.[t.id] ?? 0;
        const selected = selectedTownId === t.id;
        const icon = L.divIcon({
          className: "",
          html: `<div class="town-pill${selected ? " selected" : ""}">${esc(t.name)}<span>${count}</span></div>`,
          iconSize: [0, 0],
        });
        L.marker([t.label.lat, t.label.lng], { icon, zIndexOffset: 1000, keyboard: true, title: `Show ${t.name}` })
          .on("click", () => clickRef.current?.(t.id))
          .addTo(g);
      }
    }

    // Spread markers that share a barangay a little, so they don't hide each other.
    const jitter = (id: string, r = 0.0035): [number, number] => {
      let h = 0;
      for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      const a = (h % 360) * (Math.PI / 180);
      return [Math.sin(a) * r, Math.cos(a) * r];
    };
    const gmaps = (lat: number, lng: number) => `<a href="${googleMapsUrl(lat, lng)}" target="_blank" rel="noopener">Google Maps ↗</a>`;

    for (const w of workers) {
      const [dy, dx] = jitter(w.id);
      const icon = L.divIcon({ className: "", html: `<div class="pin pin-worker"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] });
      L.marker([w.lat + dy, w.lng + dx], { icon, title: w.name })
        .bindPopup(`<b>${esc(w.name)}</b><br>${esc(w.categories.join(", "))}<br>${esc(w.barangay)}<div class="pop-links"><a href="#" data-to="/workers/${w.id}">View profile →</a></div>`)
        .addTo(g);
    }

    for (const j of jobs) {
      const [dy, dx] = jitter(j.id);
      const icon = L.divIcon({ className: "", html: `<div class="pin pin-job">₱</div>`, iconSize: [24, 24], iconAnchor: [12, 12] });
      L.marker([j.lat + dy, j.lng + dx], { icon, title: j.title })
        .bindPopup(`<b>${esc(j.title)}</b><br>${esc(j.employer)}<br>${esc(j.type)} · ${esc(j.barangay)}<div class="pop-links"><a href="#" data-to="/jobs/${j.id}">View job →</a>${gmaps(j.lat, j.lng)}</div>`)
        .addTo(g);
    }

    for (const x of gigs) {
      const icon = L.divIcon({
        className: "",
        html: `<div class="pin pin-gig urg-${x.urgency.toLowerCase()}"><span></span></div>`,
        iconSize: [26, 34],
        iconAnchor: [13, 32],
      });
      L.marker([x.lat, x.lng], { icon, zIndexOffset: x.urgency === "High" ? 500 : 0, title: x.title })
        .bindPopup(`<b>${esc(x.title)}</b><br>${esc(x.category)} · ${esc(x.urgency)}<br>${esc(x.barangay)}<div class="pop-links"><a href="#" data-to="/gigs/${x.id}">Open quest →</a>${gmaps(x.lat, x.lng)}</div>`)
        .addTo(g);
    }
  }, [gigs, workers, jobs, showTowns, selectedTownId, townCounts]);

  return (
    <div className={`map-wrap${provider === "Google Maps JS" ? " gjs" : ""}`}>
      <div ref={el} className="map" style={{ height }} />

      <div className="map-ctrl map-modes" role="group" aria-label="Map style">
        {(["street", "satellite", "simple"] as Mode[]).map((md) => (
          <button key={md} className={mode === md ? "active" : ""} onClick={() => setMode(md)}>
            {md === "street" ? "Street" : md === "satellite" ? "Satellite" : "Simple"}
          </button>
        ))}
      </div>

      {!focus && (
        <div className="map-ctrl map-views" role="group" aria-label="Map view">
          <button onClick={() => map.current?.flyTo(PH_VIEW.center, PH_VIEW.zoom, { duration: 1.4 })}>Philippines</button>
          <button
            onClick={() => {
              if (selectedRef.current) clickRef.current?.(null);
              else map.current?.flyTo(HOME.center, HOME.zoom, { duration: 1.2 });
            }}
          >
            Batangas
          </button>
        </div>
      )}

      {!focus && (
        <button className={`map-ctrl map-locate${locating ? " busy" : ""}`} onClick={locateMe} disabled={locating} title="Show my location" aria-label="Show my location">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          <span>{locating ? "Locating…" : "Near me"}</span>
        </button>
      )}

      {provider === "Google Maps" && <div className="google-mark" aria-hidden="true">Google</div>}

      {notice && (
        <div className="map-notice" role="status">
          <span>
            {notice.text}
            {notice.retry && (
              <>
                {" "}
                <button className="notice-retry" onClick={() => setMode(notice.retry!)}>
                  Try again
                </button>
              </>
            )}
          </span>
          <button aria-label="Dismiss" onClick={() => setNotice(null)}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
