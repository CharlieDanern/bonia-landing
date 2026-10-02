import React from "react";
import { OnboardingBar } from "../../components/shell/index.js";
import { useScreenState } from "../../lib/hooks.js";
import { STEP_SLUGS } from "../../data/onboarding.js";

// STUB — replaced by the login-onboarding screen agent.
// Owns: /dang-nhap (3.0 A–H), /bat-dau/:step? (3.1 A–N).
// Frames: src/frames/login-onboarding.js. Data: src/data/onboarding.js.

export function Login() {
  const { state } = useScreenState();
  return (
    <div style={{ height: "100%", display: "grid", placeItems: "center" }} data-state={state}>
      <h2 className="tt-page-title" style={{ fontSize: 36 }}>
        Đăng nhập
      </h2>
    </div>
  );
}

export function Onboarding({ step }) {
  const i = Math.max(0, STEP_SLUGS.indexOf(step));
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <OnboardingBar step={i + 1} />
    </div>
  );
}
