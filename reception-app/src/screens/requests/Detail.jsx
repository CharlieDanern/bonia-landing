import React from "react";
import { Link } from "wouter";
import { Button, Tag } from "../../components/ui/index.js";
import { STAFF_BY_ID } from "../../data/staff.js";
import { useIsMobile } from "../../lib/hooks.js";
import { vnd } from "../../lib/format.js";
import { copyText, telHref } from "../../lib/sms.js";
import { select, useStore } from "../../store/index.jsx";
import {
  ActionBar,
  DetailHeader,
  GuestTitle,
  History,
  InfoGrid,
  NoteBox,
  RoomTitle,
  Stepper,
  WaitingLabel,
  WarnBox,
  recordedLabel,
} from "./parts.jsx";
import { calendarNote, conflictText, stayNights, typeName } from "./text.js";

// The detail pane of one request (3.3 A, C–I, L). Which body and which
// actions it shows depend on the request's type and status; the screen
// passes the handlers (`on.*`) and the transient UI (`ui`).
//
// ui: { compact, error, saving, historyOpen }
//   compact → right after a decision (ask bar on top): only what changed
//   error   → the decision did not save; summary dimmed, button waiting

export function Detail({ r, ui, on }) {
  const state = useStore();
  const mobile = useIsMobile();
  const Body = BODIES[bodyKind(r)] || OtherBody;
  const { content, actions, aside } = Body({ r, ui, on, state, mobile });
  return (
    <>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: mobile ? "16px 16px 24px" : ui.compact || ui.error ? "22px 36px" : "28px 36px",
          display: "flex",
          flexDirection: "column",
          gap: GAP[bodyKind(r)] ?? 18,
          overflowY: mobile ? "visible" : "auto",
          opacity: ui.error ? 0.9 : 1,
        }}
      >
        {content}
      </div>
      <ActionBar actions={actions} aside={aside} />
    </>
  );
}

const GAP = { booking: 18, hourly: 20, room: 20, lost: 20 };

function bodyKind(r) {
  if (r.type === "dat-phong") return r.sellMode === "theo-gio" ? "hourly" : "booking";
  if (r.type === "khach-dang-o") return "room";
  if (r.type === "quen-do") return "lost";
  return "other";
}

// Gọi lại: dial at once on a phone, show the number on a desktop.
function callAction(r, on, mobile, label = "Gọi lại") {
  if (mobile && r.phone) return { label, href: telHref(r.phone) };
  return { label, onClick: on.callBack };
}

function historyBlock(r, ui, on) {
  return <History rows={r.history} open={ui.historyOpen} onToggle={on.toggleHistory} />;
}

// ── Đặt phòng theo ngày (Kevin, Ngân, Long) ─────────────────────────────

