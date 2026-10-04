#!/usr/bin/env node
// Cài đặt edits + the Thử Bonia fix loop (desktop and phone frame).
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, ".qa", "flow");
mkdirSync(OUT, { recursive: true });
const base = process.argv[2] || "http://localhost:5180";
const b = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--hide-scrollbars", "--mute-audio"] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = [];
const btn = (p, t) => p.evaluate((t) => { const el = [...document.querySelectorAll("button,a")].find((e) => e.getBoundingClientRect().width > 0 && e.textContent.trim().startsWith(t)); if (el) el.click(); return !!el; }, t).then((ok) => { if (!ok) log.push(`miss ${t}`); });

for (const dev of ["dk", "ph"]) {
  const phone = dev === "ph";
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  p.on("pageerror", (e) => log.push(`${dev}: ${e.message}`));
  await p.setViewport(phone ? { width: 600, height: 1100 } : { width: 1440, height: 952 });
  await p.evaluateOnNewDocument((ph) => { sessionStorage.setItem("tt3.demo", "true"); sessionStorage.setItem("tt3.frame", JSON.stringify(ph ? "p390" : "")); }, phone);
  const shot = async (name) => {
    if (phone) {
      const clip = await p.evaluate(() => { const r = document.querySelector(".tt-phone").getBoundingClientRect(); return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height }; });
      await p.screenshot({ path: join(OUT, `${dev}_${name}.png`), clip });
    } else await p.screenshot({ path: join(OUT, `${dev}_${name}.png`) });
  };
  await p.goto(`${base}/reception/app/cai-dat`, { waitUntil: "networkidle0" });
  await p.evaluate(() => localStorage.removeItem("tt3.settings"));
  await p.reload({ waitUntil: "networkidle0" });
  await sleep(500);
  // type into the address field
  await p.click('[data-f="address"] input', { clickCount: 3 });
  await p.keyboard.type("18/4 Võ Hữu Lân, phường Xuân Hòa, TP.HCM");
  await sleep(500);
  await shot("set_dirty");
  log.push(`${dev} focus kept: ${await p.evaluate(() => document.activeElement?.tagName + " " + (document.activeElement?.value || "").slice(0, 12))}`);
  await btn(p, "13:00");
  await btn(p, "Tới mục tiếp theo") || null;
  if (phone) await btn(p, "Mục tiếp");
  await sleep(900);
  await shot("set_next");
  await btn(p, "Lưu");
  await sleep(600);
  await p.evaluate(() => { history.pushState({}, "", "/reception/app/tai-khoan"); dispatchEvent(new PopStateEvent("popstate")); });
  await sleep(1200);
  await shot("set_account");
  // Thử Bonia: ask about parking, fix the answer, call again
  await p.evaluate(() => { history.pushState({}, "", "/reception/app/thu-bonia"); dispatchEvent(new PopStateEvent("popstate")); });
  await sleep(600);
  await btn(p, "Giọng 3");
  await btn(p, "▶ Bắt đầu gọi thử");
  await sleep(3500);
  await p.type('input[placeholder="Gõ câu của khách…"]', "Em ơi khách sạn có chỗ đậu ô tô không em?");
  await p.keyboard.press("Enter");
  await sleep(6000);
  await shot("try_live");
  await btn(p, "Kết thúc cuộc gọi");
  await sleep(900);
  await shot("try_done");
  await p.evaluate(() => { const els = [...document.querySelectorAll("button")].filter((e) => e.textContent.trim() === "Sửa" && e.getBoundingClientRect().width > 0); els[els.length - 1]?.click(); });
  await sleep(400);
  await p.evaluate(() => { const ts = [...document.querySelectorAll("textarea")]; ts[ts.length - 1].focus(); });
  await p.keyboard.type("Dạ ô tô vào tới cửa ạ, bên em không thu phí gửi ô tô cho khách ở.");
  await btn(p, "Lưu");
  await sleep(600);
  await shot("try_fixed");
  await btn(p, "Gọi lại thử");
  await sleep(1500);
  await p.type('input[placeholder="Gõ câu của khách…"]', "Em ơi khách sạn có chỗ đậu ô tô không em?");
  await p.keyboard.press("Enter");
  await sleep(8000);
  await shot("try_again");
  log.push(`${dev} extra: ${await p.evaluate(() => JSON.parse(localStorage.getItem("tt3.settings")).f.extra)}`);
  log.push(`${dev} voice saved: ${await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("tt3.settings")); return s.f.voice + " / saved " + JSON.parse(s.saved).f.voice; })}`);
  await ctx.close();
}
await b.close();
console.log(log.join("\n"));
