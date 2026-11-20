// Builds the website into dist/.
//   node scripts/build.mjs           → dist/index.html + app.js + app.css (served by server/index.mjs or Vercel)
//   node scripts/build.mjs --single  → dist-single/index.html with everything inlined (one file preview)
//   node scripts/build.mjs --watch   → rebuild on every change (used by npm run dev)

import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const single = process.argv.includes("--single");
const watch = process.argv.includes("--watch");
const outdir = path.join(root, single ? "dist-single" : "dist");

const options = {
  entryPoints: [path.join(root, "src/main.tsx")],
  bundle: true,
  outdir,
  entryNames: "app",
  minify: !watch,
  sourcemap: watch ? "inline" : false,
  jsx: "automatic",
  target: ["es2020"],
  loader: { ".png": "dataurl", ".svg": "dataurl" },
  define: { "process.env.NODE_ENV": watch ? '"development"' : '"production"' },
  logLevel: "info",
};

function writeHtml() {
  let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  if (single) {
    const css = fs.readFileSync(path.join(outdir, "app.css"), "utf8");
    const js = fs.readFileSync(path.join(outdir, "app.js"), "utf8").replace(/<\/script/gi, "<\\/script");
    html = html.replace("<!--CSS-->", () => `<style>${css}</style>`).replace("<!--JS-->", () => `<script>${js}</script>`);
    fs.rmSync(path.join(outdir, "app.css"));
    fs.rmSync(path.join(outdir, "app.js"));
  } else {
    html = html.replace("<!--CSS-->", '<link rel="stylesheet" href="/app.css" />').replace("<!--JS-->", '<script src="/app.js"></script>');
  }
  fs.writeFileSync(path.join(outdir, "index.html"), html);
}

fs.rmSync(outdir, { recursive: true, force: true });

if (watch) {
  const ctx = await esbuild.context({
    ...options,
    plugins: [{ name: "html", setup: (b) => b.onEnd((r) => r.errors.length === 0 && writeHtml()) }],
  });
  await ctx.watch();
  console.log("Watching for changes…");
} else {
  await esbuild.build(options);
  writeHtml();
  console.log(`Built → ${path.relative(root, outdir)}/`);
}
