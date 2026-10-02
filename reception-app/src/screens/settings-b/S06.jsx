import React from "react";
import { useIsMobile } from "../../lib/hooks.js";
import { BoniaSays, Toggle } from "../../components/ui/index.js";
import { Body, Card, DraftBar, GroupLabel, InlineInput, MobileBack, PillButton, Row, SectionHead, WithPreview, useDraft } from "./parts.jsx";

// §06 Cách nghe máy (3.6 H). Error state = 3.6 Q: the greeting edit that
// could not be saved; Bonia keeps the old greeting until it is.

const Q_GREETING = "Dạ khách sạn Sân Nhài xin nghe, em có thể giúp gì ạ?";

/** Read the greeting aloud with the browser's Vietnamese voice, if any. */
function speak(text) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "vi-VN";
    u.rate = 0.95;
    synth.speak(u);
  } catch {
    /* no speech in this browser: the button simply does nothing */
  }
}

export function S06({ state }) {
  const failed = state === "error";
  const d = useDraft("06", failed ? { initial: { "06": { greeting: Q_GREETING } }, error: "Chưa lưu được. Máy đang mất mạng; thay đổi vẫn còn trên máy này." } : undefined);
  if (failed && (d.error || d.saving)) return <S06Unsaved d={d} />;
  return <S06Form d={d} />;
}

function S06Form({ d }) {
  const mobile = useIsMobile();
  const v = d.draft["06"];
  const set = (patch) => d.set("06", patch);

  const greetingField = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <GroupLabel>Lời chào · Bonia nói nguyên văn</GroupLabel>
      <div style={{ display: "flex", gap: 8, flexDirection: mobile ? "column" : "row" }}>
        <label
          className="sb-field"
          style={{
            flex: mobile ? "none" : 1,
            height: 52,
            border: "1px solid var(--bn-hairline)",
            borderRadius: 10,
            background: "#fff",
            padding: "0 14px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <InlineInput
            label="Lời chào"
            value={v.greeting}
            onChange={(greeting) => set({ greeting })}
            style={{ fontFamily: "var(--bn-serif)", fontSize: 18 }}
          />
        </label>
        <PillButton height={52} padding="0 18px" fontSize={14} onClick={() => speak(v.greeting)} style={{ gap: 4 }}>
          ▶ Nghe thử
        </PillButton>
      </div>
    </div>
  );

  const voiceRow = (
    <Row first minHeight={52} style={mobile ? { flexWrap: "wrap", padding: "10px 16px" } : undefined}>
      <span style={{ fontSize: 14.5 }}>Giọng</span>
      <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {v.voices.map((o) => {
          const on = o.id === v.voice;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => set({ voice: o.id })}
              className="tt-chip"
              style={{
                height: 34,
                padding: "0 12px",
                borderRadius: 17,
                fontSize: 13,
                background: on ? "var(--bn-clay)" : "transparent",
                color: on ? "#fff" : "var(--bn-ink)",
                border: on ? 0 : "1px solid var(--bn-hairline)",
              }}
            >
              {on ? "✓ " : ""}
              {o.label} ▶
            </button>
          );
        })}
      </span>
    </Row>
  );

  return (
    <>
      <Body>
        <WithPreview
          preview={
            <BoniaSays quote={`“${v.greeting}”`} size={18}>
              <div style={{ fontSize: 12.5, color: "var(--bn-muted)", borderTop: "1px solid var(--bn-hairline-2)", paddingTop: 10 }}>
                {v.announceAssistant ? "Đang bật báo trợ lý tự động, Bonia nói thêm:" : "Nếu bật báo trợ lý tự động, thêm:"}
              </div>
              <div style={{ fontFamily: "var(--bn-serif)", fontStyle: "italic", fontSize: 16, lineHeight: 1.5, color: "var(--bn-ink-2)" }}>
                “{v.announceLine}”
              </div>
            </BoniaSays>
          }
        >
          <MobileBack />
          <SectionHead eyebrow="§ 06 · Cài đặt" title="Cách nghe máy" />
          {greetingField}
          <Card>
            {voiceRow}
            <Row>
              <span style={{ fontSize: 14.5 }}>Tiếng Anh khi khách nói tiếng Anh</span>
              <Toggle on={v.english} onChange={(english) => set({ english })} label="Tiếng Anh khi khách nói tiếng Anh" />
            </Row>
            <Row style={mobile ? { flexDirection: "column", alignItems: "flex-start", gap: 4, padding: "12px 16px" } : undefined}>
              <span style={{ fontSize: 14.5 }}>Xưng hô</span>
              <span style={{ fontSize: 14, color: "var(--bn-ink-2)" }}>{v.address}</span>
            </Row>
            <Row minHeight={60} style={mobile ? { padding: "10px 16px" } : undefined}>
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 14.5 }}>Báo khách đây là trợ lý tự động</span>
                <span style={{ fontSize: 12.5, color: "var(--bn-muted)" }}>Tắt sẵn. Bật thì Bonia nói thêm một câu ngắn sau lời chào.</span>
              </span>
              <Toggle
                on={v.announceAssistant}
                onChange={(announceAssistant) => set({ announceAssistant })}
                label="Báo khách đây là trợ lý tự động"
              />
            </Row>
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              className="tt-label"
              style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}
            >
              <span>Giới thiệu thêm</span>
              <span>Tối đa 1 lần mỗi cuộc gọi · chỉ khi liên quan</span>
            </div>
            <Card>
              {v.upsells.map((u, i) => (
                <Row key={u.id} first={i === 0} minHeight={48} style={mobile ? { padding: "8px 16px" } : undefined}>
                  <span style={{ fontSize: 14 }}>{u.label}</span>
                  <Toggle
                    on={u.on}
                    label={u.label}
                    onChange={(on) => set((s) => ({ upsells: s.upsells.map((x) => (x.id === u.id ? { ...x, on } : x)) }))}
                  />
                </Row>
              ))}
            </Card>
          </div>
          <Card>
            <FreeRow first label="Cuộc gọi rác" value={v.spam} onChange={(spam) => set({ spam })} />
            <FreeRow
              label="Bonia cần biết thêm"
              value={v.extraKnowledge}
              placeholder={v.extraKnowledgePlaceholder}
              onChange={(extraKnowledge) => set({ extraKnowledge })}
            />
          </Card>
        </WithPreview>
      </Body>
      <DraftBar d={d} />
    </>
  );
}

