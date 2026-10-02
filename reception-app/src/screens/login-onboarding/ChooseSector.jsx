import React from "react";
import { useLocation } from "wouter";
import { OnboardingBar } from "../../components/shell/index.js";
import { useIsMobile } from "../../lib/hooks.js";
import { SECTORS, setNewAccountSector } from "../../data/sectors.js";
import { Eyebrow, MONO, SERIF, Title } from "./ui.jsx";

// 3.0b Chọn lĩnh vực (brief §3.0b): after login, before every other step.
// Not drawn in handoff 11; built from the onboarding frames' language (bar
// with all five steps ahead, serif title, white cards on cream, the locked
// look of "Tự đặt phòng" for sectors that aren't open yet).
export function ChooseSector() {
  const [, navigate] = useLocation();
  const mobile = useIsMobile();

  const pick = (s) => {
    if (!s.ready) return;
    setNewAccountSector(s.key);
    navigate("/bat-dau/tim");
  };

  return (
    <div className={`lo-onb${mobile ? " lo-m" : ""}`}>
      <OnboardingBar step={0} saveLater={false} />
      <div className="lo-body">
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: mobile ? "28px 16px 40px" : "64px 40px 80px", display: "flex", flexDirection: "column", gap: mobile ? 20 : 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Eyebrow>Bắt đầu</Eyebrow>
            <Title size={mobile ? 32 : 44}>Bạn kinh doanh lĩnh vực nào?</Title>
            <p style={{ margin: 0, fontSize: mobile ? 15 : 17, lineHeight: 1.55, color: "var(--bn-ink-2)", maxWidth: 640 }}>
              Bonia cài sẵn từ ngữ và các mục cài đặt theo lĩnh vực của bạn.
            </p>
          </div>
          <div
            role="radiogroup"
            aria-label="Lĩnh vực"
            style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: mobile ? 12 : 16 }}
          >
            {SECTORS.map((s, i) => (
              <SectorCard key={s.key} s={s} n={i + 1} mobile={mobile} onPick={() => pick(s)} />
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--bn-muted)" }}>
            Đổi lĩnh vực sau khi đã cài: liên hệ hỗ trợ.
          </p>
        </div>
      </div>
    </div>
  );
}

function SectorCard({ s, n, mobile, onPick }) {
  const open = s.ready;
  return (
    <button
      type="button"
      role="radio"
      aria-checked="false"
      aria-disabled={!open}
      disabled={!open}
      onClick={onPick}
      className={open ? "lo-card-btn" : undefined}
      style={{
        textAlign: "left",
        font: "inherit",
        color: open ? "var(--bn-ink)" : "var(--bn-muted)",
        background: open ? "#FFFFFF" : "var(--bn-cream-2)",
        border: open ? "1px solid var(--bn-hairline)" : "1px dashed var(--bn-hairline)",
        borderRadius: 16,
        padding: mobile ? "18px 18px 16px" : "24px 24px 22px",
        minHeight: mobile ? 0 : 248,
        display: "flex",
        flexDirection: "column",
        gap: mobile ? 8 : 12,
        cursor: open ? "pointer" : "default",
      }}
    >
      <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, minHeight: 22 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", color: "var(--bn-muted)" }}>§ 0{n}</span>
        {!open && (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 9.5,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--bn-muted)",
              border: "1px solid var(--bn-muted)",
              borderRadius: 4,
              padding: "2px 6px",
              whiteSpace: "nowrap",
            }}
          >
            Sớm ra mắt
          </span>
        )}
      </span>
      <span style={{ fontFamily: SERIF, fontWeight: 400, fontSize: mobile ? 28 : 34, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{s.label}</span>
      <span style={{ fontSize: 14.5, lineHeight: 1.5, color: open ? "var(--bn-ink-2)" : "var(--bn-muted)" }}>{s.desc}</span>
      {open && (
        <span style={{ marginTop: "auto", paddingTop: mobile ? 6 : 12, fontSize: 15, fontWeight: 500, color: "var(--bn-clay)" }}>Bắt đầu cài đặt →</span>
      )}
    </button>
  );
}
