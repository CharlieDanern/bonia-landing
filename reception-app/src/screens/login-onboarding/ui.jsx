import React from "react";

// Small pieces shared by the login and onboarding screens (exact frame
// styles; the app-wide ones live in components/ui).

export const MONO = "var(--bn-mono)";
export const SERIF = "var(--bn-serif)";

/** Mono uppercase step label ("Bước 1 · Tìm"). */
export function Eyebrow({ children, color = "var(--bn-muted)", style }) {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: 11,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Serif step title (40px unless the frame says otherwise). */
export function Title({ children, size = 40, lineHeight, className = "lo-title", style }) {
  return (
    <h2
      className={className}
      style={{
        margin: 0,
        fontFamily: SERIF,
        fontWeight: 400,
        fontSize: size,
        lineHeight,
        letterSpacing: "-0.02em",
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

/** Field label, optionally with a muted note ("· không bắt buộc"). */
export function FieldLabel({ children, note, htmlFor, style }) {
  return (
    <label htmlFor={htmlFor} style={{ fontSize: 14, fontWeight: 500, ...style }}>
      {children}
      {note && <span style={{ fontWeight: 400, color: "var(--bn-muted)" }}> · {note}</span>}
    </label>
  );
}

/** Rounded mono tag (ĐẶT PHÒNG / MỚI / GỌI THỬ, LỖI / HẾT HẠN). */
export function MonoTag({ children, tone = "line", style }) {
  const tones = {
    line: { border: "1px solid var(--bn-hairline)" },
    new: { border: "1px solid var(--bn-clay)", color: "var(--bn-clay)" },
    fill: { background: "var(--bn-processing-bg)", color: "var(--bn-ink-2)" },
  };
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: 10,
        letterSpacing: "0.12em",
        padding: "4px 8px",
        borderRadius: 10,
        whiteSpace: "nowrap",
        ...tones[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** Choice pill used for carriers and device names (40/36px). */
export function ChoicePill({ selected, onClick, children, height = 40, padding = "0 16px", bold = true, style }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="tt-chip"
      style={{
        height,
        padding,
        borderRadius: height / 2,
        border: `1px solid ${selected ? "var(--bn-clay)" : "var(--bn-hairline)"}`,
        color: selected ? "var(--bn-clay)" : "var(--bn-ink)",
        background: "#fff",
        fontSize: 14,
        fontWeight: selected && bold ? 500 : 400,
        display: "flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        flex: "none",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** Radio dot as drawn (22px, 6px clay ring when on). */
export function RadioDot({ on, size = 22, ring = 6 }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        border: on ? `${ring}px solid var(--bn-clay)` : "1px solid var(--bn-dashed)",
        flex: "none",
        display: "block",
        background: "#fff",
      }}
    />
  );
}

/** Mock push notification card (3.0 E and the demo toast). */
export function PushCard({ mark, code, style, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      style={{
        background: "#fff",
        border: "1px solid var(--bn-hairline)",
        borderRadius: 16,
        padding: "16px 18px",
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        textAlign: "left",
        width: "100%",
        ...style,
      }}
    >
      <img src={mark} alt="" style={{ height: 20, width: "auto", marginTop: 2 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--bn-muted)" }}>
          <span style={{ fontWeight: 600, color: "var(--bn-ink)" }}>Bonia</span>
          <span>bây giờ</span>
        </div>
        <div style={{ fontSize: 14 }}>
          Mã đăng nhập Bonia Tiếp tân: <span style={{ fontFamily: MONO, fontWeight: 500 }}>{code}</span>
        </div>
      </div>
    </Tag>
  );
}

/** "0900000300" → "0900 000 300" while typing (max 10 digits). */
export function formatPhoneInput(raw) {
  const d = String(raw || "")
    .replace(/\D/g, "")
    .slice(0, 10);
  return [d.slice(0, 4), d.slice(4, 7), d.slice(7)].filter(Boolean).join(" ");
}

/** 45 → "0:45" */
export function mmss(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
