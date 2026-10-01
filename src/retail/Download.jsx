import { C, F, gradText, inkGrad, clayGrad } from "./tokens.js";
import StoreBadges from "./StoreBadges.jsx";
import { STATS } from "./data.js";

/* Tải app (#taiapp): the stand-out sand section. H2 on one line on wide
 * screens ("Đã có mặt trên" upright in the ink gradient, "iOS & Android."
 * bold italic in the clay gradient, as the founder set it), the real store
 * badges, and a 3-stat row (a <dl>: each label is the term, shown under
 * its value). */
export default function Download() {
  return (
    <section
      id="taiapp"
      data-screen-label="08 Tải app"
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "clamp(72px,10vw,140px) clamp(16px,4vw,56px)",
        borderTop: `1px solid ${C.line2}`,
        background:
          "radial-gradient(70% 60% at 50% 100%,rgba(240,206,160,0.55) 0%,rgba(240,206,160,0) 70%),radial-gradient(120% 100% at 50% 0%,#F1E3CC 0%,#EADBC2 55%,#E3D2B6 100%)",
        scrollMarginTop: 64,
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "clamp(24px,3.4vw,36px)",
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: "0.26em", textTransform: "uppercase", color: C.label2 }}>
          Tải ứng dụng
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: F.serif,
            fontWeight: 300,
            fontSize: "clamp(32px,5vw,66px)",
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            textWrap: "balance",
          }}
        >
          <span style={gradText(inkGrad, true)}>
            <span style={{ fontStyle: "normal" }}>Đã có mặt trên </span>
          </span>
          <span style={gradText(clayGrad)}>
            <b>
              <i>iOS &amp; Android.</i>
            </b>
          </span>
        </h2>
        <p style={{ margin: 0, maxWidth: "34em", fontSize: "clamp(15px,1.4vw,17px)", lineHeight: 1.55, color: C.muted, textWrap: "pretty" }}>
          Tải Bonia, cài đặt trong hai phút, và không bao giờ phải nghe spam nữa.
        </p>
        <StoreBadges />
        <dl
          style={{
            margin: "8px 0 0",
            width: "100%",
            maxWidth: 720,
            display: "grid",
            gridTemplateColumns: "repeat(3,minmax(0,1fr))",
            borderTop: `1px solid ${C.line}`,
          }}
        >
          {STATS.map((s) => (
            <div key={s.l} style={{ padding: "20px 8px 0", display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
              <dt
                style={{
                  order: 2,
                  fontFamily: F.mono,
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: C.label,
                }}
              >
                {s.l}
              </dt>
              <dd style={{ order: 1, margin: 0, fontFamily: F.serif, fontSize: "clamp(20px,2.4vw,28px)", letterSpacing: "-0.01em" }}>{s.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
