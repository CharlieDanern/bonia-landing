import React from "react";
import { Link } from "wouter";
import { useStore, select } from "../../store/index.jsx";
import { NAV_ITEMS } from "./nav.js";

// Below 768px the sidebar becomes a bottom tab bar with the same 5 tabs
// (README "Responsive"). 64px + safe area, 44px+ touch targets.
export function MobileTabBar({ active, counts }) {
  const state = useStore();
  const c = counts ?? select.sidebarCounts(state);
  return (
    <nav
      className="tt-tabbar"
      aria-label="Chính"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        height: "calc(var(--bn-tab-h) + env(safe-area-inset-bottom))",
        paddingBottom: "env(safe-area-inset-bottom)",
        background: "var(--bn-cream-2)",
        borderTop: "1px solid var(--bn-hairline)",
        display: "grid",
        gridTemplateColumns: `repeat(${NAV_ITEMS.length},1fr)`,
      }}
    >
      {NAV_ITEMS.map((it) => {
        const on = it.key === active;
        return (
          <Link
            key={it.key}
            href={it.to}
            aria-current={on ? "page" : undefined}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              minHeight: 44,
              fontSize: 12,
              fontWeight: on ? 600 : 400,
              color: on ? "var(--bn-clay)" : "var(--bn-ink-2)",
              borderTop: `2px solid ${on ? "var(--bn-clay)" : "transparent"}`,
              marginTop: -1,
            }}
          >
            <span style={{ whiteSpace: "nowrap" }}>{it.label}</span>
            <span style={{ fontFamily: "var(--bn-mono)", fontSize: 10, minHeight: 12, color: on ? "var(--bn-clay)" : "var(--bn-muted)" }}>
              {c[it.key] || ""}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
