import React, { useEffect, useRef, useState } from "react";
import { Orb } from "../components/Orb.jsx";
import { Bubble, RequestCard } from "../components/Request.jsx";
import { scriptReply } from "../test-call/scriptEngine.js";
import { DeskHeader, PhoneTabs, useLayout } from "../layout.jsx";
import { hm, useApp } from "../state.jsx";
import { Link } from "wouter";

// Thử Bonia (handoff 13): the owner calls Bonia from this device like a real
// guest, fixes any answer with "Sửa" (saved into Cài đặt · Thông tin khác) and
// calls again. Not billed. Speech in/out uses the browser for now; answers
// come from the demo engine (src/test-call/scriptEngine.js) until the test
// call runs on the real voice agent.

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Source Serif 4', Georgia, serif";
const EASE = "cubic-bezier(.2,.8,.2,1)";
const VI = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const VOICES = [[1.12, 1.02], [1.0, 1.0], [0.86, 0.98], [1.28, 1.06], [0.74, 0.95]]; // browser stand-ins for Giọng 1–5
const IDEAS = [
  ["Hỏi giá theo giờ", "Bên em có phòng theo giờ không, bao nhiêu vậy em?"],
  ["Hỏi chỗ đậu ô tô", "Em ơi khách sạn có chỗ đậu ô tô không em?"],
  ["Đặt phòng cuối tuần", "Cuối tuần này bên em còn phòng Deluxe không em, chị muốn đặt 2 đêm."],
  ["Khách nói tiếng Anh", "Hi, do you have a room for two tonight?"],
  ["Khách đang ở báo máy lạnh hư", "Em ơi phòng 302 nè, máy lạnh không chạy nữa rồi."],
  ["Hỏi số tài khoản", "Em cho chị xin số tài khoản để chị chuyển cọc nha."],
];

