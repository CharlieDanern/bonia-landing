import React, { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Orb } from "../components/Orb.jsx";
import { Bubble, RequestCard } from "../components/Request.jsx";
import { VOICE_COUNT, flat } from "../data/settings.js";
import { scriptReply } from "../test-call/scriptEngine.js";
import { WEBCALL_URL, startRealCall } from "../test-call/realCall.js";
import { DeskHeader, PhoneTabs, Switch, useLayout } from "../layout.jsx";
import { hm, useApp } from "../state.jsx";
import { EASE, MONO, SERIF, dims } from "../ui.js";
import { playVoice } from "../voice.js";

// Thử Bonia: a free playground (founder 2026-10-04). The owner talks to Bonia
// from this device about anything, like a real guest; quick settings sit
// beside it (voice, greeting, English) and apply to the next call. An
// answer the owner doesn't like is fixed in Cài đặt, then tested again
// (founder 2026-10-05: no corrections feature). Not billed. Signed in, it is a
// real call with the receptionist of the phone line on the Cài đặt on screen
// (test-call/realCall.js, founder 2026-10-05); the demo keeps the browser's
// speech and the demo engine (test-call/scriptEngine.js).
const VI = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const VOICES = [[1.12, 1.02], [1.0, 1.0], [0.86, 0.98], [1.28, 1.06], [0.74, 0.95], [0.92, 1.0]]; // browser stand-ins for Giọng 1–6