function BookingBody({ r, ui, on, state, mobile }) {
  // Once another request took the last room, "Có thể đã hết phòng"
  // replaces the ⚠ box; Bonia never resolves either for the hotel.
  const mayBeFull = !ui.error && select.mayBeFull(state, r);
  const conflict = !ui.error && !mayBeFull && conflictText(state, r);
  const compact = ui.compact || ui.error;
  const confirmed = r.status === "cho-coc" || r.status === "da-xac-nhan";

  const rows = [
    ["Loại phòng", r.roomLabel],
    ["Nhận → trả", r.stayLabel],
    !compact && r.people && ["Người", r.people],
    ["Tổng Bonia đã báo", vnd(r.total), { mono: true, note: compact ? null : r.totalNote }],
    confirmed && r.deposit && ["Cọc", `${r.deposit.nights} đêm · ${vnd(r.deposit.amount)} · ${r.deposit.received ? "đã nhận" : "chưa nhận"}`],
    confirmed && r.confirmedAt && ["Lịch phòng", calendarNote(r)],
    !compact && r.status === "moi" && r.special && ["Yêu cầu đặc biệt", r.special],
  ];

  const content = (
    <>
      <DetailHeader r={r} flag={!ui.error} right={ui.error ? null : recordedLabel(r, { time: !compact })} />
      <GuestTitle
        title={r.guest}
        phone={ui.error ? null : r.phone}
        callId={compact ? null : r.callId}
        callMinutes={r.callMinutes}
      />
      {conflict && (
        <WarnBox title={conflict.title}>
          {conflict.body}{" "}
          <Link href="/lich" style={{ color: "var(--bn-clay)", fontWeight: 500 }}>
            Xem trên Lịch phòng
          </Link>
        </WarnBox>
      )}
      {mayBeFull && <WarnBox title="Có thể đã hết phòng · kiểm tra trước khi xác nhận" />}
      <InfoGrid rows={rows} />
      {!compact && (r.boniaSaid || r.unanswered) && (
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 12 }}>
          {r.boniaSaid && <NoteBox label="BONIA ĐÃ NÓI VỚI KHÁCH">{r.boniaSaid}</NoteBox>}
          {r.unanswered && <NoteBox label="KHÁCH HỎI MÀ BONIA CHƯA TRẢ LỜI">{r.unanswered}</NoteBox>}
        </div>
      )}
      {!compact && r.note && (
        <div style={{ fontSize: 13.5, color: "var(--bn-ink-2)" }}>
          <span style={{ fontFamily: "var(--bn-mono)", fontSize: 9.5, letterSpacing: "0.18em", color: "var(--bn-muted)" }}>CẦN ĐỂ Ý · </span>
          {r.note}
        </div>
      )}
      {!ui.error && historyBlock(r, ui, on)}
    </>
  );

  let actions = [];
  let aside = null;
  if (ui.error) {
    actions = [{ label: "Xác nhận và nhắn khách", primary: true, disabled: true, content: <WaitingLabel>Xác nhận và nhắn khách</WaitingLabel>, style: { gap: 10 } }];
  } else if (r.status === "moi") {
    actions = [
      { label: "Xác nhận và nhắn khách", primary: true, onClick: on.confirm, loading: ui.saving },
      callAction(r, on, mobile),
      { label: "Từ chối", onClick: on.reject },
    ];
  } else if (r.status === "cho-coc") {
    actions = [{ label: "Đã nhận cọc", primary: true, onClick: on.depositReceived }];
    if (!r.messagedAt) actions.push({ label: "Mở lại tin nhắn", onClick: on.openMessage });
    actions.push(callAction(r, on, mobile));
    if (!ui.compact) {
      actions.push({ label: "Từ chối", onClick: on.reject });
      if (r.messagedAt) aside = "Chỉ bạn đổi được Chờ cọc → Đã xác nhận.";
    }
  } else if (r.status === "da-xac-nhan") {
    actions = [r.messagedAt || !r.needsMessage ? null : { label: "Nhắn khách", primary: true, onClick: on.openMessage }, callAction(r, on, mobile)].filter(Boolean);
  } else {
    actions = r.phone ? [callAction(r, on, mobile)] : [];
  }
  return { content, actions, aside };
}

// ── Đặt phòng theo giờ (Thu): call back is the main action ─────────────

function CopyNumber({ phone }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      style={{ padding: "0 18px" }}
      onClick={async () => {
        if (await copyText(phone.replace(/\s/g, ""))) setCopied(true);
      }}
    >
      {copied ? "Đã chép số" : "Sao chép số"}
    </Button>
  );
}

