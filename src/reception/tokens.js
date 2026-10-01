// Design tokens for bonia.vn/reception (handoff v4 README, "Design tokens").
// Every section imports these instead of retyping hex values.
export const C = {
  ground: "#F2EEE6",
  surface: "#FFFFFF",
  warm: "#F7F3EC",
  warm2: "#FBF8F2",
  tinted: "#EFE9DD",
  line: "#D9D0BF",
  line2: "#E4DCCB",
  line3: "#EFE9DD",
  dashed: "#7A6F62",
  ink: "#1F1B16",
  ink2: "#3A2E1E",
  ink3: "#4A4239",
  muted: "#6E6255",
  clay: "#7B4A2D",
  clayHover: "#5E3820",
  amber: "#A65E24",
  onClay: "#FFF8EE",
  priceBg: "#F5E4C9",
  priceLine: "#E4D2B4",
  priceMuted: "#6E5530",
  priceInk: "#2A2016",
  priceNote: "#4A3A22",
  highlight: "#FBF1E4",
  danger: "#A0412D",
  dangerBg: "#F6E7E1",
  clayDisabled: "#B89A80",
  clayDisabled2: "#C9B9A4",
  bezel: "#1F1B16",
};

export const F = {
  serif: "'Source Serif 4', Georgia, serif",
  sans: "Inter, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

// Section frame: padding clamp(56px,8vw,104px) clamp(18px,5vw,72px); content max 1160px.
export const sectionPad = "clamp(56px,8vw,104px) clamp(18px,5vw,72px)";
export const contentMax = 1160;

// "§ 0N · …" eyebrow: JetBrains Mono 11px, .22em, uppercase, #6E6255 (price section: #6E5530).
export const eyebrow = (color = C.muted) => ({
  fontFamily: F.mono,
  fontSize: 11,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color,
  margin: 0,
});

// Section H2: Source Serif 4 400, clamp(30px,4.2vw,50px), lh 1.08, ls -.025em, balance.
export const h2 = (overrides = {}) => ({
  fontFamily: F.serif,
  fontWeight: 400,
  fontSize: "clamp(30px,4.2vw,50px)",
  lineHeight: 1.08,
  letterSpacing: "-0.025em",
  textWrap: "balance",
  color: C.ink,
  margin: 0,
  ...overrides,
});

// Accent words inside headings: italic, weight 300, clay.
export const accent = { fontStyle: "italic", fontWeight: 300, color: C.clay };

// Appear animation for every item that shows up.
export const appear = (ms = 450) => ({ animation: `bonia-in ${ms}ms ease both` });

// Gradient headline text (handoff v5 hero and "§ 00 · Nghe thử"): ink for the
// first voice, clay for Bonia's. background-clip:text paints only inside the
// box, and an italic line's last glyph overhangs it ("quầy" was cut off in
// the prototype), so italic spans get padding to widen the painted box and a
// matching negative margin so the layout stays as designed.
export const inkGrad = "linear-gradient(180deg,#2B2419 0%,#70614D 100%)";
export const clayGrad = "linear-gradient(180deg,#B8753A 0%,#7B4A2D 100%)";
export const gradText = (bg, italic) => ({
  background: bg,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...(italic ? { fontStyle: "italic", padding: "0.04em 0.12em", margin: "-0.04em -0.12em" } : null),
});
