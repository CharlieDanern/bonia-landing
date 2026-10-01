import { C, F } from "./tokens.js";
import { APP_STORE_URL, PLAY_STORE_URL } from "./links.js";

/* The real store badges: the App Store and Google Play URLs, icons and
 * labels of the old consumer page (src/App.jsx, StoreBadges), drawn the way
 * the handoff draws them (outlined, "TẢI TRÊN" in mono beside the store name,
 * as on the Business get-started frame). */

const badge = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "clamp(8px,1.15vh,10px) clamp(22px,2.8vw,34px)",
  background: "transparent",
  border: `1px solid ${C.badgeLine}`,
  color: C.ink,
};

function Label({ store }) {
  return (
    <span style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
      <span
        style={{
          fontFamily: F.mono,
          fontSize: "clamp(10.5px,min(1.15vw,2vh),12px)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: C.label2,
        }}
      >
        Tải trên
      </span>
      <span style={{ fontFamily: F.serif, fontSize: "clamp(14px,min(1.55vw,2.7vh),18px)", fontWeight: 500, whiteSpace: "nowrap" }}>
        {store}
      </span>
    </span>
  );
}

export default function StoreBadges() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
      <a href={APP_STORE_URL} target="_blank" rel="noopener" style={badge}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flex: "none" }}>
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
        <Label store="App Store" />
      </a>
      <a href={PLAY_STORE_URL} target="_blank" rel="noopener" style={badge}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flex: "none" }}>
          <path d="M3.6 2.3c-.4.3-.6.7-.6 1.3v17c0 .5.2 1 .6 1.3l9.6-9.9-9.6-9.7zM14.4 13.2l2.6 2.7-11.5 6.5 8.9-9.2zM14.4 11l-8.9-9.2 11.5 6.6-2.6 2.6zM18.5 9.7l3.1 1.8c.7.4.7 1.4 0 1.8l-3.1 1.8-2.9-3 2.9-2.4z" />
        </svg>
        <Label store="Google Play" />
      </a>
    </div>
  );
}
