import { useEffect, useRef } from "react";
import { Deck } from "./deck.js";
import {
  Frame01Question,
  Frame02Today,
  Frame03HowItStarts,
  Frame04Fee,
  Frame05NoFees,
  Frame06Commitment,
  Frame07GetStarted,
} from "./frames/index.js";

/* bonia.vn/business — the partner-acquisition scroll narrative.
 *
 * Seven full-viewport frames in one snapped scroll container. The argument
 * runs in a fixed order and the order is the content, so frames are rendered
 * statically here rather than routed: 01 the question, 02 the problem, 03 the
 * reversal, 04 the fee, 05 no fees, 06 the commitments, 07 both audiences.
 *
 * All motion lives in deck.js, which drives the DOM directly off data-
 * attributes. React owns structure and copy; it deliberately does not own the
 * animation state, because the reveal timelines are frame-scoped and imperative. */
export default function Business() {
  const deckRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    if (!deckRef.current) return;
    const engine = new Deck(deckRef.current);
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const goTo = (n) => (e) => {
    e.preventDefault();
    engineRef.current?.goTo(n);
  };

  return (
    <div
      data-deck=""
      ref={deckRef}
      style={{
        position: "relative",
        height: "100dvh",
        width: "100%",
        overflowY: "scroll",
        overflowX: "hidden",
        scrollSnapType: "y mandatory",
        overscrollBehavior: "contain",
        scrollbarWidth: "none",
        background: "#F2EEE6",
      }}
    >
      <Frame01Question />
      <Frame02Today />
      <Frame03HowItStarts />
      <Frame04Fee />
      <Frame05NoFees />
      <Frame06Commitment />
      <Frame07GetStarted />

      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "clamp(14px, 2.4vw, 24px) clamp(18px, 4vw, 40px)",
          pointerEvents: "none",
        }}
      >
        <a
          href="#"
          onClick={goTo(0)}
          aria-label="Về đầu trang"
          style={{ pointerEvents: "auto", display: "flex", alignItems: "center" }}
        >
          <img
            src="/bonia-mark.png"
            alt="Bonia"
            style={{ height: "clamp(34px, 4.4vw, 46px)", width: "auto", display: "block" }}
          />
          {/* Hidden on narrow screens by .bn-wordmark — the mark plus the two
              auth links already fill a phone's nav row. */}
          <span
            className="bn-wordmark"
            style={{
              marginLeft: "10px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#4A4239",
              whiteSpace: "nowrap",
            }}
          >
            Bonia Business
          </span>
        </a>
        <span style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(6px, 1.2vw, 16px)" }}>
          {/* The portal reads the path: anything containing "dang-ky" opens the
              register view, everything else falls through to login. */}
          <a
            href="/app/dang-ky"
            style={{
              pointerEvents: "auto",
              fontSize: "13px",
              fontWeight: 500,
              background: "#A65E24",
              color: "#FFF8EE",
              padding: "11px 18px",
              borderRadius: "999px",
              whiteSpace: "nowrap",
              transition: "background .4s ease",
            }}
          >
            Đăng ký
          </a>
          <a
            href="/app"
            style={{
              pointerEvents: "auto",
              fontSize: "13px",
              color: "#4A4239",
              padding: "10px 6px",
              whiteSpace: "nowrap",
              transition: "color .4s ease",
            }}
          >
            Đăng nhập
          </a>
          {/* Utility link, so it reads lighter than the two auth actions.
              .bn-navguide hides it on narrow screens, where the row is already
              full with the mark and both auth links. */}
          <a
            href="/huong-dan-business.html"
            className="bn-navguide"
            style={{
              pointerEvents: "auto",
              fontSize: "13px",
              // Same ink as "Đăng nhập": a lighter grey washed out against the
              // drifting card field behind the nav on frame 01.
              color: "#4A4239",
              padding: "10px 6px",
              whiteSpace: "nowrap",
              transition: "color .4s ease",
            }}
          >
            Hướng dẫn
          </a>
        </div>
      </nav>

      {/* deck.js fills this with one dot per frame. */}
      <div
        data-rail=""
        style={{
          position: "fixed",
          right: "clamp(10px, 2vw, 22px)",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      />
    </div>
  );
}
