import { C, F } from "./tokens.js";
import { Section, SectionHead } from "./parts.jsx";
import { SPAM, IMPORTANT } from "./data.js";

/* §01 Vấn đề: two equal cards (what Bonia blocks, struck through; what it
 * tells you about, with brown ticks) and an italic serif closing line. */

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))",
  gap: "clamp(12px,1.6vw,20px)",
  alignItems: "stretch",
};

const card = {
  border: `1px solid ${C.line}`,
  borderRadius: 20,
  padding: "clamp(18px,2.6vw,30px)",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

function CardHead({ title, tag, tagColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
      <h3
        style={{
          margin: 0,
          fontFamily: F.serif,
          fontWeight: 400,
          fontSize: "clamp(22px,2.2vw,26px)",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      <span
        style={{
          fontFamily: F.mono,
          fontSize: 10.5,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: tagColor,
        }}
      >
        {tag}
      </span>
    </div>
  );
}

const mark = {
  width: 20,
  height: 20,
  flex: "none",
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export default function Problem() {
  return (
    <Section label="02 Vấn đề">
      <SectionHead
        kicker="§ 01 · Vấn đề"
        title="Mỗi ngày bạn nhận"
        em="hàng chục cuộc gọi."
        lead="Phần lớn là telesales, lừa đảo hoặc số lạ. Một số ít là quan trọng, và bạn không có cách nào biết trước."
      />
      <div style={grid}>
        <div style={{ ...card, background: C.card }}>
          <CardHead title="Cuộc gọi không mong muốn" tag="Bonia chặn" tagColor={C.label} />
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", borderTop: `1px solid ${C.line2}` }}>
            {SPAM.map((t) => (
              <li
                key={t}
                style={{
                  padding: "14px 0",
                  borderBottom: `1px solid ${C.line2}`,
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                  fontSize: 15.5,
                  color: C.label,
                }}
              >
                <span aria-hidden="true" style={{ ...mark, border: `1px solid ${C.spamRing}`, fontSize: 12, color: C.spamMark }}>
                  ×
                </span>
                <span style={{ textDecoration: "line-through", textDecorationColor: "rgba(110,98,85,0.45)" }}>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ ...card, background: C.white, boxShadow: "0 24px 48px -32px rgba(31,27,22,0.35)" }}>
          <CardHead title="Cuộc gọi bạn cần biết" tag="Bonia báo ngay" tagColor={C.clay} />
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", borderTop: `1px solid ${C.line3}` }}>
            {IMPORTANT.map((t) => (
              <li
                key={t}
                style={{
                  padding: "14px 0",
                  borderBottom: `1px solid ${C.line3}`,
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                  fontSize: 15.5,
                  color: C.ink,
                }}
              >
                <span aria-hidden="true" style={{ ...mark, background: C.clay, fontSize: 11, color: C.onClay }}>
                  ✓
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p
        style={{
          margin: 0,
          maxWidth: 760,
          fontFamily: F.serif,
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: "clamp(19px,1.9vw,23px)",
          lineHeight: 1.45,
          color: C.body,
          textWrap: "pretty",
        }}
      >
        Mỗi cuộc gọi nhỡ là một câu hỏi: có quan trọng không? Bonia trả lời câu hỏi đó cho bạn, trước khi bạn phải bận tâm.
      </p>
    </Section>
  );
}
