import React, { useState } from "react";
import { Link } from "wouter";
import { useStore } from "../../store/index.jsx";
import { useIsMobile } from "../../lib/hooks.js";
import { nowHHMM } from "../../lib/clock.js";
import { telHref } from "../../lib/sms.js";
import { CALLS, SAMPLE_REPORT } from "../../data/calls.js";
import { Button, Dialog, TextInput } from "../../components/ui/index.js";
import { Body, MobileBack, SectionHead } from "./parts.jsx";

// Trợ giúp (3.6 N): calls the hotel reported (from Cuộc gọi → "Báo cuộc
// gọi này có vấn đề") with the Bonia team's answers, questions sent from
// here, and the support number.

// Questions sent from this page live for the session (no backend).
const sentQuestions = [];

/** 3.6 N shows chị Ngân's call as already reported. */
function frameReports(reports) {
  const ngan = CALLS.find((c) => c.id === SAMPLE_REPORT.callId);
  if (!ngan || reports.some((r) => r.callId === ngan.id)) return reports;
  return [
    {
      id: `r-${ngan.id}`,
      callId: ngan.id,
      callLabel: `${ngan.who} · hôm nay ${ngan.time}`,
      reason: SAMPLE_REPORT.reason,
      note: SAMPLE_REPORT.note,
      sentAt: SAMPLE_REPORT.sentAt,
      status: "dang-xem",
    },
    ...reports,
  ];
}

function StatusTag({ answered }) {
  return (
    <span
      style={{
        fontFamily: "var(--bn-mono)",
        fontSize: 9.5,
        letterSpacing: "0.1em",
        padding: "4px 8px",
        borderRadius: 10,
        whiteSpace: "nowrap",
        flex: "none",
        ...(answered
          ? { border: "1px solid var(--bn-ok)", color: "var(--bn-ok)" }
          : { background: "var(--bn-processing-bg)", color: "var(--bn-ink-2)" }),
      }}
    >
      {answered ? "✓ ĐÃ TRẢ LỜI" : "ĐANG XEM"}
    </span>
  );
}

function ReportCard({ r }) {
  const mobile = useIsMobile();
  const answered = r.status === "da-tra-loi";
  const title = [r.callLabel, r.reason].filter(Boolean).join(" · ");
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--bn-hairline)",
        borderRadius: 14,
        padding: mobile ? 16 : "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: mobile ? "flex-start" : "center", gap: 10 }}>
        {r.callId ? (
          <Link href={`/cuoc-goi/${r.callId}`} className="sb-link" style={{ fontSize: 15, fontWeight: 600, color: "var(--bn-ink)" }}>
            {title}
          </Link>
        ) : (
          <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
        )}
        <StatusTag answered={answered} />
      </div>
      {r.note && <div style={{ fontSize: 13.5, color: "var(--bn-ink-2)", lineHeight: 1.5 }}>“{r.note}”</div>}
      {answered && r.answer ? (
        <div
          style={{
            padding: "12px 14px",
            background: "var(--bn-cream-3)",
            border: "1px solid var(--bn-hairline-2)",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <span style={{ fontFamily: "var(--bn-mono)", fontSize: 9.5, letterSpacing: "0.18em", color: "var(--bn-muted)" }}>{r.answer.by}</span>
          <span style={{ fontSize: 14, lineHeight: 1.55 }}>{r.answer.text}</span>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: "var(--bn-muted)" }}>Đã gửi {r.sentAt} · đội Bonia thường trả lời trong 1 giờ làm việc</div>
      )}
    </div>
  );
}

export function HelpPage({ state: screenState, frame }) {
  const mobile = useIsMobile();
  const state = useStore();
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [, rerender] = useState(0);

  const base = frame === "3.6_N" ? frameReports(state.reports) : state.reports;
  const reports = screenState === "empty" ? [] : [...sentQuestions, ...base];

  const send = () => {
    const text = question.trim();
    if (!text) return;
    sentQuestions.unshift({ id: `q-${Date.now()}`, callLabel: `Câu hỏi · hôm nay ${nowHHMM()}`, note: text, sentAt: nowHHMM(), status: "dang-xem" });
    setQuestion("");
    setAskOpen(false);
    rerender((n) => n + 1);
  };

  const side = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: mobile ? 0 : 72 }}>
      <Button onClick={() => setAskOpen(true)} style={{ height: 48, fontSize: 15, width: "100%" }}>
        Gửi câu hỏi cho Bonia
      </Button>
      <a
        href={telHref(state.hotel.supportPhone)}
        style={{
          background: "#fff",
          border: "1px solid var(--bn-hairline)",
          borderRadius: 12,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          color: "var(--bn-ink)",
        }}
      >
        <span style={{ fontSize: 12.5, color: "var(--bn-muted)" }}>Số hỗ trợ · {state.hotel.supportHours}</span>
        <span style={{ fontFamily: "var(--bn-mono)", fontSize: 20 }}>{state.hotel.supportPhone}</span>
      </a>
      <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--bn-muted)", padding: "0 4px" }}>
        Khi gọi hỗ trợ, câu đầu tiên sẽ là: khối tình trạng ở Hôm nay đang bình thường hay đang báo cần kiểm tra?
      </div>
    </div>
  );

  return (
    <Body style={mobile ? undefined : { display: "grid", gridTemplateColumns: "minmax(0,1fr) 280px", gap: 32, alignContent: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        <MobileBack />
        <SectionHead eyebrow="Trợ giúp" title="Cuộc gọi đã báo" />
        {reports.length === 0 ? (
          <div
            style={{
              background: "#fff",
              border: "1px dashed var(--bn-dashed)",
              borderRadius: 14,
              padding: "22px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600 }}>Chưa báo cuộc gọi nào.</span>
            <span style={{ fontSize: 13.5, color: "var(--bn-ink-2)", lineHeight: 1.5 }}>
              Nếu Bonia nghe sai hay nói sai, mở cuộc gọi đó trong Cuộc gọi và bấm “Báo cuộc gọi này có vấn đề”. Câu trả lời của đội Bonia hiện ở đây.
            </span>
            <Link href="/cuoc-goi" className="sb-link" style={{ fontSize: 13.5, fontWeight: 500 }}>
              Mở Cuộc gọi
            </Link>
          </div>
        ) : (
          reports.map((r) => <ReportCard key={r.id} r={r} />)
        )}
      </div>
      {side}

      <Dialog open={askOpen} onClose={() => setAskOpen(false)} eyebrow="Trợ giúp" title="Gửi câu hỏi cho Bonia" width={600}>
        <TextInput
          multiline
          rows={4}
          label="Câu hỏi"
          value={question}
          onChange={setQuestion}
          placeholder="Ví dụ: Khách hỏi xuất hóa đơn đỏ thì Bonia trả lời sao?"
          autoFocus
        />
        <div style={{ fontSize: 13, color: "var(--bn-muted)" }}>Đội Bonia thường trả lời trong 1 giờ làm việc ({state.hotel.supportHours}).</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="secondary" size="sm" onClick={() => setAskOpen(false)}>
            Hủy
          </Button>
          <Button size="sm" disabled={!question.trim()} onClick={send}>
            Gửi
          </Button>
        </div>
      </Dialog>
    </Body>
  );
}
