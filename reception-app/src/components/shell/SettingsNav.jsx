import React from "react";
import { Link } from "wouter";
import { useStore, select } from "../../store/index.jsx";
import { NAV_MARK_TEXT } from "../../data/settings.js";

// TT Settings Nav, exact: 248px, right border #E4DCCB, padding 28 12.
// active: "01"…"11" | "tk" (Tài khoản) | "tg" (Trợ giúp).
// marks override per section: { "05": "setup" } (else from the store).
export function SettingsNav({ active = "01", marks }) {
  const state = useStore();
  const m = { ...select.sectionMarks(state), ...marks };
  const items = [
    ...state.sections.map((s) => ({ key: s.n, n: s.n, label: s.title, mark: NAV_MARK_TEXT[m[s.n]] ?? "", to: `/cai-dat/${s.n}` })),
    { key: "tk", n: "", label: "Tài khoản", mark: "", to: "/tai-khoan" },
    { key: "tg", n: "", label: "Trợ giúp", mark: "", to: "/tro-giup" },
  ];
  return (
    <nav
      aria-label="Cài đặt"
      style={{
        width: 248,
        height: "100%",
        flex: "none",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--bn-skeleton-2)",
        padding: "28px 12px",
        gap: 2,
        fontFamily: "var(--bn-sans)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontFamily: "var(--bn-mono)",
          fontSize: 10,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--bn-muted)",
          padding: "0 10px 12px",
        }}
      >
        Cài đặt
      </div>
      {items.map((it) => {
        const on = it.key === active;
        const mc = it.mark === "✓" ? "var(--bn-ok)" : it.mark ? "var(--bn-urgent)" : "var(--bn-muted)";
        return (
          <Link
            key={it.key}
            href={it.to}
            aria-current={on ? "page" : undefined}
            className={on ? undefined : "tt-nav-item"}
            style={{
              minHeight: 40,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "0 10px",
              borderRadius: 8,
              background: on ? "#FFFFFF" : "transparent",
              borderTop: it.key === "tk" ? "1px solid var(--bn-skeleton-2)" : 0,
              color: "var(--bn-ink)",
            }}
          >
            <span style={{ fontFamily: "var(--bn-mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--bn-muted)", width: 20, flex: "none" }}>
              {it.n}
            </span>
            <span style={{ flex: 1, fontSize: 13.5, color: "var(--bn-ink)", fontWeight: on ? 600 : 400 }}>{it.label}</span>
            <span style={{ fontFamily: "var(--bn-mono)", fontSize: 9.5, letterSpacing: "0.08em", color: mc }}>{it.mark}</span>
          </Link>
        );
      })}
    </nav>
  );
}
