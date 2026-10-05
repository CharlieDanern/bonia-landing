import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { isDemo } from "./demo.js";
import { Link } from "wouter";
import { BONIA_MARK } from "./lib/assets.js";
import { useApp } from "./state.jsx";
import { flat } from "./data/settings.js";

// Phone first (brief v3 §2): below 1024 px the app uses the phone layout
// (bottom tabs, sheets from below); from 1024 px the desktop layout of
// handoff 13 direction D. Demo mode (?demo=1, kept for the browser session)
// adds the strip of call simulations and a phone frame for laptop demos.

const Layout = createContext(null);
export const useLayout = () => useContext(Layout);

const PHONE_QUERY = "(max-width: 1023px)";

function readSession(key, fallback) {
  try {
    const v = sessionStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
function writeSession(key, v) {
  try {
    sessionStorage.setItem(key, JSON.stringify(v));
  } catch {
    // private mode: the choice lasts until reload
  }
}

const initialDemo = isDemo;

function useMedia(query) {
  const [m, setM] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return m;
}

export function LayoutProvider({ children }) {
  const [demo] = useState(initialDemo);
  const [frame, setFrameState] = useState(() => (demo ? readSession("tt3.frame", "") : ""));
  const [reduce, setReduceState] = useState(() => readSession("tt3.reduce", false));
  const narrow = useMedia(PHONE_QUERY);
  const setFrame = (f) => {
    setFrameState(f);
    writeSession("tt3.frame", f);
  };
  const setReduce = (r) => {
    setReduceState(r);
    writeSession("tt3.reduce", r);
  };
  const phone = frame ? true : narrow;
  const value = { demo, frame, setFrame, phone, reduce, setReduce, device: phone ? "iPhone quầy" : "Máy tính quầy" };
  return <Layout.Provider value={value}>{children}</Layout.Provider>;
}

/** The app surface: the whole window, or a 390/360 × 844 phone in demo mode. */
export function AppFrame({ children }) {
  const { demo, frame } = useLayout();
  const vp = (
    <div className={`tt-vp${frame ? " tt-vp-frame" : ""}`}>
      {frame && (
        <div className="tt-status">
          <span>9:41</span>
          <span className="tt-status-r">●●● 5G ▮</span>
        </div>
      )}
      {children}
    </div>
  );
  return (
    <div className={`tt-page${frame ? " tt-page-frame" : ""}`}>
      {demo && <DemoStrip />}
      {frame ? (
        <div className="tt-phone" style={{ width: frame === "p360" ? 360 : 390 }}>
          {vp}
        </div>
      ) : (
        vp
      )}
    </div>
  );
}

function DemoStrip() {
  const { frame, setFrame, reduce, setReduce } = useLayout();
  const app = useApp();
  const dev = [["p390", "Điện thoại 390"], ["p360", "Điện thoại 360"], ["", "Máy tính"]];
  return (
    <div className="tt-demo">
      <span className="tt-demo-label">BẢN DEMO</span>
      <div className="tt-demo-seg">
        {dev.map(([k, l]) => (
          <button key={l} type="button" className={frame === k ? "on" : ""} onClick={() => setFrame(k)}>{l}</button>
        ))}
      </div>
      <span className="tt-demo-sep" />
      <button type="button" className="tt-demo-btn primary" onClick={() => app.startCall("booking")}>▶ Cuộc gọi đặt phòng</button>
      <button type="button" className="tt-demo-btn urgent" onClick={() => app.startCall("urgent")}>Cuộc gọi gấp</button>
      <button type="button" className="tt-demo-btn" onClick={() => { app.startCall("booking"); app.later(() => app.startCall("urgent"), 12000); }}>Hai cuộc gọi cùng lúc</button>
      <button type="button" className="tt-demo-btn" onClick={app.toggleOffline}>{app.offline ? "Bỏ Offline" : "Offline"}</button>
      <button type="button" className="tt-demo-btn muted" onClick={app.resetDemo}>Đặt lại</button>
      <label className="tt-demo-btn muted" style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }} title="Nạp hồ sơ từ tệp kết quả tìm bằng AI (scripts/hotel-import.ts)">
        Nạp hồ sơ…
        <input
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              if (!app.loadProfile(JSON.parse(await file.text()))) window.alert("Tệp không đúng dạng hồ sơ.");
            } catch {
              window.alert("Không đọc được tệp.");
            }
          }}
        />
      </label>
      <button type="button" className="tt-demo-btn muted" onClick={app.resetAll}>Hồ sơ mẫu</button>
      <span style={{ flex: 1 }} />
      <button type="button" className="tt-demo-toggle" onClick={() => setReduce(!reduce)}>
        Giảm chuyển động
        <Switch on={reduce} />
      </button>
    </div>
  );
}

export const TABS = [["Trực tiếp", "/"], ["Lịch sử", "/lich-su"], ["Cài đặt", "/cai-dat"], ["Thử Bonia", "/thu-bonia"], ["Tài khoản", "/tai-khoan"]];
const ACCOUNT_TAB = 4;

export function DeskHeader({ active, right = null, solid = false }) {
  const { unpaid, settings } = useApp();
  const name = flat(settings).name || "Khách sạn";
  return (
    <header className={`tt-head${solid ? " solid" : ""}`}>
      <div className="tt-head-brand">
        <img src={BONIA_MARK} alt="Bonia" />
        <span className="tt-mono-label">TIẾP TÂN</span>
        <span className="tt-head-name">{name}</span>
      </div>
      <nav className="tt-head-nav">
        {TABS.map(([l, href], i) => (
          <Link key={href} href={href} className={i === active ? "on" : ""}>
            {l}
            {i === ACCOUNT_TAB && unpaid && <span className="tt-dot" aria-label="Chưa thanh toán" />}
          </Link>
        ))}
      </nav>
      <div className="tt-head-right">{right}</div>
    </header>
  );
}

export function PhoneTabs({ active }) {
  const { unpaid } = useApp();
  return (
    <nav className="tt-tabs">
      {TABS.map(([l, href], i) => (
        <Link key={href} href={href} className={i === active ? "on" : ""}>
          <span className="bar" />
          {l}
          {i === ACCOUNT_TAB && unpaid && <span className="tt-dot" aria-label="Chưa thanh toán" />}
        </Link>
      ))}
    </nav>
  );
}

export function Switch({ on }) {
  return (
    <span className="tt-switch" style={{ background: on ? "#7B4A2D" : "#D9D0BF" }}>
      <span style={{ left: on ? 17 : 3 }} />
    </span>
  );
}

/** Width of the app surface, for the desktop orb (fits between the columns). */
export function useWidth(ref) {
  const [w, setW] = useState(1440);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

export function useRefWidth() {
  const ref = useRef(null);
  const w = useWidth(ref);
  return [ref, w];
}
