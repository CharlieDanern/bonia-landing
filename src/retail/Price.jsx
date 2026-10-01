import { C, F, priceGrad, pad2 } from "./tokens.js";
import { FREE_POINTS } from "./data.js";

/* §04 Chi phí: a full-height warm section modelled on the Business
 * "500.000đ" frame. "0 VNĐ" in JetBrains Mono with the price gradient (the
 * scroll reveal scales it 1.12 → 1 instead of raising it, data-rv="scale"),
 * "MIỄN PHÍ" under it, and three numbered points above a brown rule. */
export default function Price() {
  return (
    <section
      data-screen-label="05 Chi phí"
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "min(100svh,900px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(64px,9vw,120px) clamp(16px,4vw,56px)",
        background: "radial-gradient(125% 95% at 50% 48%,#FCEBD1 0%,#F5E4C9 52%,#EFE2CB 100%)",
        color: C.ink,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 1000,
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
            color: C.gold,
            marginBottom: "clamp(18px,3vh,32px)",
          }}
        >
          § 04 · Chi phí
        </div>
        <h2
          data-rv="scale"
          style={{
            margin: 0,
            fontFamily: F.mono,
            fontWeight: 400,
            fontSize: "clamp(64px,13vw,168px)",
            lineHeight: 0.92,
            letterSpacing: "-0.045em",
            paddingBottom: "0.06em",
            background: priceGrad,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          0 VNĐ
        </h2>
        <div
          style={{
            fontFamily: F.mono,
            fontSize: "clamp(10.5px,1.2vw,13px)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: C.gold,
            marginTop: "clamp(10px,1.6vh,18px)",
          }}
        >
          Miễn phí
        </div>
        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))",
            gap: "clamp(14px,2.2vw,34px)",
            marginTop: "clamp(28px,5vh,56px)",
          }}
        >
          {FREE_POINTS.map((t, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                borderTop: "1px solid rgba(123,74,45,0.28)",
                paddingTop: "clamp(14px,2.2vh,26px)",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  fontFamily: F.mono,
                  fontSize: "clamp(26px,3.4vw,48px)",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  color: C.clay,
                }}
              >
                {pad2(i)}
              </div>
              <p
                style={{
                  margin: "clamp(8px,1.3vh,14px) 0 0",
                  fontSize: "clamp(14px,1.45vw,18px)",
                  lineHeight: 1.45,
                  color: C.body,
                  textWrap: "pretty",
                }}
              >
                {t}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
