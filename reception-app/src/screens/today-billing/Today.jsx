import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { AppLayout, Page } from "../../components/shell/index.js";
import { Button, Toggle, SideSheet, TextInput } from "../../components/ui/index.js";
import { useStore, useActions, select } from "../../store/index.jsx";
import { DEMO_LABEL, weekdayShort, dayMonth } from "../../lib/clock.js";
import { decimal } from "../../lib/format.js";
import { useIsMobile, useScreenState } from "../../lib/hooks.js";
import { ROOM_TYPE_BY_ID } from "../../data/calendar.js";
import { OVERDUE_REMINDER } from "../../data/billing.js";
import { FIRST_DAY_KNOWLEDGE as SETUP_PROGRESS } from "../../data/hotel.js";
import { STAFF_GROUPS } from "../../data/staff.js";
import { mono, serif, Eyebrow, Pill, Block, ErrorState, Scope, ForwardCodeSheet, TestCallDialog, useRetry } from "./parts.jsx";

// Hôm nay (3.2 A–E, 3.8 A). Is Bonia answering, what's left tonight, what
// to do first. Everything is derived from the store, so confirming Kevin or
// switching "Hết phòng tối nay" updates this page and every other screen.
//
// Frames: ?f=3.2_B line silent + stale calendar · ?state=empty (3.2 C)
// · ?state=loading (3.2 D) · ?state=error (3.2 E) · ?f=3.8_A reminder strip.

export function Today() {
  const { state: initial, frame } = useScreenState();
  const [view, retry, retrying, setView] = useRetry(initial === "ready" && frame === "3.2_C" ? "empty" : initial);
  useEffect(() => setView(initial === "ready" && frame === "3.2_C" ? "empty" : initial), [initial, frame, setView]);

  if (frame === "3.8_A") return <ReminderFrame />;

  return (
    <AppLayout active="hom-nay" counts={view === "empty" ? {} : undefined}>
      <Scope>
      {view === "loading" ? (
        <TodayLoading />
      ) : view === "error" ? (
        <Page>
          <TitleBlock />
          <ErrorState
            title="Máy này đang mất kết nối."
            body="Bonia vẫn nghe máy bình thường; chỉ màn hình này chưa tải được. Yêu cầu mới vẫn được ghi lại và hiện khi có mạng."
            onRetry={retry}
            retrying={retrying}
            footnote="LẦN TẢI GẦN NHẤT 14:02"
          />
        </Page>
      ) : (
        <TodayReady empty={view === "empty"} warnFrame={frame === "3.2_B"} />
      )}
      </Scope>
    </AppLayout>
  );
}

function TitleBlock({ eyebrow = DEMO_LABEL }) {
  const mobile = useIsMobile();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="tt-eyebrow">{eyebrow}</div>
      <h2 className="tt-page-title" style={{ fontSize: mobile ? 32 : 40 }}>
        Hôm nay
      </h2>
    </div>
  );
}

/** "Bonia đang nghe máy cho 0900 000 300 · khi lễ tân không bắt máy" + switch. */
function ListeningSwitch() {
  const state = useStore();
  const { setListening } = useActions();
  const on = state.line.listening;
  const mobile = useIsMobile();
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 12px 10px 18px",
        background: "#fff",
        border: "1px solid var(--bn-hairline)",
        borderRadius: 26,
        cursor: "pointer",
        alignSelf: mobile ? "stretch" : undefined,
        justifyContent: "space-between",
      }}
    >
      <span style={{ fontSize: 14, color: on ? undefined : "var(--bn-muted)" }}>
        {on ? "Bonia đang nghe máy cho " : "Bonia đang tắt cho "}
        <span style={mono}>{state.hotel.phone}</span>
        {on ? ` · ${state.hotel.listenWhen}` : " · khách gọi chỉ đổ chuông ở quầy"}
      </span>
      <Toggle size="lg" on={on} onChange={setListening} label="Bonia nghe máy" />
    </label>
  );
}