export function TryBonia() {
  const app = useApp();
  const { phone, reduce } = useLayout();
  const [st, setSt] = useState({ live: false, phase: "idle", turns: [], interim: "", out: null, err: "", t0: 0, level: 0, fixes: {} });
  const [now, setNow] = useState(Date.now());
  const [pickups, setPickups] = useState(0);
  const [draft, setDraft] = useState("");
  const [runs, setRuns] = useState([]);
  const [view, setView] = useState(null);
  const [fixAt, setFixAt] = useState(null);
  const [fixDraft, setFixDraft] = useState("");
  const S = useRef(st);
  S.current = st;
  const R = useRef({});
  const settingsRef = useRef(app.settings);
  settingsRef.current = app.settings;

  const patch = (p) => setSt((s) => ({ ...s, ...(typeof p === "function" ? p(s) : p) }));

  const teardown = () => {
    const r = R.current;
    clearInterval(r.tick);
    clearTimeout(r.safe);
    cancelAnimationFrame(r.raf);
    r.want = false;
    if (r.rec) {
      r.rec.onend = null;
      try { r.rec.abort(); } catch { /* already stopped */ }
      r.rec = null;
    }
    r.stream?.getTracks().forEach((t) => t.stop());
    r.stream = null;
    try { r.ac?.close(); } catch { /* closed */ }
    r.ac = null;
    try { window.speechSynthesis?.cancel(); } catch { /* none */ }
  };
  useEffect(() => teardown, []);

  const listen = (on) => {
    const r = R.current;
    r.want = on;
    if (!r.rec) return;
    try {
      if (on) r.rec.start();
      else r.rec.stop();
    } catch {
      // start() while running / stop() while stopped
    }
  };

  const say = (text, after) => {
    listen(false);
    patch((s) => ({ phase: "speaking", interim: "", turns: [...s.turns, { w: "B", text }] }));
    let fired = false;
    const done = () => {
      if (fired) return;
      fired = true;
      clearTimeout(R.current.safe);
      if (!S.current.live) return;
      if (after) after();
      else {
        patch({ phase: "listening" });
        listen(true);
      }
    };
    const ss = window.speechSynthesis;
    R.current.safe = setTimeout(done, 2500 + text.length * 110);
    if (!ss) {
      setTimeout(done, 700 + text.length * 55);
      return;
    }
    try {
      ss.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const en = !VI.test(text) && /[a-z]/i.test(text);
      const v = ss.getVoices().find((x) => x.lang?.toLowerCase().startsWith(en ? "en" : "vi"));
      if (v) u.voice = v;
      u.lang = en ? "en-US" : "vi-VN";
      const vv = VOICES[(settingsRef.current.f.voice || 1) - 1] || VOICES[0];
      u.pitch = vv[0];
      u.rate = vv[1];
      u.onend = done;
      u.onerror = done;
      ss.speak(u);
    } catch {
      setTimeout(done, 700 + text.length * 55);
    }
  };

  const finish = () => {
    if (R.current.ended) return;
    R.current.ended = true;
    const s = S.current;
    teardown();
    const g = s.turns.filter((t) => t.w === "K");
    const sec = Math.round((Date.now() - s.t0) / 1000);
    const run = { id: `r${Date.now()}`, at: hm(), turns: s.turns, out: s.out || {}, fixes: { ...s.fixes }, len: `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}` };
    patch({ live: false, phase: "idle", interim: "", level: 0 });
    if (g.length) {
      setRuns((rs) => [run, ...rs]);
      setView(run.id);
    } else setView(null);
  };

  const guest = (text) => {
    if (!text || !S.current.live || S.current.phase === "thinking") return;
    listen(false);
    setDraft("");
    patch((s) => ({ phase: "thinking", interim: "", turns: [...s.turns, { w: "K", text }] }));
    const history = S.current.turns;
    setTimeout(() => {
      if (!S.current.live) return;
      const out = scriptReply(settingsRef.current, history, text);
      patch((s) => ({ out: { ...(s.out || {}), ...out, understood: { ...((s.out || {}).understood || {}), ...(out.understood || {}) } } }));
      say(out.reply || "Dạ.", out.end ? () => setTimeout(finish, 500) : null);
    }, 650);
  };

  const meter = (stream) => {
    try {
      const A = window.AudioContext || window.webkitAudioContext;
      const ac = new A();
      R.current.ac = ac;
      const an = ac.createAnalyser();
      an.fftSize = 512;
      ac.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(512);
      let last = 0;
      const loop = () => {
        an.getByteTimeDomainData(buf);
        let s = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          s += v * v;
        }
        const rms = Math.sqrt(s / buf.length);
        const t = performance.now();
        if (t - last > 150) {
          last = t;
          if (Math.abs(rms - S.current.level) > 0.01) patch({ level: rms });
        }
        R.current.raf = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      // no Web Audio: the orb just doesn't follow the mic level
    }
  };

  const start = async (firstLine) => {
    if (S.current.live) return;
    R.current.ended = false;
    setView(null);
    setFixAt(null);
    setPickups((p) => p + 1);
    const t0 = Date.now();
    patch({ live: true, phase: "speaking", turns: [], interim: "", out: null, err: "", t0, fixes: {} });
    S.current = { ...S.current, live: true, turns: [], t0 };
    setNow(t0);
    R.current.tick = setInterval(() => setNow(Date.now()), 500);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    try {
      R.current.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      meter(R.current.stream);
    } catch {
      patch({ err: "Không mở được micro của máy này. Gõ câu của khách bên dưới." });
    }
    if (!SR) patch({ err: "Trình duyệt này chưa nghe được giọng nói. Gõ câu của khách bên dưới." });
    else if (R.current.stream) {
      const rec = new SR();
      rec.lang = "vi-VN";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        if (S.current.phase !== "listening") return;
        let interim = "";
        let fin = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) fin += t;
          else interim += t;
        }
        if (fin.trim()) {
          patch({ interim: "" });
          guest(fin.trim());
        } else patch({ interim });
      };
      rec.onend = () => {
        if (S.current.live && R.current.want) {
          try { rec.start(); } catch { /* restarting */ }
        }
      };
      R.current.rec = rec;
    }
    if (!S.current.live) return;
    say(settingsRef.current.f.greeting || "Dạ xin nghe ạ.", firstLine ? () => guest(firstLine) : null);
  };

  // ── view model ─────────────────────────────────────────────────────────
  const live = st.live;
  const run = view ? runs.find((r) => r.id === view) : null;
  const turns = live ? st.turns : run ? run.turns : [];
  const fixes = live ? st.fixes : run ? run.fixes : {};
  const out = live ? st.out : run ? run.out : null;
  const talking = st.phase === "listening" && (st.interim || st.level > 0.045);
  const mood = !live ? "idle" : st.phase === "speaking" ? "bonia" : st.phase === "thinking" ? "writing" : talking ? "guest" : "idle";
  const showPanel = live || !!run;
  const sec = Math.max(0, Math.floor((now - st.t0) / 1000));
  const phaseLabel = { speaking: "BONIA ĐANG NÓI", thinking: "BONIA ĐANG NGHĨ…", listening: talking ? "BẠN ĐANG NÓI" : "BONIA ĐANG NGHE · MỜI BẠN NÓI" }[st.phase] || "";
  const phaseC = st.phase === "listening" ? "#4A6B3A" : "#7B4A2D";
  const o = out || {};
  const U = Object.entries(o.understood || {}).slice(0, 5);
  const resultReq = { id: "test", name: o.name || null, room: o.room || null, number: "Máy này", at: run ? run.at : "", type: o.type || "Lời nhắn", urgent: !!o.urgent, fields: U.map(([k, v]) => [k, String(v)]), said: o.promised || "" };

  const saveFix = () => {
    const i = fixAt;
    const txt = fixDraft.trim();
    if (i == null || !txt) return;
    const q = (turns[i - 1] || {}).text || "";
    app.appendExtra(`• Khi khách nói "${q.slice(0, 80)}": ${txt}`);
    if (live) patch((s) => ({ fixes: { ...s.fixes, [i]: txt } }));
    else setRuns((rs) => rs.map((r) => (r.id === view ? { ...r, fixes: { ...r.fixes, [i]: txt } } : r)));
    setFixAt(null);
  };

  const ideas = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: "#6E6255" }}>GỢI Ý ĐỂ THỬ</span>
      <div className={phone ? "tt-scroll-x" : undefined} style={{ display: "flex", flexWrap: phone ? "nowrap" : "wrap", gap: 6, margin: phone ? "0 -16px" : 0, padding: phone ? "0 16px" : 0 }}>
        {IDEAS.map(([l, line]) => (
          <button key={l} type="button" className="b-ghost" onClick={() => !S.current.live && start(line)} style={{ minHeight: 44, padding: "0 14px", borderRadius: 22, fontSize: 13.5, whiteSpace: "nowrap", flex: "none" }}>{l}</button>
        ))}
      </div>
    </div>
  );
  const recent = (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: "#6E6255", paddingBottom: 4 }}>LẦN THỬ GẦN ĐÂY</span>
      {!runs.length && <span style={{ fontSize: 13.5, color: "#6E6255", padding: "4px 0" }}>Chưa có lần thử nào.</span>}
      {runs.map((r) => {
        const n = Object.keys(r.fixes).length;
        const g = r.turns.find((t) => t.w === "K");
        return (
          <button key={r.id} type="button" onClick={() => !S.current.live && (setView(r.id), setFixAt(null))} style={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) auto", gap: 10, alignItems: "center", minHeight: 52, padding: "8px 8px", borderTop: "1px solid #E4DCCB", background: view === r.id ? "#FFFFFF" : "transparent", textAlign: "left", borderRadius: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 11.5, color: "#6E6255" }}>{r.at}</span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#1F1B16" }}>{r.out?.type || "Gọi thử"}</span>
              <span style={{ fontSize: 12, color: "#6E6255", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g ? g.text : ""}</span>
            </span>
            <span style={{ fontSize: 12, color: n ? "#7B4A2D" : "#6E6255", whiteSpace: "nowrap" }}>{n ? `${n} câu đã sửa` : "không sửa"}</span>
          </button>
        );
      })}
    </div>
  );
  const startBtn = (
    <button type="button" className="b-primary" onClick={() => start()} style={{ height: 52, padding: "0 30px", borderRadius: 26, fontSize: 16, marginTop: phone ? -10 : -6 }}>▶ Bắt đầu</button>
  );

  const panel = (
    <div style={{ height: "100%", background: "#fff", border: "1px solid #D9D0BF", borderRadius: phone ? "20px 20px 0 0" : 18, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: live ? "#F1F3EA" : "#F3F3EC", borderBottom: "1px solid #E2E6D6", flex: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: live ? "#4A6B3A" : "#4A4239" }}>{live ? "ĐANG GỌI THỬ · KHÔNG TÍNH PHÚT" : "CUỘC GỌI THỬ ĐÃ XONG"}</span>
          <span style={{ fontSize: 17, fontWeight: 600 }}>Máy này</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: MONO, fontSize: 13, color: "#4A4239" }}>{live ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}` : run ? run.len : ""}</span>
          {!live && run && (
            <button type="button" onClick={() => { setView(null); setFixAt(null); }} aria-label="Đóng" className="h-line" style={{ width: 44, height: 44, borderRadius: 22, fontSize: 16, color: "#4A4239", textAlign: "center" }}>✕</button>
          )}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "14px 16px" }}>
        {turns.map((t, i) => {
          const B = t.w === "B";
          const fx = fixes[i];
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: B ? "flex-end" : "flex-start", gap: 3, flex: "none" }}>
              <Bubble who={t.w} text={t.text} size="lg" />
              {B && i > 0 && !fx && fixAt !== i && (
                <button type="button" onClick={() => { setFixAt(i); setFixDraft(""); }} style={{ height: 32, padding: "0 12px", fontSize: 12.5, color: "#7B4A2D" }}>Sửa</button>
              )}
              {B && fixAt === i && (
                <div style={{ width: "88%", display: "flex", flexDirection: "column", gap: 6, padding: 10, borderRadius: 12, border: "1px solid #7B4A2D", background: "#FBF5EC" }}>
                  <span style={{ fontSize: 12.5, color: "#4A4239" }}>Bonia nên nói (hoặc nên biết):</span>
                  {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                  <textarea value={fixDraft} onChange={(e) => setFixDraft(e.target.value)} rows={3} autoFocus style={{ width: "100%", resize: "vertical", border: "1px solid #D9D0BF", borderRadius: 8, padding: "8px 10px", fontSize: 14, lineHeight: 1.45, background: "#fff", color: "#1F1B16" }} />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                    <button type="button" className="b-ghost" onClick={() => setFixAt(null)} style={{ height: 40, padding: "0 14px", borderRadius: 20, fontSize: 13 }}>Huỷ</button>
                    <button type="button" className="b-primary" onClick={saveFix} style={{ height: 40, padding: "0 18px", borderRadius: 20, fontSize: 13 }}>Lưu</button>
                  </div>
                </div>
              )}
              {fx && (
                <div style={{ maxWidth: "88%", padding: "7px 11px", borderRadius: 10, background: "#EEF0E6", fontSize: 12.5, color: "#4A6B3A", lineHeight: 1.45 }}>
                  ✓ “{fx}” · <Link href="/cai-dat#s4" style={{ color: "#4A6B3A", textDecoration: "underline" }}>Đã lưu vào Cài đặt · Thông tin khác</Link>
                </div>
              )}
            </div>
          );
        })}
        {live && st.interim && <Bubble who="K" text={`${st.interim}…`} op={0.6} size="lg" />}
        {!live && run && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 10, borderTop: "1px solid #EFE9DD", marginTop: 4 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: "#6E6255" }}>YÊU CẦU BONIA SẼ GHI</span>
            <RequestCard r={resultReq} actions={false} tel={false} />
          </div>
        )}
      </div>
      <div style={{ padding: `10px 14px ${phone ? "max(30px, var(--tt-bot))" : "14px"}`, borderTop: "1px solid #EFE9DD", display: "flex", flexDirection: "column", gap: 8, flex: "none" }}>
        {live && (
          <>
            {phone && <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.14em", color: phaseC, textAlign: "center" }}>{phaseLabel}</span>}
            {phone && st.err && <span style={{ fontSize: 12.5, color: "#A0412D", textAlign: "center", lineHeight: 1.45 }}>{st.err}</span>}
            <div style={{ display: "flex", gap: 6 }}>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") guest(draft.trim()); }} placeholder="Gõ câu của khách…" style={{ flex: 1, minWidth: 0, height: 44, border: "1px solid #D9D0BF", borderRadius: 22, padding: "0 16px", fontSize: 14, background: "#fff", color: "#1F1B16" }} />
              <button type="button" className="b-ghost" onClick={() => guest(draft.trim())} style={{ height: 44, padding: "0 16px", borderRadius: 22, fontSize: 14 }}>Gửi</button>
            </div>
            <button type="button" className="b-ghost" onClick={finish} style={{ height: 46, borderRadius: 23, fontSize: 14.5, textAlign: "center" }}>Kết thúc cuộc gọi</button>
          </>
        )}
        {!live && run && <button type="button" className="b-primary" onClick={() => start()} style={{ height: 48, borderRadius: 24, fontSize: 15, textAlign: "center" }}>Gọi lại thử</button>}
      </div>
    </div>
  );

  const bg = live ? "#EEF0E6" : "#F2EEE6";
  if (phone) {
    return (
      <div style={{ position: "absolute", inset: 0, background: bg, transition: "background-color 900ms ease", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: "var(--tt-top)", bottom: "calc(57px + var(--tt-bot))", overflow: "auto" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "6px 16px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
            <span style={{ fontFamily: SERIF, fontSize: 28 }}>Thử Bonia</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <Orb size={170} mood={mood} tone={live ? "green" : "warm"} pickup={pickups} lively={live} reduce={reduce} />
              {startBtn}
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", color: "#6E6255" }}>KHÔNG TÍNH PHÚT</span>
            </div>
            {ideas}
            {recent}
          </div>
        </div>
        <PhoneTabs active={3} />
        <div style={{ position: "absolute", left: 0, right: 0, top: "calc(var(--tt-top) + 7px)", bottom: 0, transform: showPanel ? "none" : "translateY(105%)", opacity: showPanel ? 1 : 0, pointerEvents: showPanel ? "auto" : "none", transition: `transform 650ms ${EASE}, opacity 400ms ease`, zIndex: 6, boxShadow: "0 -8px 28px rgba(31,27,22,0.14)", borderRadius: "20px 20px 0 0" }}>
          {panel}
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, background: bg, transition: "background-color 900ms ease", overflow: "hidden" }}>
      <DeskHeader active={3} />
      <div style={{ position: "absolute", left: 40, top: 88, width: 360, bottom: 24, overflow: "auto", display: "flex", flexDirection: "column", gap: 18 }}>
        {ideas}
        {recent}
      </div>
      <div style={{ position: "absolute", left: 440, right: 500, top: live ? 130 : 200, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: `top 800ms ${EASE}` }}>
        <div style={{ transform: live ? "scale(1)" : "scale(0.56)", transformOrigin: "50% 0", marginBottom: live ? 0 : -150, transition: `transform 800ms ${EASE}, margin-bottom 800ms ${EASE}` }}>
          <Orb size={340} mood={mood} tone={live ? "green" : "warm"} pickup={pickups} lively={live} reduce={reduce} />
        </div>
        {!live && startBtn}
        {live && (
          <>
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em", color: phaseC, marginTop: -18 }}>{phaseLabel}</span>
            <div style={{ minHeight: 56, maxWidth: 480, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 20, lineHeight: 1.4, color: "#4A4239" }}>{st.interim}</div>
          </>
        )}
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", color: "#6E6255" }}>KHÔNG TÍNH PHÚT</span>
        {live && st.err && <span style={{ fontSize: 13, color: "#A0412D", textAlign: "center", maxWidth: 420, lineHeight: 1.5 }}>{st.err}</span>}
      </div>
      <div style={{ position: "absolute", right: 40, width: 440, top: 88, bottom: 24, transform: showPanel ? "none" : "translateX(520px)", opacity: showPanel ? 1 : 0, pointerEvents: showPanel ? "auto" : "none", transition: `transform 650ms ${EASE}, opacity 400ms ease`, zIndex: 6 }}>
        {panel}
      </div>
    </div>
  );
}
