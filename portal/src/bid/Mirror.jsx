import React from "react";

// ── CANONICAL consumer mirror ─────────────────────────────────────────
// This file is the single source of truth for how a card renders in the
// consumer apps (iOS + Android catalog cells) and inside the realistic
// phone-frame preview. It is SELF-CONTAINED on purpose (no imports from
// api.js, no styles.css classes) so it can be copied verbatim into the
// admin app — both mirrors must stay pixel-identical.
//
// FROZEN card cell layout:
//   Line 1  bank + card name INLINE — bank medium weight, name bold,
//           single line, tail truncation ("VPBank  Private Visa Infinite")
//   Line 2  one-line best-promo text (perk)
//   Line 3  reward figure, unchanged big style ("400.000đ")
//   Line 4  small grey caption, exactly:
//           "Phần thưởng tiền mặt khi mở thẻ thành công"
//   The Chi tiết chip and the Quan tâm bar stay as they are.
//
// The chip label was "Điều kiện" until the sheet behind it grew a
// free-text lede (rm_cards.details) and stopped being only a list of
// conditions. Renamed in lockstep with iOS + Android — the pill is the
// affordance for the same sheet on all four surfaces.
//
// `cta`: "Quan tâm" (consumer truth: preview/phone) or "Chi tiết" (the
// board/detail divergence — the mirror is the rep's click target).

const MONO = '"JetBrains Mono", ui-monospace, monospace';
const REWARD_CAPTION = "Phần thưởng tiền mặt khi mở thẻ thành công";

const vnd = (n) =>
  n == null ? "—" : `${Math.round(n).toLocaleString("de-DE")}đ`;

const BANK_SURFACES = {
  vpbank: ["#1B1B22", "#08080C"],
  techcombank: ["#7A1B26", "#3A0C12"],
  vib: ["#0F3B78", "#071B3A"],
  "mb bank": ["#0E5E38", "#06301C"],
};

export function bankSurface(bank) {
  const [a, b] = BANK_SURFACES[(bank || "").trim().toLowerCase()] || ["#191970", "#0D0D3F"];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
}

export function AppMirror({
  bank,
  name,
  perk,
  rewardVnd,
  imageUrl,
  cta = "Quan tâm",
  scale = "portal",
  dimmed = false,
  onClick,
}) {
  // ONE scale for board/detail/wizard (300–360px boxes). `base` is the
  // consumer-native scale (matches the live app's ~269px card) — used only
  // inside the phone frame, never on the board.
  // `portal` mirrors the consumer app 1:1 — every value below is the
  // literal iOS/Android figure (OfferCatalogView.swift / OfferCatalogScreen.kt)
  // and only holds true because the card renders at the app's real width
  // (~361px). `base` is the same scale × 0.745 for the 269px phone-frame
  // screen, so the preview reads like a phone rather than a poster.
  const t = scale === "base"
    ? { bank: 9.5, title: 10, reward: 18, perk: 8.5, caption: 8, bar: 28, barText: 10.5, pad: "9px 10.5px", pill: 8 }
    : { bank: 13, title: 13.5, reward: 24, perk: 11.5, caption: 10.5, bar: 38, barText: 14, pad: "12px 14px", pill: 11 };

  const body = (
    <div
      style={{
        // Matches the consumer app exactly: the iOS/Android cell is a fixed
        // 168pt tall at ~361pt wide (screen − 16pt padding each side).
        // Anything squatter crowds line 1 and the name starts truncating
        // here while it fits fine on a phone.
        aspectRatio: "361/168",
        borderRadius: 18,
        overflow: "hidden",
        position: "relative",
        background: imageUrl ? `url(${imageUrl}) center/cover` : bankSurface(bank),
        opacity: dimmed ? 0.62 : 1,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        textAlign: "left",
      }}
    >
      {/* left-weighted scrim — copy column left, artwork right */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(8,10,26,.74) 0%, rgba(8,10,26,.44) 58%, rgba(8,10,26,.22) 100%)",
        }}
      />
      {!imageUrl && (
        <>
          <div
            style={{
              position: "absolute", right: "-7%", bottom: "11%", width: "47%", height: "72%",
              background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.14)",
              borderRadius: 12, transform: "rotate(-14deg)",
            }}
          />
          <div
            style={{
              position: "absolute", right: "5%", bottom: "25%", width: "29%", height: "42%",
              background: "rgba(255,255,255,.07)", borderRadius: 9, transform: "rotate(-14deg)",
            }}
          />
        </>
      )}

      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: t.pad, paddingBottom: 0 }}>
        {/* Line 1 — bank medium + name bold, inline, single line, tail truncation */}
        <div
          style={{
            minWidth: 0, fontSize: t.title, lineHeight: 1.3, color: "#fff",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}
        >
          <span style={{ fontSize: t.bank, fontWeight: 500, color: "rgba(255,255,255,.92)" }}>{bank}</span>
          <span style={{ display: "inline-block", width: "0.55em" }} />
          <span style={{ fontWeight: 700 }}>{name}</span>
        </div>
        <span
          style={{
            flex: "none", fontSize: t.pill, fontWeight: 500, color: "#fff",
            padding: scale === "base" ? "4px 8px" : "5px 10px", borderRadius: 20,
            background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.22)",
          }}
        >
          Chi tiết
        </span>
      </div>

      <div style={{ position: "relative", padding: t.pad, paddingTop: 0 }}>
        {/* Line 2 — one-line best-promo text */}
        {perk ? (
          <div
            style={{
              fontSize: t.perk, lineHeight: 1.4, color: "rgba(255,255,255,.86)", marginBottom: 3,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}
          >
            {perk}
          </div>
        ) : null}
        {/* Line 3 — the reward figure, unchanged big style */}
        <div style={{ fontFamily: MONO, fontSize: t.reward, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
          {vnd(rewardVnd)}
        </div>
        {/* Line 4 — reward caption, small grey, directly under the figure */}
        <div style={{ fontSize: t.caption, lineHeight: 1.35, color: "rgba(255,255,255,.62)", marginTop: 2 }}>
          {REWARD_CAPTION}
        </div>
        <div
          style={{
            marginTop: 8, height: t.bar, borderRadius: 11, background: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: t.barText, fontWeight: 700, color: "#111436",
          }}
        >
          {cta}
        </div>
      </div>
    </div>
  );

  if (!onClick) return body;
  return (
    <button type="button" onClick={onClick} style={{ display: "block", width: "100%", padding: 0, border: 0, background: "none", cursor: "pointer" }}>
      {body}
    </button>
  );
}

// ── Realistic phone frame ─────────────────────────────────────────────
// Modern iPhone look: outer body radius ~46px, uniform thin dark bezel
// (~10px), inner screen radius ~38px, floating Dynamic Island pill OVER
// the content, "9:41" + real signal/wifi/battery glyphs, bottom home
// indicator, soft drop shadow. No hardware buttons.

function StatusGlyphs() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#1B2236" }}>
      {/* cellular */}
      <svg width="17" height="11" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true">
        <rect x="0" y="7.5" width="3.1" height="4.5" rx="1" />
        <rect x="4.9" y="5" width="3.1" height="7" rx="1" />
        <rect x="9.8" y="2.5" width="3.1" height="9.5" rx="1" />
        <rect x="14.7" y="0" width="3.1" height="12" rx="1" />
      </svg>
      {/* wifi */}
      <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true">
        <path d="M8 9.4c.94 0 1.79.4 2.39 1.04L8 12 5.61 10.44A3.3 3.3 0 0 1 8 9.4Z" />
        <path d="M8 5.6c1.98 0 3.78.79 5.1 2.07l-1.42 1.5A5.2 5.2 0 0 0 8 7.7a5.2 5.2 0 0 0-3.68 1.47L2.9 7.67A7.2 7.2 0 0 1 8 5.6Z" fillOpacity=".95" />
        <path d="M8 1.8c3.03 0 5.78 1.21 7.8 3.18l-1.42 1.5A9.16 9.16 0 0 0 8 3.9a9.16 9.16 0 0 0-6.38 2.58L.2 4.98A11.16 11.16 0 0 1 8 1.8Z" fillOpacity=".95" />
      </svg>
      {/* battery */}
      <svg width="25" height="12" viewBox="0 0 25 12" aria-hidden="true">
        <rect x="0.5" y="0.5" width="21" height="11" rx="3.2" fill="none" stroke="currentColor" strokeOpacity=".4" />
        <rect x="2" y="2" width="14.5" height="8" rx="1.8" fill="currentColor" />
        <path d="M22.8 4v4c1-.35 1.7-1.05 1.7-2s-.7-1.65-1.7-2Z" fill="currentColor" fillOpacity=".4" />
      </svg>
    </span>
  );
}

