import React, { useEffect, useRef } from "react";
import { MONO, SERIF } from "../ui.js";

// Bonia on/off (handoff 14 W6–W8, founder 2026-10-06). The Orb is the switch:
// clicking it asks to confirm. Off, forwarded calls are rejected (callers hear
// the carrier's busy tone) and the phone app switches with it.

export const SWITCH_ERRORS = {
  no_profile: "Lưu Cài đặt trước khi bật Bonia.",
  network: "Không kết nối được. Kiểm tra mạng rồi thử lại.",
};

/** Tắt Bonia? / Bật Bonia? — `on` is Bonia's state now; the dialog offers the other. */
export function SwitchDialog({ on, name, busy, error, onCancel, onConfirm, phone }) {
  useEffect(() => {
    const key = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onCancel]);
  const verb = on ? "tắt" : "bật";
  // focus inside the dialog, but not on the switch itself: Enter must not turn Bonia off by accident
  const box = useRef(null);
  useEffect(() => { box.current?.focus(); }, []);
  const btn = { height: 46, borderRadius: 23, fontSize: 14.5, display: "flex", alignItems: "center", justifyContent: "center" };
  return (
    <div onClick={onCancel} style={{ position: "absolute", inset: 0, zIndex: 30, background: "rgba(31,27,22,0.42)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-label={on ? "Tắt Bonia?" : "Bật Bonia?"} onClick={(e) => e.stopPropagation()} style={{ outline: "none", width: "100%", maxWidth: 480, padding: phone ? "26px 22px" : "32px 34px", borderRadius: 20, background: "#fff", display: "flex", flexDirection: "column", gap: 14 }}>
        <span style={{ fontFamily: SERIF, fontSize: phone ? 25 : 28, lineHeight: 1.15 }}>{on ? "Tắt Bonia?" : "Bật Bonia?"}</span>
        <span style={{ fontSize: 15.5, lineHeight: 1.55 }}>{on ? "Khi tắt, cuộc gọi chuyển tới Bonia sẽ bị từ chối. Khách nghe tín hiệu máy bận." : `Bonia sẽ nghe máy cho ${name || "bạn"} từ bây giờ.`}</span>
        <span style={{ fontSize: 13.5, color: "#4A4239" }}>Ứng dụng trên điện thoại cũng {verb} theo.</span>
        {error && <span role="alert" style={{ fontSize: 13.5, lineHeight: 1.5, color: "#A0412D" }}>{SWITCH_ERRORS[error] || SWITCH_ERRORS.network}</span>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 6 }}>
          <button type="button" className="b-ghost" onClick={onCancel} style={{ ...btn, padding: "0 20px" }}>Huỷ</button>
          <button type="button" disabled={busy} onClick={onConfirm} style={{ ...btn, padding: "0 22px", background: on ? "#A0412D" : "#4A6B3A", color: "#fff", fontWeight: 500, opacity: busy ? 0.6 : 1 }}>{on ? "Tắt Bonia" : "Bật Bonia"}</button>
        </div>
      </div>
    </div>
  );
}

/** W6: shown once, the first time Trực tiếp opens after Bật Bonia. arrow: where the Orb is (left, up). */
export function OrbTip({ onDone, arrow = "left", style }) {
  const tail = arrow === "left" ? { left: -7, top: 30 } : { left: "calc(50% - 7px)", top: -7 };
  return (
    <div role="dialog" aria-label="Mẹo" style={{ position: "absolute", width: 250, padding: "14px 16px 12px", borderRadius: 12, background: "#1F1B16", color: "#F7F3EC", display: "flex", flexDirection: "column", gap: 10, zIndex: 8, boxShadow: "0 8px 24px rgba(31,27,22,0.18)", pointerEvents: "auto", textAlign: "left", ...style }}>
      <span style={{ position: "absolute", width: 14, height: 14, background: "#1F1B16", transform: "rotate(45deg)", ...tail }} />
      <span style={{ fontSize: 14, fontWeight: 600 }}>Bấm vào Orb để bật/tắt Bonia</span>
      <span style={{ fontSize: 13, lineHeight: 1.5, color: "#E4DCCB" }}>Tạm thời tắt hoặc bật lễ tân</span>
      <button type="button" onClick={onDone} style={{ alignSelf: "flex-end", height: 32, padding: "0 14px", borderRadius: 16, background: "#F7F3EC", color: "#1F1B16", fontSize: 13, fontWeight: 500 }}>Đã hiểu</button>
    </div>
  );
}

/** The line under the Orb: on with today's calls, or off. */
export function OnOffStatus({ on, calls, size = 10 }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: size, letterSpacing: "0.18em", color: on ? "#4A6B3A" : "#A0412D", textAlign: "center" }}>
      {on ? `BONIA ĐANG BẬT · ${calls} CUỘC HÔM NAY` : "BONIA ĐANG TẮT"}
    </span>
  );
}
