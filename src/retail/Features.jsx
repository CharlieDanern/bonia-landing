import { C, F, pad2 } from "./tokens.js";
import { Section, SectionHead } from "./parts.jsx";
import { FEATURES } from "./data.js";

/* §02 Giải pháp (#tinhnang): three features in a hairline grid, 1 px
 * #D9D0BF gaps between #F7F3EC cells. The grid has a background, so the
 * scroll reveal shows it as one block and the lines never show up empty. */
export default function Features() {
  return (
    <Section id="tinhnang" label="03 Giải pháp">
      <SectionHead
        kicker="§ 02 · Giải pháp"
        title="Một trợ lý lịch sự,"
        em="nói tiếng Việt tự nhiên."
        lead="Bonia hoạt động như một thư ký riêng: khéo léo tìm hiểu mục đích cuộc gọi, ghi lại nội dung, và để bạn quyết định có gọi lại hay không."
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))",
          gap: 1,
          background: C.line,
          border: `1px solid ${C.line}`,
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            style={{
              background: C.card,
              padding: "clamp(20px,2.8vw,32px)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              minHeight: 200,
            }}
          >
            <span style={{ fontFamily: F.mono, fontSize: 12, color: C.clay }}>{pad2(i)}</span>
            <h3
              style={{
                margin: 0,
                fontFamily: F.serif,
                fontWeight: 400,
                fontSize: "clamp(21px,2vw,24px)",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                textWrap: "balance",
              }}
            >
              {f.title}
            </h3>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.58, color: C.muted, textWrap: "pretty" }}>{f.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
