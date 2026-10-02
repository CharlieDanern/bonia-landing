import React from "react";
import { Link } from "wouter";
import { useStore, select } from "../../store/index.jsx";
import { LINE_STATUSES } from "../../data/hotel.js";
import { BONIA_MARK } from "../../lib/assets.js";
import { decimal, percent } from "../../lib/format.js";
import { NAV_ITEMS } from "./nav.js";

// TT Sidebar, exact: 224px, #F7F3EC, right hairline, padding 22/14/18.
// active: hom-nay | yeu-cau | lich-phong | cuoc-goi | cai-dat | none
// status / counts override the store (frames: 3.2 B warn, 3.2 C no counts).
const mono = { fontFamily: "var(--bn-mono)" };

export function Sidebar({ active = "hom-nay", status, counts }) {
  const state = useStore();
  const st = LINE_STATUSES[status || state.line.status] || LINE_STATUSES.ok;
  const c = counts ?? select.sidebarCounts(state);
  const m = state.minutes;

  return (
    <aside
      style={{
        width: 224,
        height: "100%",
        flex: "none",
        display: "flex",
        flexDirection: "column",
        background: "var(--bn-cream-2)",
        borderRight: "1px solid var(--bn-hairline)",
        padding: "22px 14px 18px",
        gap: 22,
        fontFamily: "var(--bn-sans)",
        color: "var(--bn-ink)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 8px" }}>
        <img src={BONIA_MARK} alt="Bonia" style={{ height: 22, width: "auto", display: "block" }} />
        <span style={{ ...mono, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--bn-muted)" }}>
          Tiếp tân
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 8px" }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{state.hotel.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: st.color }}>
          <span style={{ width: 8, height: 8, borderRadius: st.radius, background: st.color, flex: "none" }} />
          {st.text}
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }} aria-label="Chính">
        {NAV_ITEMS.map((it) => {
          const on = it.key === active;
          return (
            <Link
              key={it.key}
              href={it.to}
              aria-current={on ? "page" : undefined}
              className={on ? undefined : "tt-nav-item"}
              style={{
                height: 42,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 12px",
                borderRadius: 10,
                background: on ? "var(--bn-clay)" : "transparent",
                color: on ? "#FFFFFF" : "var(--bn-ink)",
                fontSize: 14,
                fontWeight: on ? 600 : 400,
                whiteSpace: "nowrap",
                flex: "none",
              }}
            >
              <span>{it.label}</span>
              <span style={{ ...mono, fontSize: 11, color: on ? "#FFFFFF" : "var(--bn-ink)" }}>{c[it.key] || ""}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 14, padding: "0 8px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              ...mono,
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--bn-muted)",
            }}
          >
            <span>{m.monthLabel}</span>
            <span>
              {decimal(m.used)} / {m.included} phút
            </span>
          </div>
          <div
            role="meter"
            aria-label="Phút đã dùng tháng này"
            aria-valuemin={0}
            aria-valuemax={m.included}
            aria-valuenow={m.used}
            style={{ height: 4, borderRadius: 2, background: "var(--bn-skeleton-2)", overflow: "hidden" }}
          >
            <div style={{ width: percent(m.used, m.included), height: "100%", background: "var(--bn-clay)" }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 13 }}>
          <Link href="/thanh-toan" className="tt-side-link" style={{ height: 32, display: "flex", alignItems: "center", color: "var(--bn-ink-2)" }}>
            Thanh toán
          </Link>
          <Link href="/tro-giup" className="tt-side-link" style={{ height: 32, display: "flex", alignItems: "center", color: "var(--bn-ink-2)" }}>
            Trợ giúp
          </Link>
        </div>
        <div
          style={{
            ...mono,
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--bn-muted)",
            borderTop: "1px solid var(--bn-skeleton-2)",
            paddingTop: 12,
          }}
        >
          {state.device}
        </div>
      </div>
    </aside>
  );
}
