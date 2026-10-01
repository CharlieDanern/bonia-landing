import { C, F, SHADES, cardTexture, pad2 } from "./tokens.js";
import { Section, SectionHead } from "./parts.jsx";
import { STEPS } from "./data.js";

/* §03 Cách dùng (#cachdung): three step cards on the credit-card shades,
 * light → dark, each with the fine diagonal texture and a large brown serif
 * number. */
export default function Steps() {
  return (
    <Section id="cachdung" label="04 Cách dùng">
      <SectionHead kicker="§ 03 · Cách dùng" title="Cài đặt một lần," em="yên tâm trọn đời." />
      <ol
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))",
          gap: "clamp(12px,1.6vw,20px)",
        }}
      >
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 20,
              padding: "clamp(20px,2.6vw,28px)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              background: SHADES[i],
              boxShadow: "0 24px 42px -26px rgba(52,38,20,0.36),inset 0 0 0 0.5px rgba(255,255,255,0.4)",
              minHeight: 230,
            }}
          >
            <span aria-hidden="true" style={{ position: "absolute", inset: 0, background: cardTexture, pointerEvents: "none" }} />
            <span
              style={{
                position: "relative",
                fontFamily: F.serif,
                fontWeight: 300,
                fontSize: 52,
                lineHeight: 1,
                letterSpacing: "-0.03em",
                color: C.clay,
              }}
            >
              {pad2(i)}
            </span>
            <h3
              style={{
                position: "relative",
                margin: 0,
                fontFamily: F.serif,
                fontWeight: 400,
                fontSize: "clamp(21px,2vw,24px)",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}
            >
              {s.title}
            </h3>
            <p style={{ position: "relative", margin: 0, fontSize: 15, lineHeight: 1.58, color: C.body, textWrap: "pretty" }}>{s.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
