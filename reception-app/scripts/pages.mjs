#!/usr/bin/env node
// Static screenshots of every page (desktop 1440 × 900 and the phone frame),
// plus a request opened, into .qa/pages/.
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, ".qa", "pages");
mkdirSync(OUT, { recursive: true });
const base = process.argv[2] || "http://localhost:5180";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--hide-scrollbars", "--mute-audio"] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = [];
const PAGES = [["live", "/"], ["history", "/lich-su"], ["settings", "/cai-dat"], ["try", "/thu-bonia"], ["account", "/tai-khoan"], ["start", "/bat-dau"]];
for (const dev of ["dk", "ph"]) {
  const phone = dev === "ph";
  for (const [name, path] of PAGES) {
    const p = await b.newPage();
    p.on("pageerror", (e) => errs.push(`${dev} ${name}: ${e.message}`));
    await p.setViewport(phone ? { width: 600, height: 1100 } : { width: 1440, height: 900 });
    await p.evaluateOnNewDocument((ph) => { sessionStorage.setItem("tt3.demo", JSON.stringify(ph)); sessionStorage.setItem("tt3.frame", JSON.stringify(ph ? "p390" : "")); localStorage.removeItem("tt3.settings"); }, phone);
    await p.goto(`${base}/reception/app${path}`, { waitUntil: "networkidle0" });
    await p.evaluate(() => document.fonts.ready);
    await sleep(900);
    const clip = phone ? await p.evaluate(() => { const r = document.querySelector(".tt-phone").getBoundingClientRect(); return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height }; }) : { x: 0, y: 0, width: 1440, height: 900 };
    // desktop: plain capture (a clipped capture resizes the page and restarts fades)
    const shoot = (file) => (phone ? p.screenshot({ path: file, clip }) : p.screenshot({ path: file }));
    await shoot(join(OUT, `${dev}_${name}.png`));
    if (name === "history" || name === "live") {
      await p.evaluate(() => { const el = [...document.querySelectorAll('[role="button"]')].find((e) => e.textContent.includes("chị Hương")); el && el.click(); });
      await sleep(900);
      await shoot(join(OUT, `${dev}_${name}_open.png`));
    }
    await p.close();
  }
}
await b.close();
console.log(errs.join("\n") || "no errors");
