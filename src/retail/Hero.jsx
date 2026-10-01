import { C, F, gradText, inkGrad, clayGrad } from "./tokens.js";
import Orb from "../reception/Orb.jsx";

/* 01 Hero: built exactly like the Tiếp tân v5 hero, one screen tall below
 * the 64 px nav. The orb ("signal", the reception page's port of
 * bonia-orb.js) is drawn at its native 960 px, never scaled with CSS, and
 * centred with a -437 px top margin because it draws its sphere R·0.14 above
 * the canvas centre, so the sphere sits on the headline. Resolution capped
 * at 1.5× like the reception hero; the radial mask fades it toward the
 * centre and two cream glows sit over it.
 *
 * The eyebrow and the link are zero-height, so the H1 alone is centred. */

const MASK =
  "radial-gradient(closest-side at 50% 50%,rgba(0,0,0,0.18) 0%,rgba(0,0,0,0.3) 34%,rgba(0,0,0,0.75) 62%,#000 90%)";

const glow = { position: "absolute", inset: 0, pointerEvents: "none" };

export default function Hero() {
  return (
    <section
      data-screen-label="01 Hero"
      style={{
        position: "relative",
        overflow: "hidden",
        height: "calc(100svh - 64px)",
        minHeight: 540,
        maxHeight: 980,
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
          opacity: 0.6,
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
          ...glow,
          background:
            "radial-gradient(125% 95% at 50% 112%,rgba(251,234,207,0.74) 0%,rgba(245,240,230,0.46) 46%,rgba(239,234,223,0.38) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          ...glow,
          background:
            "radial-gradient(closest-side at 50% 50%,rgba(250,243,230,0.62) 20%,rgba(250,243,230,0.26) 46%,rgba(244,236,222,0) 78%)",
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
        <div
          style={{
            fontFamily: F.mono,
            fontSize: 11,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            color: C.label2,
            height: 0,
            overflow: "visible",
            transform: "translateY(-40px)",
          }}
        >
          Trợ lý nghe máy bằng tiếng Việt
        </div>
        <h1
          style={{
            fontFamily: F.serif,
            fontWeight: 300,
            fontSize: "clamp(32px,5.6vw,74px)",
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            margin: 0,
            textWrap: "balance",
          }}
        >
          <span style={{ display: "block", ...gradText(inkGrad, true) }}>Bonia nghe máy giúp bạn,</span>
          <span style={{ display: "block", ...gradText(clayGrad) }}>khi bạn không tiện trả lời.</span>
        </h1>
        <a
          href="#tinhnang"
          style={{
            display: "block",
            height: 0,
            overflow: "visible",
            position: "relative",
            top: "clamp(34px,4vh,46px)",
            fontFamily: F.mono,
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.label,
            animation: "bnNudge 2.6s ease-in-out infinite",
          }}
        >
          Xem Bonia làm được gì
        </a>
      </div>
    </section>
  );
}
