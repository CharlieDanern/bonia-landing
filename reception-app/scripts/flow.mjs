#!/usr/bin/env node
// Drives the demo calls in the app (desktop + phone frame) and saves frames to
// .qa/flow/ for side-by-side review with the handoff 13 prototype.
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, ".qa", "flow");
mkdirSync(OUT, { recursive: true });
const base = process.argv[2] || "http://localhost:5180";
const only = process.argv[3] || "";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--hide-scrollbars"] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errors = [];

async function open(dev, path = "/") {
  const p = await b.newPage();
  p.on("pageerror", (e) => errors.push(`${dev} ${path}: ${e.message}`));
  p.on("console", (m) => { if (m.type() === "error") errors.push(`${dev} ${path}: ${m.text()}`); });
  const phone = dev === "ph";
  await p.setViewport(phone ? { width: 600, height: 1100 } : { width: 1440, height: 952 });
  await p.evaluateOnNewDocument((ph) => {
    sessionStorage.setItem("tt3.demo", "true");
    sessionStorage.setItem("tt3.frame", JSON.stringify(ph ? "p390" : ""));
    localStorage.removeItem("tt3.settings");
  }, phone);
  await p.goto(`${base}/reception/app${path}`, { waitUntil: "networkidle0" });
  await p.evaluate(() => document.fonts.ready);
  await sleep(400);
  return p;
}
const btn = (p, t) => p.evaluate((t) => { const el = [...document.querySelectorAll("button,a")].find((e) => e.getBoundingClientRect().width > 0 && e.textContent.trim().startsWith(t)); if (el) el.click(); return !!el; }, t).then((ok) => { if (!ok) errors.push(`miss ${t}`); });
const txt = (p, t) => p.evaluate((t) => { const el = [...document.querySelectorAll("span,div")].find((e) => e.children.length === 0 && e.textContent.trim() === t && e.getBoundingClientRect().width > 0); if (!el) return false; let c = el; while (c && !c.getAttribute("role") && c.tagName !== "BUTTON") c = c.parentElement; (c || el).click(); return true; }, t).then((ok) => { if (!ok) errors.push(`miss text ${t}`); });
async function shot(p, dev, name) {
  if (dev === "ph") {
    const clip = await p.evaluate(() => { const r = document.querySelector(".tt-phone").getBoundingClientRect(); return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height }; });
    await p.screenshot({ path: join(OUT, `${dev}_${name}.png`), clip });
  } else {
    await p.screenshot({ path: join(OUT, `${dev}_${name}.png`), clip: { x: 0, y: 52, width: 1440, height: 900 } });
  }
}

for (const dev of ["dk", "ph"]) {
  if (only && !only.includes(dev)) continue;
  let p = await open(dev);
  await shot(p, dev, "idle");
  await btn(p, "▶ Cuộc gọi đặt phòng");
  await sleep(10000); await shot(p, dev, "call10");
  if (dev === "ph") { await p.evaluate(() => document.querySelector('[aria-label="Kéo lên để xem lời thoại"]').click()); await sleep(900); await shot(p, dev, "call_expanded"); }
  await sleep(14000); await shot(p, dev, "call24");
  await btn(p, "Nghe máy"); await sleep(1500); await shot(p, dev, "ringing"); await sleep(2500); await shot(p, dev, "takeover");
  await sleep(9000); await shot(p, dev, "takeover_filed"); await p.close();

  p = await open(dev); await btn(p, "▶ Cuộc gọi đặt phòng"); await sleep(42200); await shot(p, dev, "summary"); await sleep(4000); await shot(p, dev, "filed"); await p.close();
  p = await open(dev); await btn(p, "Hai cuộc gọi"); await sleep(9000); await shot(p, dev, "two_a"); await sleep(15000); await shot(p, dev, "two_b"); await p.close();
  p = await open(dev); await btn(p, "Cuộc gọi gấp"); await sleep(8000); await shot(p, dev, "urgent"); await sleep(14000); await shot(p, dev, "urgent_filed"); await p.close();
  p = await open(dev); await btn(p, "Offline"); await sleep(1200); await shot(p, dev, "offline"); await p.close();
  p = await open(dev); await txt(p, "chị Hương"); await sleep(1000); await shot(p, dev, "detail"); await btn(p, "Đã xử lý"); await sleep(1200); await shot(p, dev, "detail_done"); await p.close();
}
await b.close();
console.log(errors.length ? errors.join("\n") : "no errors");
