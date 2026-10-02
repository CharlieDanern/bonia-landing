import React, { useState } from "react";
import { useLocation } from "wouter";
import { useStore, select } from "../../store/index.jsx";
import { REQUEST_TYPES, STATUS_GROUPS } from "../../data/requests.js";
import { Chip, PillRow, Segmented, SkeletonRow } from "../ui/index.js";
import { useIsMobile } from "../../lib/hooks.js";

// TT Request List, exact: 456px pane, padding 28 20 0 28, right hairline.
// Segments Mới · Đang xử lý · Xong · Tất cả, type chips + "Chưa nhắn khách",
// rows newest first with urgent pinned. mode: all | empty | loading.
//
// Filters are controlled when `filter` + `onFilterChange` are passed,
// otherwise kept here. filter = { segment, type, notMessaged }.
export const DEFAULT_FILTER = { segment: "all", type: "all", notMessaged: false };

const SKELETON_WIDTHS = ["48%", "62%", "40%", "55%", "66%", "44%", "58%", "50%"];

export function RequestList({ selectedId, mode = "all", filter: controlled, onFilterChange, onSelect, width = 456, style }) {
  const state = useStore();
  const [, navigate] = useLocation();
  const mobile = useIsMobile();
  const [own, setOwn] = useState(DEFAULT_FILTER);
  const filter = controlled ?? own;
  const setFilter = (f) => (onFilterChange ? onFilterChange(f) : setOwn(f));

  const counts = select.segmentCounts(state);
  const unsent = select.notMessaged(state);

  let rows = select.sortRequests(state.requests);
  if (filter.segment !== "all") rows = rows.filter((r) => STATUS_GROUPS[filter.segment].includes(r.status));
  if (filter.type !== "all") rows = rows.filter((r) => r.type === filter.type);
  if (filter.notMessaged) rows = rows.filter((r) => unsent.includes(r));
  const effectiveMode = mode === "all" && rows.length === 0 ? "empty" : mode;

  const seg = [
    { value: "moi", label: "Mới", count: mode === "empty" ? "0" : String(counts.moi) },
    { value: "dang-xu-ly", label: "Đang xử lý", count: String(counts["dang-xu-ly"]) },
    { value: "xong", label: "Xong", count: "" },
    { value: "all", label: "Tất cả", count: "" },
  ];
  const chips = [{ id: "all", label: "Mọi loại" }, ...REQUEST_TYPES.map((t) => ({ id: t.id, label: t.label }))];
  const open = (id) => (onSelect ? onSelect(id) : navigate(`/yeu-cau/${id}`));

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
        <h2 style={{ margin: 0, fontFamily: "var(--bn-serif)", fontWeight: 400, fontSize: 34, letterSpacing: "-0.02em" }}>Yêu cầu</h2>
        <span style={{ fontFamily: "var(--bn-mono)", fontSize: 10.5, letterSpacing: "0.16em", color: "var(--bn-muted)" }}>MỚI NHẤT TRƯỚC</span>
      </div>

      <Segmented
        options={seg}
        value={mode === "empty" ? "moi" : filter.segment}
        onChange={(v) => setFilter({ ...filter, segment: v })}
        // 40px control (38 + borders). In the frames' list mode the pane
        // overflows and flex shrinks the overflow:hidden control to 36px;
        // match that so list frames line up.
        height={effectiveMode === "all" ? 34 : 38}
        style={{ flex: "none" }}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: "none" }}>
        {chips.map((c) => (
          <Chip
            key={c.id}
            variant="filter"
            selected={!filter.notMessaged && filter.type === c.id}
            onClick={() => setFilter({ ...filter, type: c.id, notMessaged: false })}
          >
            {c.label}
          </Chip>
        ))}
        <Chip
          variant="filter"
          selected={filter.notMessaged}
          onClick={() => setFilter({ ...filter, notMessaged: !filter.notMessaged })}
          style={filter.notMessaged ? undefined : { background: "var(--bn-urgent-wash)" }}
        >
          Chưa nhắn khách · {unsent.length}
        </Chip>
      </div>

      {effectiveMode === "all" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, margin: "0 -8px", overflowY: mobile ? "visible" : "auto", minHeight: 0, paddingBottom: 16 }}>
          {rows.map((r) => {
            const on = r.id === selectedId;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => open(r.id)}
                aria-current={on ? "true" : undefined}
                className={on ? undefined : "tt-row-btn"}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  padding: "9px 12px",
                  borderRadius: 10,
                  background: on ? "#FFFFFF" : "transparent",
                  border: `1px solid ${on ? "var(--bn-clay)" : "transparent"}`,
                  textAlign: "left",
                  width: "100%",
                  flex: "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, width: "100%" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.listTitle}
                  </span>
                  <PillRow pills={select.requestPills(state, r)} size="sm" />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5, color: "var(--bn-ink-2)", width: "100%" }}>
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{select.listSub(r)}</span>
                  <span style={{ fontFamily: "var(--bn-mono)", fontSize: 11, color: "var(--bn-muted)", flex: "none" }}>{r.listTime}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {effectiveMode === "empty" && (
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12, padding: "0 4px" }}>
          <div style={{ fontFamily: "var(--bn-serif)", fontSize: 26, lineHeight: 1.25 }}>Không có yêu cầu mới.</div>
          <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--bn-ink-2)" }}>
            Mọi yêu cầu Bonia ghi đã được xử lý. Yêu cầu mới hiện ở đây ngay khi cuộc gọi kết thúc.
          </div>
          <button
            type="button"
            onClick={() => setFilter(DEFAULT_FILTER)}
            style={{ fontSize: 14, color: "var(--bn-clay)", fontWeight: 500, alignSelf: "flex-start" }}
          >
            Xem tất cả · {counts.all}
          </button>
        </div>
      )}

      {effectiveMode === "loading" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }} aria-busy="true" aria-label="Đang tải">
          {SKELETON_WIDTHS.map((w, i) => (
            <SkeletonRow key={i} titleWidth={w} />
          ))}
        </div>
      )}
    </div>
  );
}
