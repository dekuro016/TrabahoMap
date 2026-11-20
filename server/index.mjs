// TrabahoMap standalone server: serves the website (dist/) and the two AI endpoints.
// Run: npm start  (after npm run build)   or   npm run dev  (auto-rebuild)

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeTask, assistantTurn, checkReview } from "./ai.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

// Load .env without extra packages (Node 20.12+).
try {
  process.loadEnvFile(path.join(root, ".env"));
} catch {
  /* no .env file — AI will use the keyword fallback */
}

const PORT = Number(process.env.PORT) || 3000;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".map": "application/json" };

/** Reads a JSON body. Bodies over `limit` bytes are rejected (a photo for the AI is allowed on /api/analyze-task). */
function readJson(req, limit = 40000) {
  return new Promise((resolve) => {
    let body = "";
    let tooLarge = false;
    req.on("data", (c) => {
      if (tooLarge) return; // keep draining, but stop storing
      body += c;
      if (body.length > limit) {
        tooLarge = true;
        body = "";
        resolve({ tooLarge: true });
      }
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const tooBig = () => sendJson(res, 413, { error: "Request too large" });

  if (req.method === "POST" && url.pathname === "/api/analyze-task") {
    const { text, image, tooLarge } = await readJson(req, 450000);
    if (tooLarge) return tooBig();
    const result = await analyzeTask(text, image);
    return sendJson(res, result.error ? 400 : 200, result);
  }
  if (req.method === "POST" && url.pathname === "/api/check-review") {
    const { text, rating, tooLarge } = await readJson(req);
    if (tooLarge) return tooBig();
    return sendJson(res, 200, await checkReview(text || "", rating || 0));
  }
  if (req.method === "POST" && url.pathname === "/api/assistant") {
    const { messages, tooLarge } = await readJson(req);
    if (tooLarge) return tooBig();
    const result = await assistantTurn(messages);
    return sendJson(res, result.error ? 400 : 200, result);
  }
  if (url.pathname === "/api/config") {
    // Public settings for the browser. The Maps key is needed by the browser to load tiles;
    // protect it with HTTP-referrer + "Map Tiles API" restrictions in Google Cloud Console.
    return sendJson(res, 200, { googleMapsKey: process.env.GOOGLE_MAPS_API_KEY || null, ai: process.env.GEMINI_API_KEY ? "gemini" : "fallback" });
  }
  if (url.pathname === "/api/health") {
    return sendJson(res, 200, { ok: true, ai: process.env.GEMINI_API_KEY ? "gemini" : "fallback" });
  }

  // Static files
  let file = path.join(dist, decodeURIComponent(url.pathname));
  if (!file.startsWith(dist)) return sendJson(res, 403, { error: "Forbidden" });
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, "index.html");
  if (!fs.existsSync(file)) {
    res.writeHead(500);
    return res.end("Website not built yet. Run: npm run build");
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log(`\n  TrabahoMap running at http://localhost:${PORT}`);
  console.log(`  Maps: ${process.env.GOOGLE_MAPS_API_KEY ? "Google Maps (key set) with free fallback" : "free CARTO/Esri tiles (add GOOGLE_MAPS_API_KEY to .env for Google)"}`);
  console.log(`  AI mode: ${process.env.GEMINI_API_KEY ? "Gemini (" + (process.env.GEMINI_MODEL || "gemini-2.5-flash") + ")" : "keyword fallback (add GEMINI_API_KEY to .env for real AI)"}\n`);
});
