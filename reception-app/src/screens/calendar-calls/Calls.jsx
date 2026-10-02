import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useActions, useStore, select } from "../../store/index.jsx";
import { AppLayout, CallList } from "../../components/shell/index.js";
import { ChatBubble, RecordingPlayer, StatusPill } from "../../components/ui/index.js";
import { useIsMobile, useScreenState } from "../../lib/hooks.js";
import { REPORT_REASONS } from "../../data/calls.js";
import { ReportDialog } from "./ReportDialog.jsx";
import { DarkNote } from "./parts.jsx";
import "./calendar-calls.css";

// 3.5 Cuộc gọi: TT Call List + detail (player, transcript, the request the
// call created, "Báo cuộc gọi này có vấn đề"). Frames (?f=): B report
// dialog · C reported · F recording failed. ?state=empty|loading → D / E.
// Phones: the list and the detail are separate screens.
const mono = { fontFamily: "var(--bn-mono)" };

export function Calls({ id }) {
  const { state: screen, frame } = useScreenState();
  const state = useStore();
  const actions = useActions();
  const mobile = useIsMobile();
  const call = id ? state.calls.find((c) => c.id === id) : null;

  const [reporting, setReporting] = useState(frame === "3.5_B");
  const [justReported, setJustReported] = useState(frame === "3.5_C");
  const [recFailed, setRecFailed] = useState(frame === "3.5_F");

  // 3.5 C opens on an already-reported call.
  const seeded = useRef(false);
  useEffect(() => {
    if (frame === "3.5_C" && call && !call.reported && !seeded.current) {
      seeded.current = true;
      const r = { reason: "Nói sai thông tin", note: "Bonia báo Deluxe còn phòng nhưng không nói đang có người khác hỏi." };
      actions.reportCall(call.id, r.reason, r.note);
    }
  }, [frame, call, actions]);

  // A new call resets the per-call UI.
  useEffect(() => {
    if (!frame) {
      setReporting(false);
      setJustReported(false);
      setRecFailed(false);
    }
  }, [id, frame]);

  const send = useCallback(
    (reason, note) => {
      actions.reportCall(id, reason, note);
      setReporting(false);
      setJustReported(true);
    },
    [actions, id]
  );
  const hideNote = useCallback(() => setJustReported(false), []);

  const mode = screen === "loading" ? "loading" : screen === "empty" ? "empty" : "all";
  const counts = screen === "empty" ? {} : undefined;

  const detail =
    mode === "loading" ? (
      <DetailSkeleton />
    ) : mode === "empty" || !call ? (
      <div style={{ flex: 1, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14.5, color: "var(--bn-muted)", padding: 16 }}>
        Chọn một cuộc gọi để xem lời thoại.
      </div>
    ) : frame === "3.5_B" ? (
      // As drawn: the pane is blank behind the report dialog.
      <div style={{ flex: 1, background: "#fff" }} />
    ) : (
      <CallDetail
        call={call}
        reportedNote={justReported}
        onHideNote={frame ? undefined : hideNote}
        recFailed={recFailed}
        onRetryRecording={() => setRecFailed(false)}
        onReport={() => setReporting(true)}
        bare={frame === "3.5_C"}
        mobile={mobile}
      />
    );

  const dialog = call && (
    <ReportDialog
      open={reporting}
      call={call}
      initial={frame === "3.5_B" ? { reason: REPORT_REASONS[1], note: "Bonia báo Deluxe còn phòng nhưng không nói đang có người khác hỏi." } : null}
      onClose={() => setReporting(false)}
      onSend={send}
    />
  );

  if (mobile) {
    return (
      <AppLayout active="cuoc-goi" counts={counts}>
        {call && mode === "all" ? detail : <CallList mode={mode} selectedId={id} />}
        {dialog}
      </AppLayout>
    );
  }

  return (
    <AppLayout active="cuoc-goi" counts={counts} mainStyle={{ flexDirection: "row", overflow: "hidden" }}>
      <CallList selectedId={id} mode={mode} />
      {detail}
      {dialog}
    </AppLayout>
  );
}

