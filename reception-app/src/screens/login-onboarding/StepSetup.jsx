import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button, SourceChip, Toggle } from "../../components/ui/index.js";
import { FORWARD_PREFIX, FORWARD_TARGET, LISTEN, PHONE_SETUP } from "../../data/onboarding.js";
import { copyText, dialCodeHref } from "../../lib/sms.js";
import { setOnb } from "./state.js";
import { ChoicePill, Eyebrow, FieldLabel, MONO, SERIF, Title } from "./ui.jsx";

// Step 3 · Nghe máy (3.1 I) and step 4 · Số điện thoại (3.1 J).

/** Plays a line with the browser's Vietnamese voice when there is one. */
function useSpeak() {
  const [playing, setPlaying] = useState(null);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  const speak = (key, text, pitch = 1) => {
    const synth = window.speechSynthesis;
    if (!synth || typeof window.SpeechSynthesisUtterance !== "function") return;
    synth.cancel();
    if (playing === key) {
      setPlaying(null);
      return;
    }
    const u = new window.SpeechSynthesisUtterance(text);
    u.lang = "vi-VN";
    u.pitch = pitch;
    const vi = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith("vi"));
    if (vi) u.voice = vi;
    u.onend = u.onerror = () => setPlaying((p) => (p === key ? null : p));
    setPlaying(key);
    synth.speak(u);
  };
  return [playing, speak];
}

// 3.1 I ─────────────────────────────────────────────────────────────────
export function StepListen({ s }) {
  const [, navigate] = useLocation();
  const [playing, speak] = useSpeak();
  const [englishTouched, setTouched] = useState(false);
  const l = s.listen;
  const setL = (patch) => setOnb((p) => ({ listen: { ...p.listen, ...patch } }));
  const play = (key, i) => speak(key, l.greeting || LISTEN.greeting, i === 1 ? 0.8 : 1.1);

  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 56 }}>
      <div className="lo-col" style={{ width: 720, display: "flex", flexDirection: "column", gap: 28, paddingBottom: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Eyebrow>Bước 3 · Nghe máy</Eyebrow>
          <Title>Bonia bắt máy thế nào?</Title>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <FieldLabel htmlFor="lo-greeting" note="Bonia nói nguyên văn">
            Lời chào
          </FieldLabel>
          <div className="lo-wrap" style={{ display: "flex", gap: 10 }}>
            <input
              id="lo-greeting"
              className="lo-input"
              value={l.greeting}
              onChange={(e) => setL({ greeting: e.target.value })}
              style={{
                flex: 1,
                minWidth: 0,
                height: 56,
                border: "1px solid var(--bn-hairline)",
                borderRadius: 10,
                background: "#fff",
                padding: "0 16px",
                fontFamily: SERIF,
                fontSize: 19,
                outline: 0,
              }}
            />
            <button
              type="button"
              className="tt-chip"
              onClick={() => play("greeting", l.voice)}
              style={{
                height: 56,
                padding: "0 18px",
                borderRadius: 28,
                border: "1px solid var(--bn-hairline)",
                background: "#fff",
                fontSize: 14,
                gap: 8,
              }}
            >
              {playing === "greeting" ? "■ Dừng" : "▶ Nghe thử"}
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <FieldLabel>Giọng</FieldLabel>
          <div className="lo-two" role="radiogroup" aria-label="Giọng" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {LISTEN.voices.map((v, i) => {
              const on = l.voice === i;
              return (
                <div
                  key={v}
                  role="radio"
                  aria-checked={on}
                  tabIndex={0}
                  className="lo-card-btn"
                  onClick={() => setL({ voice: i })}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setL({ voice: i })}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    height: 64,
                    padding: "0 16px",
                    background: "#fff",
                    border: on ? "2px solid var(--bn-clay)" : "1px solid var(--bn-hairline)",
                    borderRadius: 12,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15 }}>
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        border: on ? "5px solid var(--bn-clay)" : "1px solid var(--bn-dashed)",
                        display: "block",
                      }}
                    />
                    {v}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      play(`voice-${i}`, i);
                    }}
                    style={{ fontSize: 13, color: "var(--bn-clay)" }}
                  >
                    {playing === `voice-${i}` ? "■ Dừng" : "▶ Nghe thử"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            padding: "16px 18px",
            background: "#fff",
            border: `1px ${englishTouched ? "solid var(--bn-hairline)" : "dashed var(--bn-dashed)"}`,
            borderRadius: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>Nghe máy bằng tiếng Anh khi khách nói tiếng Anh</span>
            <span style={{ fontSize: 13, color: "var(--bn-muted)" }}>
              {englishTouched ? (
                l.english ? "Bật." : "Tắt: Bonia chỉ nói tiếng Việt."
              ) : (
                <>
                  Bật sẵn: đánh giá trên <SourceChip>GOOGLE MAPS</SourceChip> có khách nước ngoài.
                </>
              )}
            </span>
          </div>
          <Toggle
            size="lg"
            on={l.english}
            label="Nghe máy bằng tiếng Anh"
            onChange={(v) => {
              setTouched(true);
              setL({ english: v });
            }}
          />
        </div>
        <div className="lo-actions" style={{ display: "flex", justifyContent: "space-between" }}>
          <Button size="lg" variant="secondary" to="/bat-dau/xem-lai" style={{ width: 140, fontWeight: 400 }}>
            Quay lại
          </Button>
          <Button size="lg" onClick={() => navigate("/bat-dau/so-dien-thoai")} style={{ width: 200 }}>
            Tiếp
          </Button>
        </div>
      </div>
    </div>
  );
}

