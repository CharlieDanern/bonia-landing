import React, { useState } from "react";
import { useStore, useActions } from "../../store/index.jsx";
import { useIsMobile } from "../../lib/hooks.js";
import { BoniaSays, Button, SideSheet, TextInput, Toggle } from "../../components/ui/index.js";
import { Body, GroupLabel, InlineInput, MobileBack, PillButton, SectionHead, WithPreview } from "./parts.jsx";

// §08 Hôm nay & thông báo tạm (3.6 J). Switches act at once (they are the
// same switches as on Hôm nay: "Hết phòng tối nay" sets tonight to 0), so
// this page has no save bar. The temporary line is used by Bonia right away.

// What Bonia says in a typical call while a switch is on (preview column).
const EXAMPLES = {
  "khong-theo-gio-sau-20": {
    context: "Khách gọi lúc 20:30 hỏi thuê theo giờ",
    quote: "“Dạ sau 8 giờ tối bên em không nhận khách theo giờ ạ. Nếu anh chị ở qua đêm thì bên em còn phòng ạ.”",
  },
  "het-phong-toi-nay": {
    context: "Khách gọi hỏi phòng tối nay",
    quote: "“Dạ tối nay bên em hết phòng rồi ạ. Anh chị muốn em ghi lại cho tối mai không ạ?”",
  },
  "khong-theo-gio-hom-nay": {
    context: "Khách gọi hỏi thuê theo giờ",
    quote: "“Dạ hôm nay bên em không nhận theo giờ ạ. Nếu anh chị ở qua đêm thì em ghi lại cho mình nha.”",
  },
};

