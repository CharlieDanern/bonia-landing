import React, { useEffect, useState } from "react";
import { useStore, useActions } from "../../store/index.jsx";
import { useIsMobile, useScreenState } from "../../lib/hooks.js";
import { nowHHMM } from "../../lib/clock.js";
import { BONIA_MARK } from "../../lib/assets.js";
import { STAFF_BY_ID, TASK_PAGE } from "../../data/staff.js";

// Trang việc (/viec, frames TV A–B): what a staff member opens from a push.
// Only that one task: room, task, urgency, deadline and a big "Xong". No
// guest name or number, no way into the hotel app. Link expires after 24h.
//
//   /viec                  the task (marks "Đã xem lúc …" on first open)
//   /viec?s=invite|push|task|done|expired|removed
//   /viec?state=loading|error
//   /viec?f=TV_A | TV_B    the four phones of each frame side by side

const CARD = {
  width: 300,
  height: 740,
  background: "var(--bn-cream)",
  borderRadius: 28,
  border: "1px solid var(--bn-hairline)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  flex: "none",
};

const BIG_BTN = {
  height: 56,
  borderRadius: 28,
  background: "var(--bn-clay)",
  color: "#fff",
  fontSize: 16,
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
  flex: "none",
  width: "100%",
};

const kicker = { fontFamily: "var(--bn-mono)", fontSize: 9.5, letterSpacing: "0.2em", color: "var(--bn-muted)" };
const serif = (size, extra) => ({ fontFamily: "var(--bn-serif)", fontSize: size, ...extra });

/** Task data for the page: request 302 as the store has it now. */
function useTask() {
  const state = useStore();
  const r = state.requests.find((x) => x.id === TASK_PAGE.requestId) || {};
  const staff = STAFF_BY_ID[r.assignee || TASK_PAGE.staffId];
  return {
    id: r.id || TASK_PAGE.requestId,
    hotel: TASK_PAGE.hotel,
    room: r.room || TASK_PAGE.room,
    task: r.task || TASK_PAGE.task,
    note: r.taskNote || TASK_PAGE.note,
    urgent: r.urgent ?? TASK_PAGE.urgent,
    reportedAt: r.recordedAt || TASK_PAGE.reportedAt,
    dueAt: r.dueAt || TASK_PAGE.dueAt,
    seenAt: r.seenAt,
    done: r.status === "xong",
    doneAt: r.doneAt,
    staffName: staff?.name || "Người nhận",
    staffShort: staff?.short || "",
  };
}

// ── the screens (each fills its phone) ─────────────────────────────────

function Invite({ t, onAccept, pad }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: pad || "56px 22px 28px", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <img src={BONIA_MARK} alt="Bonia" style={{ height: 18, width: "auto" }} />
        <span style={kicker}>TIẾP TÂN</span>
      </div>
      <div style={serif(26, { lineHeight: 1.2 })}>
        Khách sạn {t.hotel} mời {t.staffShort} nhận báo việc.
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--bn-ink-2)" }}>
        {t.staffShort.charAt(0).toUpperCase() + t.staffShort.slice(1).split(" ")[0]} sẽ nhận thông báo khi có việc kỹ thuật, ví dụ “Phòng 302 · Máy lạnh không lạnh”. Không cần cài ứng dụng.
      </div>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <button type="button" className="tt-btn tt-btn--primary" onClick={onAccept} style={{ ...BIG_BTN, height: 52, borderRadius: 26, fontSize: 15 }}>
          Nhận thông báo
        </button>
        <span style={{ fontSize: 12, color: "var(--bn-muted)", textAlign: "center" }}>iPhone: Chia sẻ → Thêm vào Màn hình chính trước</span>
      </div>
    </div>
  );
}

function LockScreen({ t, onOpen, time = TASK_PAGE.pushTime }) {
  return (
    <div style={{ flex: 1, background: "#2A2520", display: "flex", flexDirection: "column", padding: "64px 14px 28px", gap: 14 }}>
      <div style={{ textAlign: "center", color: "var(--bn-cream-2)", ...serif(58, { fontWeight: 300 }) }}>{time}</div>
      <div style={{ textAlign: "center", color: "#CFC5B2", fontSize: 13, marginTop: -10 }}>{TASK_PAGE.pushDate}</div>
      <button
        type="button"
        onClick={onOpen}
        style={{
          marginTop: 28,
          background: "rgba(247,243,236,0.94)",
          borderRadius: 16,
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--bn-muted)", width: "100%" }}>
          <span style={{ fontWeight: 600, color: "var(--bn-ink)" }}>Bonia · {t.hotel}</span>
          <span>bây giờ</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          Phòng {t.room} · {t.task}
          {t.urgent ? " · Gấp" : ""}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--bn-ink-2)" }}>Chạm để mở việc</div>
      </button>
    </div>
  );
}

