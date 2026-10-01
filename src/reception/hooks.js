import { useEffect, useState } from "react";

/* Layout in handoff v5 switches on the page width, not on media queries
 * (the prototype measures its root with a ResizeObserver): nav links from
 * 640 px, call tiles all across from 760 px, the wide
 * two-column player from 880 px, §02's fixed-height two columns from 1000 px. */
export function usePageWidth() {
  const [w, setW] = useState(() => (typeof document !== "undefined" ? document.documentElement.clientWidth : 1440));
  useEffect(() => {
    const el = document.documentElement;
    const measure = () => setW(el.clientWidth);
    measure();
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  return w;
}

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion() {
  const [reduce, setReduce] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(REDUCE_QUERY).matches
  );
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(REDUCE_QUERY);
    const on = () => setReduce(mq.matches);
    on();
    if (mq.addEventListener) mq.addEventListener("change", on);
    else mq.addListener(on);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", on) : mq.removeListener(on));
  }, []);
  return reduce;
}