export function TryBonia() {
  const app = useApp();
  const { phone, reduce } = useLayout();
  const [st, setSt] = useState({ live: false, phase: "idle", turns: [], interim: "", out: null, err: "", t0: 0, level: 0 });
  const [now, setNow] = useState(Date.now());
  const [pickups, setPickups] = useState(0);
  const [draft, setDraft] = useState("");
  const [runs, setRuns] = useState([]);
  const [view, setView] = useState(null);
  const S = useRef(st);
  S.current = st;
  const R = useRef({});
  const settingsRef = useRef(app.settings);
  settingsRef.current = app.settings;

  const patch = (p) => setSt((s) => ({ ...s, ...(typeof p === "function" ? p(s) : p) }));

  const real = !app.demo && !!WEBCALL_URL;
  const teardown = () => {
    const r = R.current;
    r.call?.stop();
    r.call = null;
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
      const vv = VOICES[(flat(settingsRef.current).voice || 1) - 1] || VOICES[0];
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
    const run = { id: `r${Date.now()}`, at: hm(), turns: s.turns, out: s.out || {}, len: `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}` };
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
      // keep the last summary/type; a goodbye turn carries neither
      patch((s) => ({ out: { ...(s.out || {}), ...Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined && v !== "")) } }));
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

  // the real call: Bonia's own transcript and the request she records come back as they happen
  const startReal = async () => {
    if (S.current.live) return;
    R.current.ended = false;
    setView(null);
    setPickups((p) => p + 1);
    const t0 = Date.now();
    patch({ live: true, phase: "connecting", turns: [], interim: "", out: null, err: "", t0, level: 0 });
    S.current = { ...S.current, live: true, turns: [], t0 };
    setNow(t0);
    R.current.tick = setInterval(() => setNow(Date.now()), 500);
    const open = { B: -1, K: -1 };
    const last = { B: 0, K: 0 };
    try {
      const cur = settingsRef.current;
      R.current.call = await startRealCall({
        profile: { values: cur.values, rooms: cur.rooms },
        on: {
          state: (phase) => { if (S.current.live && S.current.phase !== phase) patch({ phase }); },
          // the call's clock starts when Bonia picks up (her greeting is ready)
          ready: () => {
            const at = Date.now();
            S.current = { ...S.current, t0: at };
            patch({ t0: at });
            setNow(at);
          },
          level: (lv) => { if (Math.abs(lv - S.current.level) > 0.01) patch({ level: lv }); },
          transcript: (who, text) => {
            const w = who === "bonia" ? "B" : "K";
            const clean = text.replace(/\[[a-z_ ]+\]/gi, "");
            if (!clean) return;
            const at = Date.now();
            // a pause of 2 s starts a new bubble; a late caller line still joins the caller's open bubble
            patch((s) => {
              const turns = [...s.turns];
              const i = open[w];
              if (i >= 0 && turns[i] && at - last[w] < 2000) turns[i] = { ...turns[i], text: turns[i].text + clean };
              else {
                turns.push({ w, text: clean.replace(/^\s+/, "") });
                open[w] = turns.length - 1;
              }
              last[w] = at;
              return { turns };
            });
          },
          request: (m) => {
            const c = m.card || {};
            patch({ out: m.withdrawn ? { type: "Đã hủy", summary: "Khách rút lại yêu cầu trong cuộc gọi." } : { type: c.type, name: c.customer_name, room: c.room, urgent: !!c.urgent, summary: c.summary } });
          },
          end: () => finish(),
          error: (msg) => patch({ err: msg }),
        },
      });
    } catch (e) {
      patch({ err: e?.name === "NotAllowedError" ? "Cần cho phép micro để gọi thử." : "Không bắt đầu được cuộc gọi thử. Thử lại sau." });
      setTimeout(finish, 1800);
    }
  };

  const start = async (firstLine) => {
    if (real) return startReal();
    if (S.current.live) return;
    R.current.ended = false;
    setView(null);
    setPickups((p) => p + 1);
    const t0 = Date.now();
    patch({ live: true, phase: "speaking", turns: [], interim: "", out: null, err: "", t0 });
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
    say(flat(settingsRef.current).greeting || "Dạ xin nghe ạ.", firstLine ? () => guest(firstLine) : null);
  };

  // ── view model ─────────────────────────────────────────────────────────
  const d = dims(phone);
  const f = flat(app.settings);
  const live = st.live;
  const run = view ? runs.find((r) => r.id === view) : null;
  const turns = live ? st.turns : run ? run.turns : [];
  const out = live ? st.out : run ? run.out : null;
  const talking = st.phase === "listening" && (st.interim || st.level > 0.045);
  const mood = !live || st.phase === "connecting" ? "idle" : st.phase === "speaking" ? "bonia" : st.phase === "thinking" ? "writing" : talking ? "guest" : "idle";
  const showPanel = live || !!run;
  const sec = Math.max(0, Math.floor((now - st.t0) / 1000));
  const phaseLabel = { connecting: "ĐANG KẾT NỐI · BONIA SẮP NHẤC MÁY…", speaking: "BONIA ĐANG NÓI", thinking: "BONIA ĐANG NGHĨ…", listening: talking ? "BẠN ĐANG NÓI" : "BONIA ĐANG NGHE · MỜI BẠN NÓI" }[st.phase] || "";
  const phaseC = st.phase === "listening" ? "#4A6B3A" : "#7B4A2D";
  const o = out || {};
  const resultReq = { id: "test", name: o.name || null, room: o.room || null, number: "Máy này", at: run ? run.at : "", type: o.type || "Lời nhắn", urgent: !!o.urgent, summary: o.summary || "" };

  // ── quick settings: save at once, used by the next answer ───────────────
  const eyebrow = { fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", color: "#6E6255" };
  const [playing, setPlaying] = useState(null);
  const stopPlay = useRef(null);
  useEffect(() => () => stopPlay.current?.(), []);
  const quickInput = { width: "100%", minHeight: d.input, border: "1px solid #D9D0BF", borderRadius: 8, padding: "7px 10px", fontSize: d.fs.body, lineHeight: 1.45, background: "#fff", color: "#1F1B16", resize: "none" };
  const quick = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <span style={{ fontFamily: SERIF, fontSize: phone ? 18 : 20 }}>Cài đặt nhanh</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={eyebrow}>GIỌNG</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {Array.from({ length: VOICE_COUNT }, (_, j) => j + 1).map((i) => {
            const on = f.voice === i;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 2, height: d.chip, padding: "0 2px 0 10px", borderRadius: d.chip / 2, border: `1px solid ${on ? "#7B4A2D" : "#D9D0BF"}`, background: on ? "#FBF5EC" : "#fff" }}>
                <button type="button" onClick={() => app.applyNow("voice", i)} style={{ fontSize: d.fs.small, color: on ? "#7B4A2D" : "#1F1B16", height: "100%" }}>Giọng {i}</button>
                <button
                  type="button"
                  aria-label={`Nghe thử giọng ${i}`}
                  className="h-line"
                  onClick={() => {
                    stopPlay.current?.();
                    if (playing === i) return setPlaying(null);
                    setPlaying(i);
                    stopPlay.current = playVoice(i, f.greeting || "Dạ xin nghe ạ.", () => setPlaying(null));
                    return undefined;
                  }}
                  style={{ width: d.chip - 6, height: d.chip - 6, borderRadius: (d.chip - 6) / 2, fontSize: 9, color: "#7B4A2D" }}
                >
                  {playing === i ? "■" : "▶"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={eyebrow}>LỜI CHÀO</span>
        <textarea rows={2} value={f.greeting} onChange={(e) => app.applyNow("greeting", e.target.value)} style={quickInput} />
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {[
          ["english", "Trả lời tiếng Anh khi khách nói tiếng Anh", !!f.english, () => app.applyNow("english", !f.english)],
        ].map(([k, l, on, go]) => (
          <button key={k} type="button" onClick={go} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: d.fs.body, color: "#1F1B16", textAlign: "left", minHeight: d.row }}>
            <Switch on={on} />
            {l}
          </button>
        ))}
      </div>
      <Link href="/cai-dat" style={{ fontSize: d.fs.small, width: "max-content" }}>Cài đặt đầy đủ →</Link>
    </div>
  );

  const recent = runs.length > 0 && (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ ...eyebrow, paddingBottom: 4 }}>LẦN THỬ GẦN ĐÂY</span>
      {runs.map((r) => {
        const g = r.turns.find((t) => t.w === "K");
        return (
          <button key={r.id} type="button" onClick={() => !S.current.live && setView(r.id)} style={{ display: "grid", gridTemplateColumns: "40px minmax(0,1fr) auto", gap: 8, alignItems: "center", padding: "7px 6px", borderTop: "1px solid #E4DCCB", background: view === r.id ? "#FFFFFF" : "transparent", textAlign: "left", borderRadius: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: "#6E6255" }}>{r.at}</span>
            <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
              <span style={{ fontSize: d.fs.small, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#1F1B16" }}>{r.out?.type || "Gọi thử"}</span>
              <span style={{ fontSize: d.fs.tiny, color: "#6E6255", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g ? g.text : ""}</span>
            </span>
            <span style={{ fontSize: d.fs.tiny, color: "#6E6255", whiteSpace: "nowrap" }}>{r.len}</span>
          </button>
        );
      })}
    </div>
  );
  const startBtn = (
    <button type="button" className="b-primary" onClick={() => start()} style={{ height: phone ? 44 : 42, padding: "0 26px", borderRadius: 22, fontSize: phone ? 14.5 : 14 }}>▶ Bắt đầu gọi thử</button>
  );

  const panel = (
    <div style={{ height: "100%", background: "#fff", border: "1px solid #D9D0BF", borderRadius: phone ? "18px 18px 0 0" : 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "9px 12px 9px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: live ? "#F1F3EA" : "#F3F3EC", borderBottom: "1px solid #E2E6D6", flex: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: live ? "#4A6B3A" : "#4A4239" }}>{live ? "ĐANG GỌI THỬ · KHÔNG TÍNH PHÚT" : "CUỘC GỌI THỬ ĐÃ XONG"}</span>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Máy này</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: MONO, fontSize: 11.5, color: "#4A4239" }}>{live ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}` : run ? run.len : ""}</span>
          {!live && run && (
            <button type="button" onClick={() => setView(null)} aria-label="Đóng" className="h-line" style={{ width: 34, height: 34, borderRadius: 17, fontSize: 14, color: "#4A4239", textAlign: "center" }}>✕</button>
          )}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px" }}>
        {turns.map((t, i) => {
          const B = t.w === "B";
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: B ? "flex-end" : "flex-start", gap: 2, flex: "none" }}>
              <Bubble who={t.w} text={t.text} />
            </div>
          );
        })}
        {live && st.interim && <Bubble who="K" text={`${st.interim}…`} op={0.6} />}
        {!live && run && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 10, borderTop: "1px solid #EFE9DD", marginTop: 4 }}>
            <span style={eyebrow}>{real ? "YÊU CẦU BONIA ĐÃ GHI" : "YÊU CẦU BONIA SẼ GHI"}</span>
            {o.summary ? <RequestCard r={resultReq} actions={false} tel={false} /> : <span style={{ fontSize: d.fs.small, color: "#6E6255", lineHeight: 1.5 }}>Không có yêu cầu: cuộc gọi chỉ hỏi thông tin.</span>}
          </div>
        )}
      </div>
      <div style={{ padding: `8px 12px ${phone ? "max(22px, var(--tt-bot))" : "12px"}`, borderTop: "1px solid #EFE9DD", display: "flex", flexDirection: "column", gap: 6, flex: "none" }}>
        {live && (
          <>
            {phone && <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.14em", color: phaseC, textAlign: "center" }}>{phaseLabel}</span>}
            {phone && st.err && <span style={{ fontSize: 11.5, color: "#A0412D", textAlign: "center", lineHeight: 1.45 }}>{st.err}</span>}
            {real && <span style={{ fontSize: d.fs.tiny, color: "#6E6255", textAlign: "center", lineHeight: 1.45 }}>Nói vào micro như một vị khách. Nên đeo tai nghe để Bonia không nghe lại giọng của chính mình.</span>}
            {!real && <div style={{ display: "flex", gap: 6 }}>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") guest(draft.trim()); }} placeholder="Gõ câu của khách…" style={{ flex: 1, minWidth: 0, height: d.input, border: "1px solid #D9D0BF", borderRadius: d.input / 2, padding: "0 14px", fontSize: d.fs.body, background: "#fff", color: "#1F1B16" }} />
              <button type="button" className="b-ghost" onClick={() => guest(draft.trim())} style={{ height: d.input, padding: "0 14px", borderRadius: d.input / 2, fontSize: d.fs.body }}>Gửi</button>
            </div>}
            <button type="button" className="b-ghost" onClick={finish} style={{ height: d.btn, borderRadius: d.btn / 2, fontSize: d.fs.body, textAlign: "center" }}>Kết thúc cuộc gọi</button>
          </>
        )}
        {!live && run && <button type="button" className="b-primary" onClick={() => start()} style={{ height: d.btn, borderRadius: d.btn / 2, fontSize: d.fs.body, textAlign: "center" }}>Gọi lại thử</button>}
      </div>
    </div>
  );

  const bg = live ? "#EEF0E6" : "#F2EEE6";
  if (phone) {
    return (
      <div style={{ position: "absolute", inset: 0, background: bg, transition: "background-color 900ms ease", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: "var(--tt-top)", bottom: "calc(57px + var(--tt-bot))", overflow: "auto" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "8px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontFamily: SERIF, fontSize: d.fs.h1 }}>Thử Bonia</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Orb size={170} mood={mood} tone={live ? "green" : "warm"} pickup={pickups} lively={live} reduce={reduce} />
              <div style={{ marginTop: -14 }}>{startBtn}</div>
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color: "#6E6255" }}>NÓI GÌ CŨNG ĐƯỢC · KHÔNG TÍNH PHÚT</span>
            </div>
            <div style={{ background: "#fff", border: "1px solid #E4DCCB", borderRadius: 12, padding: "12px 14px" }}>{quick}</div>
            {recent}
          </div>
        </div>
        <PhoneTabs active={3} />
        <div style={{ position: "absolute", left: 0, right: 0, top: "calc(var(--tt-top) + 7px)", bottom: 0, transform: showPanel ? "none" : "translateY(105%)", opacity: showPanel ? 1 : 0, pointerEvents: showPanel ? "auto" : "none", transition: `transform 650ms ${EASE}, opacity 400ms ease`, zIndex: 6, boxShadow: "0 -8px 28px rgba(31,27,22,0.14)", borderRadius: "18px 18px 0 0" }}>
          {panel}
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, background: bg, transition: "background-color 900ms ease", overflow: "hidden" }}>
      <DeskHeader active={3} />
      <div style={{ position: "absolute", left: 48, top: 56 + 28, width: 320, bottom: 24, overflow: "auto", display: "flex", flexDirection: "column", gap: 24 }}>
        {quick}
        {recent}
      </div>
      <div style={{ position: "absolute", left: 48 + 320 + 40, right: 48 + 400 + 40, top: 56, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <div style={{ transform: live ? "scale(1)" : "scale(0.85)", transition: `transform 800ms ${EASE}`, marginTop: -40 }}>
          <Orb size={380} mood={mood} tone={live ? "green" : "warm"} pickup={pickups} lively={live} reduce={reduce} />
        </div>
        {!live && startBtn}
        {live && (
          <>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.16em", color: phaseC }}>{phaseLabel}</span>
            <div style={{ minHeight: 48, maxWidth: 440, textAlign: "center", fontFamily: SERIF, fontStyle: "italic", fontSize: 18, lineHeight: 1.4, color: "#4A4239" }}>{st.interim}</div>
          </>
        )}
        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color: "#6E6255", marginTop: 6 }}>NÓI GÌ CŨNG ĐƯỢC · KHÔNG TÍNH PHÚT</span>
        {live && st.err && <span style={{ fontSize: 12, color: "#A0412D", textAlign: "center", maxWidth: 400, lineHeight: 1.5 }}>{st.err}</span>}
      </div>
      <div style={{ position: "absolute", right: 48, width: 400, top: 56 + 28, bottom: 28, transform: showPanel ? "none" : "translateX(480px)", opacity: showPanel ? 1 : 0, pointerEvents: showPanel ? "auto" : "none", transition: `transform 650ms ${EASE}, opacity 400ms ease`, zIndex: 6 }}>
        {panel}
      </div>
    </div>
  );
}
