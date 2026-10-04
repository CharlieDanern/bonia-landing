import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Orb } from "../components/Orb.jsx";
import { StoreQR } from "../components/StoreQR.jsx";
import { SECTORS } from "../data/sectors.js";
import { BONIA_MARK } from "../lib/assets.js";
import { useLayout } from "../layout.jsx";
import { useApp } from "../state.jsx";

// Bắt đầu (handoff 13 + brief v3 §3): the phone app does sign-up, forwarding
// and the test call; the web then logs in with a code sent to the app, picks
// the sector, lets Bonia search the internet, reviews (Cài đặt), tries Bonia,
// and finally switches the number to Bonia Tiếp tân with an explicit step.
// Sample flow: any 6-digit code works; 0900 000 999 shows "no account".

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Source Serif 4', Georgia, serif";

export const STEPS = {
  "": "login", "nhap-ma": "code", "khong-nhan-ma": "nocode", "chua-co-tai-khoan": "noacct", "cai-ung-dung": "sales",
  "linh-vuc": "sector", tim: "ask", "dang-tim": "searching", "gan-xong": "hub", "bat-dau-nghe-may": "golive", xong: "live",
};
const PATH = Object.fromEntries(Object.entries(STEPS).map(([p, s]) => [s, p ? `/bat-dau/${p}` : "/bat-dau"]));

const SOURCES = [["Google Maps", 14, "✓ ĐÃ ĐỌC"], ["Booking.com", 12, "✓ ĐÃ ĐỌC"], ["Agoda", 6, "✓ ĐÃ ĐỌC"], ["Trang web khách sạn", 7, "✓ ĐÃ ĐỌC"], ["Facebook", 2, "✓ ĐÃ ĐỌC"], ["Traveloka", 0, "— KHÔNG TÌM THẤY"]];

function session(key, v) {
  try {
    if (v === undefined) return JSON.parse(sessionStorage.getItem(key) || "null");
    sessionStorage.setItem(key, JSON.stringify(v));
  } catch {
    // private mode
  }
  return null;
}

/** /start/VNPT-HCM-0123: a salesperson's link. Remembers the referral, opens step 1. */
export function StartLink({ code }) {
  const [, navigate] = useLocation();
  useEffect(() => {
    const [via, ...rest] = String(code || "").split("-");
    session("tt3.ref", { via, code: rest.join("-") });
    navigate(PATH.sales, { replace: true });
  }, [code, navigate]);
  return null;
}

