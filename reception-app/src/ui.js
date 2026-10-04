// Density (founder 2026-10-04): thinner controls, smaller type, calmer pages.
// One scale for the whole app so screens stay consistent; phones get slightly
// larger touch targets than desktops.

export const MONO = "'JetBrains Mono', monospace";
export const SERIF = "'Source Serif 4', Georgia, serif";
export const EASE = "cubic-bezier(.2,.8,.2,1)";

const DESK = {
  input: 34, btn: 34, btnSm: 28, chip: 30, row: 32,
  fs: { h1: 22, h2: 18, title: 13.5, body: 12.5, small: 11.5, tiny: 10.5, label: 9, num: 16 },
};
const PHONE = {
  input: 40, btn: 40, btnSm: 32, chip: 34, row: 36,
  fs: { h1: 24, h2: 18, title: 14, body: 13, small: 12, tiny: 11, label: 9.5, num: 16 },
};

export const dims = (phone) => (phone ? PHONE : DESK);

/** Mono uppercase label (section eyebrows, pills). */
export const label = (size = 9, color = "#6E6255", spacing = "0.18em") => ({ fontFamily: MONO, fontSize: size, letterSpacing: spacing, color, textTransform: "uppercase" });

/** Text input / textarea base. */
export const inputStyle = (h, fs) => ({ height: h, minWidth: 0, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 10px", fontSize: fs, background: "#fff", color: "#1F1B16" });
