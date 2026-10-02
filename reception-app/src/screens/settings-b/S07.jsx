import React, { useState } from "react";
import { Link } from "wouter";
import { useStore, useActions } from "../../store/index.jsx";
import { useIsMobile } from "../../lib/hooks.js";
import { nowHHMM } from "../../lib/clock.js";
import { copyText, dialCodeHref } from "../../lib/sms.js";
import { Button, Dialog } from "../../components/ui/index.js";
import { Body, DraftBar, MobileBack, PillButton, SectionHead, SegmentBox, useDraft, useFlash } from "./parts.jsx";

// §07 Kết nối (3.6 I): the hotel keeps its number and forwards to Bonia;
// line health with "Kiểm tra ngay"; hotel software (coming); web search.

const CODE_PREFIX = { "no-answer": ["**61*"], busy: ["**67*"], both: ["**61*", "**67*"], all: ["**21*"] };

function codesFor(when, base) {
  const target = base.replace(/^\*\*\d+\*/, "");
  return (CODE_PREFIX[when] || CODE_PREFIX["no-answer"]).map((p) => p + target);
}

const mono10 = { fontFamily: "var(--bn-mono)", fontSize: 10, letterSpacing: "0.2em", color: "var(--bn-muted)", textTransform: "uppercase" };

const panel = { background: "#fff", border: "1px solid var(--bn-hairline)", borderRadius: 12, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 };

