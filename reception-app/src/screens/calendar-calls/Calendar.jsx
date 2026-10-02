import React, { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { useActions, useStore } from "../../store/index.jsx";
import { AppLayout, Page, PageHeader } from "../../components/shell/index.js";
import { Button } from "../../components/ui/index.js";
import { DAYS, ROOM_TYPE_BY_ID } from "../../data/calendar.js";
import { dayMonth, weekdayShort } from "../../lib/clock.js";
import { useIsMobile, useScreenState } from "../../lib/hooks.js";
import { CalendarGrid } from "./CalendarGrid.jsx";
import { CellSheet } from "./CellSheet.jsx";
import { AddBookingSheet } from "./AddBookingSheet.jsx";
import { MobileCalendar } from "./MobileCalendar.jsx";
import { DarkNote } from "./parts.jsx";
import { HourlyRow, Legend, LimitNote } from "./CalendarBits.jsx";
import "./calendar-calls.css";

// 3.4 Lịch phòng. Frames (?f=): B cell sheet Deluxe T6 9/10 · C Thêm đặt
// phòng (Superior T7 10/10, Mr. Lee, Booking.com) · D stale banner.
// ?state=loading|empty|error → F / E / G.
//
// Under its sheets the handoff draws a reduced page (B: title + plain grid,
// C: title only); frame mode reproduces that, normal use keeps the full page.
const mono = { fontFamily: "var(--bn-mono)" };
const FRAME_B = { roomType: "deluxe", date: "2026-10-09" };
const FRAME_C = { roomType: "superior", date: "2026-10-10", name: "Mr. Lee", source: "Booking.com" };

export function Calendar() {
  const { state: screen, frame } = useScreenState();
  const state = useStore();
  const actions = useActions();
  const mobile = useIsMobile();
  const [, navigate] = useLocation();

  const [cell, setCell] = useState(() => (frame === "3.4_B" ? FRAME_B : null));
  const [adding, setAdding] = useState(() => (frame === "3.4_C" ? FRAME_C : null));
  const [stale, setStale] = useState(frame === "3.4_D");
  const [note, setNote] = useState(null);

  const openCell = useCallback((roomType, date) => setCell({ roomType, date }), []);
  const openAdd = useCallback((init = {}) => {
    setCell(null);
    setAdding(init);
  }, []);
  const closeAdd = useCallback(() => setAdding(null), []);
  const hideNote = useCallback(() => setNote(null), []);
  const onSaved = useCallback(({ roomType, date, name, hourly }) => {
    setAdding(null);
    setStale(false);
    const what = `${ROOM_TYPE_BY_ID[roomType].name} ${weekdayShort(date)} ${dayMonth(date)}${name ? ` · ${name}` : ""}`;
    setNote(hourly ? `Đã ghi khách theo giờ: ${what}.` : `Đã thêm vào lịch: ${what}.`);
  }, []);

  // Frames reduce the page under the sheet; normal use keeps everything.
  const backdrop = frame === "3.4_C" ? "title" : frame === "3.4_B" ? "plain" : "full";
  const sidebarStatus = frame === "3.4_D" ? "warn" : undefined;

  const sheets = (
    <>
      <CellSheet open={!!cell} {...(cell || {})} onClose={() => setCell(null)} onAdd={(roomType, date) => openAdd({ roomType, date })} />
      <AddBookingSheet open={!!adding} initial={adding} focusDate={frame === "3.4_C"} onClose={closeAdd} onSaved={onSaved} />
    </>
  );

  if (screen === "loading") return <Loading />;
  if (screen === "error") return <ErrorState onRetry={() => navigate("/lich")} />;
  if (screen === "empty") return <Empty />;

  if (mobile) {
    return (
      <AppLayout active="lich-phong" status={sidebarStatus}>
        {stale && <StaleBanner mobile onStillRight={() => (actions.calendarStillRight(), setStale(false))} onAdd={() => openAdd()} />}
        <MobileCalendar onCell={openCell} onAdd={() => openAdd()} note={note} onHideNote={hideNote} stale={stale} />
        {sheets}
      </AppLayout>
    );
  }

  if (backdrop === "title") {
    return (
      <AppLayout active="lich-phong">
        <div style={{ padding: "54px 36px" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--bn-serif)", fontWeight: 400, fontSize: 40 }}>Lịch phòng</h2>
        </div>
        {sheets}
      </AppLayout>
    );
  }

  if (backdrop === "plain") {
    return (
      <AppLayout active="lich-phong">
        <Page padding="32px 36px" gap={18}>
          <h2 className="tt-page-title" style={{ paddingTop: 22 }}>
            Lịch phòng
          </h2>
          <CalendarGrid plain onCell={openCell} style={{ marginTop: 70 }} />
        </Page>
        {sheets}
      </AppLayout>
    );
  }

  if (stale) {
    return (
      <AppLayout active="lich-phong" status={sidebarStatus}>
        <StaleBanner onStillRight={() => (actions.calendarStillRight(), setStale(false))} onAdd={() => openAdd()} />
        <Page padding="24px 36px" gap={18}>
          <PageHeader
            eyebrow={<span style={{ color: "var(--bn-urgent)", letterSpacing: "0.18em" }}>Lịch phòng cập nhật lúc {state.calendarMeta.staleSince}</span>}
            title="Lịch phòng"
          />
          {/* As drawn: numbers only, dimmed, since they are the old ones. */}
          <CalendarGrid plain dimmed onCell={openCell} />
        </Page>
        {sheets}
      </AppLayout>
    );
  }

  return (
    <AppLayout active="lich-phong">
      <Page padding="32px 36px" gap={18}>
        <PageHeader
          eyebrow={<span style={{ letterSpacing: "0.18em" }}>Lịch phòng cập nhật lúc {state.calendarMeta.updatedAt} · Bonia chỉ báo phòng trống theo lịch này</span>}
          title="Lịch phòng"
          right={
            <div style={{ display: "flex", gap: 8 }}>
              <RangePill />
              <Button size="sm" onClick={() => openAdd()} style={{ padding: "0 20px" }}>
                Thêm đặt phòng
              </Button>
            </div>
          }
        />
        {note && <DarkNote onHide={hideNote} timeout={6000}>{note}</DarkNote>}
        <LimitNote onAdd={() => openAdd()} />
        <CalendarGrid onCell={openCell} />
        <HourlyRow />
        <Legend />
      </Page>
      {sheets}
    </AppLayout>
  );
}

/** "‹ 8/10 – 21/10 ›": the sample data holds these 14 days only. */
function RangePill() {
  return (
    <span
      style={{
        height: 44,
        padding: "0 16px",
        borderRadius: 22,
        border: "1px solid var(--bn-hairline)",
        background: "#fff",
        fontSize: 14,
        display: "flex",
        alignItems: "center",
        whiteSpace: "nowrap",
      }}
    >
      ‹ {DAYS[0].d} – {DAYS[DAYS.length - 1].d} ›
    </span>
  );
}

/** 3.4 D: no change for 24h → Bonia is answering from old numbers. */
function StaleBanner({ onStillRight, onAdd, mobile = false }) {
  const state = useStore();
  const btn = { height: mobile ? 44 : 40, padding: "0 16px", borderRadius: mobile ? 22 : 20, fontSize: 14, display: "flex", alignItems: "center", whiteSpace: "nowrap" };
  return (
    <div
      role="alert"
      style={{
        padding: mobile ? "14px 16px" : "14px 36px",
        background: "var(--bn-urgent-bg)",
        color: "var(--bn-urgent)",
        display: "flex",
        alignItems: mobile ? "flex-start" : "center",
        flexDirection: mobile ? "column" : "row",
        gap: mobile ? 10 : 14,
        borderBottom: "1px solid var(--bn-urgent-line)",
        flex: "none",
      }}
    >
      <span style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", border: "1px solid var(--bn-urgent)", borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap" }}>
        LỊCH CŨ
      </span>
      <span style={{ flex: 1, fontSize: 14.5, fontWeight: 500 }}>
        Lịch phòng chưa cập nhật từ {state.calendarMeta.staleSince}. Bonia đang báo phòng trống theo số cũ.
      </span>
      {/* Desktop: the buttons sit in the banner's own 14px gap, as drawn. */}
      <span style={{ display: mobile ? "flex" : "contents", gap: 8 }}>
        <button type="button" onClick={onStillRight} style={{ ...btn, border: "1px solid var(--bn-urgent)", background: "#fff", color: "var(--bn-urgent)" }}>
          Lịch vẫn đúng
        </button>
        <button type="button" onClick={onAdd} style={{ ...btn, background: "var(--bn-urgent)", color: "#fff", fontWeight: 500 }}>
          Thêm đặt phòng
        </button>
      </span>
    </div>
  );
}

