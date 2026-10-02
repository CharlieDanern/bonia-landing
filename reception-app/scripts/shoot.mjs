#!/usr/bin/env node
/**
 * Visual QA: render every registered handoff frame at 1440 × 900 and diff it
 * against the design PNG (design/frames/<id>.png).
 *
 *   npm run shoot                       # all registered frames, dev server on :5180
 *   npm run shoot -- 3.3                # only ids containing "3.3"
 *   npm run shoot -- --base http://localhost:5181 3.2_A 3.2_B
 *   npm run shoot -- --extra 3.2_A=/hom-nay   # ad-hoc frame → path (not in the registry)
 *
 * Writes .qa/app/<id>.png (our render), .qa/diff/<id>.png (pixelmatch,
 * threshold 0.1) and .qa/report.json; prints a table sorted by mismatch.
 * Frames that exist in design/frames but nobody registered yet are listed
 * as "unregistered" — that is a report, not an error.
 *
 * Registry: src/frames/<group>.js → { "<frameId>": "/path?query" }, paths
 * relative to the app base (/reception/app).
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DESIGN = join(ROOT, "design", "frames");
const OUT_APP = join(ROOT, ".qa", "app");
const OUT_DIFF = join(ROOT, ".qa", "diff");
const REPORT = join(ROOT, ".qa", "report.json");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const APP_BASE = "/reception/app";
const W = 1440;
const H = 900;

// ── args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
let base = process.env.QA_BASE || "http://localhost:5180";
const filters = [];
const extra = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--base") base = args[++i];
  else if (a.startsWith("--base=")) base = a.slice(7);
  else if (a === "--extra") {
    const [id, ...p] = args[++i].split("=");
    extra[id] = p.join("=");
  } else if (a.startsWith("--extra=")) {
    const [id, ...p] = a.slice(8).split("=");
    extra[id] = p.join("=");
  } else filters.push(a);
}
base = base.replace(/\/$/, "");

// ── registry + design frames ───────────────────────────────────────────
const { FRAMES } = await import(pathToFileURL(join(ROOT, "src", "frames", "index.js")).href);
const registry = { ...FRAMES, ...extra };
const designIds = readdirSync(DESIGN)
  .filter((f) => f.endsWith(".png"))
  .map((f) => f.replace(/\.png$/, ""))
  .sort(byFrameId);

const matchesFilter = (id) => !filters.length || filters.some((f) => id.includes(f));
const unregistered = designIds.filter((id) => !registry[id]);
const unknown = Object.keys(registry).filter((id) => !designIds.includes(id));
const todo = Object.keys(registry)
  .filter((id) => designIds.includes(id) && matchesFilter(id))
  .sort(byFrameId);

function byFrameId(a, b) {
  return a.localeCompare(b, "en", { numeric: true });
}

function urlFor(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${APP_BASE}${p}`;
}

// Freeze motion so spinners, carets and pulses match the static frames.
const FREEZE_CSS = `
  *, *::before, *::after {
    animation-play-state: paused !important;
    animation-delay: 0s !important;
    transition: none !important;
    caret-color: transparent !important;
  }
`;

mkdirSync(OUT_APP, { recursive: true });
mkdirSync(OUT_DIFF, { recursive: true });

const results = [];
const errors = [];

if (todo.length) {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--hide-scrollbars", "--force-color-profile=srgb", "--font-render-hinting=none", `--window-size=${W},${H}`],
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  page.on("pageerror", (e) => errors.push({ id: page.__frameId, error: String(e.message || e) }));

  for (const id of todo) {
    page.__frameId = id;
    const url = urlFor(registry[id]);
    const row = { id, url };
    try {
      await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
      await page.addStyleTag({ content: FREEZE_CSS });
      await page.evaluate(async () => {
        await document.fonts.ready;
        // Two frames so layout settles after fonts swap in.
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      });
      await new Promise((r) => setTimeout(r, 120));
      // puppeteer returns a Uint8Array; pngjs wants a Buffer.
      const shot = Buffer.from(await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: W, height: H } }));
      writeFileSync(join(OUT_APP, `${id}.png`), shot);

      const ours = PNG.sync.read(shot);
      const theirs = PNG.sync.read(readFileSync(join(DESIGN, `${id}.png`)));
      const w = Math.min(ours.width, theirs.width);
      const h = Math.min(ours.height, theirs.height);
      const a = crop(ours, w, h);
      const b = crop(theirs, w, h);
      const diff = new PNG({ width: w, height: h });
      const px = pixelmatch(b.data, a.data, diff.data, w, h, { threshold: 0.1 });
      writeFileSync(join(OUT_DIFF, `${id}.png`), PNG.sync.write(diff));
      row.diffPixels = px;
      row.mismatch = +((px / (w * h)) * 100).toFixed(2);
      if (theirs.width !== W || theirs.height !== H) row.note = `design is ${theirs.width}×${theirs.height}`;
    } catch (e) {
      row.error = String(e.message || e);
    }
    results.push(row);
  }
  await browser.close();
}

function crop(png, w, h) {
  if (png.width === w && png.height === h) return png;
  const out = new PNG({ width: w, height: h });
  PNG.bitblt(png, out, 0, 0, w, h, 0, 0);
  return out;
}

// ── report ──────────────────────────────────────────────────────────────
const sorted = [...results].sort((x, y) => (y.mismatch ?? 101) - (x.mismatch ?? 101));
const report = {
  generatedAt: new Date().toISOString(),
  base: `${base}${APP_BASE}`,
  viewport: `${W}x${H}@1`,
  threshold: 0.1,
  frames: sorted,
  registered: Object.keys(registry).length,
  designFrames: designIds.length,
  unregistered,
  unknownIds: unknown,
  pageErrors: errors,
};
writeFileSync(REPORT, JSON.stringify(report, null, 2));

const pad = (s, n) => String(s).padEnd(n);
if (sorted.length) {
  console.log(`\n${pad("frame", 8)} ${pad("mismatch", 10)} url`);
  console.log(`${"-".repeat(8)} ${"-".repeat(10)} ${"-".repeat(40)}`);
  for (const r of sorted) {
    const m = r.error ? "ERROR" : `${r.mismatch.toFixed(2)}%`;
    console.log(`${pad(r.id, 8)} ${pad(m, 10)} ${r.url}${r.error ? `  ← ${r.error}` : ""}`);
  }
} else {
  console.log("\nNo registered frames to shoot" + (filters.length ? ` matching ${filters.join(", ")}` : "") + ".");
}
console.log(`\nregistered ${Object.keys(registry).length} · design frames ${designIds.length} · unregistered ${unregistered.length}`);
if (unregistered.length) console.log(`unregistered: ${unregistered.join(" ")}`);
if (unknown.length) console.log(`registry ids with no design PNG: ${unknown.join(" ")}`);
if (errors.length) console.log(`page errors: ${errors.length} (see .qa/report.json)`);
console.log(`report: ${REPORT}`);
