import React from "react";
import { Link } from "wouter";
import { ActivityRow, Button, MessageFlag, StatusPill } from "../../components/ui/index.js";
import { useIsMobile } from "../../lib/hooks.js";
import { select } from "../../store/index.jsx";

// Building blocks of the Yêu cầu detail pane, copied from the 3.3 frames:
// header pills, title, the 170px label grid, note boxes, history, the
// sticky action bar and the two strips that sit above the detail (the
// "Bạn đã gửi tin…" question and the "Chưa lưu" error).

const SELL_MODE = { "theo-ngay": "THEO NGÀY", "theo-gio": "THEO GIỜ", "qua-dem": "QUA ĐÊM" };

/** Type · GẤP · QUÁ HẠN · status · message flag, plus the mono line on the right. */
export function DetailHeader({ r, right, flag = true }) {
  const open = select.statusGroup(r.status) !== "xong";
  const type = r.sellMode ? `${r.typeLabel} · ${SELL_MODE[r.sellMode]}` : r.typeLabel;
  const mobile = useIsMobile();
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: mobile ? "wrap" : "nowrap" }}>
      <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <StatusPill kind="type">{type}</StatusPill>
        {r.urgent && open && <StatusPill kind="urgent">GẤP</StatusPill>}
        {r.overdue && open && <StatusPill kind="overdue">QUÁ HẠN</StatusPill>}
        <StatusPill kind={select.statusPill(r.status).kind}>{select.statusPill(r.status).text}</StatusPill>
        {flag && r.needsMessage && r.status !== "da-tu-choi" && <MessageFlag messagedAt={r.messagedAt} />}
      </span>
      {right && <span style={{ fontFamily: "var(--bn-mono)", fontSize: 11, color: "var(--bn-muted)", whiteSpace: "nowrap" }}>{right}</span>}
    </div>
  );
}

/** "BONIA GHI 14:02 · TIẾNG ANH" */
export function recordedLabel(r, { time = true } = {}) {
  const parts = [];
  if (time && r.recordedAt) parts.push(`BONIA GHI ${r.recordedAt}`);
  if (r.lang === "en") parts.push("TIẾNG ANH");
  return parts.join(" · ");
}

/** Guest name in serif 34 + phone, with "▶ Nghe cuộc gọi" on the right. */
export function GuestTitle({ title, phone, sub, callId, callMinutes }) {
  const mobile = useIsMobile();
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: mobile ? "flex-start" : "flex-end", gap: 12, flexDirection: mobile ? "column" : "row" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--bn-serif)", fontSize: mobile ? 30 : 34, letterSpacing: "-0.02em" }}>{title}</div>
        {sub}
        {phone && <div style={{ fontFamily: "var(--bn-mono)", fontSize: 14, color: "var(--bn-ink-2)" }}>{phone}</div>}
      </div>
      {callId && callMinutes && (
        <Link href={`/cuoc-goi/${callId}`} style={{ fontSize: 14, color: "var(--bn-clay)", fontWeight: 500, whiteSpace: "nowrap" }}>
          ▶ Nghe cuộc gọi · {callMinutes} phút
        </Link>
      )}
    </div>
  );
}

/** "302  Máy lạnh không lạnh": room in mono 72, task in serif 30. */
export function RoomTitle({ room, task }) {
  const mobile = useIsMobile();
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: mobile ? 14 : 22, flexWrap: "wrap" }}>
      <span style={{ fontFamily: "var(--bn-mono)", fontSize: mobile ? 56 : 72, lineHeight: 1, letterSpacing: "-0.02em" }}>{room}</span>
      <span style={{ fontFamily: "var(--bn-serif)", fontSize: mobile ? 24 : 30, lineHeight: 1.2 }}>{task}</span>
    </div>
  );
}

