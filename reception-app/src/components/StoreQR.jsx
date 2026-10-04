import React, { useEffect } from "react";
import { qrMatrix } from "../lib/qr.js";

// TT3 Store QR (handoff 13): one code for both stores. It opens
// bonia.vn/reception/app/tai, which sends iPhones to the App Store and every
// other phone to Google Play (most VN desk phones are Android).

export const APP_STORE_URL = "https://apps.apple.com/vn/app/bonia/id6761518423";
export const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=net.bonia.app&pcampaignid=web_share";
const QR_TARGET = "https://bonia.vn/reception/app/tai";

export function QrGrid({ text, size = 150, pad = 9, radius = 10 }) {
  const { size: n, cells } = qrMatrix(text);
  return (
    <div
      role="img"
      aria-label="Mã QR"
      style={{ width: size, height: size, padding: pad, background: "#fff", border: "1px solid #D9D0BF", borderRadius: radius, display: "grid", gridTemplateColumns: `repeat(${n},1fr)`, flex: "none" }}
    >
      {Array.from(cells).map((on, i) => (
        <span key={i} style={{ background: on ? "#1F1B16" : "transparent" }} />
      ))}
    </div>
  );
}

export function StoreQR() {
  const btn = { height: 44, borderRadius: 22, background: "#1F1B16", color: "#F7F3EC", fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center" };
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", padding: 14, borderRadius: 14, background: "#fff", border: "1px solid #D9D0BF", flexWrap: "wrap" }}>
      <QrGrid text={QR_TARGET} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 150 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Ứng dụng Bonia</span>
        <a href={APP_STORE_URL} target="_blank" rel="noreferrer" style={btn}>App Store</a>
        <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer" style={btn}>Google Play</a>
      </div>
    </div>
  );
}

/** /tai: where the QR lands. Sends the phone to its store. */
export function StoreRedirect() {
  useEffect(() => {
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    window.location.replace(ios ? APP_STORE_URL : PLAY_STORE_URL);
  }, []);
  return null;
}
