import React from "react";
import { useLang } from "./lang.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// Install & onboarding guide — real app screenshots in an iPhone frame, laid
// out as a compact grid (not long alternating rows). Shares the landing tokens
// (clay / cream / serif).
// ─────────────────────────────────────────────────────────────────────────────
const ACC = "#7B4A2D";
const BG = "#F2EEE6";

// ─── iPhone frame: dark bezel + side buttons, wraps a screenshot OR children ──
function IPhoneFrame({ src, alt, children, width = 190 }) {
  const innerR = Math.round(width * 0.135);
  const outerR = Math.round(width * 0.17);
  const btn = {
    position: "absolute",
    background: "#2f2f31",
    borderRadius: 2,
    zIndex: 0,
  };
  return (
    <div className="relative mx-auto" style={{ width }}>
      {/* left: silence + volume up/down · right: side button */}
      <div style={{ ...btn, left: -2, top: "20%", width: 3, height: 22 }} />
      <div style={{ ...btn, left: -2, top: "31%", width: 3, height: 40 }} />
      <div style={{ ...btn, left: -2, top: "43%", width: 3, height: 40 }} />
      <div style={{ ...btn, right: -2, top: "28%", width: 3, height: 60 }} />
      <div
        className="relative"
        style={{
          padding: 5,
          background: "linear-gradient(150deg,#3a3a3c,#161618)",
          borderRadius: outerR,
          boxShadow:
            "0 22px 48px -22px rgba(31,27,22,0.5), inset 0 0 1px 1px rgba(255,255,255,0.12)",
        }}
      >
        <div
          style={{
            borderRadius: innerR,
            overflow: "hidden",
            background: "#000",
          }}
        >
          {src ? (
            <img src={src} alt={alt} className="block w-full" loading="lazy" />
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

function StepNote({ children }) {
  return (
    <div
      className="mt-3 flex items-start gap-2 px-3 py-2.5"
      style={{
        background: "#FAF3E6",
        border: "1px solid #E7D6B8",
        borderRadius: 10,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#B9852F"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 flex-shrink-0"
      >
        <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      </svg>
      <p className="text-[12.5px] leading-snug" style={{ color: "#7A5B22" }}>
        {children}
      </p>
    </div>
  );
}

// ─── The 5 steps (text lives in copy.js; screenshots stay VN app UI) ───
const STEP_IMGS = [
  "/onboarding/phone.png",
  "/onboarding/explainer.png",
  "/onboarding/activation.png",
  "/onboarding/verification.png",
  "/onboarding/success.png",
];

// The "press dial" tile — a real iOS dialer screenshot with the CF code typed
// in, placed right after the activation step to show the action it triggers.
function DialerCard() {
  const { guide } = useLang();
  return (
    <div
      className="flex flex-col p-5"
      style={{
        background: "#fff",
        border: "1px solid #D9D0BF",
        borderRadius: 16,
      }}
    >
      <IPhoneFrame
        src="/onboarding/dialer.png"
        alt={guide.dialer.title}
        width={168}
      />
      <div className="mt-5">
        <span className="ff-mono text-[12px]" style={{ color: ACC }}>
          {guide.dialer.afterStep}
        </span>
        <h3
          className="mt-1.5 text-[19px] leading-snug ff-serif"
          style={{ color: "#1F1B16", fontWeight: 500 }}
        >
          {guide.dialer.title}
        </h3>
        <p
          className="mt-2 text-[14px] leading-relaxed"
          style={{ color: "#4A4239" }}
        >
          {guide.dialer.bodyLead}
          <span style={{ color: "#1B8A4B", fontWeight: 600 }}>
            {guide.dialer.bodyCallWord}
          </span>
          {guide.dialer.bodyTail}
        </p>
      </div>
    </div>
  );
}

function StepCard({ step }) {
  const { guide } = useLang();
  return (
    <div
      className="flex flex-col p-5"
      style={{
        background: "#fff",
        border: "1px solid #D9D0BF",
        borderRadius: 16,
      }}
    >
      <IPhoneFrame src={step.img} alt={step.title} width={168} />
      <div className="mt-5">
        <span className="ff-mono text-[12px]" style={{ color: ACC }}>
          {guide.stepWord} {step.n}
        </span>
        <h3
          className="mt-1.5 text-[19px] leading-snug ff-serif"
          style={{ color: "#1F1B16", fontWeight: 500 }}
        >
          {step.title}
        </h3>
        <p
          className="mt-2 text-[14px] leading-relaxed"
          style={{ color: "#4A4239" }}
        >
          {step.body}
        </p>
        {step.note && <StepNote>{step.note}</StepNote>}
      </div>
    </div>
  );
}

// ─── The carrier-call step (Viettel removed — those users use the SMS path) ───
const HOTLINES = [
  { name: "MobiFone", num: "18001090" },
  { name: "VinaPhone", num: "18001091" },
  { name: "Vietnamobile", num: "789" },
];

export default function HuongDan() {
  const { guide } = useLang();
  const steps = guide.steps.map((s, i) => ({ ...s, img: STEP_IMGS[i] }));
  return (
    <section
      id="huong-dan"
      className="px-6 sm:px-12 py-20 sm:py-24"
      style={{ background: BG }}
    >
      <header className="max-w-3xl">
        <div className="flex items-baseline gap-3 mb-6">
          <span className="text-[12px] ff-mono" style={{ color: ACC }}>
            № 04
          </span>
          <span
            className="text-[11px] uppercase tracking-[0.22em]"
            style={{ color: "#7A6F62" }}
          >
            {guide.header.tag}
          </span>
        </div>
        <h2
          className="text-[36px] sm:text-[44px] md:text-[52px] leading-[1.05] tracking-tight ff-serif"
          style={{ color: "#1F1B16", fontWeight: 400 }}
        >
          {guide.header.title}
        </h2>
        <p
          className="mt-5 text-[17px] sm:text-[18px] leading-relaxed max-w-2xl"
          style={{ color: "#4A4239" }}
        >
          {guide.header.sub}
        </p>
      </header>

      {/* Compact grid of steps. The dialer tile is injected right after step
          03 (activation) so "bật mã → bấm gọi" reads in order. */}
      <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StepCard step={steps[0]} />
        <StepCard step={steps[1]} />
        <StepCard step={steps[2]} />
        <DialerCard />
        <StepCard step={steps[3]} />
        <StepCard step={steps[4]} />
      </div>

      {/* Troubleshooting subsection heading */}
      <div className="mt-20 sm:mt-24 max-w-3xl">
        <span className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "#7A6F62" }}>
          {guide.troubleshooting.tag}
        </span>
        <h3 className="mt-4 text-[23px] sm:text-[32px] leading-snug tracking-tight ff-serif"
          style={{ color: "#1F1B16", fontWeight: 400 }}>
          {guide.troubleshooting.title}
        </h3>
      </div>

      {/* Carrier-call — the delicate fallback, set apart on a white card */}
      <div
        className="mt-8 p-6 sm:p-10"
        style={{
          background: "#fff",
          border: "1px solid #D9D0BF",
          borderRadius: 20,
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
          <div className="md:col-span-4 flex justify-center">
            <IPhoneFrame
              src="/onboarding/support.png"
              alt={guide.carrierCard.title}
              width={190}
            />
          </div>
          <div className="md:col-span-8">
            <span className="ff-mono text-[13px]" style={{ color: ACC }}>
              {guide.carrierCard.eyebrow}
            </span>
            <h3
              className="mt-2 text-[26px] sm:text-[30px] leading-tight ff-serif"
              style={{ color: "#1F1B16", fontWeight: 500 }}
            >
              {guide.carrierCard.title}
            </h3>
            <p
              className="mt-3 text-[16px] leading-relaxed max-w-xl"
              style={{ color: "#4A4239" }}
            >
              {guide.carrierCard.p1}
            </p>
            <p
              className="mt-3 text-[16px] leading-relaxed max-w-xl"
              style={{ color: "#4A4239" }}
            >
              {guide.carrierCard.p2}
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <p className="ff-mono text-[12px] mb-2" style={{ color: ACC }}>
                  {guide.carrierCard.step1Label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {HOTLINES.map((h) => (
                    <span
                      key={h.name}
                      className="text-[12px] px-2.5 py-1.5"
                      style={{
                        background: BG,
                        border: "1px solid #D9D0BF",
                        borderRadius: 8,
                        color: "#4A4239",
                      }}
                    >
                      {h.name}{" "}
                      <span className="ff-mono" style={{ color: ACC }}>
                        {h.num}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="ff-mono text-[12px] mb-2" style={{ color: ACC }}>
                  {guide.carrierCard.step2Label}
                </p>
                <blockquote
                  className="p-3.5 text-[14px] leading-relaxed italic ff-serif"
                  style={{
                    background: BG,
                    borderLeft: `3px solid ${ACC}`,
                    color: "#1F1B16",
                  }}
                >
                  {guide.carrierCard.quote}
                </blockquote>
              </div>
            </div>
            <p className="mt-5 text-[14px]" style={{ color: "#7A6F62" }}>
              <span className="ff-mono text-[12px]" style={{ color: ACC }}>
                03 ·{" "}
              </span>
              {guide.carrierCard.step3}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
