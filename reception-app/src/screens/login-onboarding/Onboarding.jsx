import React, { useEffect, useRef } from "react";
import { Redirect } from "wouter";
import { OnboardingBar } from "../../components/shell/index.js";
import { useIsMobile, useScreenState } from "../../lib/hooks.js";
import { STEP_SLUGS } from "../../data/onboarding.js";
import { framePreset, seedOnb, useOnb } from "./state.js";
import { StepFind } from "./StepFind.jsx";
import { StepReview } from "./StepReview.jsx";
import { StepListen, StepPhone } from "./StepSetup.jsx";
import { StepTest } from "./StepTest.jsx";

// 3.1 Bắt đầu: AI setup in five steps, /bat-dau/:step. State lives in
// ./state.js (persisted), so "Lưu, làm tiếp sau" and a reload both resume.

// ?state= on a step → the frame that draws that state.
const STATE_FRAMES = {
  tim: { loading: "3.1_E", empty: "3.1_D" },
  "goi-thu": { loading: "3.1_K", error: "3.1_N" },
};

export function Onboarding({ step }) {
  const { frame, state: screenState } = useScreenState();
  const mobile = useIsMobile();
  const seeded = useRef(null);

  // Seed the store with the drawn state before the first paint of a frame.
  const target = frame || STATE_FRAMES[step]?.[screenState] || null;
  if (target && seeded.current !== target) {
    const preset = framePreset(target);
    if (preset) seedOnb(preset);
    seeded.current = target;
  }
  const s = useOnb();

  const idx = STEP_SLUGS.indexOf(step);
  if (idx < 0) return <Redirect to={`/bat-dau/${resumeSlug(s)}`} replace />;

  let body;
  if (idx === 0) body = <StepFind s={s} frame={target} />;
  else if (idx === 1) body = <StepReview s={s} frame={target} />;
  else if (idx === 2) body = <StepListen s={s} frame={target} />;
  else if (idx === 3) body = <StepPhone s={s} frame={target} />;
  else body = <StepTest s={s} frame={target} />;

  return (
    <div className={`lo-onb${mobile ? " lo-m" : ""}`}>
      <OnboardingBar step={idx + 1} />
      <div className="lo-body" key={step}>
        {body}
      </div>
      <ScrollTop step={step} />
    </div>
  );
}

/** Where to pick up again when /bat-dau is opened without a step. */
function resumeSlug(s) {
  if (s.test.startedAt) return "goi-thu";
  if (s.mode && s.phase === "searching") return "tim";
  return s.mode === "manual" ? "xem-lai" : "tim";
}

function ScrollTop({ step }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);
  return null;
}
