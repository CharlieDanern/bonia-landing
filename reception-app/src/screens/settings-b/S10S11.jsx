import React, { useState } from "react";
import { useIsMobile } from "../../lib/hooks.js";
import { telHref } from "../../lib/sms.js";
import { useStore } from "../../store/index.jsx";
import { Button, Dialog, LockTag, Toggle } from "../../components/ui/index.js";
import { Body, DraftBar, GroupLabel, MobileBack, PillButton, Row, SectionHead, SegmentBox, useDraft } from "./parts.jsx";

// §10 Thông báo + §11 Bảo mật & dữ liệu share one page (3.6 L), two
// columns on desktop. One save bar covers both sections.

const TIME_INPUT = {
  fontFamily: "var(--bn-mono)",
  fontSize: 14,
  border: 0,
  background: "transparent",
  padding: 0,
  outline: 0,
  width: 46,
  textAlign: "right",
};

export function S10S11() {
  const mobile = useIsMobile();
  const state = useStore();
  const d = useDraft(["10", "11"]);
  const n = d.draft["10"];
  const s = d.draft["11"];
  const [exportOpen, setExportOpen] = useState(false);
  const [exported, setExported] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [quietFrom, quietTo] = n.quietHours.range.split("–");

  return (
    <>
      <Body style={{ display: "grid", gridTemplateColumns: mobile ? "minmax(0,1fr)" : "1fr 1fr", gap: 24, alignContent: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <MobileBack />
          <SectionHead eyebrow="§ 10 · Cài đặt" title="Thông báo" size={32} />
          <div role="radiogroup" style={{ display: "flex", flexDirection: "column", border: "1px solid var(--bn-hairline)", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
            {[
              { id: "all", label: "Mọi yêu cầu" },
              { id: "urgent", label: "Chỉ việc gấp" },
            ].map((o) => {
              const on = n.scope === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => d.set("10", { scope: o.id })}
                  style={{
                    height: 46,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 14px",
                    fontSize: 14,
                    background: on ? "var(--bn-clay)" : "#fff",
                    color: on ? "#fff" : "var(--bn-ink)",
                    fontWeight: on ? 500 : 400,
                    textAlign: "left",
                  }}
                >
                  {on ? "✓ " : ""}
                  {o.label}
                </button>
              );
            })}
          </div>
          <div style={{ background: "#fff", border: "1px solid var(--bn-hairline)", borderRadius: 12 }}>
            <Row first>
              <span style={{ fontSize: 14 }}>Giờ im lặng, trừ việc gấp</span>
              <span style={{ display: "flex", alignItems: "center", fontFamily: "var(--bn-mono)", fontSize: 14 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label="Im lặng từ"
                  value={quietFrom}
                  onChange={(e) => d.set("10", { quietHours: { ...n.quietHours, range: `${e.target.value}–${quietTo}` } })}
                  style={TIME_INPUT}
                />
                –
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label="Im lặng tới"
                  value={quietTo}
                  onChange={(e) => d.set("10", { quietHours: { ...n.quietHours, range: `${quietFrom}–${e.target.value}` } })}
                  style={{ ...TIME_INPUT, textAlign: "left" }}
                />
              </span>
            </Row>
            <Row>
              <span style={{ fontSize: 14 }}>Tóm tắt cuối ngày</span>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label="Giờ gửi tóm tắt"
                  value={n.dailySummary.at}
                  onChange={(e) => d.set("10", { dailySummary: { ...n.dailySummary, at: e.target.value } })}
                  style={{ ...TIME_INPUT, fontSize: 13, color: "var(--bn-ink-2)" }}
                />
                <Toggle
                  on={n.dailySummary.on}
                  label="Tóm tắt cuối ngày"
                  onChange={(on) => d.set("10", { dailySummary: { ...n.dailySummary, on } })}
                />
              </span>
            </Row>
            <Row>
              <span style={{ fontSize: 14 }}>Báo khi dùng 80% và 100% số phút</span>
              <Toggle on={n.minutesAlert} label="Báo khi dùng 80% và 100% số phút" onChange={(minutesAlert) => d.set("10", { minutesAlert })} />
            </Row>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <SectionHead eyebrow="§ 11 · Cài đặt" title="Bảo mật & dữ liệu" size={32} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              padding: "14px 16px",
              background: "var(--bn-cream-2)",
              border: "1px solid var(--bn-hairline)",
              borderRadius: 12,
            }}
          >
            <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>{s.neverSay}</span>
            <LockTag />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <GroupLabel>Xác minh khi tra đặt phòng đã có</GroupLabel>
            <div role="radiogroup" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {s.verifyOptions.map((o) => {
                const on = s.verify === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => d.set("11", { verify: o.id })}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      minHeight: 46,
                      padding: "0 14px",
                      background: "#fff",
                      border: on ? "2px solid var(--bn-clay)" : "1px solid var(--bn-hairline)",
                      borderRadius: 10,
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        border: on ? "5px solid var(--bn-clay)" : "1px solid var(--bn-dashed)",
                        flex: "none",
                      }}
                    />
                    <span style={{ fontSize: 14, fontWeight: on ? 600 : 400 }}>{o.label}</span>
                    {o.note && <span style={{ fontSize: 12, color: "var(--bn-muted)", marginLeft: "auto" }}>{o.note}</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14 }}>Giữ ghi âm</span>
            <SegmentBox
              options={s.keepOptions.map((k) => ({ value: k, label: `${k} ngày` }))}
              value={s.keepRecordings}
              onChange={(keepRecordings) => d.set("11", { keepRecordings })}
              height={36}
            />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <PillButton height={42} padding="0 16px" fontSize={14} onClick={() => setExportOpen(true)}>
              Xuất dữ liệu
            </PillButton>
            <PillButton height={42} padding="0 16px" fontSize={14} color="var(--bn-urgent)" onClick={() => setDeleteOpen(true)}>
              Xóa dữ liệu…
            </PillButton>
          </div>
        </div>
      </Body>
      <DraftBar d={d} />

      <Dialog open={exportOpen} onClose={() => setExportOpen(false)} eyebrow="§ 11 · Bảo mật & dữ liệu" title="Xuất dữ liệu" width={560}>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--bn-ink-2)" }}>
          {exported
            ? "Đã nhận yêu cầu. Trong vòng 1 giờ, nút tải về hiện ở trang này; tệp giữ 24 giờ."
            : "Gồm yêu cầu, cuộc gọi, bản ghi lời nói, Lịch phòng và cài đặt. Ghi âm cũ hơn thời hạn giữ đã xóa sẽ không có."}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="secondary" size="sm" onClick={() => setExportOpen(false)}>
            {exported ? "Đóng" : "Để sau"}
          </Button>
          {!exported && (
            <Button size="sm" onClick={() => setExported(true)}>
              Chuẩn bị tệp
            </Button>
          )}
        </div>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} eyebrow="§ 11 · Bảo mật & dữ liệu" title="Xóa dữ liệu?" width={560}>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--bn-ink-2)" }}>
          Xóa hết ghi âm và bản ghi lời nói của khách. Yêu cầu và Lịch phòng vẫn giữ. Đã xóa thì không lấy lại được, nên việc này làm qua số hỗ trợ.
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="secondary" size="sm" onClick={() => setDeleteOpen(false)}>
            Không xóa
          </Button>
          <Button variant="danger" size="sm" href={telHref(state.hotel.supportPhone)}>
            Gọi hỗ trợ để xóa
          </Button>
        </div>
      </Dialog>
    </>
  );
}
