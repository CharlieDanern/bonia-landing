#!/usr/bin/env node
/**
 * Visual QA against Claude Design handoff 13: render the same state in the
 * design prototype and in the app, at desktop (1440 × 900) and phone
 * (390 × 844), and pixel-diff them. The orb canvas is hidden on both sides
 * (it animates) and transitions are frozen.
 *
 *   node scripts/shoot.mjs --design http://localhost:5192 [--base http://localhost:5180] [filter...]
 *
 * The design folder (design_handoff_bonia_tiep_tan_v3) must be served at
 * --design, e.g. `python3 -m http.server 5192` inside it.
 * Writes .qa/v3/<case>-{design,app,diff}.png and prints mismatch per case.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, ".qa", "v3");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
mkdirSync(OUT, { recursive: true });

const args = process.argv.slice(2);
let base = "http://localhost:5180";
let design = "http://localhost:5192";
const filters = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--base") base = args[++i];
  else if (args[i] === "--design") design = args[++i];
  else filters.push(args[i]);
}

const FREEZE = `*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important} canvas{visibility:hidden!important}`;
const START = ["Đường dẫn kinh doanh", "Đăng nhập", "Nhập mã", "Không nhận được mã", "Số chưa có tài khoản", "Lĩnh vực", "Hộp hỏi", "Xem lại · thử", "Bắt đầu nghe máy", "Xong"];
const START_PATH = ["/start/VNPT-HCM-0123", "/bat-dau", "/bat-dau/nhap-ma", "/bat-dau/khong-nhan-ma", "/bat-dau/chua-co-tai-khoan", "/bat-dau/linh-vuc", "/bat-dau/tim", "/bat-dau/gan-xong", "/bat-dau/bat-dau-nghe-may", "/bat-dau/xong"];

// [name, design file, design actions, app path]
const CASES = [
  ["live", "Bonia Truc Tiep v3", [], "/"],
  ["history", "Bonia Lich Su v3", [], "/lich-su"],
  ["settings", "Bonia Cai Dat v3", [], "/cai-dat"],
  ["try", "Bonia Thu Bonia v3", [], "/thu-bonia"],
  ...START.map((label, i) => [`start-${i}`, "Bonia Bat Dau v3", [["button", label]], START_PATH[i]]),
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--hide-scrollbars", "--mute-audio"] });

async function clickButton(page, text) {
  await page.evaluate((t) => {
    const el = [...document.querySelectorAll("button")].find((b) => b.getBoundingClientRect().width > 0 && b.textContent.trim() === t);
    if (el) el.click();
  }, text);
}

async function shootDesign(file, device, actions) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 1200 });
  await page.evaluateOnNewDocument((dev) => {
    localStorage.setItem("tt3.view", JSON.stringify({ device: dev }));
    localStorage.removeItem("tt3.settings");
  }, device === "phone" ? "p390" : "desk");
  await page.goto(`${design}/${encodeURIComponent(file)}.dc.html`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: FREEZE });
  for (const [, label] of actions) await clickButton(page, label);
  await new Promise((r) => setTimeout(r, 700));
  const box = await page.evaluate((phone) => {
    const want = phone ? [390, 844] : [1440, 900];
    const el = [...document.querySelectorAll("div")].find((d) => {
      const r = d.getBoundingClientRect();
      return Math.abs(r.width - want[0]) < 1 && Math.abs(r.height - want[1]) < 1;
    });
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y + window.scrollY, width: want[0], height: want[1] };
  }, device === "phone");
  const png = await page.screenshot({ clip: box, captureBeyondViewport: true });
  await page.close();
  return png;
}

async function shootApp(path, device) {
  const page = await browser.newPage();
  const phone = device === "phone";
  await page.setViewport(phone ? { width: 600, height: 1100 } : { width: 1440, height: 900 });
  await page.evaluateOnNewDocument((ph) => {
    sessionStorage.setItem("tt3.demo", JSON.stringify(ph));
    sessionStorage.setItem("tt3.frame", JSON.stringify(ph ? "p390" : ""));
    localStorage.removeItem("tt3.settings");
  }, phone);
  await page.goto(`${base}/reception/app${path}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: FREEZE });
  await new Promise((r) => setTimeout(r, 900));
  let clip = { x: 0, y: 0, width: 1440, height: 900 };
  if (phone) {
    clip = await page.evaluate(() => {
      const r = document.querySelector(".tt-phone").getBoundingClientRect();
      return { x: r.x, y: r.y + window.scrollY, width: 390, height: 844 };
    });
  }
  const png = await page.screenshot({ clip, captureBeyondViewport: true });
  await page.close();
  return png;
}

const rows = [];
for (const [name, file, actions, path] of CASES) {
  for (const device of ["desk", "phone"]) {
    const id = `${name}-${device}`;
    if (filters.length && !filters.some((f) => id.includes(f))) continue;
    try {
      const a = PNG.sync.read(Buffer.from(await shootDesign(file, device, actions)));
      const b = PNG.sync.read(Buffer.from(await shootApp(path, device)));
      const { width, height } = a;
      const diff = new PNG({ width, height });
      const n = pixelmatch(a.data, b.data, diff.data, width, height, { threshold: 0.1 });
      writeFileSync(join(OUT, `${id}-design.png`), PNG.sync.write(a));
      writeFileSync(join(OUT, `${id}-app.png`), PNG.sync.write(b));
      writeFileSync(join(OUT, `${id}-diff.png`), PNG.sync.write(diff));
      rows.push([id, ((n / (width * height)) * 100).toFixed(2)]);
    } catch (e) {
      rows.push([id, `ERR ${e.message.slice(0, 80)}`]);
    }
  }
}
await browser.close();
rows.sort((x, y) => parseFloat(y[1]) - parseFloat(x[1]));
for (const [id, pct] of rows) console.log(`${pct.padStart(7)}%  ${id}`);
