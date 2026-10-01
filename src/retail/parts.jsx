import { C, contentMax, eyebrow, h2, accent, sectionPad } from "./tokens.js";

/* The frame §01–§06 share: hairline on top, the section padding, and a
 * 1160 px column whose direct children are what the scroll reveal animates
 * (Retail.jsx). */
export function Section({ id, label, max = contentMax, gap = "clamp(28px,4vw,48px)", center = false, children }) {
  return (
    <section
      id={id}
      data-screen-label={label}
      style={{
        padding: sectionPad,
        borderTop: `1px solid ${C.line2}`,
        ...(id ? { scrollMarginTop: 64 } : null),
      }}
    >
      <div
        style={{
          maxWidth: max,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          ...(center ? { alignItems: "center" } : null),
          gap,
        }}
      >
        {children}
      </div>
    </section>
  );
}

/* "§ 0N · …" eyebrow, H2 with its italic brown half, optional lead. */
export function SectionHead({ kicker, title, em, lead, center = false, max = 780 }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        ...(max ? { maxWidth: max } : null),
        ...(center ? { alignItems: "center", textAlign: "center" } : null),
      }}
    >
      <div style={eyebrow}>{kicker}</div>
      <h2 style={h2}>
        {title} <span style={accent}>{em}</span>
      </h2>
      {lead && (
        <p
          style={{
            margin: 0,
            fontSize: "clamp(15.5px,1.4vw,17.5px)",
            lineHeight: 1.6,
            color: C.body,
            textWrap: "pretty",
          }}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