export function Start({ step: slug = "" }) {
  const app = useApp();
  const { phone } = useLayout();
  const [, navigate] = useLocation();
  const step = STEPS[slug] || "login";
  const go = (s) => navigate(PATH[s]);
  const [tel, setTel] = useState(() => session("tt3.phone") || "0900 000 300");
  const [code, setCode] = useState("");
  const [srcN, setSrcN] = useState(0);
  const iv = useRef(null);
  const ref = session("tt3.ref");
  const progress = session("tt3.setup") || {};

  useEffect(() => {
    clearInterval(iv.current);
    if (step === "searching") {
      setSrcN(0);
      iv.current = setInterval(() => setSrcN((n) => {
        if (n + 1 >= SOURCES.length + 1) clearInterval(iv.current);
        return n + 1;
      }), 900);
    }
    if (step === "code") setCode("");
    return () => clearInterval(iv.current);
  }, [step]);

  // Headings as in the frames: login/code/nocode sit at 1.15 (login also -0.01em), the rest at 1.2.
  const tight = ["login", "code", "nocode"].includes(step);
  const h1 = { margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: phone ? 24 : 28, lineHeight: tight ? 1.15 : 1.2, letterSpacing: step === "login" ? "-0.01em" : undefined };
  const primary = (h = 44, fs = 14) => ({ height: h, borderRadius: h / 2, fontSize: fs, textAlign: "center", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" });
  const steps = (list) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {list.map((t, i) => (
        <div key={t} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: 8, fontSize: 13.5, lineHeight: 1.5 }}>
          <span style={{ fontFamily: MONO, color: "#7B4A2D" }}>{i + 1}</span>
          <span>{t}</span>
        </div>
      ))}
    </div>
  );

  let body = null;
  if (step === "login") {
    body = (
      <>
        <h1 style={h1}>Đăng nhập</h1>
        <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 13, color: "#4A4239" }}>Số điện thoại đã cài Bonia</span>
          <input value={tel} onChange={(e) => setTel(e.target.value)} inputMode="tel" autoComplete="tel" style={{ height: 46, border: "1px solid #D9D0BF", borderRadius: 10, padding: "0 14px", fontFamily: MONO, fontSize: 17, background: "#fff", color: "#1F1B16" }} />
        </label>
        <button type="button" className="b-primary" onClick={() => { session("tt3.phone", tel); go(tel.replace(/\s/g, "") === "0900000999" ? "noacct" : "code"); }} style={primary(46, 14.5)}>Gửi mã tới ứng dụng Bonia</button>
        <span style={{ fontSize: 13, color: "#6E6255", textAlign: "center" }}>Chưa có ứng dụng Bonia? <Link href={PATH.noacct}>Cài ứng dụng</Link></span>
      </>
    );
  } else if (step === "code") {
    body = (
      <>
        <h1 style={h1}>Nhập mã</h1>
        <span style={{ fontSize: 13.5, lineHeight: 1.55, color: "#4A4239" }}>Mã đã gửi tới ứng dụng Bonia trên số <span style={{ fontFamily: MONO, color: "#1F1B16" }}>{tel}</span>.</span>
        {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
        <input
          value={code}
          autoFocus
          onChange={(e) => {
            const c = e.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(c);
            if (c.length === 6) setTimeout(() => go("sector"), 350);
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="••••••"
          style={{ height: 56, border: "2px solid #7B4A2D", borderRadius: 10, padding: "0 14px", fontFamily: MONO, fontSize: 24, letterSpacing: "0.5em", textAlign: "center", background: "#fff", color: "#1F1B16" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 14 }}>
          <button type="button" onClick={() => go("nocode")} style={{ minHeight: 44, color: "#7B4A2D", fontSize: 14 }}>Không nhận được mã?</button>
          <span style={{ fontFamily: MONO, fontSize: 13, color: "#6E6255", alignSelf: "center" }}>Gửi lại sau 0:45</span>
        </div>
      </>
    );
  } else if (step === "nocode") {
    body = (
      <>
        <h1 style={h1}>Không nhận được mã?</h1>
        {steps(["Mở ứng dụng Bonia trên điện thoại có số này.", "Mã nằm trong thông báo mới nhất, hoặc ở mục Thông báo trong ứng dụng.", "Chưa có ứng dụng? Cài Bonia rồi đăng ký bằng số này trước."])}
        <div style={{ padding: 14, borderRadius: 14, background: "#fff", border: "1px solid #D9D0BF", display: "flex", gap: 12, alignItems: "center" }}>
          <img src={BONIA_MARK} alt="" style={{ height: 30, width: "auto" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Bonia · bây giờ</span>
            <span style={{ fontSize: 13.5, color: "#4A4239" }}>Mã đăng nhập Bonia Tiếp tân: <span style={{ fontFamily: MONO, color: "#1F1B16" }}>482 913</span></span>
          </div>
        </div>
        <button type="button" className="b-primary" onClick={() => go("code")} style={primary()}>Gửi lại mã</button>
      </>
    );
  } else if (step === "noacct") {
    body = (
      <>
        <h1 style={h1}>Số này chưa dùng Bonia.</h1>
        <span style={{ fontSize: 13.5, lineHeight: 1.55, color: "#4A4239" }}>Cài ứng dụng Bonia trên điện thoại này trước.</span>
        <StoreQR />
        <button type="button" className="b-primary" onClick={() => go("login")} style={primary()}>Tôi đã cài xong</button>
      </>
    );
  } else if (step === "sales") {
    body = (
      <>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", color: "#6E6255" }}>BƯỚC 1 / 2</span>
        <h1 style={h1}>Cài Bonia trên điện thoại quầy</h1>
        {steps(["Quét mã bằng điện thoại quầy để cài Bonia.", "Đăng ký bằng số điện thoại quầy.", "Chọn nhà mạng, cài chuyển cuộc gọi.", "Gọi thử trong ứng dụng."])}
        <StoreQR />
        <button type="button" className="b-primary" onClick={() => go("login")} style={primary()}>Tôi đã cài xong</button>
      </>
    );
  } else if (step === "sector") {
    body = (
      <>
        <h1 style={h1}>Bonia nghe máy cho</h1>
        <div role="radiogroup" aria-label="Lĩnh vực" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {SECTORS.map((s) => (
            <button
              key={s.key}
              type="button"
              role="radio"
              aria-checked={s.ready}
              disabled={!s.ready}
              style={{ minHeight: 64, padding: "12px 14px", border: s.ready ? "2px solid #7B4A2D" : "1px solid #E4DCCB", borderRadius: 12, background: s.ready ? "#FBF5EC" : "#F7F3EC", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: 4, cursor: s.ready ? "pointer" : "default", textAlign: "left" }}
            >
              <span style={{ fontSize: 14.5, fontWeight: 600, color: s.ready ? "#1F1B16" : "#6E6255" }}>{s.label}</span>
              <span style={{ fontSize: 12.5, color: "#6E6255" }}>{s.desc}</span>
            </button>
          ))}
        </div>
        <button type="button" className="b-primary" onClick={() => go("ask")} style={primary()}>Tiếp tục</button>
      </>
    );
  } else if (step === "ask") {
    const field = (l, v) => (
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 13, color: "#4A4239" }}>{l}</span>
        <input defaultValue={v} style={{ height: 44, border: "1px solid #D9D0BF", borderRadius: 10, padding: "0 12px", fontSize: 14.5, background: "#fff" }} />
      </label>
    );
    body = (
      <>
        <h1 style={h1}>Để Bonia tự tìm thông tin khách sạn của bạn trên mạng?</h1>
        {field("Tên khách sạn", "Khách sạn Sân Nhài")}
        {field("Khu vực", "Phường Xuân Hòa, TP.HCM")}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button type="button" className="b-primary" onClick={() => go("searching")} style={primary(46, 14.5)}>Có, tìm giúp tôi</button>
          <button type="button" className="b-ghost" onClick={() => go("hub")} style={primary(44, 14)}>Tôi tự điền</button>
        </div>
      </>
    );
  } else if (step === "searching") {
    const found = SOURCES.slice(0, Math.min(srcN, SOURCES.length)).reduce((a, x) => a + x[1], 0);
    body = (
      <>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ fontFamily: SERIF, fontSize: phone ? 72 : 88, lineHeight: 1, color: "#7B4A2D" }}>{found}</span>
          <span style={{ fontSize: 15, color: "#4A4239" }}>thông tin tìm được</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {SOURCES.map(([l, n, s], i) => {
            const done = srcN > i;
            const cur = srcN === i;
            return (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, minHeight: 40, borderTop: "1px solid #E4DCCB", opacity: done || cur ? 1 : 0.45, transition: "opacity 400ms ease" }}>
                <span style={{ fontSize: 13.5 }}>{l}</span>
                <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.12em", color: done ? (n ? "#4A6B3A" : "#6E6255") : cur ? "#7B4A2D" : "#6E6255", whiteSpace: "nowrap" }}>{done ? s : cur ? "ĐANG ĐỌC…" : "CHỜ"}</span>
              </div>
            );
          })}
        </div>
        {srcN > SOURCES.length && <button type="button" className="b-primary" onClick={() => go("hub")} style={primary(46, 14.5)}>Xem lại thông tin</button>}
      </>
    );
  } else if (step === "hub") {
    const items = [
      { done: !!progress.reviewed, l: "Xem lại thông tin", sub: progress.reviewed ? "Đã xem lại" : "Còn 12 mục cần xem lại", href: "/cai-dat?xem-lai=1", mark: "reviewed" },
      { done: !!progress.tested, l: "Thử Bonia", sub: progress.tested ? "Đã gọi thử" : "Gọi như một khách thật, sửa chỗ chưa đúng", href: "/thu-bonia", mark: "tested" },
      { done: false, l: "Bắt đầu nghe máy", sub: "Bonia nghe máy cho khách sạn", href: PATH.golive },
    ];
    body = (
      <>
        <h1 style={h1}>Gần xong</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((h, i) => (
            <Link
              key={h.l}
              href={h.href}
              onClick={() => h.mark && session("tt3.setup", { ...progress, [h.mark]: true })}
              style={{ display: "grid", gridTemplateColumns: "28px minmax(0,1fr) auto", gap: 12, alignItems: "center", minHeight: 56, padding: "10px 12px", borderRadius: 12, border: "1px solid #D9D0BF", background: "#fff", color: "#1F1B16" }}
            >
              <span style={{ width: 28, height: 28, borderRadius: 14, border: `1px solid ${h.done ? "#4A6B3A" : "#7B4A2D"}`, background: h.done ? "#EEF0E6" : "#fff", color: h.done ? "#4A6B3A" : "#7B4A2D", fontFamily: MONO, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{h.done ? "✓" : i + 1}</span>
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{h.l}</span>
                <span style={{ fontSize: 12, color: h.done ? "#4A6B3A" : "#6E6255" }}>{h.sub}</span>
              </span>
              <span style={{ color: "#7B4A2D", fontSize: 16 }}>→</span>
            </Link>
          ))}
        </div>
      </>
    );
  } else if (step === "golive") {
    body = (
      <>
        <div style={{ display: "flex", justifyContent: "center" }}><Orb size={180} mood="idle" tone="warm" /></div>
        <span style={{ fontSize: phone ? 14.5 : 15, lineHeight: 1.55, textWrap: "pretty" }}>Từ giờ, khi bạn không bắt máy, Bonia nghe máy cho <b style={{ fontWeight: 600 }}>{app.settings.f.name}</b> và nói:</span>
        <div style={{ padding: "16px 18px", borderRadius: 14, background: "#FAF7F1", border: "1px solid #EFE9DD", fontFamily: SERIF, fontStyle: "italic", fontSize: 18, lineHeight: 1.45 }}>“{app.settings.f.greeting}”</div>
        <button type="button" className="b-primary" onClick={() => go("live")} style={primary(46, 14.5)}>Bắt đầu nghe máy</button>
        <button type="button" onClick={() => go("hub")} style={{ height: 44, fontSize: 14, color: "#4A4239", textAlign: "center" }}>Chưa, để sau</button>
      </>
    );
  } else if (step === "live") {
    body = (
      <>
        <div style={{ display: "flex", justifyContent: "center" }}><Orb size={200} mood="bonia" tone="green" lively pickup={1} /></div>
        <h1 style={{ ...h1, textAlign: "center" }}>Bonia đang nghe máy cho {app.settings.f.name}</h1>
        <Link href="/" className="b-primary" style={primary(46, 14.5)}>Vào Trực tiếp</Link>
      </>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: step === "live" ? "#EEF0E6" : "#F2EEE6", transition: "background-color 900ms ease", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: phone ? "var(--tt-top)" : 12, height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${phone ? 20 : 40}px` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={BONIA_MARK} alt="Bonia" style={{ height: 22, width: "auto" }} />
          <span className="tt-mono-label">TIẾP TÂN</span>
        </div>
        {ref?.code && <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", padding: "4px 8px", border: "1px solid #D9D0BF", borderRadius: 10, color: "#4A4239", whiteSpace: "nowrap" }}>{ref.via} · {ref.code}</span>}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: phone ? "calc(var(--tt-top) + 56px)" : 68, bottom: 0, overflow: "auto", display: "flex", justifyContent: "center", alignItems: phone ? "flex-start" : "center", padding: phone ? "8px 20px 32px" : "24px 40px 60px" }}>
        <div style={{ width: "100%", maxWidth: phone ? 520 : 480, display: "flex", flexDirection: "column", gap: 14, padding: phone ? 0 : "28px 32px", background: phone ? "transparent" : "#FFFFFF", border: phone ? 0 : "1px solid #D9D0BF", borderRadius: 20, margin: phone ? 0 : "auto 0" }}>
          {body}
        </div>
      </div>
    </div>
  );
}