function FreeRow({ first, label, value, placeholder, onChange }) {
  const mobile = useIsMobile();
  return (
    <label
      style={{
        display: "grid",
        gridTemplateColumns: mobile ? "1fr" : "150px 1fr",
        gap: mobile ? 4 : 12,
        alignItems: "center",
        minHeight: 50,
        padding: mobile ? "10px 16px" : "0 16px",
        borderTop: first ? 0 : "1px solid var(--bn-hairline-2)",
      }}
    >
      <span style={{ fontSize: 13, color: "var(--bn-muted)" }}>{label}</span>
      <InlineInput value={value} placeholder={placeholder} onChange={onChange} label={label} />
    </label>
  );
}

/** 3.6 Q: only the change that failed to save, plus the error bar. */
function S06Unsaved({ d }) {
  const v = d.draft["06"];
  return (
    <>
      <Body style={{ maxWidth: 700 }}>
        <MobileBack />
        <SectionHead eyebrow="§ 06 · Cài đặt" title="Cách nghe máy" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <GroupLabel>Lời chào</GroupLabel>
          <label
            style={{
              height: 52,
              border: "2px solid var(--bn-clay)",
              borderRadius: 10,
              background: "#fff",
              padding: "0 14px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <InlineInput
              label="Lời chào"
              value={v.greeting}
              onChange={(greeting) => d.set("06", { greeting })}
              style={{ fontFamily: "var(--bn-serif)", fontSize: 18 }}
            />
          </label>
        </div>
        <div style={{ fontSize: 13.5, color: "var(--bn-ink-2)" }}>Bonia vẫn dùng lời chào cũ cho tới khi lưu được.</div>
      </Body>
      <DraftBar d={d} />
    </>
  );
}
