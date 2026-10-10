import React, { useState } from "react";
import { MONO, SERIF } from "../ui.js";
import { downloadExport } from "./api.js";

// Xuất Excel (handoff 16 v1): what is exported (a campaign's list, or Lịch sử's current filter), the time, the
// transcript option, and the columns the file will have. The backend writes the file (routes/finance.ts).

const COLUMNS = ["Thời gian", "Chiều", "Danh sách", "Số điện thoại", "Tên", "Ghi chú (danh sách)", "Kết quả", "Máy quan tâm", "Giá máy", "Trả trước", "Số tháng", "Gói", "Khu vực", "Gọi lại lúc", "Tóm tắt", "Thời lượng", "Số lần gọi", "Trạng thái xử lý"];
const RANGES = [["today", "Hôm nay"], ["7", "7 ngày"], ["30", "30 ngày"]];

export function ExportDialog({ count, filter, filterLabel, range: initialRange, campaign = null, onClose }) {
  const [what, setWhat] = useState(campaign ? "campaign" : "filter");
  const [range, setRange] = useState(initialRange === "custom" ? "custom" : initialRange || "30");
  const [withText, setWithText] = useState(false);
  const [state, setState] = useState("idle"); // idle · busy · failed
  const params = () => {
    const base = what === "campaign" && campaign ? { campaign: campaign.id } : { ...filter };
    if (range !== "custom") { delete base.from; delete base.to; base.days = range === "today" ? 1 : Number(range); }
    return { ...base, ...(withText ? { transcript: "1" } : {}) };
  };
  const go = async () => {
    setState("busy");
    try {
      await downloadExport(params());
      onClose();
    } catch {
      setState("failed");
    }
  };
  const option = (k, title, sub, disabled) => {
    const on = what === k;
    return (
      <button type="button" disabled={disabled} onClick={() => setWhat(k)} style={{ display: "flex", gap: 12, alignItems: "center", textAlign: "left", padding: "10px 14px", borderRadius: 10, border: `1px solid ${on ? "#7B4A2D" : "#D9D0BF"}`, background: on ? "#FBF5EC" : "#fff", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.55 : 1 }}>
        <span style={{ width: 16, height: 16, borderRadius: 8, border: `1.5px solid ${on ? "#7B4A2D" : "#C9BCA5"}`, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          {on && <span style={{ width: 8, height: 8, borderRadius: 4, background: "#7B4A2D" }} />}
        </span>
        <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontSize: 13 }}>{title}</span>
          <span style={{ fontSize: 12, color: "#6E6255" }}>{sub}</span>
        </span>
      </button>
    );
  };
  const lbl = { fontSize: 12.5, color: "#4A4239" };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(31,27,22,0.42)", zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Xuất Excel" style={{ width: "min(640px, 100%)", maxHeight: "92vh", overflow: "auto", background: "#fff", borderRadius: 20, boxShadow: "0 20px 60px rgba(31,27,22,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 18px 14px", borderBottom: "1px solid #EFE9DD" }}>
          <span style={{ fontFamily: SERIF, fontSize: 21 }}>Xuất Excel</span>
          <button type="button" onClick={onClose} aria-label="Đóng" style={{ border: 0, background: "none", fontSize: 18, cursor: "pointer", color: "#4A4239" }}>✕</button>
        </div>
        <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={lbl}>Xuất</span>
          {option("campaign", "Danh sách này", campaign ? campaign.name : "Mở một chiến dịch Gọi ra để xuất danh sách của nó", !campaign)}
          {option("filter", "Bộ lọc Lịch sử hiện tại", filterLabel || "Tất cả")}
          <span style={{ ...lbl, marginTop: 6 }}>Thời gian</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {RANGES.map(([k, l]) => (
              <button key={k} type="button" onClick={() => setRange(k)} style={{ height: 34, padding: "0 14px", borderRadius: 8, border: `1px solid ${range === k ? "#1F1B16" : "#D9D0BF"}`, background: range === k ? "#1F1B16" : "#fff", color: range === k ? "#F7F3EC" : "#1F1B16", fontSize: 12.5, cursor: "pointer" }}>{l}</button>
            ))}
            {range === "custom" && <span style={{ height: 34, padding: "0 14px", borderRadius: 8, border: "1px solid #1F1B16", background: "#1F1B16", color: "#F7F3EC", fontSize: 12.5, display: "flex", alignItems: "center" }}>Tùy chọn ({filter.from} – {filter.to})</span>}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, cursor: "pointer", fontSize: 12.5 }}>
            <span onClick={() => setWithText(!withText)} style={{ width: 34, height: 20, borderRadius: 10, background: withText ? "#7B4A2D" : "#D9D0BF", position: "relative", flex: "none", transition: "background 160ms" }}>
              <span style={{ position: "absolute", top: 2, left: withText ? 16 : 2, width: 16, height: 16, borderRadius: 8, background: "#fff", transition: "left 160ms" }} />
            </span>
            <span onClick={() => setWithText(!withText)}>Gồm lời thoại</span>
            <span style={{ color: "#6E6255" }}>· lời thoại khá dài</span>
          </label>
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", color: "#6E6255", marginTop: 8 }}>CÁC CỘT TRONG FILE · {COLUMNS.length + (withText ? 1 : 0)} CỘT</span>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {[...COLUMNS, ...(withText ? ["Lời thoại"] : [])].map((c) => (
              <span key={c} style={{ fontSize: 12, padding: "3px 8px", borderRadius: 6, background: "#F7F3EC", border: "1px solid #E4DCCB", color: "#1F1B16" }}>{c}</span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px 16px", borderTop: "1px solid #EFE9DD" }}>
          <span style={{ fontSize: 12.5, color: state === "failed" ? "#A0412D" : "#4A4239" }}>{state === "failed" ? "Không tải được file. Thử lại." : `${count} dòng`}</span>
          <button type="button" disabled={state === "busy"} onClick={go} style={{ height: 38, padding: "0 18px", borderRadius: 19, border: 0, background: "#7B4A2D", color: "#fff", fontSize: 13.5, cursor: "pointer" }}>{state === "busy" ? "Đang tạo file…" : "Tải Excel (.xlsx)"}</button>
        </div>
      </div>
    </div>
  );
}
