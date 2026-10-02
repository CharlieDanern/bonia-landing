import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button, ChatBubble, TypingBubble } from "../../components/ui/index.js";
import { BONIA_MARK } from "../../lib/assets.js";
import {
  CALL_END,
  CALL_RING_SECONDS,
  CALL_SCRIPT,
  CALL_SPEED,
  PHONE_SETUP,
  TEST_CALL,
} from "../../data/onboarding.js";
import { setOnb } from "./state.js";
import { Eyebrow, MONO, MonoTag, SERIF, Title, mmss } from "./ui.jsx";

// Step 5 · Gọi thử: K waiting → L live call (bubbles stream word by word,
// "Bonia đang ghi" fills in) → M done. N = no call after 2:00.
// Simulated client-side: the call "arrives" a few seconds after K opens and
// its clock runs CALL_SPEED× so the 1:12 call plays in about 30 seconds.

function useTicker(active, ms = 120) {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(() => setN((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [active, ms]);
}

export function StepTest({ s }) {
  const t = s.test;
  // Opened directly (or after a reset): start waiting now.
  useEffect(() => {
    if (!t.startedAt && !t.timeout) setOnb({ test: { startedAt: Date.now(), frozenE: null, timeout: false } });
  }, [t.startedAt, t.timeout]);

  const frozen = t.frozenE != null;
  const e = frozen ? t.frozenE : t.startedAt ? (Date.now() - t.startedAt) / 1000 : 0;
  const callT = (e - CALL_RING_SECONDS) * CALL_SPEED;
  const phase = t.timeout ? "timeout" : e < CALL_RING_SECONDS ? "waiting" : callT < CALL_END ? "live" : "done";
  useTicker(!frozen && (phase === "waiting" || phase === "live"));

  const restart = () => setOnb({ test: { startedAt: Date.now(), frozenE: null, timeout: false } });

  if (phase === "timeout") return <Timeout onRetry={restart} />;
  if (phase === "waiting") return <Waiting keep={s.phone.mode === "keep"} />;
  if (phase === "live") return <Live t={callT} animate={!frozen} />;
  return <Done onAgain={restart} />;
}

// 3.1 K ─────────────────────────────────────────────────────────────────
function Waiting({ keep }) {
  return (
    <Center gap={28}>
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: "50%",
          border: "1px solid var(--bn-hairline)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: 130, height: 130, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span
            className="lo-spin"
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "2px solid #E4DCCB",
              borderTopColor: "var(--bn-clay)",
              animationDuration: "1.6s",
            }}
          />
          <img src={BONIA_MARK} alt="" style={{ height: 30, width: "auto" }} />
        </div>
      </div>
      <Eyebrow color="var(--bn-clay)" style={{ fontSize: 12 }}>
        Đang chờ cuộc gọi…
      </Eyebrow>
      <Title lineHeight={1.2} style={{ maxWidth: 760 }}>
        {keep ? (
          <>
            Dùng một máy khác gọi vào <span style={{ fontFamily: MONO, fontSize: 34, letterSpacing: 0 }}>{PHONE_SETUP.number}</span>.
          </>
        ) : (
          "Dùng một máy khác gọi vào số mới của VNPT."
        )}
      </Title>
      <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: "var(--bn-ink-2)", maxWidth: 560 }}>
        Đừng bắt máy quầy, để nó đổ chuông tới khi Bonia nghe.
      </p>
    </Center>
  );
}

