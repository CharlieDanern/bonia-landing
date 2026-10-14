import React from "react";
import { MONO } from "../ui.js";

/**
 * What the company's own system did during the call (OCB's demo, founder 2026-10-14: "the verification steps and OCB's
 * answers in the call view"): whether the call is verified, then each step, newest last. The pinned card shows it live,
 * the call drawer after the call. system: { verified, approval?, steps: [{ label, status, note }] }.
 */
const STEP_COL = { ok: ["#E6EDDD", "#4A6B3A"], refused: ["#F3E0D9", "#8A3F2E"], waiting: ["#F5E4C9", "#8A4D1C"], failed: ["#EFE9DD", "#6E6255"] };
const STEP_WORD = { ok: "XONG", refused: "TỪ CHỐI", waiting: "ĐANG CHỜ", failed: "KHÔNG ĐƯỢC" };
export function SystemSteps({ system, title = "HỆ THỐNG NGÂN HÀNG", border = true }) {
  const v = system.verified;
  const [vbg, vc] = v ? STEP_COL.ok : system.approval === "pending" ? STEP_COL.waiting : STEP_COL.failed;
  return (
    <div style={{ padding: "10px 12px", borderTop: border ? "1px solid #EFE9DD" : "none", display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.16em", color: "#6E6255" }}>{title}</span>
        <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.08em", padding: "2px 7px", borderRadius: 6, background: vbg, color: vc, whiteSpace: "nowrap" }}>
          {v ? "✓ ĐÃ XÁC THỰC" : system.approval === "pending" ? "CHỜ KHÁCH XÁC NHẬN" : "CHƯA XÁC THỰC"}
        </span>
      </div>
      {(system.steps || []).length === 0 && <span style={{ fontSize: 12, color: "#6E6255" }}>Chưa có yêu cầu nào tới hệ thống.</span>}
      {(system.steps || []).map((s, i) => {
        const [bg, c] = STEP_COL[s.status] || STEP_COL.failed;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.1em", padding: "2px 6px", borderRadius: 5, background: bg, color: c, whiteSpace: "nowrap" }}>{STEP_WORD[s.status] || s.status}</span>
            </div>
            {s.note && <span style={{ fontSize: 11.5, color: "#4A4239", lineHeight: 1.4 }}>{s.note}</span>}
          </div>
        );
      })}
    </div>
  );
}
