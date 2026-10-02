import React, { useEffect, useRef, useState } from "react";

// 6-cell code (README "OTP"): 62 × 68, radius 10, mono 26. Active cell 2px
// clay with a caret; error = every cell urgent; expired = dashed, 50%.
// Auto-advances, Backspace goes back, pasting fills every cell.
export function OtpInput({
  value = "",
  onChange,
  onComplete,
  length = 6,
  state = "normal", // normal | error | expired
  autoFocus = false,
  activeIndex, // force the active cell (frames), else follows focus
  disabled = false,
  style,
}) {
  const refs = useRef([]);
  const [focusIdx, setFocusIdx] = useState(null);
  const digits = Array.from({ length }, (_, i) => value[i] || "");
  const expired = state === "expired";

  useEffect(() => {
    if (autoFocus && !expired) {
      const first = Math.min(value.length, length - 1);
      refs.current[first]?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus, expired]);

  const set = (next) => {
    const v = next.replace(/\D/g, "").slice(0, length);
    onChange?.(v);
    if (v.length === length) onComplete?.(v);
    return v;
  };

  const handleInput = (i, raw) => {
    const d = raw.replace(/\D/g, "");
    if (!d) return;
    if (d.length > 1) {
      // Paste or autofill into one cell: spread from here.
      const v = set(value.slice(0, i) + d);
      refs.current[Math.min(v.length, length - 1)]?.focus();
      return;
    }
    const arr = digits.slice();
    arr[i] = d;
    const v = set(arr.join(""));
    refs.current[Math.min(i + 1, length - 1, v.length)]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        const arr = digits.slice();
        arr[i] = "";
        set(arr.join(""));
      } else if (i > 0) {
        const arr = digits.slice();
        arr[i - 1] = "";
        set(arr.join(""));
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text");
    if (!text) return;
    e.preventDefault();
    const v = set(text);
    refs.current[Math.min(v.length, length - 1)]?.focus();
  };

  const active = activeIndex ?? focusIdx;
  const cls = `tt-otp${state === "error" ? " tt-otp--error" : ""}${expired ? " tt-otp--expired" : ""}`;

  return (
    <div className={cls} style={{ display: "flex", gap: 10, ...style }} onPaste={handlePaste}>
      {digits.map((d, i) => {
        const isActive = !expired && state !== "error" && active === i;
        return (
          <div key={i} className={`tt-otp-cell${isActive ? " tt-otp-cell--active" : ""}`}>
            {!expired && (
              <input
                ref={(el) => (refs.current[i] = el)}
                value={d}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                aria-label={`Số thứ ${i + 1}`}
                disabled={disabled}
                maxLength={length}
                onChange={(e) => handleInput(i, e.target.value)}
                onKeyDown={(e) => handleKey(i, e)}
                onFocus={(e) => {
                  setFocusIdx(i);
                  e.target.select();
                }}
                onBlur={() => setFocusIdx((f) => (f === i ? null : f))}
              />
            )}
            {isActive && !d && <span className="tt-otp-caret" />}
          </div>
        );
      })}
    </div>
  );
}
