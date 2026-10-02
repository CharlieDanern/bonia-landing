import React from "react";
import { useStore } from "../../store/index.jsx";
import { LINE_STATUSES } from "../../data/hotel.js";
import { BONIA_MARK } from "../../lib/assets.js";

// Phone header: mark, hotel name and the line status (shape + colour), so
// "is Bonia answering?" stays visible without the sidebar.
export function MobileTopBar({ status, right }) {
  const state = useStore();
  const st = LINE_STATUSES[status || state.line.status] || LINE_STATUSES.ok;
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        gap: 10,
        minHeight: 52,
        padding: "8px 16px",
        paddingTop: "calc(8px + env(safe-area-inset-top))",
        background: "var(--bn-cream-2)",
        borderBottom: "1px solid var(--bn-hairline)",
      }}
    >
      <img src={BONIA_MARK} alt="Bonia" style={{ height: 20, width: "auto" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {state.hotel.name}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: st.color }}>
          <span style={{ width: 7, height: 7, borderRadius: st.radius, background: st.color, flex: "none" }} />
          {st.text}
        </span>
      </div>
      {right}
    </header>
  );
}
