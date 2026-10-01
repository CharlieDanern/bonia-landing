import { C } from "./tokens.js";
import { Section, SectionHead } from "./parts.jsx";
import { FAQ } from "./data.js";

/* §06 Câu hỏi (#cauhoi): a native <details> accordion between hairlines;
 * the round + turns into × when a question is open (retail.css). */
export default function Faq() {
  return (
    <Section id="cauhoi" label="07 Câu hỏi" max={880} gap="clamp(24px,3.4vw,40px)">
      <SectionHead kicker="§ 06 · Câu hỏi thường gặp" title="Những điều bạn" em="có thể đang băn khoăn." max={0} />
      <div style={{ display: "flex", flexDirection: "column", borderTop: `1px solid ${C.line}` }}>
        {FAQ.map((q) => (
          <details key={q.q} style={{ borderBottom: `1px solid ${C.line}` }}>
            <summary style={{ padding: "20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: "clamp(16px,1.5vw,17.5px)", fontWeight: 500, lineHeight: 1.4 }}>{q.q}</span>
              <span
                aria-hidden="true"
                className="rt-plus"
                style={{
                  width: 28,
                  height: 28,
                  flex: "none",
                  borderRadius: 14,
                  border: `1px solid ${C.line}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  color: C.clay,
                }}
              >
                +
              </span>
            </summary>
            <p style={{ margin: "0 0 22px", maxWidth: "68ch", fontSize: 15.5, lineHeight: 1.62, color: C.muted, textWrap: "pretty" }}>{q.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
