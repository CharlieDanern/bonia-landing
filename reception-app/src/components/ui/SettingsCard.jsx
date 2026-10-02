import React from "react";
import { useLocation } from "wouter";

// Settings list card (README): white, hairline, radius 12, padding 14 16,
// grid 40px 1fr auto: "§ 01" · title + one-line summary · mark.
const MARKS = {
  ok: { text: "✓", bg: "#FFFFFF", color: "var(--bn-ok)", border: "var(--bn-hairline)" },
  setup: { text: "CẦN CÀI", bg: "var(--bn-urgent-bg)", color: "var(--bn-urgent)", border: "var(--bn-urgent-bg)" },
  review: { text: "CẦN XEM LẠI", bg: "#FFFFFF", color: "var(--bn-clay)", border: "var(--bn-clay)" },
};

export function SettingsMark({ mark }) {
  const m = MARKS[mark] || MARKS.ok;
  return (
    <span
      style={{
        fontFamily: "var(--bn-mono)",
        fontSize: 10,
        letterSpacing: "0.1em",
        padding: "4px 8px",
        borderRadius: 10,
        whiteSpace: "nowrap",
        background: m.bg,
        color: m.color,
        border: `1px solid ${m.border}`,
      }}
    >
      {m.text}
    </span>
  );
}

export function SettingsCard({ n, title, summary, mark = "ok", to, onClick, style }) {
  const [, navigate] = useLocation();
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        if (to) navigate(to);
      }}
      style={{
        display: "grid",
        gridTemplateColumns: "40px minmax(0,1fr) auto",
        gap: 12,
        alignItems: "center",
        padding: "14px 16px",
        background: "#fff",
        border: "1px solid var(--bn-hairline)",
        borderRadius: 12,
        minHeight: 72,
        width: "100%",
        textAlign: "left",
        ...style,
      }}
    >
      <span style={{ fontFamily: "var(--bn-mono)", fontSize: 11, letterSpacing: "0.08em", color: "var(--bn-muted)" }}>
        § {n}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
        <span
          style={{
            fontSize: 12.5,
            color: "var(--bn-ink-2)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {summary}
        </span>
      </div>
      {mark && <SettingsMark mark={mark} />}
    </button>
  );
}