export function S07() {
  const mobile = useIsMobile();
  const state = useStore();
  const { setLineStatus } = useActions();
  const d = useDraft("07");
  const v = d.draft["07"];
  const [copied, flash] = useFlash();
  const [checking, setChecking] = useState(false);
  const [testing, setTesting] = useState(false);
  const [health, setHealth] = useState(() => ({ ...v.lineHealth }));
  const [testNote, setTestNote] = useState("");
  const [vnptOpen, setVnptOpen] = useState(false);
  const [vnptSent, setVnptSent] = useState(false);
  const codes = codesFor(v.when, v.forwardCode);
  const ok = state.line.status !== "warn";

  // Automatic test call to the hotel's own line (the counter phone may ring).
  const checkNow = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setHealth((h) => ({ ...h, lastCheck: `${nowHHMM()} ✓` }));
      setLineStatus("ok");
    }, 1800);
  };

  const testCall = () => {
    setTesting(true);
    setTestNote("");
    setTimeout(() => {
      setTesting(false);
      const t = nowHHMM();
      setHealth((h) => ({ ...h, lastCall: t }));
      setTestNote(`Bonia đã nghe cuộc gọi thử lúc ${t}.`);
    }, 2200);
  };

  return (
    <>
      <Body>
        <MobileBack />
        <SectionHead eyebrow="§ 07 · Cài đặt" title="Kết nối" />
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "minmax(0,1fr)" : "minmax(0,1.3fr) minmax(0,1fr)", gap: 12 }}>
          <div style={panel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={mono10}>Số điện thoại · giữ số đang dùng</span>
              <span
                style={{
                  fontFamily: "var(--bn-mono)",
                  fontSize: 9.5,
                  letterSpacing: "0.1em",
                  padding: "4px 8px",
                  borderRadius: 10,
                  border: "1px solid var(--bn-ok)",
                  color: "var(--bn-ok)",
                  whiteSpace: "nowrap",
                }}
              >
                ✓ ĐANG CHUYỂN TỚI BONIA
              </span>
            </div>
            <div style={{ fontFamily: "var(--bn-mono)", fontSize: 26 }}>
              {v.number}{" "}
              <span style={{ fontFamily: "var(--bn-sans)", fontSize: 14, color: "var(--bn-ink-2)" }}>· {v.carrier}</span>
            </div>
            <SegmentBox
              options={v.whenOptions.map((o) => ({ value: o.id, label: o.label }))}
              value={v.when}
              onChange={(when) => d.set("07", { when })}
              height={40}
              radius={10}
              padding="0"
              columns={mobile ? "repeat(2,1fr)" : undefined}
              perRow={mobile ? 2 : undefined}
              itemStyle={{ justifyContent: "center", textAlign: "left" }}
            />
            {codes.map((code) => (
              <div
                key={code}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  padding: "10px 12px",
                  background: "var(--bn-cream-2)",
                  borderRadius: 10,
                }}
              >
                <span style={{ fontFamily: "var(--bn-mono)", fontSize: 16 }}>{code}</span>
                <span style={{ display: "flex", gap: 6 }}>
                  <PillButton href={dialCodeHref(code)}>Bấm để cài</PillButton>
                  <PillButton
                    onClick={async () => {
                      if (await copyText(code)) flash(code);
                    }}
                  >
                    {copied === code ? "Đã chép" : "Sao chép mã"}
                  </PillButton>
                </span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button size="xs" loading={testing} onClick={testCall} style={{ height: 42, padding: "0 18px", gap: 8 }}>
                {testing ? "Đang gọi thử" : "Gọi thử"}
              </Button>
              <PillButton height={42} padding="0 16px" fontSize={14} onClick={() => setVnptOpen(true)}>
                Đổi sang số mới của VNPT
              </PillButton>
            </div>
            {testNote && <span style={{ fontSize: 13, color: "var(--bn-ok)" }}>✓ {testNote}</span>}
          </div>

          <div style={panel}>
            <div style={mono10}>Tình trạng đường dây</div>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: ok ? 5 : 2,
                  background: ok ? "var(--bn-ok)" : "var(--bn-urgent)",
                }}
              />
              <span style={{ fontSize: 15, fontWeight: 600, color: ok ? undefined : "var(--bn-urgent)" }}>
                {ok ? health.status : "Cần kiểm tra"}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, fontSize: 13.5 }}>
              <span style={{ color: "var(--bn-muted)" }}>Cuộc gọi gần nhất Bonia nhận</span>
              <span style={{ fontFamily: "var(--bn-mono)" }}>{health.lastCall}</span>
              <span style={{ color: "var(--bn-muted)" }}>Lần kiểm tra gần nhất</span>
              <span style={{ fontFamily: "var(--bn-mono)" }}>{health.lastCheck}</span>
              <span style={{ color: "var(--bn-muted)" }}>Ngưỡng báo</span>
              <span>{health.threshold}</span>
            </div>
            <Button variant="secondary" loading={checking} onClick={checkNow} style={{ height: 42, fontSize: 14, gap: 8, width: "100%" }}>
              {checking ? "Đang gọi kiểm tra" : "Kiểm tra ngay"}
            </Button>
            <span style={{ fontSize: 12, color: "var(--bn-muted)" }}>Máy quầy có thể đổ chuông khi kiểm tra.</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: mobile ? "minmax(0,1fr)" : "1fr 1fr", gap: 12 }}>
          <div
            style={{
              background: "var(--bn-cream-2)",
              border: "1px dashed var(--bn-dashed)",
              borderRadius: 12,
              padding: "16px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span style={mono10}>Phần mềm quản lý khách sạn</span>
              <span style={{ fontFamily: "var(--bn-mono)", fontSize: 9.5, letterSpacing: "0.12em", color: "var(--bn-muted)", whiteSpace: "nowrap" }}>
                SẮP CÓ
              </span>
            </div>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Chưa kết nối</span>
            <span style={{ fontSize: 13, color: "var(--bn-ink-2)", lineHeight: 1.5 }}>
              Bản này Bonia dùng Lịch phòng của chính nó. Khi có kết nối, Bonia đọc phòng trống từ phần mềm bạn đang dùng.
            </span>
          </div>
          <div style={{ ...panel, gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={mono10}>Thông tin tìm trên mạng</span>
              <Link href="/bat-dau" className="sb-link" style={{ fontSize: 13, color: "var(--bn-clay)", fontWeight: 500, whiteSpace: "nowrap" }}>
                Tìm lại trên mạng
              </Link>
            </div>
            <div style={{ fontSize: 13, color: "var(--bn-ink-2)" }}>{v.webSearch.last}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {v.webSearch.sources.map((s) => (
                <span
                  key={s.id}
                  title={s.ok ? "Đã đọc" : "Không tìm thấy"}
                  style={{
                    fontFamily: "var(--bn-mono)",
                    fontSize: 9.5,
                    letterSpacing: "0.14em",
                    border: s.ok ? "1px solid var(--bn-hairline)" : "1px dashed var(--bn-dashed)",
                    color: s.ok ? undefined : "var(--bn-muted)",
                    borderRadius: 4,
                    padding: "3px 7px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.label} {s.ok ? "✓" : "—"}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Body>
      <DraftBar d={d} detail={d.dirty ? `Bonia nghe máy: ${v.whenOptions.find((o) => o.id === v.when)?.label} · bấm mã mới để cài` : ""} />

      <Dialog open={vnptOpen} onClose={() => setVnptOpen(false)} eyebrow="§ 07 · Kết nối" title="Đổi sang số mới của VNPT" width={560}>
        {vnptSent ? (
          <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--bn-ink-2)" }}>
            Đã gửi yêu cầu. VNPT sẽ gọi số {v.number} để hẹn ngày đổi. Trong lúc chờ, Bonia vẫn nghe máy như bây giờ.
          </div>
        ) : (
          <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--bn-ink-2)" }}>
            Khách sạn nhận một số mới của VNPT, Bonia nghe máy ở số đó, không cần cài chuyển cuộc gọi. Số đang dùng vẫn giữ nguyên tới khi bạn đổi xong.
          </div>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Button variant="secondary" size="sm" onClick={() => setVnptOpen(false)}>
            {vnptSent ? "Đóng" : "Để sau"}
          </Button>
          {!vnptSent && (
            <Button size="sm" onClick={() => setVnptSent(true)}>
              Gửi yêu cầu cho VNPT
            </Button>
          )}
        </div>
      </Dialog>
    </>
  );
}
