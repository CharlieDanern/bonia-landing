import { useEffect } from "react";

/* Scroll reveal (handoff README, "Scroll reveal"). Every direct child of each
 * non-hero section's column (and of the footer's) rises 22 px and fades in
 * once, when 12% of it is on screen above the bottom 8% of the viewport:
 * opacity .8s ease, transform 1s cubic-bezier(.2,.6,.2,1).
 * - A grid with no background of its own (the card rows, the price points,
 *   the stats, the footer columns) reveals child by child, 0.09 s apart.
 * - Anything else reveals as one block; that includes the hairline grids,
 *   whose 1 px lines are their background, so they never show up empty.
 * - The "0 VNĐ" price (data-rv="scale") scales 1.12 → 1 instead of rising.
 * Skipped entirely under prefers-reduced-motion (and without
 * IntersectionObserver), so the page is simply there. One addition to the
 * prototype: whatever is still hidden when the page is scrolled to its very
 * end is shown then (see atEnd). */

const SELECTOR = 'section:not([data-screen-label="01 Hero"]) > div > *, footer > div > *';
const EASE = "cubic-bezier(.2,.6,.2,1)";

export function useScrollReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return undefined;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const items = [];
    root.querySelectorAll(SELECTOR).forEach((el) => {
      const cs = getComputedStyle(el);
      const n = el.children.length;
      const transparent = cs.backgroundColor === "rgba(0, 0, 0, 0)" || cs.backgroundColor === "transparent";
      const bareGrid = cs.display === "grid" && n > 1 && n <= 12 && transparent;
      if (bareGrid) [...el.children].forEach((k, i) => items.push([k, i]));
      else items.push([el, 0]);
    });

    for (const [el, i] of items) {
      const d = `${(i * 0.09).toFixed(2)}s`;
      el.style.opacity = "0";
      el.style.transform = el.dataset.rv === "scale" ? "scale(1.12)" : "translate3d(0,22px,0)";
      el.style.transition = `opacity .8s ease ${d}, transform 1s ${EASE} ${d}`;
      el.style.willChange = "opacity, transform";
    }

    const pending = new Set(items.map(([el]) => el));
    const show = (el) => {
      if (!pending.delete(el)) return;
      el.style.opacity = "1";
      el.style.transform = "none";
      io.unobserve(el);
      // Drop the compositing hint once the reveal has finished.
      el.addEventListener("transitionend", (ev) => {
        if (ev.target === el && ev.propertyName === "transform") el.style.willChange = "";
      });
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) show(e.target);
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    items.forEach(([el]) => io.observe(el));

    // The page's last line (the footer's copyright) sits inside the bottom
    // 8% of the viewport even when scrolled all the way down, so the observer
    // alone would never show it (the prototype has the same gap). At the end
    // of the page, show whatever is still waiting.
    const atEnd = () => {
      const doc = document.documentElement;
      if (window.scrollY + window.innerHeight < doc.scrollHeight - 4) return;
      [...pending].forEach(show);
      window.removeEventListener("scroll", atEnd);
    };
    window.addEventListener("scroll", atEnd, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", atEnd);
    };
  }, [rootRef]);
}