export function PhonePreview({ bank, name, perk, reward, imageUrl }) {
  const ink35 = "#8B93A7";
  const navy = "#191970";
  return (
    <div
      style={{
        width: 300,
        flex: "none",
        borderRadius: 46,
        background: "#0E0F13",
        padding: 10,
        boxShadow:
          "0 34px 64px -26px rgba(15,20,40,.5), 0 12px 28px -16px rgba(15,20,40,.32), 0 2px 6px rgba(15,20,40,.14)",
      }}
    >
      <div
        style={{
          position: "relative",
          background: "#F5F7FB",
          borderRadius: 38,
          minHeight: 548,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: "0 12px 6px",
          color: "#1B2236",
        }}
      >
        {/* Dynamic Island — floats OVER the content */}
        <div
          style={{
            position: "absolute", top: 9, left: "50%", transform: "translateX(-50%)",
            width: 90, height: 26, borderRadius: 13, background: "#000", zIndex: 5,
          }}
        />
        {/* status bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 8px 12px" }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: ".01em" }}>9:41</span>
          <StatusGlyphs />
        </div>

        <div style={{ display: "flex", gap: 14, fontSize: 12, fontWeight: 700, color: ink35, padding: "0 4px 10px" }}>
          <span style={{ color: navy, boxShadow: `inset 0 -2.5px 0 ${navy}`, paddingBottom: 4 }}>Sản phẩm</span>
          <span>Giao dịch</span>
          <span>Phần thưởng</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 10.5, color: ink35, padding: "0 2px 10px" }}>
          <span style={{ background: navy, color: "#fff", fontWeight: 600, padding: "5px 11px", borderRadius: 99 }}>
            Thẻ tín dụng
          </span>
          <span>Ưu đãi khác sắp ra mắt</span>
        </div>

        <AppMirror bank={bank} name={name || "Tên thẻ"} perk={perk} rewardVnd={reward} imageUrl={imageUrl} cta="Quan tâm" scale="base" />

        <div style={{ marginTop: 10, textAlign: "center", fontSize: 11, lineHeight: 1.5, color: "#6B7385" }}>
          Bonia không hiển thị tên nhân viên tư vấn. Số điện thoại của bạn được bảo mật.
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", justifyContent: "space-around", fontSize: 10, color: ink35, borderTop: "1px solid #E6E9F1", paddingTop: 8 }}>
          <span>Cuộc gọi</span>
          <span style={{ color: navy, fontWeight: 700 }}>Ưu đãi</span>
          <span>Cài đặt</span>
        </div>
        {/* home indicator */}
        <div style={{ width: "34%", height: 5, borderRadius: 3, background: "rgba(0,0,0,.25)", margin: "7px auto 3px" }} />
      </div>
    </div>
  );
}