// 3.1 J ─────────────────────────────────────────────────────────────────
export function StepPhone({ s }) {
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);
  const ph = s.phone;
  const setP = (patch) => setOnb((p) => ({ phone: { ...p.phone, ...patch } }));
  const code = `${FORWARD_PREFIX[ph.when]}${FORWARD_TARGET}#`;
  const keep = ph.mode === "keep";

  const copy = async () => {
    if (await copyText(code)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  const startTest = () => {
    setOnb({ test: { startedAt: Date.now(), frozenE: null, timeout: false } });
    navigate("/bat-dau/goi-thu");
  };

  const modeCard = (mode, title, sub) => {
    const on = ph.mode === mode;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={on}
        className="lo-card-btn"
        onClick={() => setP({ mode })}
        style={{
          padding: "16px 18px", // as drawn: the 2px border makes the chosen card 2px taller
          background: "#fff",
          border: on ? "2px solid var(--bn-clay)" : "1px solid var(--bn-hairline)",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: 13, color: "var(--bn-ink-2)" }}>{sub}</span>
      </button>
    );
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 44 }}>
      <div className="lo-col" style={{ width: 800, display: "flex", flexDirection: "column", gap: 22, paddingBottom: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Eyebrow>Bước 4 · Số điện thoại</Eyebrow>
          <Title>Khách gọi số nào?</Title>
        </div>
        <div className="lo-two" role="radiogroup" aria-label="Khách gọi số nào" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {modeCard("keep", "Giữ số đang dùng", `Chuyển cuộc gọi từ ${PHONE_SETUP.number} sang Bonia`)}
          {modeCard("vnpt", "Dùng số mới của VNPT", "Bonia nghe mọi cuộc gọi vào số mới")}
        </div>
        {keep ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <FieldLabel>Nhà mạng của {PHONE_SETUP.number}</FieldLabel>
              <div className="lo-wrap" style={{ display: "flex", gap: 8 }}>
                {PHONE_SETUP.carriers.map((c) => (
                  <ChoicePill key={c} selected={ph.carrier === c} onClick={() => setP({ carrier: c })}>
                    {c}
                  </ChoicePill>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <FieldLabel>Bonia nghe khi nào</FieldLabel>
              <div
                className="lo-seg"
                role="radiogroup"
                aria-label="Bonia nghe khi nào"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  border: "1px solid var(--bn-hairline)",
                  borderRadius: 10,
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                {PHONE_SETUP.whenOptions.map((w, i) => {
                  const on = ph.when === i;
                  return (
                    <button
                      key={w}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setP({ when: i })}
                      style={{
                        height: 44,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        background: on ? "var(--bn-clay)" : "#fff",
                        color: on ? "#fff" : "var(--bn-ink)",
                        fontWeight: on ? 500 : 400,
                        borderLeft: i ? "1px solid var(--bn-hairline)" : 0,
                      }}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                padding: "18px 20px",
                background: "#fff",
                border: "1px solid var(--bn-hairline)",
                borderRadius: 12,
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--bn-muted)" }}>
                Mã chuyển cuộc gọi · bấm trên điện thoại quầy
              </div>
              <div className="lo-code" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="lo-code__value" style={{ fontFamily: MONO, fontSize: 28, letterSpacing: "0.04em", userSelect: "all" }}>
                  {code}
                </span>
                <span className="lo-code__btns" style={{ display: "flex", gap: 8 }}>
                  <Button size="sm" href={dialCodeHref(code)} style={{ padding: "0 18px" }}>
                    Bấm để cài
                  </Button>
                  <Button size="sm" variant="secondary" onClick={copy} style={{ padding: "0 18px" }} aria-live="polite">
                    {copied ? "Đã sao chép" : "Sao chép mã"}
                  </Button>
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--bn-muted)", lineHeight: 1.5 }}>
                Một số iPhone không mở được mã từ đường dẫn. Khi đó bấm Sao chép mã, mở ứng dụng Điện thoại và dán vào.
              </div>
            </div>
          </>
        ) : (
          <div
            className="lo-in"
            style={{
              padding: "18px 20px",
              background: "#fff",
              border: "1px solid var(--bn-hairline)",
              borderRadius: 12,
              fontSize: 14.5,
              lineHeight: 1.55,
              color: "var(--bn-ink-2)",
            }}
          >
            VNPT cấp số mới khi ký hợp đồng. Khách gọi số đó là Bonia nghe máy, không cần mã chuyển cuộc gọi.
          </div>
        )}
        <div className="lo-actions" style={{ display: "flex", justifyContent: "space-between" }}>
          <Button size="lg" variant="secondary" to="/bat-dau/nghe-may" style={{ width: 140, fontWeight: 400 }}>
            Quay lại
          </Button>
          <Button size="lg" onClick={startTest} style={{ width: 240 }}>
            {keep ? "Đã cài · Gọi thử" : "Tiếp · Gọi thử"}
          </Button>
        </div>
      </div>
    </div>
  );
}