function Task({ t, onDone, sending, pad }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: pad || "56px 22px 28px", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={kicker}>VIỆC · {t.hotel.toUpperCase()}</span>
        {t.urgent && (
          <span
            style={{
              fontFamily: "var(--bn-mono)",
              fontSize: 9.5,
              letterSpacing: "0.1em",
              padding: "4px 8px",
              borderRadius: 10,
              background: "var(--bn-urgent-bg)",
              color: "var(--bn-urgent)",
              whiteSpace: "nowrap",
            }}
          >
            GẤP
          </span>
        )}
      </div>
      <div style={{ fontFamily: "var(--bn-mono)", fontSize: 88, lineHeight: 1 }}>{t.room}</div>
      <div style={serif(28, { lineHeight: 1.2 })}>{t.task}</div>
      {t.note && <div style={{ fontSize: 14, color: "var(--bn-ink-2)", lineHeight: 1.55 }}>{t.note}</div>}
      <div style={{ fontSize: 13, color: t.urgent ? "var(--bn-urgent)" : "var(--bn-ink-2)" }}>
        Báo lúc {t.reportedAt} · cần xong trước {t.dueAt}
      </div>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        <button type="button" className="tt-btn tt-btn--primary" onClick={onDone} aria-busy={sending || undefined} style={BIG_BTN}>
          {sending ? <span className="tt-spinner" style={{ width: 16, height: 16 }} /> : null}
          Xong
        </button>
        <span style={{ fontSize: 12, color: "var(--bn-muted)", textAlign: "center" }}>Đường dẫn hết hạn sau {TASK_PAGE.linkHours} giờ</span>
      </div>
    </div>
  );
}

function Done({ t, at }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 22px",
        gap: 14,
        textAlign: "center",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          border: "1px solid var(--bn-ok)",
          color: "var(--bn-ok)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
        }}
      >
        ✓
      </span>
      <div style={serif(26)}>Đã xong · {at}</div>
      <div style={{ fontSize: 14, color: "var(--bn-ink-2)", lineHeight: 1.6 }}>
        Phòng {t.room} · {t.task}. Lễ tân đã thấy việc này xong.
      </div>
    </div>
  );
}

function Loading() {
  const bar = (w, h, r, extra) => <span style={{ width: w, height: h, borderRadius: r, background: "var(--bn-skeleton-2)", flex: "none", ...extra }} />;
  return (
    <div aria-busy="true" aria-label="Đang tải" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "56px 22px 28px", gap: 16 }}>
      {bar(110, 10, 3)}
      {bar(150, 80, 6)}
      {bar(220, 26, 4)}
      {bar("100%", 56, 28, { marginTop: "auto" })}
    </div>
  );
}

function SendError({ t, onRetry, sending, pad }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: pad || "56px 22px 28px", gap: 14 }}>
      <div style={{ fontFamily: "var(--bn-mono)", fontSize: 88, lineHeight: 1 }}>{t.room}</div>
      <div style={serif(26)}>{t.task}</div>
      <div
        role="alert"
        style={{
          marginTop: "auto",
          padding: "12px 14px",
          background: "var(--bn-urgent-bg)",
          color: "var(--bn-urgent)",
          borderRadius: 12,
          fontSize: 13.5,
          lineHeight: 1.5,
        }}
      >
        Chưa gửi được “Xong”. Kiểm tra mạng rồi bấm lại.
      </div>
      <button type="button" className="tt-btn tt-btn--primary" onClick={onRetry} style={BIG_BTN}>
        {sending ? <span className="tt-spinner" style={{ width: 16, height: 16 }} /> : null}
        Bấm lại Xong
      </button>
    </div>
  );
}

function Notice({ kickerText, title, body }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "28px 22px", gap: 12 }}>
      <div style={{ ...kicker, fontSize: 10 }}>{kickerText}</div>
      <div style={serif(26, { lineHeight: 1.2 })}>{title}</div>
      <div style={{ fontSize: 14, color: "var(--bn-ink-2)", lineHeight: 1.6 }}>{body}</div>
    </div>
  );
}

