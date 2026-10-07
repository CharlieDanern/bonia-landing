import { C, F, gradText, inkGrad, clayGrad } from "./tokens.js";
import Orb from "./Orb.jsx";

/* 01 Hero (handoff v6, 2026-10-07; v5's hero from 2026-09-30, modelled on
 * the bonia.vn/business hero): the headline, one sentence on what Bonia does,
 * two buttons (Nghe thử 1 cuộc gọi to the call demo #nghe, Dùng thử miễn phí
 * 14 ngày to the §04 form #demo) and three ticks. The orb turns behind it,
 * fainter than v5 (0.4), with a cream glow behind the text so its lines
 * don't run through the copy.
 *
 * The orb is drawn at its native 960 px (scaling the canvas would thicken its
 * lines) and centred with a -437 px top margin because the orb draws its
 * sphere R·0.14 above the canvas centre, so the sphere sits on the copy.
 * Its resolution is capped at 1.5× (a 2× 960 px canvas redrawn every frame is
 * heavy on phones); the wrapper's mask fades it out toward the centre anyway.
 *
 * The hero starts at the top of the page, underneath the (transparent at the
 * top) nav: it is pulled up by the nav's height (--rnav-h, measured by
 * Nav.jsx), so its centre is the screen's centre (founder 2026-09-30; the
 * prototypes start it below the nav). v6 caps the part below the nav at
 * 780 px (min 600), so on a tall screen the call demo shows underneath.
 * Until the nav has been measured the fallback is the nav's own CSS height:
 * padding clamp(12px,2vw,18px) twice + the 40 px logo row + its 1 px border. */

const NAV_H = "calc(2 * clamp(12px,2vw,18px) + max(clamp(28px,4vw,40px), 38px) + 1px)";

const MASK =
  "radial-gradient(closest-side at 50% 50%,rgba(0,0,0,0.18) 0%,rgba(0,0,0,0.3) 34%,rgba(0,0,0,0.75) 62%,#000 90%)";

const TICKS = ["Giữ nguyên số đang dùng", "Không cần tổng đài", "Nhiều cuộc gọi cùng lúc"];

// The two hero buttons; colours and hover come from .r-btn-amber / .r-btn-line (reception.css).
const button = {
  height: 52,
  padding: "0 24px",
  borderRadius: 999,
  fontSize: 15,
  fontWeight: 500,
  display: "flex",
  alignItems: "center",
  whiteSpace: "nowrap",
};

export default function Hero() {
  return (
    <section
      data-screen-label="01 Hero"
      style={{
        position: "relative",
        overflow: "hidden",
        marginTop: `calc(-1 * var(--rnav-h, ${NAV_H}))`,
        height: "100svh",
        minHeight: `calc(600px + var(--rnav-h, ${NAV_H}))`,
        maxHeight: `calc(780px + var(--rnav-h, ${NAV_H}))`,
        background: C.ground,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 960,
          height: 960,
          margin: "-437px 0 0 -480px",
          opacity: 0.4,
          pointerEvents: "none",
          WebkitMaskImage: MASK,
          maskImage: MASK,
        }}
      >
        <Orb size={960} maxDpr={1.5} />
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(125% 95% at 50% 112%,rgba(251,234,207,0.74) 0%,rgba(245,240,230,0.46) 46%,rgba(239,234,223,0.38) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(48% 40% at 50% 50%,rgba(247,241,230,0.9) 0%,rgba(247,241,230,0.55) 55%,rgba(244,236,222,0) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 1040,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            fontFamily: F.serif,
            fontWeight: 300,
            fontSize: "clamp(30px,5.6vw,74px)",
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            margin: 0,
            textWrap: "balance",
          }}
        >
          <span style={{ display: "block", ...gradText(inkGrad, true) }}>Lễ tân lo khách tại quầy</span>
          <span style={{ display: "block", ...gradText(clayGrad) }}>Bonia lo điện thoại</span>
        </h1>
        <p
          style={{
            margin: "clamp(22px,3.2vh,32px) 0 0",
            maxWidth: "30em",
            fontSize: "clamp(16px,1.5vw,19px)",
            lineHeight: 1.6,
            color: C.ink2,
            textWrap: "balance",
          }}
        >
          Bonia nghe máy 24/7 trên số hotline đang dùng, trả lời và tư vấn khách, rồi ghi lại việc cần xử lý.
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
            marginTop: "clamp(22px,3.2vh,34px)",
          }}
        >
          <a href="#nghe" className="r-btn r-btn-amber" style={{ ...button, gap: 10, boxShadow: "0 10px 24px -14px rgba(123,74,45,0.7)" }}>
            <span
              aria-hidden="true"
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                background: "rgba(255,248,238,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
              }}
            >
              ▶
            </span>
            Nghe thử 1 cuộc gọi
          </a>
          <a href="#demo" className="r-btn r-btn-line" style={button}>
            Dùng thử miễn phí 14 ngày
          </a>
        </div>
        <ul
          style={{
            listStyle: "none",
            margin: "22px 0 0",
            padding: 0,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "8px 22px",
            fontSize: 13.5,
            color: "#5E5448",
          }}
        >
          {TICKS.map((t) => (
            <li key={t} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span aria-hidden="true" style={{ color: C.amber }}>
                ✓
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
