#!/usr/bin/env node
// Cài đặt: full-page captures of every section (desktop + phone frame) plus an
// edit / conflict / room / list check, into .qa/settings/.
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, ".qa", "settings");
mkdirSync(OUT, { recursive: true });
const base = process.argv[2] || "http://localhost:5180";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--hide-scrollbars", "--mute-audio"] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
for (const phone of [false, true]) {
  const dev = phone ? "ph" : "dk";
  const p = await b.newPage();
  p.on("pageerror", (e) => log.push(`${dev}: ${e.message}`));
  await p.setViewport(phone ? { width: 600, height: 1100 } : { width: 1440, height: 900 });
  await p.evaluateOnNewDocument((ph) => { sessionStorage.setItem("tt3.demo", JSON.stringify(ph)); sessionStorage.setItem("tt3.frame", JSON.stringify(ph ? "p390" : "")); localStorage.removeItem("tt4.settings"); }, phone);
  await p.goto(`${base}/reception/app/cai-dat`, { waitUntil: "networkidle0" });
  await sleep(800);
  // scroll the settings pane section by section
  const n = await p.evaluate(() => document.querySelectorAll("[data-sec]").length);
  for (let i = 0; i < n; i++) {
    await p.evaluate((i) => { const el = document.querySelectorAll("[data-sec]")[i]; const sc = el.closest('[style*="overflow: auto"]'); sc.scrollTop = el.offsetTop - 10; }, i);
    await sleep(250);
    if (phone) {
      const clip = await p.evaluate(() => { const r = document.querySelector(".tt-phone").getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
      await p.screenshot({ path: join(OUT, `${dev}_s${i + 1}.png`), clip });
    } else await p.screenshot({ path: join(OUT, `${dev}_s${i + 1}.png`) });
  }
  // interactions: pick a conflict tile, add a tag, add a list row, open a room
  await p.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("14:00") && x.textContent.includes("Booking")); b && b.click(); });
  await p.evaluate(() => { const i = document.querySelector('[data-f="aliases"] input'); i.focus(); });
  await p.keyboard.type("Sân Nhài Hotel"); await p.keyboard.press("Enter");
  const state = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("tt4.settings")); return { checkin: s.values.checkin, aliases: s.values.aliases.v, focus: document.activeElement?.placeholder }; });
  log.push(`${dev} after edits: ${JSON.stringify(state)}`);
  await p.evaluate(() => { const b = [...document.querySelectorAll('[data-f^="room:"] > button')][2]; b && b.click(); });
  await sleep(500);
  await p.evaluate(() => { const el = document.querySelector('[data-f="room:2"]'); const sc = el.closest('[style*="overflow: auto"]'); sc.scrollTop = el.offsetTop - 10; });
  await sleep(300);
  if (phone) {
    const clip = await p.evaluate(() => { const r = document.querySelector(".tt-phone").getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
    await p.screenshot({ path: join(OUT, `${dev}_room.png`), clip });
  } else await p.screenshot({ path: join(OUT, `${dev}_room.png`) });
  await p.close();
}
await b.close();
console.log(log.join("\n") || "no errors");
