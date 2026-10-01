import { C, F, pad2 } from "./tokens.js";
import { Section, SectionHead } from "./parts.jsx";
import { CONCERNS, PRIVACY } from "./data.js";

/* §05 Riêng tư & tin cậy, symmetric: centred header; three borderless
 * concern cards on a cream gradient with a soft shadow, everything centred
 * (3-across down to about 760 px); below them a 2-cell hairline band with
 * the privacy points. */
export default function Trust() {
  return (
    <Section label="06 Riêng tư" center>
      <SectionHead kicker="§ 05 · Riêng tư & tin cậy" title="Ba điều người Việt" em="lo lắng nhất." center />
      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,232px),1fr))",
          gap: "clamp(12px,1.6vw,20px)",
          alignItems: "stretch",
        }}
      >
        {CONCERNS.map((c, i) => (
          <div
            key={c.q}
            style={{
              background: "linear-gradient(160deg,#FCFAF5 0%,#F3EEE5 100%)",
              border: "none",
              borderRadius: 20,
              padding: "clamp(20px,2.6vw,30px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              textAlign: "center",
              boxShadow:
                "0 1px 2px rgba(52,38,20,0.06),0 18px 40px -22px rgba(52,38,20,0.32),inset 0 0 0 0.5px rgba(255,255,255,0.6)",
            }}
          >
            <span aria-hidden="true" style={{ fontFamily: F.mono, fontSize: 12, color: C.clay }}>
              {pad2(i)}
            </span>
            <h3
              style={{
                margin: 0,
                fontFamily: F.serif,
                fontWeight: 400,
                fontSize: "clamp(20px,1.9vw,23px)",
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
                textWrap: "balance",
              }}
            >
              {c.q}
            </h3>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: C.muted, textWrap: "pretty" }}>{c.a}</p>
          </div>
        ))}
      </div>
      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))",
          gap: 1,
          background: C.line,
          border: `1px solid ${C.line}`,
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        {PRIVACY.map((p) => (
          <div
            key={p.title}
            style={{
              background: C.card,
              padding: "clamp(20px,2.6vw,28px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              textAlign: "center",
            }}
          >
            <h3 style={{ margin: 0, fontFamily: F.serif, fontWeight: 400, fontSize: "clamp(19px,1.8vw,22px)", letterSpacing: "-0.01em" }}>
              {p.title}
            </h3>
            <p style={{ margin: 0, maxWidth: "40ch", fontSize: 14.5, lineHeight: 1.55, color: C.muted, textWrap: "pretty" }}>{p.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
