import { useEffect, useRef, useState } from "react";
import { C, F } from "./tokens.js";
import { usePageWidth } from "./hooks.js";

/* Sticky nav (handoff v5, "Nav"). Logo + "TIẾP TÂN" on the left; the in-page
 * links Nghe thử · Cài đặt · Giá, the outlined "Nhận tư vấn" (to the §04
 * contact form) and, at the far right in amber, "Đăng nhập" (to the app,
 * /reception/app). v6 still labels the middle link "Lĩnh vực",
 * but in v6 its target is §02's settings demo, not the sectors, so it reads
 * "Cài đặt" like the footer's link to the same place (2026-10-07).
 *
 * The links show only when the page is at least 640 px wide (the prototype
 * switches on its measured width, not a media query); below that the row is
 * logo + the two buttons (the TIẾP TÂN label hides below 380 px). No hamburger.
 *
 * Over the hero it is part of the hero, like bonia.vn/business: the hero
 * slides up underneath it (Hero.jsx, using --rnav-h, the nav's measured
 * height) so the headline sits at the true centre of the screen, and the
 * nav is transparent until the page scrolls, then takes its cream band and
 * hairline back (founder 2026-09-30). */

const link = {
  fontSize: 13,
  color: C.ink3,
  padding: "10px 6px",
  whiteSpace: "nowrap",
};

// The two buttons (founder 2026-10-07): "Nhận tư vấn" outlined, then "Đăng nhập" in amber at the far right, the
// owners' way into the receptionist app. Colours and hover come from .r-btn-line / .r-btn-amber (reception.css), so
// a:hover never darkens the label. Both show at every width.
const button = {
  fontSize: 13,
  fontWeight: 500,
  padding: "10px 16px",
  borderRadius: 999,
  whiteSpace: "nowrap",
};

export default function Nav() {
  const w = usePageWidth();
  const ref = useRef(null);
  const [atTop, setAtTop] = useState(() => typeof window === "undefined" || window.scrollY < 8);

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Publish the nav's height for the hero's pull-up.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const root = document.documentElement;
    const set = () => root.style.setProperty("--rnav-h", `${el.offsetHeight}px`);
    set();
    if (!window.ResizeObserver) return undefined;
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <nav
      ref={ref}
      aria-label="Chính"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: atTop ? "rgba(242,238,230,0)" : "rgba(242,238,230,0.94)",
        borderBottom: `1px solid ${atTop ? "rgba(228,220,203,0)" : C.line2}`,
        transition: "background-color .3s ease, border-color .3s ease",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "clamp(12px,2vw,18px) clamp(16px,4vw,40px)",
      }}
    >
      <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <img
          src="/bonia-mark.png"
          alt="Bonia"
          width="40"
          height="40"
          style={{ height: "clamp(28px,4vw,40px)", width: "auto", display: "block" }}
        />
        {/* below 380 px the two buttons need the room: the logo alone */}
        {w >= 380 && (
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: C.ink3,
              whiteSpace: "nowrap",
            }}
          >
            Tiếp tân
          </span>
        )}
      </a>
      <span style={{ flex: 1 }} />
      {w >= 640 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <a href="#nghe" style={link}>
            Nghe thử
          </a>
          <a href="#cai-dat" style={link}>
            Cài đặt
          </a>
          <a href="#gia" style={link}>
            Giá
          </a>
        </div>
      )}
      <a href="#demo" className="r-btn r-btn-line" style={button}>
        Nhận tư vấn
      </a>
      <a href="/reception/app" className="r-btn r-btn-amber" style={{ ...button, border: "1px solid transparent" }}>
        Đăng nhập
      </a>
    </nav>
  );
}
