import React from "react";
import { vnd } from "./api.js";

// The app-mirror — copied verbatim from portal/src/bid/Mirror.jsx (import
// path adjusted). The consumer catalog card: aspect 1.9:1, left-weighted
// scrim over the rep's art, ghosted card artwork on the right when there
// is no art, bank SMALL+BOLD over the product name LARGER+LIGHTER (the
// app's inverted hierarchy), bare mono reward (no label inside the mirror
// — the 50% explanation belongs to the chrome around it), perk line,
// white bottom bar.
//
// `cta`: "Quan tâm" (consumer truth: preview/phone) or "Chi tiết" (the
// board/detail divergence — the mirror is the rep's click target).

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
  // §8: ONE scale for board/detail/wizard (300–360px boxes). `base` is the
  // consumer-native scale (matches the live app's ~269px card) — used only
  // inside the §6 phone frame, never on the board.
  const t = scale === "base"
    ? { bank: 10, name: 14, reward: 21, perk: 10.5, bar: 34, barText: 12.5, pad: "13px 15px", pill: 10 }
    : { bank: 11, name: 16, reward: 24, perk: 12, bar: 40, barText: 14, pad: "16px 18px", pill: 11 };

  const body = (
    <div
      className="mirror"
      style={{
        aspectRatio: "1.9/1",
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

      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: t.pad, paddingBottom: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: t.bank, fontWeight: 700, color: "#fff", letterSpacing: ".02em" }}>{bank}</div>
          <div
            style={{
              fontSize: t.name, fontWeight: 400, color: "rgba(255,255,255,.94)",
              lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden", maxWidth: "100%",
            }}
          >
            {name}
          </div>
        </div>
        {(
          <span
            style={{
              flex: "none", fontSize: t.pill, color: "#fff", padding: "5px 11px", borderRadius: 20,
              background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.22)",
            }}
          >
            Điều kiện
          </span>
        )}
      </div>

      <div style={{ position: "relative", padding: t.pad, paddingTop: 0 }}>
        <div className="mono" style={{ fontSize: t.reward, fontWeight: 700, color: "#fff" }}>
          {vnd(rewardVnd)}
        </div>
        {perk ? (
          <div
            style={{
              fontSize: t.perk, lineHeight: 1.4, color: "rgba(255,255,255,.86)", marginTop: 3,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}
          >
            {perk}
          </div>
        ) : null}
        <div
          style={{
            marginTop: 9, height: t.bar, borderRadius: 11, background: "#fff",
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
