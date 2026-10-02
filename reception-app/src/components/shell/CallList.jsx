import React, { useState } from "react";
import { useLocation } from "wouter";
import { useStore } from "../../store/index.jsx";
import { PillRow, Skeleton, SkeletonBar } from "../ui/index.js";
import { useIsMobile } from "../../lib/hooks.js";
import { stripAccents } from "../../lib/sms.js";

// TT Call List, exact: 456px pane, search box, "HÔM NAY · 23", rows with
// time · who · tags · summary. mode: all | empty | loading.
const SKELETON_WIDTHS = ["55%", "40%", "62%", "48%", "66%", "44%", "58%", "50%", "38%"];

/** Tag pills for a call: ĐÃ BÁO first, then GẤP / TIẾNG ANH, then types. */
export function callPills(call) {
  const pills = [];
  if (call.reported) pills.push({ kind: "reported", text: "ĐÃ BÁO" });
  if (call.urgent) pills.push({ kind: "urgent", text: "GẤP" });
  if (call.lang === "en") pills.push({ kind: "processing", text: "TIẾNG ANH" });
  for (const t of call.tags || []) pills.push({ kind: "type", text: t });
  return pills;
}

const norm = (s) => stripAccents(String(s || "")).toLowerCase().replace(/\s/g, "");

export function CallList({ selectedId, mode = "all", onSelect, width = 456, style }) {
  const state = useStore();
  const [, navigate] = useLocation();
  const mobile = useIsMobile();
  const [q, setQ] = useState("");
  const rows = q ? state.calls.filter((c) => norm(`${c.who} ${c.phone} ${c.summary}`).includes(norm(q))) : state.calls;
  const open = (id) => (onSelect ? onSelect(id) : navigate(`/cuoc-goi/${id}`));

  return (
    <div
      style={{
        width: mobile ? "100%" : width,
        // Phones scroll the whole page; desktop scrolls the rows inside the pane.
        height: mobile ? "auto" : "100%",
        flex: "none",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: mobile ? "20px 16px 0" : "28px 20px 0 28px",
        borderRight: mobile ? 0 : "1px solid var(--bn-hairline)",
        fontFamily: "var(--bn-sans)",
        color: "var(--bn-ink)",
        overflow: mobile ? "visible" : "hidden",
        ...style,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ margin: 0, fontFamily: "var(--bn-serif)", fontWeight: 400, fontSize: 34, letterSpacing: "-0.02em" }}>Cuộc gọi</h2>
        <span style={{ fontFamily: "var(--bn-mono)", fontSize: 10.5, letterSpacing: "0.16em", color: "var(--bn-muted)", whiteSpace: "nowrap" }}>
          {mode === "empty" ? "HÔM NAY · 0" : "THỨ NĂM 8/10"}
        </span>
      </div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Tìm theo số hoặc tên"
        aria-label="Tìm theo số hoặc tên"
        className="tt-search"
        style={{
          height: 44,
          border: "1px solid var(--bn-hairline)",
          borderRadius: 10,
          background: "#fff",
          padding: "0 14px",
          fontSize: 14,
          flex: "none",
          outline: 0,
          width: "100%",
        }}
      />

      {mode === "all" && (
        <div style={{ display: "flex", flexDirection: "column", margin: "0 -8px", overflowY: mobile ? "visible" : "auto", minHeight: 0, paddingBottom: 16 }}>
          <div style={{ fontFamily: "var(--bn-mono)", fontSize: 10, letterSpacing: "0.2em", color: "var(--bn-muted)", padding: "4px 12px 6px" }}>
            HÔM NAY · {q ? rows.length : state.todayStats.handled}
          </div>
          {rows.map((c) => {
            const on = c.id === selectedId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => open(c.id)}
                aria-current={on ? "true" : undefined}
                className={on ? undefined : "tt-row-btn"}
                style={{
                  display: "grid",
                  gridTemplateColumns: "48px minmax(0,1fr)",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 10,
                  background: on ? "#FFFFFF" : "transparent",
                  border: `1px solid ${on ? "var(--bn-clay)" : "transparent"}`,
                  textAlign: "left",
                  width: "100%",
                  flex: "none",
                }}
              >
                <span style={{ fontFamily: "var(--bn-mono)", fontSize: 12, color: "var(--bn-ink-2)", paddingTop: 2 }}>{c.time}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.who}</span>
                    <PillRow pills={callPills(c)} size="sm" />
                  </div>
                  <span style={{ fontSize: 12.5, color: "var(--bn-ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.summary}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {mode === "empty" && (
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12, padding: "0 4px" }}>
          <div style={{ fontFamily: "var(--bn-serif)", fontSize: 26, lineHeight: 1.25 }}>Chưa có cuộc gọi nào hôm nay.</div>
          <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--bn-ink-2)" }}>
            Bonia chỉ nghe khi lễ tân không bắt máy. Ngày quầy bắt máy hết thì ở đây trống, và đó là chuyện tốt.
          </div>
          <span style={{ fontSize: 14, color: "var(--bn-clay)", fontWeight: 500 }}>Xem hôm qua · {state.todayStats.yesterdayCalls} cuộc</span>
        </div>
      )}

      {mode === "loading" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }} aria-busy="true" aria-label="Đang tải">
          {SKELETON_WIDTHS.map((w, i) => (
            <Skeleton key={i} height={56} style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 12px", flex: "none" }}>
              <SkeletonBar width={36} height={10} />
              <SkeletonBar width={w} />
            </Skeleton>
          ))}
        </div>
      )}
    </div>
  );
}