function HourlyBody({ r, ui, on, mobile }) {
  const content = (
    <>
      <DetailHeader r={r} right={recordedLabel(r)} />
      <GuestTitle title={r.guest} />
      <InfoGrid
        rows={[
          ["Loại phòng", typeName(r.roomType)],
          ["Giờ", r.hoursLabel],
          ["Bonia đã báo", vnd(r.total), { mono: true, note: r.totalNote }],
          ["Lịch phòng", calendarNote(r)],
        ]}
      />
      {r.status === "moi" && (
        <div
          style={{
            padding: mobile ? "16px" : "20px 22px",
            border: "2px solid var(--bn-clay)",
            borderRadius: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: mobile ? "stretch" : "center",
            flexDirection: mobile ? "column" : "row",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: "var(--bn-mono)", fontSize: 10, letterSpacing: "0.2em", color: "var(--bn-muted)" }}>
              {mobile ? "GỌI LẠI KHÁCH" : "GỌI LẠI · BẤM TRÊN ĐIỆN THOẠI QUẦY"}
            </span>
            <span style={{ fontFamily: "var(--bn-mono)", fontSize: mobile ? 26 : 32, letterSpacing: "0.02em" }}>{r.phone}</span>
          </div>
          {mobile ? (
            <Button size="lg" href={telHref(r.phone)}>
              Gọi {r.phone}
            </Button>
          ) : (
            <CopyNumber phone={r.phone} />
          )}
        </div>
      )}
      <div style={{ fontSize: 13.5, color: "var(--bn-ink-2)", lineHeight: 1.5 }}>
        Khách đặt theo giờ thường không muốn nhận tin nhắn. Nếu cần nhắn, mẫu tin đặt theo giờ không ghi chữ “theo giờ”.
      </div>
      {historyBlock(r, ui, on)}
    </>
  );
  const actions =
    r.status === "moi"
      ? [
          { label: "Đã gọi · xác nhận", primary: true, onClick: on.confirmCalled },
          { label: "Xác nhận và nhắn khách", onClick: on.confirm, loading: ui.saving },
          { label: "Từ chối", onClick: on.reject },
        ]
      : [callAction(r, on, mobile)];
  return { content, actions };
}

// ── Khách đang ở (302, 205, 401) ────────────────────────────────────────

function RoomBody({ r, ui, on, mobile }) {
  const who = STAFF_BY_ID[r.assignee];
  const receiver = who
    ? [r.team, who.short, r.seenAt ? `Đã xem lúc ${r.seenAt}` : "chưa xem"].join(" · ")
    : `${r.team} · chưa giao ai`;
  const done = select.statusGroup(r.status) === "xong";
  const content = (
    <>
      <DetailHeader r={r} right={r.recordedAt ? recordedLabel(r) : null} />
      <RoomTitle room={r.room} task={r.task} />
      <InfoGrid
        rows={[
          [done ? "Người làm" : "Người nhận", receiver],
          !done && ["Thời hạn", r.deadline || (r.urgent ? "Việc gấp 15 phút" : "Việc thường 60 phút"), { urgent: r.overdue }],
          r.guestSaid && ["Khách nói", r.guestSaid],
          r.boniaSaid && ["Bonia đã nói", r.boniaSaid],
        ]}
      />
      {historyBlock(r, ui, on)}
    </>
  );
  let actions = [];
  if (r.status === "moi") {
    actions = [
      { label: "Giao cho …", primary: true, onClick: on.assign },
      { label: "Xong", onClick: on.done },
      callAction(r, on, mobile, "Gọi lại khách"),
    ];
  } else if (!done) {
    actions = [
      { label: "Xong", primary: true, onClick: on.done },
      { label: "Giao cho …", onClick: on.assign },
      callAction(r, on, mobile, "Gọi lại khách"),
    ];
  }
  return { content, actions };
}

// ── Quên đồ (Hương): Mới → Đang tìm → Tìm thấy / Không thấy → Đã trả khách ──

const LOST_ORDER = ["moi", "dang-tim", "found", "da-tra-khach"];

