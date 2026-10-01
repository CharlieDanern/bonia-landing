import { C, F, gradText, inkGrad, clayGrad } from "./tokens.js";
import Orb from "./Orb.jsx";

/* 01 Hero (handoff v5 update, 2026-09-30; modelled on the bonia.vn/business
 * hero): one screen tall, the orb turning slowly behind the headline, the
 * business page's two cream glows over it, and a nudging link down to the
 * call demo (#nghe, CallDemo.jsx). No button here: the CTA is the nav pill
 * and §04's form.
 *
 * The orb is drawn at its native 960 px (scaling the canvas would thicken its
 * lines) and centred with a -437 px top margin because the orb draws its
 * sphere R·0.14 above the canvas centre, so the sphere sits on the headline.
 * Its resolution is capped at 1.5× (a 2× 960 px canvas redrawn every frame is
 * heavy on phones); the wrapper's mask fades it out toward the centre anyway.
 *
 * The eyebrow and the link are zero-height, so the H1 alone is centred.
 *
 * The hero is a full screen that starts at the top of the page, underneath
 * the (transparent at the top) nav: it is pulled up by the nav's height
 * (--rnav-h, measured by Nav.jsx), so its centre is the screen's centre
 * (founder 2026-09-30; the prototype started it below the nav, which put
 * the headline visibly low). Until the nav has been measured the fallback is
 * the nav's own CSS height: padding clamp(12px,2vw,18px) twice + the 40 px
 * logo row + its 1 px border. */

const NAV_H = "calc(2 * clamp(12px,2vw,18px) + max(clamp(28px,4vw,40px), 38px) + 1px)";

const MASK =
  "radial-gradient(closest-side at 50% 50%,rgba(0,0,0,0.18) 0%,rgba(0,0,0,0.3) 34%,rgba(0,0,0,0.75) 62%,#000 90%)";

export default function Hero() {
  return (
    <section
      data-screen-label="01 Hero"
      style={{
        position: "relative",
        overflow: "hidden",
        marginTop: `calc(-1 * var(--rnav-h, ${NAV_H}))`,
        height: "100svh",
        minHeight: 600,
        maxHeight: 1040,
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
            color: C.dashed,
            height: 0,
            overflow: "visible",
            transform: "translateY(-40px)",
          }}
        >
          Bonia Tiếp Tân
        </div>
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
        <a
          href="#nghe"
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
            color: C.muted,
            animation: "bnNudge 2.6s ease-in-out infinite",
          }}
        >
          Nghe thử 1 cuộc gọi
        </a>
      </div>
    </section>
  );
}
