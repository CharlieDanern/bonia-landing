import React, { useRef, useState } from "react";
import { useIsMobile } from "../../lib/hooks.js";
import { smsCountLabel, stripAccents } from "../../lib/sms.js";
import { LockTag } from "../../components/ui/index.js";
import { Body, DraftBar, GroupLabel, MobileBack, SectionHead, SegmentBox, useDraft } from "./parts.jsx";

// §09 Tin nhắn cho khách (3.6 K): 6 templates × Tiếng Việt / Tiếng Anh,
// insert chips, live character / SMS count. Messages go out from the
// hotel's own phone; Vietnamese is sent không dấu to fit one SMS.

// Insert chips → the placeholder each language uses.
const TOKENS = {
  "Tên khách": { vi: "[Tên khách]", en: "[Guest name]" },
  "Loại phòng": { vi: "[Loại phòng]", en: "[Room type]" },
  "Ngày nhận": { vi: "[Ngày nhận]", en: "[Check-in]" },
  "Số đêm": { vi: "[Số đêm]", en: "[Nights]" },
  "Tổng tiền": { vi: "[Tổng tiền]", en: "[Total]" },
  "Tên ngắn khách sạn": { vi: "[Tên ngắn khách sạn]", en: "[Hotel short name]" },
};

// Preview guest: anh Long (Superior 9/10, 1 đêm, 620.000đ).
const SAMPLE = {
  vi: {
    "[Tên ngắn khách sạn]": "KS San Nhai",
    "[Tên khách]": "anh Long",
    "[Loại phòng]": "Superior",
    "[Ngày nhận]": "9/10",
    "[Số đêm]": "1",
    "[Tổng tiền]": "620.000đ",
  },
  en: {
    "[Hotel short name]": "San Nhai Hotel",
    "[Guest name]": "Long",
    "[Room type]": "Superior",
    "[Check-in]": "Fri 9/10",
    "[Nights]": "1",
    "[Total]": "620,000 VND",
  },
};

function preview(text, lang) {
  let out = text || "";
  for (const [k, v] of Object.entries(SAMPLE[lang])) out = out.split(k).join(v);
  return lang === "vi" ? stripAccents(out) : out;
}

export function S09() {
  const mobile = useIsMobile();
  const d = useDraft("09");
  const v = d.draft["09"];
  const [sel, setSel] = useState(v.templates[0].id);
  const [lang, setLang] = useState("vi");
  const ta = useRef(null);
  const tpl = v.templates.find((t) => t.id === sel) || v.templates[0];
  const text = tpl[lang] || "";
  const pv = preview(text, lang);

  const setText = (next) =>
    d.set("09", (s) => ({ templates: s.templates.map((t) => (t.id === tpl.id ? { ...t, [lang]: next } : t)) }));

  const insert = (chip) => {
    const token = TOKENS[chip][lang];
    const el = ta.current;
    const start = el ? el.selectionStart : text.length;
    const end = el ? el.selectionEnd : text.length;
    const next = text.slice(0, start) + token + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <>
      <Body>
        <MobileBack />
        <SectionHead eyebrow={`§ 09 · Cài đặt · ${v.templates.length} mẫu`} title="Tin nhắn cho khách" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: mobile ? "minmax(0,1fr)" : "260px minmax(0,1fr)",
            gap: 20,
            flex: 1,
            minHeight: 0,
          }}
        >
          <div role="listbox" aria-label="Mẫu tin" style={{ display: "flex", flexDirection: mobile ? "row" : "column", gap: 4, overflowX: mobile ? "auto" : undefined }}>
            {v.templates.map((t) => {
              const on = t.id === tpl.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="option"
                  aria-selected={on}
                  className={on ? undefined : "tt-nav-item"}
                  onClick={() => setSel(t.id)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: on ? "#fff" : "transparent",
                    border: `1px solid ${on ? "var(--bn-clay)" : "transparent"}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    flex: mobile ? "none" : undefined,
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: on ? 600 : 400, whiteSpace: mobile ? "nowrap" : undefined }}>{t.label}</span>
                  <span style={{ fontFamily: "var(--bn-mono)", fontSize: 10, letterSpacing: "0.1em", color: "var(--bn-muted)" }}>
                    {t.vi ? "VI" : "VI —"} · {t.en ? "EN" : "EN —"}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid var(--bn-hairline)",
              borderRadius: 14,
              padding: mobile ? "16px" : "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              minWidth: 0,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{tpl.label}</span>
              <SegmentBox
                options={[
                  { value: "vi", label: "Tiếng Việt" },
                  { value: "en", label: "Tiếng Anh" },
                ]}
                value={lang}
                onChange={setLang}
                height={32}
                bold={false}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {v.insertChips.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="tt-chip"
                  onClick={() => insert(c)}
                  style={{
                    height: 30,
                    padding: "0 10px",
                    borderRadius: 15,
                    border: "1px dashed var(--bn-clay)",
                    color: "var(--bn-clay)",
                    fontSize: 12.5,
                  }}
                >
                  + {c}
                </button>
              ))}
            </div>
            <textarea
              ref={ta}
              className="sb-textarea"
              aria-label={`${tpl.label} · ${lang === "vi" ? "Tiếng Việt" : "Tiếng Anh"}`}
              value={text}
              placeholder="Viết mẫu tin, bấm các ô ở trên để chèn tên khách, ngày…"
              onChange={(e) => setText(e.target.value)}
              style={{
                minHeight: 96,
                border: "2px solid var(--bn-clay)",
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 14.5,
                lineHeight: 1.7,
                resize: "vertical",
                outline: 0,
                fontFamily: "var(--bn-sans)",
                fieldSizing: "content",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--bn-muted)", flexWrap: "wrap" }}>
              <span>{lang === "vi" ? "Gửi không dấu để đỡ tốn tin · tự bỏ dấu khi gửi" : "Tin tiếng Anh gửi nguyên văn"}</span>
              <span style={{ fontFamily: "var(--bn-mono)" }}>{smsCountLabel(pv)}</span>
            </div>
            <div style={{ borderTop: "1px solid var(--bn-hairline-2)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <GroupLabel>Xem trước · anh Long</GroupLabel>
              <div
                style={{
                  alignSelf: "flex-start",
                  maxWidth: 460,
                  padding: "12px 14px",
                  borderRadius: "16px 16px 16px 4px",
                  background: "var(--bn-hairline-2)",
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: pv ? undefined : "var(--bn-muted)",
                }}
              >
                {pv || "Chưa có nội dung."}
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--bn-ink-2)", display: "flex", gap: 8, alignItems: "center" }}>
              <LockTag />
              Bonia không điền số tài khoản. Bạn tự gửi thông tin cọc.
            </div>
          </div>
        </div>
      </Body>
      <DraftBar d={d} detail={d.dirty ? `mẫu “${tpl.label}”` : ""} />
    </>
  );
}
