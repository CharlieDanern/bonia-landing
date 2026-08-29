import { useEffect, useRef } from "react";

/* Frame 02's GSAP scene. The handoff ships it as a self-building custom
 * element (bonia-void.js) and asks for it to be ported as-is rather than
 * rebuilt, so this is a thin React host: it registers the element once and
 * renders the tag. The element reads window.gsap, which main.jsx assigns from
 * the npm package — the prototype's cdnjs <script> is deliberately not used. */
export default function BoniaVoid() {
  const ref = useRef(null);

  useEffect(() => {
    let alive = true;
    import("./bonia-void.js").then(() => {
      if (!alive || !ref.current) return;
      // Upgrade is synchronous once the definition lands, but a frame that is
      // already the active one needs its timeline kicked.
      const el = ref.current;
      if (el.restart) el.restart();
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <bonia-void ref={ref} style={{ display: "block", width: "100%", height: "100%" }} />
  );
}