function LostBody({ r, ui, on, mobile }) {
  const at = r.status === "tim-thay" || r.status === "khong-thay" ? "found" : r.status;
  const idx = LOST_ORDER.indexOf(at);
  const third = r.status === "tim-thay" ? "Tìm thấy" : r.status === "khong-thay" ? "Không thấy" : "Tìm thấy / Không thấy";
  const steps = ["Mới", "Đang tìm", third, "Đã trả khách"].map((label, i) => ({
    label,
    state: i < idx || (r.status === "khong-thay" && i === 2) ? "done" : i === idx ? "current" : "future",
  }));
  const who = STAFF_BY_ID[r.assignee];
  const content = (
    <>
      <DetailHeader r={r} right={recordedLabel(r)} />
      <GuestTitle
        title={r.item}
        sub={
          <div style={{ fontSize: 15, color: "var(--bn-ink-2)" }}>
            {r.guest} · <span style={{ fontFamily: "var(--bn-mono)" }}>{r.phone}</span>
          </div>
        }
      />
      <Stepper steps={steps} />
      <InfoGrid
        rows={[
          ["Phòng", r.roomNote],
          ["Chỗ khách nhớ", r.where],
          [
            r.status === "dang-tim" ? "Đang tìm" : "Người tìm",
            who ? [r.team, who.short, r.seenAt ? `Đã xem lúc ${r.seenAt}` : "chưa xem"].join(" · ") : `${r.team} · chưa giao ai`,
          ],
        ]}
      />
      <div
        style={{
          padding: "12px 16px",
          background: "var(--bn-cream-3)",
          border: "1px solid var(--bn-hairline-2)",
          borderRadius: 10,
          fontSize: 13.5,
          color: "var(--bn-ink-2)",
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <Tag>Khóa</Tag>
        Bonia chỉ ghi lại; Bonia không bao giờ nói với khách là đã tìm thấy.
      </div>
      {ui.historyOpen && historyBlock(r, ui, on)}
    </>
  );
  const call = callAction(r, on, mobile);
  const actions = {
    moi: [{ label: "Giao cho …", primary: true, onClick: on.assign }, { label: "Đang tìm", onClick: () => on.lostStep("dang-tim") }, call],
    "dang-tim": [{ label: "Tìm thấy", primary: true, onClick: () => on.lostStep("tim-thay") }, { label: "Không thấy", onClick: () => on.lostStep("khong-thay") }, call],
    "tim-thay": [{ label: "Đã trả khách", primary: true, onClick: () => on.lostStep("da-tra-khach") }, call],
  }[r.status] || [call];
  return { content, actions };
}

// ── Dịch vụ, Đổi/hủy, Lời nhắn… ─────────────────────────────────────────

function OtherBody({ r, ui, on, mobile }) {
  const rows =
    r.type === "dich-vu"
      ? [["Dịch vụ", r.service], r.total && ["Bonia đã báo", vnd(r.total), { mono: true, note: "gồm phụ thu 22:00–05:00" }]]
      : r.type === "doi-huy"
        ? [
            ["Thay đổi", r.listSub],
            r.verified && ["Bonia đã kiểm tra", r.verified],
            r.nights?.length && ["Lịch phòng", `${typeName(r.roomType)} ${stayNights(r)} · trừ 1 khi bạn xác nhận`],
          ]
        : [["Nội dung", r.listSub]];
  const content = (
    <>
      <DetailHeader r={r} right={recordedLabel(r)} />
      <GuestTitle title={r.guest || r.listTitle} phone={r.phone} />
      <InfoGrid rows={rows} />
      {historyBlock(r, ui, on)}
    </>
  );
  const actions =
    r.status === "moi"
      ? [
          { label: r.type === "doi-huy" ? "Xác nhận đổi" : "Xác nhận", primary: true, onClick: on.confirmCalled },
          r.phone && callAction(r, on, mobile),
          { label: "Từ chối", onClick: on.reject },
        ].filter(Boolean)
      : r.phone
        ? [callAction(r, on, mobile)]
        : [];
  return { content, actions };
}

const BODIES = { booking: BookingBody, hourly: HourlyBody, room: RoomBody, lost: LostBody, other: OtherBody };

/** Right pane when nothing is selected (3.3 J). */
export function NoSelection() {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14.5, color: "var(--bn-muted)" }}>
      Chọn một yêu cầu để xem.
    </div>
  );
}

/** Right pane while loading (3.3 K). */
export function DetailSkeleton() {
  return (
    <div style={{ flex: 1, padding: "28px 36px", display: "flex", flexDirection: "column", gap: 16 }} aria-busy="true" aria-label="Đang tải">
      <span style={{ width: 180, height: 20, borderRadius: 4, background: "var(--bn-hairline-2)" }} />
      <span style={{ width: 260, height: 34, borderRadius: 4, background: "var(--bn-hairline-2)" }} />
      <span style={{ width: "100%", height: 160, borderRadius: 10, background: "#F5F1E9" }} />
    </div>
  );
}