/** Label/value grid: 170px labels (muted 13.5) and 15px values. rows = [[label, value, {urgent, mono, note}]]. */
export function InfoGrid({ rows }) {
  const mobile = useIsMobile();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: mobile ? "112px minmax(0,1fr)" : "170px minmax(0,1fr)",
        gap: "11px 16px",
        fontSize: 15,
        borderTop: "1px solid var(--bn-hairline-2)",
        paddingTop: 16,
      }}
    >
      {rows.filter(Boolean).map(([label, value, o = {}]) => (
        <React.Fragment key={label}>
          <span style={{ color: "var(--bn-muted)", fontSize: 13.5 }}>{label}</span>
          <span style={{ color: o.urgent ? "var(--bn-urgent)" : undefined, fontFamily: o.mono ? "var(--bn-mono)" : undefined }}>
            {value}
            {o.note && (
              <>
                {" "}
                <span style={{ color: "var(--bn-muted)", fontSize: 13 }}>· {o.note}</span>
              </>
            )}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

/** Quiet note box with a mono label ("BONIA ĐÃ NÓI VỚI KHÁCH"). */
export function NoteBox({ label, children }) {
  return (
    <div style={{ padding: "14px 16px", background: "var(--bn-cream-3)", border: "1px solid var(--bn-hairline-2)", borderRadius: 10, display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontFamily: "var(--bn-mono)", fontSize: 9.5, letterSpacing: "0.18em", color: "var(--bn-muted)" }}>{label}</span>
      <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

/** Dashed urgent box (⚠ conflict, "Có thể đã hết phòng"). */
export function WarnBox({ title, children }) {
  return (
    <div
      role="alert"
      style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 16px", border: "1px dashed var(--bn-urgent)", borderRadius: 10, background: "var(--bn-urgent-wash)" }}
    >
      <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--bn-urgent)" }}>{title}</div>
      {children && <div style={{ fontSize: 13.5, color: "var(--bn-ink-2)" }}>{children}</div>}
    </div>
  );
}

/** "Lịch sử · 3": collapsed row with ›, or the open list (time · device · action). */
export function History({ rows = [], open, onToggle }) {
  const mobile = useIsMobile();
  if (!open) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded="false"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--bn-hairline-2)", paddingTop: 12, fontSize: 13.5, color: "var(--bn-ink-2)", width: "100%", minHeight: mobile ? 44 : undefined }}
      >
        <span>Lịch sử · {rows.length}</span>
        <span style={{ color: "var(--bn-muted)" }}>›</span>
      </button>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--bn-hairline-2)", paddingTop: 12 }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded="true"
        style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, paddingBottom: 8, width: "100%" }}
      >
        <span style={{ fontWeight: 600, color: "var(--bn-ink)" }}>Lịch sử · {rows.length}</span>
        {onToggle && <span style={{ color: "var(--bn-muted)" }}>⌃</span>}
      </button>
      {rows.map((h, i) => (
        <ActivityRow
          key={`${h.t}-${i}`}
          t={h.t}
          d={h.d}
          a={h.a}
          urgent={h.urgent}
          columns={mobile ? "48px 96px minmax(0,1fr)" : "56px 150px minmax(0,1fr)"}
          padding="8px 0"
          style={{ gap: mobile ? 8 : 12 }}
        />
      ))}
    </div>
  );
}

/** Sticky action bar under the detail. actions = [{ label, primary, onClick, href, loading, disabled }]. */
export function ActionBar({ actions = [], aside, children }) {
  const mobile = useIsMobile();
  if (!actions.length && !aside && !children) return null;
  return (
    <div
      style={{
        padding: mobile ? "12px 16px" : "16px 36px",
        borderTop: "1px solid var(--bn-hairline)",
        display: "flex",
        gap: mobile ? 8 : 10,
        alignItems: "center",
        flexWrap: mobile ? "wrap" : "nowrap",
        background: "#fff",
        flex: "none",
        ...(mobile ? { position: "sticky", bottom: "calc(var(--bn-tab-h) + env(safe-area-inset-bottom))", zIndex: 5 } : null),
      }}
    >
      {actions.map((a) => (
        <Button
          key={a.label}
          variant={a.primary ? "primary" : "secondary"}
          size="md"
          href={a.href}
          onClick={a.onClick}
          loading={a.loading}
          disabled={a.disabled}
          style={{ padding: a.primary ? "0 22px" : "0 20px", fontWeight: a.primary ? 500 : 400, ...(mobile ? { flex: a.primary ? "1 1 100%" : "1 1 0" } : null), ...a.style }}
        >
          {a.content ?? a.label}
        </Button>
      ))}
      {children}
      {aside && <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--bn-muted)", ...(mobile ? { flexBasis: "100%", marginLeft: 0 } : null) }}>{aside}</span>}
    </div>
  );
}