function CallDetail({ call, reportedNote, onHideNote, recFailed, onRetryRecording, onReport, bare, mobile }) {
  const state = useStore();
  const request = call.requestId ? state.requests.find((r) => r.id === call.requestId) : null;
  const pill = request ? select.statusPill(request.status) : null;
  // The handoff drops the phone number when the header also carries a tag
  // or the recording strip; keep the line short the same way.
  const meta = [call.time, !call.reported && !recFailed ? call.phone : null, call.billedMin ? `TÍNH ${call.billedMin} PHÚT` : null]
    .filter(Boolean)
    .join(" · ");
  const pad = mobile ? 16 : 32;

  const nameRow = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: mobile ? "wrap" : "nowrap" }}>
      <span style={{ fontFamily: "var(--bn-serif)", fontSize: 30 }}>{call.who}</span>
      <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {call.reported && (
          <StatusPill kind="reported" size="sm">
            ĐÃ BÁO {call.reported.at}
          </StatusPill>
        )}
        <span style={{ ...mono, fontSize: 12, color: "var(--bn-muted)", whiteSpace: "nowrap" }}>{meta}</span>
      </span>
    </div>
  );

  return (
    <div style={{ flex: 1, minWidth: 0, background: "#fff", display: "flex", flexDirection: "column", minHeight: mobile ? "calc(100vh - 116px)" : undefined }}>
      {mobile && (
        <Link href="/cuoc-goi" style={{ padding: "14px 16px 0", fontSize: 14, display: "flex", alignItems: "center", minHeight: 44 }}>
          ‹ Cuộc gọi
        </Link>
      )}
      {reportedNote && (
        <DarkNote link="Xem ở Trợ giúp" linkTo="/tro-giup" onHide={onHideNote} timeout={onHideNote ? 8000 : 0} style={{ margin: mobile ? "12px 16px 0" : "20px 24px 0" }}>
          Đội Bonia đã nhận. Bạn sẽ được trả lời trong ứng dụng.
        </DarkNote>
      )}

      {bare ? (
        <div style={{ padding: `18px ${pad}px 14px`, borderBottom: "1px solid var(--bn-hairline-2)", flex: "none" }}>{nameRow}</div>
      ) : (
        <div style={{ padding: `${mobile ? 12 : 24}px ${pad}px 16px`, display: "flex", flexDirection: "column", gap: 14, borderBottom: "1px solid var(--bn-hairline-2)", flex: "none" }}>
          {nameRow}
          {recFailed ? (
            <div
              role="alert"
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "var(--bn-urgent-bg)", borderRadius: 12, color: "var(--bn-urgent)", flexWrap: mobile ? "wrap" : "nowrap" }}
            >
              <span style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", border: "1px solid var(--bn-urgent)", borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap" }}>
                GHI ÂM
              </span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>Ghi âm chưa tải được. Lời thoại bên dưới vẫn đầy đủ.</span>
              <button type="button" onClick={onRetryRecording} style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", padding: 12, margin: -12 }}>
                Thử lại
              </button>
            </div>
          ) : (
            <RecordingPlayer key={call.id} duration={call.duration || "0:00"} position={call.position || "0:00"} />
          )}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: `18px ${pad}px`, display: "flex", flexDirection: "column", gap: 10 }}>
        {(call.transcript || []).map((l, i) => (
          <ChatBubble key={i} who={l.who} text={l.text} />
        ))}
        {!call.transcript?.length && <div style={{ fontSize: 14, color: "var(--bn-muted)" }}>Cuộc gọi này chưa có lời thoại.</div>}
      </div>

      {!bare && (
        <div
          style={{
            padding: `14px ${pad}px`,
            borderTop: "1px solid var(--bn-hairline)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: mobile ? "flex-start" : "center",
            flexDirection: mobile ? "column" : "row",
            gap: mobile ? 10 : 14,
            flex: "none",
            background: "#fff",
            position: mobile ? "sticky" : "static",
            bottom: mobile ? "calc(var(--bn-tab-h) + env(safe-area-inset-bottom))" : undefined,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, flexWrap: "wrap", minWidth: 0 }}>
            <span style={{ ...mono, fontSize: 9.5, letterSpacing: "0.18em", color: "var(--bn-muted)" }}>YÊU CẦU ĐÃ TẠO</span>
            {request ? (
              <>
                <span style={{ fontWeight: 500 }}>{call.requestLabel || request.listTitle}</span>
                <StatusPill kind={pill.kind} size="sm">
                  {pill.text}
                </StatusPill>
                <Link href={`/yeu-cau/${request.id}`} className="cc-link" style={{ padding: 10, margin: -10 }}>
                  Mở
                </Link>
              </>
            ) : (
              <span style={{ color: "var(--bn-muted)" }}>Không có</span>
            )}
          </div>
          {call.reported ? (
            <span style={{ fontSize: 13.5, color: "var(--bn-muted)", whiteSpace: "nowrap" }}>Đã báo lúc {call.reported.at}</span>
          ) : (
            <button type="button" onClick={onReport} style={{ fontSize: 13.5, color: "var(--bn-ink-2)", whiteSpace: "nowrap", padding: 12, margin: -12 }}>
              Báo cuộc gọi này có vấn đề
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DetailSkeleton() {
  const block = (style) => <span style={{ display: "block", background: "#F5F1E9", ...style }} />;
  return (
    <div aria-busy="true" aria-label="Đang tải" style={{ flex: 1, background: "#fff", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
      {block({ width: 220, height: 30, borderRadius: 4, background: "var(--bn-hairline-2)" })}
      {block({ height: 58, borderRadius: 12 })}
      {block({ width: "60%", height: 48, borderRadius: 14 })}
      {block({ width: "50%", height: 48, borderRadius: 14, alignSelf: "flex-end" })}
      {block({ width: "66%", height: 64, borderRadius: 14 })}
    </div>
  );
}