const Expired = ({ t }) => (
  <Notice kickerText="ĐƯỜNG DẪN HẾT HẠN" title={`Việc này đã quá ${TASK_PAGE.linkHours} giờ.`} body={`Nếu vẫn còn việc, hỏi lễ tân ${t.hotel}.`} />
);
const Removed = ({ t }) => (
  <Notice
    kickerText="ĐÃ NGƯNG NHẬN BÁO"
    title={`Máy này không còn nhận báo từ ${t.hotel}.`}
    body="Khách sạn đã gỡ máy này. Không có việc nào hiện ở đây nữa."
  />
);

// ── frames: four phones on the #EBE5D9 board ───────────────────────────

function Board({ children }) {
  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bn-skeleton)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        flexWrap: "wrap",
        padding: "80px 0",
      }}
    >
      {children}
    </div>
  );
}

function StoryboardA({ t }) {
  const frameTask = { ...t, done: false };
  return (
    <Board>
      <div style={CARD}>
        <Invite t={frameTask} />
      </div>
      <div style={{ ...CARD, border: 0, background: "#2A2520" }}>
        <LockScreen t={frameTask} />
      </div>
      <div style={{ ...CARD }}>
        <Task t={frameTask} />
      </div>
      <div style={CARD}>
        <Done t={frameTask} at={TASK_PAGE.doneAt} />
      </div>
    </Board>
  );
}

function StoryboardB({ t }) {
  return (
    <Board>
      <div style={CARD}>
        <Loading />
      </div>
      <div style={CARD}>
        <SendError t={t} />
      </div>
      <div style={CARD}>
        <Expired t={t} />
      </div>
      <div style={CARD}>
        <Removed t={t} />
      </div>
    </Board>
  );
}

// ── the live page ──────────────────────────────────────────────────────

export function TaskPage() {
  const mobile = useIsMobile();
  const { state, frame, query } = useScreenState();
  const t = useTask();
  const { taskSeen, taskDone } = useActions();
  const initial = state === "loading" ? "loading" : state === "error" ? "error" : query.get("s") || (t.done ? "done" : "task");
  const [step, setStep] = useState(initial);
  const [sending, setSending] = useState(false);
  const [doneAt, setDoneAt] = useState(t.doneAt || null);

  useEffect(() => setStep(initial), [initial]); // eslint-disable-line react-hooks/exhaustive-deps

  // Opening the task tells the front desk "Đã xem lúc …".
  useEffect(() => {
    if (!frame && step === "task" && !t.seenAt && !t.done) taskSeen(t.id, nowHHMM());
  }, [frame, step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Demo loading: a short skeleton, then the task.
  useEffect(() => {
    if (step !== "loading" || frame || state === "loading") return undefined;
    const id = setTimeout(() => setStep("task"), 700);
    return () => clearTimeout(id);
  }, [step, frame, state]);

  if (frame === "TV_A") return <StoryboardA t={t} />;
  if (frame === "TV_B") return <StoryboardB t={t} />;

  const sendDone = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      if (navigator.onLine === false) {
        setStep("error");
        return;
      }
      const at = nowHHMM();
      taskDone(t.id, t.staffName);
      setDoneAt(at);
      setStep("done");
    }, 600);
  };

  const accept = async () => {
    try {
      if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission();
    } catch {
      /* the demo continues without system notifications */
    }
    setStep("push");
  };

  const pad = mobile ? "40px 20px 24px" : undefined;
  let screen;
  if (step === "invite") screen = <Invite t={t} onAccept={accept} pad={pad} />;
  else if (step === "push") screen = <LockScreen t={t} time={nowHHMM()} onOpen={() => setStep("task")} />;
  else if (step === "loading") screen = <Loading />;
  else if (step === "error") screen = <SendError t={t} onRetry={sendDone} sending={sending} pad={pad} />;
  else if (step === "expired") screen = <Expired t={t} />;
  else if (step === "removed") screen = <Removed t={t} />;
  else if (step === "done" || t.done) screen = <Done t={t} at={doneAt || t.doneAt || nowHHMM()} />;
  else screen = <Task t={t} onDone={sendDone} sending={sending} pad={pad} />;

  // Phone: the page is the phone. Wider screens: one phone on the board.
  if (mobile) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: step === "push" ? "#2A2520" : "var(--bn-cream)" }}>
        {screen}
      </div>
    );
  }
  return (
    <Board>
      <div style={{ ...CARD, width: 360, height: 740, ...(step === "push" ? { border: 0, background: "#2A2520" } : null) }}>{screen}</div>
    </Board>
  );
}
