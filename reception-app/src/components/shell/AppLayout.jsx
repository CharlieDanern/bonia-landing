import React from "react";
import { useLocation } from "wouter";
import { useIsMobile } from "../../lib/hooks.js";
import { Sidebar } from "./Sidebar.jsx";
import { MobileTabBar } from "./MobileTabBar.jsx";
import { MobileTopBar } from "./MobileTopBar.jsx";
import { SettingsNav } from "./SettingsNav.jsx";
import { navKeyForPath } from "./nav.js";
import "./shell.css";

// Desktop (≥768px): 224px sidebar + main filling the rest of the viewport.
// Phone (<768px): top bar + content + bottom tab bar.
// `main` has no padding: list/detail screens fill it edge to edge; padded
// pages wrap their content in <Page>.
//
// active / status / counts override what the sidebar derives (frames).
export function AppLayout({ active, status, counts, children, mainStyle }) {
  const mobile = useIsMobile();
  const [path] = useLocation();
  const key = active ?? navKeyForPath(path);

  if (mobile) {
    return (
      <div style={{ minHeight: "100%", display: "flex", flexDirection: "column", background: "var(--bn-cream)" }}>
        <MobileTopBar status={status} />
        <main
          style={{
            flex: 1,
            minWidth: 0,
            position: "relative",
            paddingBottom: "calc(var(--bn-tab-h) + env(safe-area-inset-bottom))",
            ...mainStyle,
          }}
        >
          {children}
        </main>
        <MobileTabBar active={key} counts={counts} />
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", background: "var(--bn-cream)", overflow: "hidden" }}>
      <Sidebar active={key} status={status} counts={counts} />
      <main
        style={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          ...mainStyle,
        }}
      >
        {children}
      </main>
    </div>
  );
}

/** Padded page body: 32px 40px on desktop (36 on the calendar), 16px gutter on phones. */
export function Page({ children, padding, gap = 22, style }) {
  const mobile = useIsMobile();
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: mobile ? "20px 16px 24px" : padding ?? "32px 40px",
        display: "flex",
        flexDirection: "column",
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Mono eyebrow + Source Serif 40px title, optional right-side actions. */
export function PageHeader({ eyebrow, title, right, size = 40, gap = 8, style }) {
  const mobile = useIsMobile();
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: mobile ? "flex-start" : "flex-end",
        flexDirection: mobile ? "column" : "row",
        gap: mobile ? 12 : 24,
        ...style,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap }}>
        {eyebrow && <div className="tt-eyebrow">{eyebrow}</div>}
        <h2 className="tt-page-title" style={{ fontSize: mobile ? Math.min(size, 32) : size }}>
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

/**
 * Settings detail frame: sidebar + 248px settings nav + scrolling content.
 * active: "01"…"11" | "tk" | "tg". Content usually ends with a <SaveBar>.
 */
export function SettingsLayout({ active, marks, children, mainStyle }) {
  const mobile = useIsMobile();
  return (
    <AppLayout
      active="cai-dat"
      mainStyle={mobile ? mainStyle : { flexDirection: "row", overflow: "hidden", ...mainStyle }}
    >
      {!mobile && <SettingsNav active={active} marks={marks} />}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", position: "relative", overflowY: "auto" }}>{children}</div>
    </AppLayout>
  );
}
