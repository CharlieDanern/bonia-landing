// Design tokens for bonia.vn/retail (handoff "Bonia Retail + Home",
// 2026-10-01, README "Shared design tokens"). Same visual language as
// /reception, kept local so the two pages can move independently.
export const C = {
  ground: "#F2EEE6", // page background
  card: "#F7F3EC", // card cream / hairline-grid cells
  white: "#FFFFFF",
  ink: "#1F1B16",
  body: "#3A2E1E",
  muted: "#4A4239",
  label: "#6E6255",
  label2: "#7A6F62",
  clay: "#7B4A2D", // accent brown
  clayHover: "#5E3820",
  gold: "#8A6A3E", // price section labels
  line: "#D9D0BF",
  line2: "#E4DCCB",
  line3: "#EFE9DD",
  onClay: "#FFF8EE",
  badgeLine: "#C4B9A5",
  spamRing: "#CFC3AF",
  spamMark: "#8A7F72",
};

export const F = {
  serif: "'Source Serif 4', Georgia, serif",
  sans: "Inter, system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export const contentMax = 1160;

// Section frame shared by §01–§06 (the hero, price and download sections
// have their own).
export const sectionPad = "clamp(56px,8vw,112px) clamp(16px,4vw,56px)";

// Headline gradients (background-clip:text).
export const inkGrad = "linear-gradient(180deg,#2B2419 0%,#70614D 100%)";
export const clayGrad = "linear-gradient(180deg,#B8753A 0%,#7B4A2D 100%)";
export const priceGrad = "linear-gradient(180deg,#7E4A1B 0%,#C08A4E 100%)";

// Gradient text. Descender fix from the handoff: background-clip:text paints
// only inside the box, so "g"/"y" lose their tails unless the box is padded
// below (and, for italics, on both sides for the overhang), with a matching
// negative margin so the layout stays as designed.
export const gradText = (bg, italic = false) => ({
  background: bg,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  ...(italic
    ? { fontStyle: "italic", padding: "0 0.08em 0.12em", margin: "0 -0.08em -0.12em" }
    : { paddingBottom: "0.12em", marginBottom: "-0.12em" }),
});

// "§ 0N · …" eyebrow above each section heading.
export const eyebrow = {
  fontFamily: F.mono,
  fontSize: 11,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: C.label,
};

// Section H2.
export const h2 = {
  margin: 0,
  fontFamily: F.serif,
  fontWeight: 400,
  fontSize: "clamp(30px,4.2vw,50px)",
  lineHeight: 1.08,
  letterSpacing: "-0.025em",
  textWrap: "balance",
};

// The italic brown half of each H2.
export const accent = { fontStyle: "italic", fontWeight: 300, color: C.clay };

// Credit-card shades for the step cards, light → dark.
export const SHADES = [
  "linear-gradient(138deg,#FCFAF5 0%,#E9E4DA 48%,#F6F3EC 76%,#DFD9CD 100%)",
  "linear-gradient(138deg,#F1EBDF 0%,#DCD2C1 48%,#EAE2D4 76%,#CFC3AF 100%)",
  "linear-gradient(138deg,#E2DED7 0%,#C4BDB1 48%,#D8D2C8 76%,#B2AA9C 100%)",
];
export const cardTexture = "repeating-linear-gradient(114deg,rgba(35,31,26,0.035) 0 1px,transparent 1px 5px)";

export const pad2 = (i) => String(i + 1).padStart(2, "0");