function Header() {
  const mobile = useIsMobile();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: mobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: mobile ? "stretch" : "flex-end",
        gap: mobile ? 14 : 24,
      }}
    >
      <TitleBlock />
      <ListeningSwitch />
    </div>
  );
}

function Stats() {
  const state = useStore();
  const mobile = useIsMobile();
  const urgent = select.urgentOpen(state).length;
  const s = state.todayStats;
  const items = [
    [String(s.handled), "Bonia nhận thay quầy"],
    [String(s.bookings), "Đặt phòng"],
    [String(s.inHouse), "Khách đang ở"],
    [String(urgent), "Gấp", urgent ? "var(--bn-urgent)" : undefined],
    [`${decimal(state.minutes.used)} / ${state.minutes.included}`, "Phút tháng này"],
  ];
  return (
    <div
      className={mobile ? "tb-stats-m" : undefined}
      style={{ display: mobile ? "grid" : "flex", borderTop: "1px solid var(--bn-hairline)", borderBottom: "1px solid var(--bn-hairline)" }}
    >
      {items.map(([v, l, color], i) => (
        <div
          key={l}
          style={{
            flex: 1,
            padding: "12px 0 12px 16px",
            borderLeft: i && !mobile ? "1px solid var(--bn-skeleton-2)" : 0,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <span style={{ ...mono, fontSize: 22, color: color || "var(--bn-ink)" }}>{v}</span>
          <span style={{ fontSize: 12.5, color: "var(--bn-muted)" }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

/** Việc gấp: open urgent requests (302 · Máy lạnh không lạnh). */
function UrgentList() {
  const state = useStore();
  const list = select.urgentOpen(state);
  const mobile = useIsMobile();
  if (!list.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Eyebrow color="var(--bn-urgent)">Việc gấp · {list.length}</Eyebrow>
      {list.map((r) => (
        <Link
          key={r.id}
          href={`/yeu-cau/${r.id}`}
          className="tb-row-card"
          style={{
            display: "grid",
            gridTemplateColumns: mobile ? "56px 1fr" : "72px 1fr auto",
            gap: mobile ? "10px 12px" : 16,
            alignItems: "center",
            padding: "14px 18px",
            background: "#fff",
            border: "1px solid var(--bn-urgent-line)",
            borderRadius: 12,
            color: "var(--bn-ink)",
          }}
        >
          <span style={{ ...mono, fontSize: 26 }}>{r.room}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 15.5, fontWeight: 600 }}>{r.todayTitle}</span>
            <span style={{ fontSize: 13, color: "var(--bn-ink-2)" }}>{urgentSub(state, r)}</span>
          </div>
          <span style={{ display: "flex", gap: 6, flexWrap: "wrap", gridColumn: mobile ? "1 / -1" : undefined }}>
            {select.requestPills(state, r)
              .filter((p) => p.kind !== "type")
              .map((p) => (
                <Pill key={p.text} kind={p.kind === "new" ? "new" : p.kind}>
                  {p.text}
                </Pill>
              ))}
          </span>
        </Link>
      ))}
    </div>
  );
}

/** "Kỹ thuật · anh Tư · Đã xem lúc 14:06", following reassignment in Yêu cầu. */
function urgentSub(state, r) {
  const who = state.staff.find((s) => s.id === r.assignee);
  const team = STAFF_GROUPS.find((g) => g.id === who?.group)?.label || r.team;
  return [team, who?.short, r.seenAt ? `Đã xem lúc ${r.seenAt}` : r.assignee ? "Chưa xem" : "Chưa giao"]
    .filter(Boolean)
    .join(" · ");
}

/** ⚠ banner: more pending requests than rooms left. Never auto-resolved. */
function ConflictBanners() {
  const state = useStore();
  const list = select.conflictsToday(state);
  const mobile = useIsMobile();
  if (!list.length) return null;
  return list.map((c) => {
    const reqs = c.requestIds.map((id) => state.requests.find((r) => r.id === id)).filter(Boolean);
    const name = ROOM_TYPE_BY_ID[c.roomType]?.name || c.roomType;
    const when = `${weekdayShort(c.date)} ${dayMonth(c.date)}`;
    const text = c.remaining
      ? `⚠ ${reqs.length} yêu cầu đang chờ cho ${c.remaining} phòng ${name} còn lại (${when})`
      : `⚠ ${reqs.length} yêu cầu đang chờ, phòng ${name} đã hết (${when})`;
    return (
      <Link
        key={`${c.roomType}-${c.date}`}
        href={`/yeu-cau/${reqs[0]?.id || ""}`}
        className="tb-conflict"
        style={{
          display: "flex",
          flexWrap: mobile ? "wrap" : "nowrap",
          gap: mobile ? "4px 10px" : 10,
          alignItems: "center",
          padding: "11px 16px",
          border: "1px dashed var(--bn-urgent)",
          borderRadius: 10,
          background: "var(--bn-urgent-wash)",
          fontSize: 14,
          color: "var(--bn-ink)",
        }}
      >
        <span style={{ color: "var(--bn-urgent)", fontWeight: 600 }}>{text}</span>
        <span style={{ color: "var(--bn-ink-2)" }}>{reqs.map((r) => r.guestShort).join(", ")} · khách sạn quyết</span>
        <span style={{ marginLeft: "auto", color: "var(--bn-clay)", fontWeight: 500 }}>Xem</span>
      </Link>
    );
  });
}

/** Yêu cầu mới: every request still "Mới", newest first. */
function NewRequests() {
  const state = useStore();
  const list = select.newRequests(state);
  const mobile = useIsMobile();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Eyebrow>Yêu cầu mới · {list.length}</Eyebrow>
        <Link href="/yeu-cau" style={{ ...mono, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase" }}>
          Xem tất cả
        </Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--bn-hairline)" }}>
        {list.length === 0 && (
          <div style={{ padding: "22px 0", fontSize: 14.5, color: "var(--bn-ink-2)", lineHeight: 1.55 }}>
            Không có yêu cầu mới. Các yêu cầu đã xử lý nằm ở Yêu cầu.
          </div>
        )}
        {list.map((r) => (
          <Link
            key={r.id}
            href={`/yeu-cau/${r.id}`}
            className="tb-row"
            style={{
              display: "grid",
              gridTemplateColumns: mobile ? "44px 1fr" : "52px 1fr auto",
              gap: mobile ? "4px 10px" : 14,
              alignItems: "center",
              minHeight: 56,
              padding: mobile ? "10px 0" : 0,
              borderBottom: "1px solid var(--bn-skeleton-2)",
              color: "var(--bn-ink)",
            }}
          >
            <span style={{ ...mono, fontSize: 12, color: "var(--bn-muted)", alignSelf: mobile ? "start" : undefined, paddingTop: mobile ? 3 : 0 }}>
              {r.recordedAt || r.listTime}
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 14.5, fontWeight: 600 }}>{r.todayTitle}</span>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--bn-ink-2)",
                  whiteSpace: mobile ? "normal" : "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {select.todaySub(state, r)}
              </span>
            </div>
            <span style={{ display: "flex", gap: 6, gridColumn: mobile ? "2" : undefined }}>
              <Pill kind="type">{r.typeLabel}</Pill>
              <Pill kind="new">MỚI</Pill>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

const card = (pad = "16px 18px", gap = 10) => ({
  background: "#fff",
  border: "1px solid var(--bn-hairline)",
  borderRadius: 14,
  padding: pad,
  display: "flex",
  flexDirection: "column",
  gap,
});

/** Status block (always shown). ok: green dot + facts. */
function StatusCard({ facts }) {
  const state = useStore();
  const on = state.line.listening;
  return (
    <div role="status" style={card()}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span
          style={{ width: 9, height: 9, borderRadius: on ? 5 : 2, background: on ? "var(--bn-ok)" : "var(--bn-muted)", flex: "none" }}
        />
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>{on ? "Bonia hoạt động bình thường" : "Bonia đang tắt"}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", fontSize: 12.5, color: "var(--bn-ink-2)" }}>
        {(on ? facts : ["Bật lại bằng công tắc phía trên", "Khách gọi chỉ đổ chuông ở quầy"]).map((f) => (
          <span key={f}>{f}</span>
        ))}
      </div>
    </div>
  );
}

function RoomsLeft({ left, total }) {
  return (
    <span style={{ ...serif, fontSize: 30 }}>
      Còn {left} <span style={{ color: "var(--bn-muted)", fontSize: 20 }}>/ {total} phòng</span>
    </span>
  );
}

/** Tối nay: rooms left by type, arrivals, and the big "Hết phòng tối nay". */
function TonightCard({ stale }) {
  const state = useStore();
  const { setOutTonight } = useActions();
  const t = select.tonight(state);
  const out = !!state.switches["het-phong-toi-nay"];
  const say = state.settings["08"].switches.find((s) => s.id === "het-phong-toi-nay")?.say;
  return (
    <div style={card("18px", 12)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <Eyebrow>{stale ? "Tối nay · theo số cũ" : "Tối nay"}</Eyebrow>
        <RoomsLeft left={t.remaining} total={t.total} />
      </div>
      {stale && <div style={{ fontSize: 13, color: "var(--bn-urgent)", marginTop: -4 }}>Số này có thể sai. Cập nhật Lịch phòng.</div>}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {t.rows.map((r) => (
          <div
            key={r.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              height: 28,
              alignItems: "center",
              fontSize: 13.5,
              color: r.remaining ? "var(--bn-ink)" : "var(--bn-muted)",
            }}
          >
            <span>{r.name}</span>
            <span style={mono}>{r.remaining ? `còn ${r.remaining}` : "hết"}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid var(--bn-hairline-2)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        <Eyebrow size={10} spacing="0.18em">
          Khách sắp tới · {state.arrivals.length}
        </Eyebrow>
        {state.arrivals.map((a) => (
          <div key={a.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
            <span>
              {a.name} · {ROOM_TYPE_BY_ID[a.roomType]?.name}
            </span>
            <span style={{ ...mono, color: "var(--bn-ink-2)" }}>{a.eta}</span>
          </div>
        ))}
      </div>
      <label
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "12px 14px",
          background: "var(--bn-cream-2)",
          borderRadius: 10,
          cursor: "pointer",
        }}
      >
        <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Hết phòng tối nay</span>
          <Toggle size="lg" on={out} onChange={setOutTonight} label="Hết phòng tối nay" />
        </span>
        {out && (
          <span style={{ fontSize: 13, lineHeight: 1.5, color: "var(--bn-ink-2)" }}>
            <span style={{ ...mono, fontSize: 9.5, letterSpacing: "0.18em", color: "var(--bn-muted)" }}>BONIA SẼ NÓI · </span>
            <span style={{ ...serif, fontStyle: "italic", fontSize: 15, color: "var(--bn-ink)" }}>{say}</span>
            <br />
            Tắt lại thì số phòng trở về như trước.
          </span>
        )}
      </label>
    </div>
  );
}

/** Today switch + temporary notice ("Thang máy đang bảo trì tới 17:00"). */
function TodaySwitches() {
  const state = useStore();
  const { setSwitch, setTempNotice } = useActions();
  const [edit, setEdit] = useState(false);
  const sw = state.settings["08"].switches.find((s) => s.id === "khong-theo-gio-sau-20");
  const on = !!state.switches[sw.id];
  const n = state.tempNotice;
  return (
    <div style={card()}>
      <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{sw.label}</span>
        <Toggle on={on} onChange={(v) => setSwitch(sw.id, v)} label={sw.label} />
      </label>
      {n.on ? (
        <>
          <button
            type="button"
            className="tb-notice"
            onClick={() => setEdit(true)}
            aria-label={`Sửa thông báo tạm: ${n.text}`}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}
          >
            <span style={{ fontSize: 14, fontWeight: 500 }}>{n.text}</span>
            <span style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", color: "var(--bn-muted)", flex: "none" }}>
              TỰ TẮT {n.until}
            </span>
          </button>
          <div
            style={{
              background: "var(--bn-cream-3)",
              border: "1px solid var(--bn-hairline-2)",
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            <span style={{ ...mono, fontSize: 9.5, letterSpacing: "0.18em", color: "var(--bn-muted)" }}>BONIA SẼ NÓI · </span>
            <span style={{ ...serif, fontStyle: "italic", fontSize: 15 }}>{n.say}</span>
          </div>
        </>
      ) : (
        <Button variant="link" onClick={() => setEdit(true)} style={{ alignSelf: "flex-start", fontSize: 14 }}>
          Thêm thông báo tạm
        </Button>
      )}
      <NoticeSheet open={edit} onClose={() => setEdit(false)} notice={n} onSave={setTempNotice} />
    </div>
  );
}

function NoticeSheet({ open, onClose, notice, onSave }) {
  const [text, setText] = useState(notice.text);
  const [until, setUntil] = useState(notice.until);
  const [say, setSay] = useState(notice.say);
  useEffect(() => {
    if (open) {
      setText(notice.text);
      setUntil(notice.until);
      setSay(notice.say);
    }
  }, [open, notice]);
  const valid = text.trim() && /^([01]\d|2[0-3]):[0-5]\d$/.test(until);
  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title="Thông báo tạm"
      width={480}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          {notice.on ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onSave({ on: false });
                onClose();
              }}
            >
              Tắt thông báo
            </Button>
          ) : (
            <span />
          )}
          <Button
            size="sm"
            disabled={!valid}
            onClick={() => {
              onSave({ on: true, text: text.trim(), until, untilLabel: `hôm nay ${until}`, say: say.trim() });
              onClose();
            }}
          >
            Lưu
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingBottom: 24 }}>
        <TextInput label="Thông báo" value={text} onChange={setText} />
        <TextInput label="Tự tắt lúc" mono type="time" inputMode="numeric" value={until} onChange={setUntil} />
        <TextInput label="Bonia sẽ nói" multiline rows={3} value={say} onChange={setSay} helper="Bonia nói câu này khi khách hỏi, tới giờ thì tự tắt." />
      </div>
    </SideSheet>
  );
}

/** Two warning cards (3.2 B): line silent, calendar stale. */
function Warnings({ lineWarn, stale, onCheck, onShowCode, onStillRight }) {
  const mobile = useIsMobile();
  const [, navigate] = useLocation();
  const state = useStore();
  const items = [];
  if (lineWarn)
    items.push(
      <WarnCard
        key="line"
        tag="CẦN KIỂM TRA"
        context="Số điện thoại"
        title={`Bonia chưa nhận cuộc gọi nào từ ${state.line.silentSince}, lâu hơn bình thường. Kiểm tra lại chuyển cuộc gọi.`}
        body={`Ngày thường khách sạn có khoảng ${state.line.normalDailyCalls} cuộc gọi tới Bonia. Kiểm tra ngay sẽ gọi thử tự động; máy quầy có thể đổ chuông.`}
        primary={["Kiểm tra ngay", onCheck]}
        secondary={["Xem mã chuyển cuộc gọi", onShowCode]}
      />
    );
  if (stale)
    items.push(
      <WarnCard
        key="cal"
        tag="LỊCH CŨ"
        context="Lịch phòng"
        title="Lịch phòng chưa cập nhật từ hôm qua. Bonia đang báo phòng trống theo số cũ."
        body={`Lần cập nhật gần nhất: ${state.line.calendarStaleSince}. Thêm khách vãng lai, khách Booking.com, Agoda để Bonia không báo nhầm còn phòng.`}
        primary={["Mở Lịch phòng", () => navigate("/lich")]}
        secondary={["Lịch vẫn đúng", onStillRight]}
      />
    );
  if (!items.length) return null;
  return <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 14 }}>{items}</div>;
}

function WarnCard({ tag, context, title, body, primary, secondary }) {
  return (
    <div role="alert" style={{ ...card("20px 22px", 12), border: "1px solid var(--bn-urgent-line)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <Pill kind="urgent" style={{ letterSpacing: "0.14em" }}>
          {tag}
        </Pill>
        <span style={{ fontSize: 13, color: "var(--bn-muted)" }}>{context}</span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--bn-ink-2)", lineHeight: 1.5 }}>{body}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button size="sm" onClick={primary[1]}>
          {primary[0]}
        </Button>
        <Button variant="secondary" size="sm" onClick={secondary[1]} style={{ padding: "0 18px" }}>
          {secondary[0]}
        </Button>
      </div>
    </div>
  );
}

/** First day (3.2 C): setup progress, empty requests, 14/14 tonight. */
function SetupProgress() {
  const mobile = useIsMobile();
  const p = SETUP_PROGRESS;
  return (
    <div
      style={{
        ...card("20px 22px"),
        display: "grid",
        gridTemplateColumns: mobile ? "1fr" : "minmax(0,1fr) auto",
        gap: "16px 28px",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>
            Bonia đã biết {p.known}/{p.total} điều khách hay hỏi
          </span>
          <span style={{ ...mono, fontSize: 12, color: "var(--bn-muted)", flex: "none" }}>CÒN {p.total - p.known}</span>
        </div>
        <div
          role="meter"
          aria-label="Điều Bonia đã biết"
          aria-valuemin={0}
          aria-valuemax={p.total}
          aria-valuenow={p.known}
          style={{ display: "flex", gap: 4 }}
        >
          {Array.from({ length: p.total }, (_, i) => (
            <span key={i} style={{ flex: 1, height: 6, borderRadius: 2, background: i < p.known ? "var(--bn-clay)" : "var(--bn-skeleton-2)" }} />
          ))}
        </div>
        <div style={{ fontSize: 13, color: "var(--bn-ink-2)" }}>Còn thiếu: {p.missing.join(" · ")}</div>
      </div>
      <Button size="sm" to="/cai-dat" style={{ justifySelf: mobile ? "start" : undefined }}>
        Cài tiếp
      </Button>
    </div>
  );
}

function TodayReady({ empty, warnFrame }) {
  const state = useStore();
  const { setLineStatus, calendarStillRight } = useActions();
  const mobile = useIsMobile();
  const [stale, setStale] = useState(warnFrame);
  const [testOpen, setTestOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [testAt, setTestAt] = useState(null);

  // 3.2 B opens with a silent line; the sidebar shows it on every screen.
  useEffect(() => {
    if (warnFrame) setLineStatus("warn");
  }, [warnFrame, setLineStatus]);
  useEffect(() => setStale(warnFrame), [warnFrame]);

  const lineWarn = state.line.status === "warn";
  const onTestDone = useCallback(
    (t) => {
      setTestAt(t);
      setLineStatus(state.line.listening ? "ok" : "off");
    },
    [setLineStatus, state.line.listening]
  );

  const facts = empty
    ? ["Chuyển cuộc gọi ✓", "Chưa có cuộc gọi nào", `Gọi thử lúc ${testAt || "10:12"} ✓`]
    : [
        "Chuyển cuộc gọi ✓",
        testAt ? `Gọi thử lúc ${testAt} ✓` : `Cuộc gọi gần nhất ${state.line.lastCall}`,
        `Lịch phòng cập nhật ${state.line.calendarUpdated}`,
      ];

  const dialogs = (
    <>
      <TestCallDialog open={testOpen} onClose={() => setTestOpen(false)} onDone={onTestDone} hotel={state.hotel} />
      <ForwardCodeSheet open={codeOpen} onClose={() => setCodeOpen(false)} hotel={state.hotel} />
    </>
  );

  const cols = mobile ? "1fr" : "minmax(0,1fr) 392px";
  const warnings = (
    <Warnings
      lineWarn={lineWarn}
      stale={stale}
      onCheck={() => setTestOpen(true)}
      onShowCode={() => setCodeOpen(true)}
      onStillRight={() => {
        calendarStillRight();
        setStale(false);
      }}
    />
  );
  let body;
  // 3.2 B: the line has been silent. Requests are 0 since 18:00 hôm qua and
  // the empty list says why it may be empty.
  if (lineWarn) {
    body = (
      <Page>
        <Header />
        {warnings}
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Eyebrow>Yêu cầu mới · 0 từ {state.line.silentSince}</Eyebrow>
            <div style={{ borderTop: "1px solid var(--bn-hairline)", padding: "22px 0", fontSize: 14.5, color: "var(--bn-ink-2)", lineHeight: 1.55 }}>
              Không có yêu cầu mới, có thể vì cuộc gọi không tới được Bonia. Kiểm tra đường dây trước khi yên tâm là không có khách gọi.
            </div>
          </div>
          <div style={{ ...card("18px", 8), alignSelf: "start" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <Eyebrow>{stale ? "Tối nay · theo số cũ" : "Tối nay"}</Eyebrow>
              <RoomsLeft {...pick(select.tonight(state))} />
            </div>
            {stale && <div style={{ fontSize: 13, color: "var(--bn-urgent)" }}>Số này có thể sai. Cập nhật Lịch phòng.</div>}
          </div>
        </div>
      </Page>
    );
  } else if (empty) {
    body = (
      <Page>
        <Header />
        <SetupProgress />
        <div style={{ display: "grid", gridTemplateColumns: cols, gap: 28, flex: 1, minHeight: 0 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              gap: 14,
              border: "1px dashed var(--bn-dashed)",
              borderRadius: 14,
              padding: mobile ? 24 : 48,
            }}
          >
            <Eyebrow>Yêu cầu · 0</Eyebrow>
            <div style={{ ...serif, fontSize: mobile ? 26 : 30, lineHeight: 1.2, maxWidth: 520 }}>Chưa có cuộc gọi nào hôm nay.</div>
            <div style={{ fontSize: 15, color: "var(--bn-ink-2)", lineHeight: 1.6, maxWidth: 520 }}>
              Khi Bonia nghe máy thay quầy, đặt phòng và việc của khách đang ở sẽ hiện ở đây, việc gấp lên đầu.
            </div>
            <Button variant="secondary" size="sm" onClick={() => setTestOpen(true)} style={{ padding: "0 18px" }}>
              Gọi thử
            </Button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <StatusCard facts={facts} />
            <div style={card("18px", 8)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <Eyebrow>Tối nay</Eyebrow>
                <RoomsLeft left={14} total={14} />
              </div>
              <div style={{ fontSize: 13, color: "var(--bn-ink-2)", lineHeight: 1.5 }}>
                Lịch phòng chưa có đặt phòng nào. Thêm khách đang ở và khách đã đặt qua Booking.com, Agoda.
              </div>
              <Link href="/lich?f=3.4_C" style={{ fontSize: 14, fontWeight: 500, alignSelf: "flex-start" }}>
                Thêm đặt phòng
              </Link>
            </div>
          </div>
        </div>
      </Page>
    );
  } else {
    body = <TodayMain warnings={warnings} facts={facts} stale={stale} cols={cols} />;
  }

  // Dialogs sit beside the body so a branch change (line back to ok) keeps them open.
  return (
    <>
      {body}
      {dialogs}
    </>
  );
}

/** 3.2 A. On phones the status block comes first. */
function TodayMain({ warnings, facts, stale, cols }) {
  const mobile = useIsMobile();
  const left = (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
      <UrgentList />
      <ConflictBanners />
      <NewRequests />
    </div>
  );
  const right = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {!mobile && <StatusCard facts={facts} />}
      <TonightCard stale={stale} />
      <TodaySwitches />
    </div>
  );
  return (
    <Page>
      <Header />
      {warnings}
      {mobile && <StatusCard facts={facts} />}
      <Stats />
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: cols, gap: mobile ? 22 : 28 }}>
        {left}
        {right}
      </div>
    </Page>
  );
}

const pick = (t) => ({ left: t.remaining, total: t.total });

/** 3.2 D: skeleton in the shape of the ready page. */
function TodayLoading() {
  const widths = ["62%", "48%", "70%", "55%", "66%", "40%", "58%"];
  const mobile = useIsMobile();
  return (
    <Page>
      <TitleBlock />
      <div
        aria-busy="true"
        aria-label="Đang tải"
        style={{
          height: 66,
          borderTop: "1px solid var(--bn-hairline)",
          borderBottom: "1px solid var(--bn-hairline)",
          display: "flex",
          alignItems: "center",
          gap: mobile ? 16 : 40,
          paddingLeft: 16,
          overflow: "hidden",
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <Block key={i} w={90} h={14} r={3} bg="var(--bn-skeleton-2)" />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0,1fr) 392px", gap: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {widths.map((w) => (
            <div key={w} style={{ height: 56, borderBottom: "1px solid var(--bn-skeleton-2)", display: "flex", alignItems: "center", gap: 16 }}>
              <Block w={40} h={10} r={3} bg="var(--bn-skeleton-2)" />
              <Block w={w} h={12} r={3} bg="var(--bn-skeleton-2)" />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Block h={86} />
          <Block h={300} />
          <Block h={140} />
        </div>
      </div>
    </Page>
  );
}

/** 3.8 A: three days before suspension, a strip sits on top of Hôm nay. */
export function ReminderStrip({ style }) {
  const mobile = useIsMobile();
  const r = OVERDUE_REMINDER;
  return (
    <div
      role="alert"
      style={{
        padding: mobile ? "12px 16px" : "14px 40px",
        background: "var(--bn-urgent-bg)",
        color: "var(--bn-urgent)",
        display: "flex",
        flexWrap: mobile ? "wrap" : "nowrap",
        alignItems: "center",
        gap: mobile ? 10 : 14,
        borderBottom: "1px solid var(--bn-urgent-line)",
        ...style,
      }}
    >
      <span
        style={{
          ...mono,
          fontSize: 10,
          letterSpacing: "0.14em",
          border: "1px solid var(--bn-urgent)",
          borderRadius: 4,
          padding: "2px 6px",
          whiteSpace: "nowrap",
        }}
      >
        CÒN {r.daysLeft} NGÀY
      </span>
      <span style={{ flex: 1, minWidth: mobile ? "100%" : 0, fontSize: 14.5, fontWeight: 500, order: mobile ? 3 : 0 }}>{r.text}</span>
      <Button variant="danger" size="xs" to="/thanh-toan" style={{ marginLeft: mobile ? "auto" : 0 }}>
        Thanh toán
      </Button>
    </div>
  );
}

function ReminderFrame() {
  const mobile = useIsMobile();
  return (
    <AppLayout active="hom-nay">
      <Scope>
      <ReminderStrip />
      <div style={{ padding: mobile ? "20px 16px" : "32px 40px", display: "flex", flexDirection: "column", gap: 18, opacity: 0.55 }}>
        <TitleBlock eyebrow={OVERDUE_REMINDER.clockLabel} />
        <div style={{ height: 68, borderTop: "1px solid var(--bn-hairline)", borderBottom: "1px solid var(--bn-hairline)" }} />
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0,1fr) 392px", gap: 28 }}>
          <Block h={420} r={12} />
          <Block h={420} r={14} />
        </div>
      </div>
      </Scope>
    </AppLayout>
  );
}
