import React from "react";
import { Link } from "wouter";
import { BONIA_MARK } from "../../lib/assets.js";
import { ONBOARDING_STEPS, STEP_SLUGS } from "../../data/onboarding.js";
import { useIsMobile } from "../../lib/hooks.js";

// TT Onboarding Bar, exact: 72px, #F7F3EC, bottom hairline, padding 0 40.
// Steps: done = clay dot ✓ · current = white pill + clay outline dot · future muted.
// Done steps link back; "Lưu, làm tiếp sau" leaves to Hôm nay (state kept).
export function OnboardingBar({ step = 1, onSaveLater, saveLaterTo = "/hom-nay" }) {
  const mobile = useIsMobile();
  return (
    <header
      style={{
        height: 72,
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: mobile ? "0 16px" : "0 40px",
        borderBottom: "1px solid var(--bn-hairline)",
        background: "var(--bn-cream-2)",
        fontFamily: "var(--bn-sans)",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, width: mobile ? "auto" : 220 }}>
        <img src={BONIA_MARK} alt="Bonia" style={{ height: 22, width: "auto", display: "block" }} />
        {!mobile && (
          <span style={{ fontFamily: "var(--bn-mono)", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--bn-muted)" }}>
            Tiếp tân
          </span>
        )}
      </div>
      <ol style={{ display: "flex", alignItems: "center", gap: 6, listStyle: "none", margin: 0, padding: 0 }} aria-label="Các bước">
        {ONBOARDING_STEPS.map((label, i) => {
          const n = i + 1;
          const done = n < step;
          const on = n === step;
          if (mobile && !on) {
            return (
              <li key={label} aria-hidden="true">
                <span style={{ display: "block", width: 8, height: 8, borderRadius: 4, background: done ? "var(--bn-clay)" : "var(--bn-hairline)" }} />
              </li>
            );
          }
          const pill = (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 34,
                padding: "0 12px 0 6px",
                borderRadius: 17,
                background: on ? "#FFFFFF" : "transparent",
                whiteSpace: "nowrap",
                flex: "none",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--bn-mono)",
                  fontSize: 11,
                  background: done ? "var(--bn-clay)" : "#FFFFFF",
                  color: done ? "#FFFFFF" : on ? "var(--bn-clay)" : "var(--bn-muted)",
                  border: `1px solid ${done || on ? "var(--bn-clay)" : "var(--bn-hairline)"}`,
                }}
              >
                {done ? "✓" : n}
              </span>
              <span style={{ fontSize: 13, color: done || on ? "var(--bn-ink)" : "var(--bn-muted)", fontWeight: on ? 600 : 400 }}>{label}</span>
            </div>
          );
          return (
            <li key={label} style={{ display: "flex", alignItems: "center", gap: 6 }} aria-current={on ? "step" : undefined}>
              {done ? (
                <Link href={`/bat-dau/${STEP_SLUGS[i]}`} style={{ color: "inherit" }}>
                  {pill}
                </Link>
              ) : (
                pill
              )}
              {!mobile && n < ONBOARDING_STEPS.length && <span style={{ width: 18, height: 1, background: "var(--bn-hairline)", display: "block" }} />}
            </li>
          );
        })}
      </ol>
      <div style={{ width: mobile ? "auto" : 220, display: "flex", justifyContent: "flex-end" }}>
        <Link href={saveLaterTo} onClick={onSaveLater} style={{ fontSize: 13, color: "var(--bn-clay)", fontWeight: 500, whiteSpace: "nowrap" }}>
          Lưu, làm tiếp sau
        </Link>
      </div>
    </header>
  );
}