function Center({ gap, children }) {
  return (
    <div
      className="lo-col"
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap,
        paddingBottom: 72,
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

// 3.1 L ─────────────────────────────────────────────────────────────────
function Live({ t, animate }) {
  const endRef = useRef(null);
  const bubbles = CALL_SCRIPT.filter((b) => t >= b.at).map((b) => {
    const words = b.text.split(" ");
    const p = Math.min(1, (t - b.at) / b.dur);
    return { ...b, shown: p >= 1 ? b.text : words.slice(0, Math.max(1, Math.ceil(words.length * p))).join(" ") };
  });

  // Keep the newest line in view as the transcript grows (the list scrolls
  // on desktop, the page scrolls on phones).
  useLayoutEffect(() => {
    if (animate) endRef.current?.scrollIntoView({ block: "nearest" });
  });

  const name = t >= 41 ? TEST_CALL.callerName : t >= 30 ? null : undefined;
  const fields = [
    t >= 11 && { label: "Loại phòng", value: "Superior" },
    t >= 11 && { label: "Ngày", value: "Tối nay, 1 đêm" },
    t >= 22 && { label: "Người", value: "2 người lớn" },
    name !== undefined && { label: "Tên", value: name || "đang hỏi…", pending: !name },
  ].filter(Boolean);

  return (
    <div
      className="lo-grid lo-live"
      style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 420px", gap: 56, padding: "44px 120px 0", height: "100%" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--bn-clay)",
          }}
        >
          <span className={animate ? "lo-pulse" : undefined} style={{ width: 8, height: 8, borderRadius: 4, background: "var(--bn-clay)" }} />
          Đang gọi · {mmss(t)} · {TEST_CALL.caller}
        </div>
        <div
          className="lo-live__list"
          aria-live="polite"
          style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8, paddingBottom: 32, overflowY: "auto", minHeight: 0 }}
        >
          {bubbles.map((b) => (
            <ChatBubble key={b.at} who={b.who} text={b.shown} size="lg" />
          ))}
          <div ref={endRef} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <TypingBubble />
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--bn-muted)" }}>
          Bonia đang ghi
        </div>
        <div
          style={{
            background: "#fff",
            border: "1px dashed var(--bn-dashed)",
            borderRadius: 14,
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            fontSize: 14.5,
          }}
        >
          {fields.length ? (
            <>
              <div style={{ display: "flex", gap: 6 }}>
                <MonoTag>ĐẶT PHÒNG</MonoTag>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 8 }}>
                {fields.map((f) => (
                  <React.Fragment key={f.label}>
                    <span style={{ color: "var(--bn-muted)" }}>{f.label}</span>
                    <span className={animate ? "lo-in" : undefined} style={{ color: f.pending ? "var(--bn-muted)" : undefined }}>
                      {f.value}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </>
          ) : (
            <span style={{ color: "var(--bn-muted)" }}>Bonia đang nghe khách nói…</span>
          )}
        </div>
      </div>
    </div>
  );
}

// 3.1 M ─────────────────────────────────────────────────────────────────
function Done({ onAgain }) {
  const [, navigate] = useLocation();
  const d = TEST_CALL.done;
  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 64 }}>
      <div className="lo-col" style={{ width: 640, display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
        <Eyebrow color="var(--bn-ok)">
          ✓ Bonia đã nghe máy · {d.duration} · tính {d.billed} phút
        </Eyebrow>
        <Title size={44} lineHeight={1.1}>
          Bonia nghe máy được rồi.
        </Title>
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--bn-hairline)",
            borderRadius: 14,
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <MonoTag>ĐẶT PHÒNG</MonoTag>
            <MonoTag tone="new">MỚI</MonoTag>
            <MonoTag tone="fill">GỌI THỬ</MonoTag>
          </div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>
            {TEST_CALL.callerName} · {TEST_CALL.caller}
          </div>
          <div style={{ fontSize: 14.5, color: "var(--bn-ink-2)", lineHeight: 1.55 }}>{d.summary}</div>
          <div style={{ fontSize: 13, color: "var(--bn-muted)" }}>Yêu cầu gọi thử không trừ phòng và không tính vào Hôm nay.</div>
        </div>
        <div className="lo-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button type="button" className="lo-link" onClick={onAgain}>
            Gọi thử lần nữa
          </button>
          <Button
            size="lg"
            style={{ width: 300 }}
            onClick={() => {
              setOnb({ done: true });
              navigate("/hom-nay");
            }}
          >
            Bonia sẵn sàng · Vào Hôm nay
          </Button>
        </div>
      </div>
    </div>
  );
}

// 3.1 N ─────────────────────────────────────────────────────────────────
function Timeout({ onRetry }) {
  return (
    <Center gap={24}>
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: "50%",
          border: "1px dashed var(--bn-dashed)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: MONO,
          fontSize: 28,
          color: "var(--bn-muted)",
        }}
      >
        {TEST_CALL.timeout}
      </div>
      <Eyebrow color="var(--bn-urgent)" style={{ fontSize: 12 }}>
        Chưa nhận được cuộc gọi
      </Eyebrow>
      <h2
        className="lo-title"
        style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 36, lineHeight: 1.25, letterSpacing: "-0.02em", maxWidth: 760 }}
      >
        Bonia chưa nhận được cuộc gọi. Kiểm tra lại mã chuyển cuộc gọi, rồi gọi lại.
      </h2>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--bn-ink-2)", maxWidth: 560 }}>
        Thường gặp: bấm mã trên máy khác, không phải máy có số {PHONE_SETUP.number}; hoặc lễ tân đã bắt máy trước khi Bonia nghe.
      </p>
      <div className="lo-actions" style={{ display: "flex", gap: 10 }}>
        <Button size="lg" variant="secondary" to="/bat-dau/so-dien-thoai" style={{ width: 180, fontWeight: 400 }}>
          Xem lại mã
        </Button>
        <Button size="lg" onClick={onRetry} style={{ width: 180 }}>
          Gọi thử lại
        </Button>
      </div>
    </Center>
  );
}
