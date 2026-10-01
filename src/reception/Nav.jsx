import { useEffect, useRef, useState } from "react";
import { C, F } from "./tokens.js";
import { usePageWidth } from "./hooks.js";

/* Sticky nav (handoff v5, "Nav"). Logo + "TIẾP TÂN" on the left; the in-page
 * links Nghe thử · Lĩnh vực · Giá and the amber "Nhận tư vấn" pill (to the
 * contact form, the page's only call to action) on the right.
 *
 * The links show only when the page is at least 640 px wide (the prototype
 * switches on its measured width, not a media query); below that the row is
 * logo + pill, which fits down to 320 px. No hamburger, no Đăng nhập.
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

const pill = {
  fontSize: 13,
  fontWeight: 500,
  background: C.amber,
  color: C.onClay,
  padding: "11px 18px",
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
      </a>
      <span style={{ flex: 1 }} />
      {w >= 640 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <a href="#nghe" style={link}>
            Nghe thử
          </a>
          <a href="#linh-vuc" style={link}>
            Lĩnh vực
          </a>
          <a href="#gia" style={link}>
            Giá
          </a>
        </div>
      )}
      <a href="#demo" style={pill}>
        Nhận tư vấn
      </a>
    </nav>
  );
}