function Loading() {
  const mobile = useIsMobile();
  return (
    <AppLayout active="lich-phong">
      <Page padding="32px 36px" gap={18} style={{ overflow: "hidden" }}>
        <h2 className="tt-page-title" style={{ marginTop: mobile ? 0 : 22, fontSize: mobile ? 32 : 40 }}>
          Lịch phòng
        </h2>
        <div aria-busy="true" aria-label="Đang tải" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ height: 44, borderRadius: 10, background: "var(--bn-skeleton)" }} />
          {mobile ? (
            Array.from({ length: 4 }, (_, i) => <div key={i} style={{ height: 160, borderRadius: 12, background: "var(--bn-skeleton)" }} />)
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "176px repeat(14,minmax(0,1fr))", gap: 4 }}>
              {Array.from({ length: 90 }, (_, i) => (
                <div key={i} style={{ height: i < 15 ? 44 : 76, borderRadius: 6, background: "var(--bn-skeleton)" }} />
              ))}
            </div>
          )}
        </div>
      </Page>
    </AppLayout>
  );
}

function Empty() {
  const mobile = useIsMobile();
  return (
    <AppLayout active="lich-phong">
      <Page padding="32px 36px" gap={18}>
        <h2 className="tt-page-title" style={{ marginTop: mobile ? 0 : 22, fontSize: mobile ? 32 : 40 }}>
          Lịch phòng
        </h2>
        <div
          style={{
            flex: 1,
            border: "1px dashed var(--bn-dashed)",
            borderRadius: 14,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            gap: 14,
            padding: mobile ? 24 : 64,
          }}
        >
          <div style={{ fontFamily: "var(--bn-serif)", fontSize: mobile ? 26 : 32, lineHeight: 1.2, maxWidth: 620 }}>
            Bonia chưa biết khách sạn có những phòng gì.
          </div>
          <div style={{ fontSize: 15.5, lineHeight: 1.6, color: "var(--bn-ink-2)", maxWidth: 620 }}>
            Cài Phòng &amp; giá trước. Khi đó lịch hiện đủ 14 ngày, và Bonia bắt đầu báo phòng trống theo lịch này.
          </div>
          <Button size="md" to="/cai-dat/02" style={{ padding: "0 22px" }}>
            Mở Phòng &amp; giá
          </Button>
        </div>
      </Page>
    </AppLayout>
  );
}

function ErrorState({ onRetry }) {
  return (
    <AppLayout active="lich-phong">
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div role="alert" style={{ maxWidth: 560, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
          <div style={{ ...mono, fontSize: 11, letterSpacing: "0.2em", color: "var(--bn-urgent)" }}>KHÔNG TẢI ĐƯỢC</div>
          <div style={{ fontFamily: "var(--bn-serif)", fontSize: 32, lineHeight: 1.2 }}>Lịch phòng chưa tải được.</div>
          <div style={{ fontSize: 15.5, lineHeight: 1.6, color: "var(--bn-ink-2)" }}>
            Bonia vẫn báo phòng trống theo lịch lúc 14:05. Thay đổi bạn chưa lưu sẽ không mất; thử lại khi có mạng.
          </div>
          <Button size="md" onClick={onRetry} style={{ padding: "0 24px" }}>
            Thử lại
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
