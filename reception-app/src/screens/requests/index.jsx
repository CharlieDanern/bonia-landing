import React, { useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AppLayout, RequestList } from "../../components/shell/index.js";
import { useIsMobile, useScreenState } from "../../lib/hooks.js";
import { telHref } from "../../lib/sms.js";
import { select, useActions, useStore } from "../../store/index.jsx";
import { AssignSheet, CallBackDialog, ConfirmAgainDialog, RejectDialog } from "./dialogs.jsx";
import { Detail, DetailSkeleton, NoSelection } from "./Detail.jsx";
import { MessageSheet } from "./MessageSheet.jsx";
import { AskSentBar, SaveErrorBar } from "./parts.jsx";

// Yêu cầu (3.3 A–L): list pane + detail. A request is never "booked" until
// the hotel confirms it here; "Xác nhận và nhắn khách" first writes the
// decision (Chờ cọc, calendar −1), then opens the message sheet; the app
// then asks whether the text was sent. Below 768px list and detail are
// separate screens and every sheet comes up from the bottom.
//
// ?f=<frame> opens the exact state drawn in a handoff frame (see
// src/frames/requests.js); ?state=loading|empty|error as usual.

const SAVE_MS = 400; // simulated save, so the button shows its loading state

export function Requests({ id }) {
  const state = useStore();
  const actions = useActions();
  const mobile = useIsMobile();
  const [, navigate] = useLocation();
  const { state: screen, frame } = useScreenState();

  const r = state.requests.find((x) => x.id === id) || null;
  const [sheet, setSheet] = useState(() => FRAME_SHEETS[frame] || null); // { kind, id }
  const [historyOpen, setHistoryOpen] = useState(() => (FRAME_HISTORY.includes(frame) ? { [id]: true } : {}));
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState(() => (frame === "3.3_L" || screen === "error" ? id : null));

  // Frames that start after a decision: replay it through the store once.
  const replayed = useRef(false);
  useLayoutEffect(() => {
    if (replayed.current || !frame) return;
    replayed.current = true;
    if (["3.3_B", "3.3_C", "3.3_E"].includes(frame)) actions.confirmRequest("kevin");
    if (frame === "3.3_C") actions.messageOpened("kevin", "qr");
  }, [frame, actions]);

  const closeSheet = () => setSheet(null);
  const openHistory = (rid) => setHistoryOpen((h) => ({ ...h, [rid]: true }));

  // Write the decision; then (optionally) open the message sheet.
  const decide = (req, { message }) => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setError(req.id);
      return;
    }
    setError(null);
    setSaving(req.id);
    setTimeout(() => {
      actions.confirmRequest(req.id);
      setSaving(null);
      openHistory(req.id);
      setSheet(message && req.phone ? { kind: "message", id: req.id } : null);
    }, SAVE_MS);
  };

  const callBack = (req) => {
    if (mobile && req.phone) window.location.href = telHref(req.phone);
    else setSheet({ kind: "call", id: req.id });
  };

  const handlers = (req) => ({
    confirm: () => (select.mayBeFull(state, req) ? setSheet({ kind: "again", id: req.id }) : decide(req, { message: true })),
    confirmCalled: () => decide(req, { message: false }),
    reject: () => setSheet({ kind: "reject", id: req.id }),
    depositReceived: () => actions.depositReceived(req.id),
    openMessage: () => setSheet({ kind: "message", id: req.id }),
    callBack: () => callBack(req),
    assign: () => setSheet({ kind: "assign", id: req.id }),
    done: () => actions.taskDone(req.id),
    lostStep: (step) => actions.lostItemStep(req.id, step),
    toggleHistory: () => setHistoryOpen((h) => ({ ...h, [req.id]: !(h[req.id] ?? !!req.urgent) })),
  });

  const asking = state.requests.find((x) => x.id === state.askSentFor);
  const askBar = asking && (
    <AskSentBar
      guest={asking.guestShort}
      onSent={() => actions.markMessaged(asking.id)}
      onNotYet={() => actions.markNotMessaged(asking.id)}
    />
  );
  const errorBar = r && error === r.id && (
    <SaveErrorBar onRetry={() => decide(r, { message: true })}>
      Chưa lưu được “Xác nhận”. Máy đang mất mạng. Lịch phòng chưa đổi, chưa mở tin nhắn.
    </SaveErrorBar>
  );

  const listMode = screen === "loading" ? "loading" : screen === "empty" ? "empty" : "all";
  const detail =
    screen === "loading" ? (
      <DetailSkeleton />
    ) : r && screen !== "empty" ? (
      <Detail
        key={r.id}
        r={r}
        ui={{ compact: state.askSentFor === r.id, error: error === r.id, saving: saving === r.id, historyOpen: historyOpen[r.id] ?? !!r.urgent }}
        on={handlers(r)}
      />
    ) : (
      <NoSelection />
    );

  const sheetReq = sheet && state.requests.find((x) => x.id === sheet.id);
  const sheets = sheetReq && (
    <>
      <MessageSheet
        r={sheetReq}
        open={sheet.kind === "message"}
        onClose={closeSheet}
        onDone={(via) => {
          actions.messageOpened(sheetReq.id, via);
          closeSheet();
        }}
      />
      <ConfirmAgainDialog
        r={sheetReq}
        open={sheet.kind === "again"}
        onClose={closeSheet}
        onCallBack={() => callBack(sheetReq)}
        onReject={() => {
          actions.rejectRequest(sheetReq.id, "Hết phòng");
          closeSheet();
        }}
        onConfirm={() => {
          closeSheet();
          decide(sheetReq, { message: true });
        }}
      />
      <RejectDialog
        r={sheetReq}
        open={sheet.kind === "reject"}
        onClose={closeSheet}
        onReject={(reason) => {
          actions.rejectRequest(sheetReq.id, reason);
          closeSheet();
        }}
      />
      <CallBackDialog
        open={sheet.kind === "call"}
        onClose={closeSheet}
        who={sheetReq.guest || `Phòng ${sheetReq.room}`}
        phone={sheetReq.phone}
        note={sheetReq.phone ? null : sheetReq.room ? `Gọi máy bàn phòng ${sheetReq.room} từ quầy.` : null}
      />
      <AssignSheet
        r={sheetReq}
        open={sheet.kind === "assign"}
        onClose={closeSheet}
        onAssign={(staffId) => {
          actions.assignStaff(sheetReq.id, staffId);
          openHistory(sheetReq.id);
          closeSheet();
        }}
      />
    </>
  );

  // J draws the sidebar without the Yêu cầu count.
  const counts = screen === "empty" ? {} : undefined;

  if (mobile) {
    return (
      <AppLayout active="yeu-cau" counts={counts}>
        {askBar}
        {r && screen !== "loading" && screen !== "empty" ? (
          <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#fff" }}>
            <button
              type="button"
              onClick={() => navigate("/yeu-cau")}
              style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 44, padding: "0 16px", fontSize: 14, color: "var(--bn-clay)", fontWeight: 500, borderBottom: "1px solid var(--bn-hairline-2)" }}
            >
              ‹ Yêu cầu
            </button>
            {errorBar}
            {detail}
          </div>
        ) : (
          <RequestList mode={listMode} />
        )}
        {sheets}
      </AppLayout>
    );
  }

  return (
    <AppLayout active="yeu-cau" counts={counts} mainStyle={{ flexDirection: "row", overflow: "hidden" }}>
      <RequestList selectedId={screen === "ready" || screen === "error" ? id : undefined} mode={listMode} />
      <div style={{ flex: 1, minWidth: 0, background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {askBar}
        {errorBar}
        {detail}
      </div>
      {sheets}
    </AppLayout>
  );
}

// Frame → what is open on first render.
const FRAME_SHEETS = {
  "3.3_B": { kind: "message", id: "kevin" },
  "3.3_E": { kind: "again", id: "ngan" },
  "3.3_G": { kind: "assign", id: "205" },
};
const FRAME_HISTORY = ["3.3_C", "3.3_D"];