/** Dark strip after the message sheet: "Bạn đã gửi tin cho anh Kevin chưa?" */
export function AskSentBar({ guest, onSent, onNotYet }) {
  const mobile = useIsMobile();
  return (
    <div
      role="status"
      style={{
        margin: mobile ? "12px 16px 0" : "20px 24px 0",
        padding: "14px 18px",
        background: "var(--bn-ink)",
        color: "var(--bn-cream-2)",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: mobile ? "wrap" : "nowrap",
        flex: "none",
      }}
    >
      <span style={{ flex: 1, fontSize: 15, minWidth: mobile ? "100%" : 0 }}>Bạn đã gửi tin cho {guest} chưa?</span>
      <button
        type="button"
        onClick={onSent}
        style={{ height: mobile ? 44 : 40, padding: "0 18px", borderRadius: 20, background: "var(--bn-cream-2)", color: "var(--bn-ink)", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", flex: mobile ? 1 : "none" }}
      >
        Đã gửi
      </button>
      <button
        type="button"
        onClick={onNotYet}
        style={{ height: mobile ? 44 : 40, padding: "0 18px", borderRadius: 20, border: "1px solid var(--bn-muted)", fontSize: 14, whiteSpace: "nowrap", flex: mobile ? 1 : "none" }}
      >
        Chưa
      </button>
    </div>
  );
}

/** Failed save (3.3 L): says exactly what did not happen. */
export function SaveErrorBar({ children, onRetry }) {
  const mobile = useIsMobile();
  return (
    <div
      role="alert"
      style={{
        margin: mobile ? "12px 16px 0" : "20px 24px 0",
        padding: "14px 18px",
        background: "var(--bn-urgent-bg)",
        color: "var(--bn-urgent)",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: mobile ? "wrap" : "nowrap",
        flex: "none",
      }}
    >
      <span style={{ fontFamily: "var(--bn-mono)", fontSize: 10, letterSpacing: "0.14em", border: "1px solid var(--bn-urgent)", borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap" }}>
        CHƯA LƯU
      </span>
      <span style={{ flex: 1, fontSize: 14.5, fontWeight: 500, minWidth: mobile ? "70%" : 0 }}>{children}</span>
      <Button variant="danger" size="xs" onClick={onRetry}>
        Thử lại
      </Button>
    </div>
  );
}

/** The grey "waiting" look of the main button while a save is retrying (3.3 L). */
export function WaitingLabel({ children }) {
  return (
    <>
      <span
        className="tt-spinner"
        aria-hidden="true"
        style={{ width: 14, height: 14, borderColor: "var(--bn-dashed)", borderTopColor: "var(--bn-muted)", marginRight: -2 }}
      />
      {children}
    </>
  );
}

/**
 * Lost-item stepper (3.3 H). Local variant of the shared StepPills: the
 * frame draws the current step as a borderless clay fill, 2px smaller
 * than the outlined steps around it.
 */
export function Stepper({ steps }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, flexWrap: "wrap" }}>
      {steps.map((s, i) => {
        const css =
          s.state === "current"
            ? { background: "var(--bn-clay)", color: "#fff", fontWeight: 500 }
            : s.state === "done"
              ? { border: "1px solid var(--bn-hairline)", color: "var(--bn-muted)" }
              : { border: "1px dashed var(--bn-dashed)", color: "var(--bn-muted)" };
        return (
          <React.Fragment key={s.label}>
            {i > 0 && <span style={{ width: 16, height: 1, background: "var(--bn-hairline)", flex: "none" }} />}
            <span aria-current={s.state === "current" ? "step" : undefined} style={{ padding: "6px 10px", borderRadius: 14, whiteSpace: "nowrap", ...css }}>
              {s.state === "done" ? `✓ ${s.label}` : s.label}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
}
