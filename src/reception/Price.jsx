import { C, F, contentMax, eyebrow, h2 } from "./tokens.js";

/* § 03 · Giá (#gia), handoff v5 "§03 · Giá": one price for all three sectors
 * (founder 2026-09-28: 999.000đ/tháng with 250 minutes, 4.000đ per extra
 * minute). The price is sized in cqw against the page root, which
 * Reception.jsx makes an inline-size container. */

const ROWS = [
  ["Dùng thử miễn phí", "1 tháng"],
  ["Phút nghe máy mỗi tháng", "250 phút"],
  ["Phút vượt, tính theo giây", "4.000đ/phút"],
  ["SIM, hotline mới", "Không cần"],
  ["Tổng đài", "Không cần"],
];

// v5 narrows the side padding floor to 16 px (tokens.sectionPad still says 18).
const pad = "clamp(56px,8vw,104px) clamp(16px,5vw,72px)";
const rowLine = "1px solid rgba(123,74,45,0.18)";

export default function Price() {
  return (
    <section
      id="gia"
      data-screen-label="04 Giá"
      style={{
        background: C.priceBg,
        borderTop: `1px solid ${C.priceLine}`,
        borderBottom: `1px solid ${C.priceLine}`,
        padding: pad,
        scrollMarginTop: 64,
      }}
    >
      <div
        style={{
          maxWidth: contentMax,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))",
          gap: "clamp(32px,5vw,72px)",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <p style={eyebrow(C.priceMuted)}>§ 03 · Giá</p>
          <h2 style={h2({ fontSize: "clamp(28px,3.6vw,44px)", lineHeight: 1.1 })}>
            Bắt đầu với lễ tân trực điện thoại 24/7 Bonia chỉ với:
          </h2>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: "clamp(48px,9cqw,120px)",
              lineHeight: 0.95,
              letterSpacing: "-0.045em",
              color: C.clay,
              marginTop: 8,
            }}
          >
            999.000đ
          </div>
          <div
            style={{
              fontFamily: F.mono,
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: C.priceMuted,
            }}
          >
            mỗi tháng · chưa gồm VAT
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <dl
            style={{
              margin: 0,
              display: "flex",
              flexDirection: "column",
              borderTop: "1px solid rgba(123,74,45,0.28)",
            }}
          >
            {ROWS.map(([k, v]) => (
              <div
                key={k}
                style={{
                  padding: "13px 0",
                  borderBottom: rowLine,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  fontSize: 16,
                  color: C.priceInk,
                }}
              >
                <dt>{k}</dt>
                <dd style={{ margin: 0, fontFamily: F.mono, whiteSpace: "nowrap" }}>{v}</dd>
              </div>
            ))}
          </dl>
          <p
            style={{
              margin: 0,
              paddingTop: 14,
              fontSize: 14,
              lineHeight: 1.55,
              color: C.priceNote,
              textWrap: "pretty",
              fontStyle: "italic",
            }}
          >
            Không tính phí cuộc gọi im lặng. Thanh toán linh hoạt từng tháng.
          </p>
        </div>
      </div>
    </section>
  );
}