export function S08() {
  const mobile = useIsMobile();
  const state = useStore();
  const { setSwitch, setTempNotice, saveSettings } = useActions();
  const list = state.settings["08"].switches;
  const [lastOn, setLastOn] = useState(null);
  const [sheet, setSheet] = useState(false);
  const [newSw, setNewSw] = useState({ label: "", say: "" });
  const [notice, setNotice] = useState(state.tempNotice.text);
  const [until, setUntil] = useState(state.tempNotice.until);

  const onIds = list.filter((s) => state.switches[s.id]).map((s) => s.id);
  const focus = lastOn && state.switches[lastOn] ? lastOn : onIds[0];
  const focusSw = list.find((s) => s.id === focus);
  const ex = focus
    ? EXAMPLES[focus] || { context: "Khi khách gọi", quote: focusSw.say }
    : state.tempNotice.on
      ? { context: "Khi khách gọi", quote: state.tempNotice.say }
      : { context: "Không có công tắc nào đang bật", quote: "“Dạ khách sạn Sân Nhài xin nghe ạ.”" };

  const commitNotice = () => {
    const text = notice.trim();
    if (text === state.tempNotice.text && until === state.tempNotice.until) return;
    setTempNotice({
      text,
      on: !!text,
      until,
      untilLabel: `hôm nay ${until}`,
      say: text ? `“Dạ ${text.charAt(0).toLowerCase()}${text.slice(1)}, mong anh chị thông cảm ạ.”` : "",
    });
  };

  const addSwitch = () => {
    const label = newSw.label.trim();
    if (!label) return;
    const say = newSw.say.trim() ? `“${newSw.say.trim().replace(/^“|”$/g, "")}”` : "";
    const id = `rieng-${Date.now()}`;
    saveSettings("08", { switches: [...list, { id, label, say, on: false }] });
    setNewSw({ label: "", say: "" });
    setSheet(false);
  };

  return (
    <>
      <Body>
        <WithPreview
          preview={
            <>
              <BoniaSays context={ex.context} quote={ex.quote} />
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--bn-muted)", padding: "0 4px" }}>
                “Hết phòng tối nay” cũng là công tắc lớn ở Hôm nay. Bật thì Lịch phòng tối nay còn 0 mọi loại; tắt thì trả lại số cũ.
              </div>
            </>
          }
        >
          <MobileBack />
          <SectionHead
            eyebrow="§ 08 · Cài đặt"
            title="Hôm nay & thông báo tạm"
            right={
              <PillButton height={40} padding="0 16px" fontSize={14} onClick={() => setSheet(true)}>
                + Tạo công tắc
              </PillButton>
            }
          />
          <div style={{ background: "#fff", border: "1px solid var(--bn-hairline)", borderRadius: 12 }}>
            {list.map((w, i) => {
              const on = !!state.switches[w.id];
              return (
                <div
                  key={w.id}
                  className="sb-row-btn"
                  onClick={() => {
                    setSwitch(w.id, !on);
                    if (!on) setLastOn(w.id);
                  }}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 14,
                    minHeight: 56,
                    padding: "6px 16px",
                    borderTop: i ? "1px solid var(--bn-hairline-2)" : 0,
                    background: on ? "var(--bn-urgent-wash)" : "#fff",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <span style={{ fontSize: 14.5, fontWeight: on ? 600 : 400 }}>{w.label}</span>
                    {w.say && (
                      <span style={{ fontSize: 12.5, color: "var(--bn-ink-2)", fontFamily: "var(--bn-serif)", fontStyle: "italic" }}>{w.say}</span>
                    )}
                  </div>
                  <Toggle
                    on={on}
                    label={w.label}
                    onChange={(v) => {
                      setSwitch(w.id, v);
                      if (v) setLastOn(w.id);
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <GroupLabel>Dòng thông báo tạm · Bonia dùng ngay</GroupLabel>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "minmax(0,1fr)" : "minmax(0,1fr) 150px", gap: 8 }}>
              <label
                style={{
                  height: 50,
                  border: notice ? "2px solid var(--bn-clay)" : "1px solid var(--bn-hairline)",
                  borderRadius: 10,
                  background: "#fff",
                  padding: "0 14px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <InlineInput
                  label="Dòng thông báo tạm"
                  value={notice}
                  placeholder="Ví dụ: Thang máy đang bảo trì tới 17:00"
                  onChange={setNotice}
                  onBlur={commitNotice}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  style={{ fontSize: 15 }}
                />
              </label>
              <label
                style={{
                  position: "relative",
                  height: 50,
                  border: "1px solid var(--bn-hairline)",
                  borderRadius: 10,
                  background: "#fff",
                  padding: "0 12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 11, color: "var(--bn-muted)" }}>Tự tắt lúc</span>
                <span style={{ fontFamily: "var(--bn-mono)", fontSize: 14 }}>hôm nay {until}</span>
                {/* Native time picker over the box (numeric keypad on phones). */}
                <input
                  type="time"
                  aria-label="Tự tắt lúc"
                  value={until}
                  onChange={(e) => setUntil(e.target.value || until)}
                  onBlur={commitNotice}
                  style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", cursor: "pointer" }}
                />
              </label>
            </div>
          </div>
        </WithPreview>
      </Body>

      <SideSheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Tạo công tắc"
        footer={
          <Button block size="sm" disabled={!newSw.label.trim()} onClick={addSwitch}>
            Thêm công tắc
          </Button>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 20 }}>
          <div style={{ fontSize: 13.5, color: "var(--bn-ink-2)", lineHeight: 1.5 }}>
            Một tình huống hay gặp, bật khi cần. Bonia nói đúng câu bạn viết.
          </div>
          <TextInput label="Tên công tắc" value={newSw.label} placeholder="Ví dụ: Hồ bơi đóng cửa" onChange={(label) => setNewSw((s) => ({ ...s, label }))} />
          <TextInput
            label="Bonia sẽ nói"
            value={newSw.say}
            placeholder="Dạ hồ bơi hôm nay tạm đóng ạ."
            onChange={(say) => setNewSw((s) => ({ ...s, say }))}
          />
        </div>
      </SideSheet>
    </>
  );
}
