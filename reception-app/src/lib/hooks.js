import { useEffect, useState } from "react";
import { useSearch } from "wouter";

const MOBILE_QUERY = "(max-width: 767px)";

function matches(query) {
  return typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false;
}

/** True below 768px (README "Responsive": bottom tabs, sheets from below). */
export function useIsMobile() {
  const [mobile, setMobile] = useState(() => matches(MOBILE_QUERY));
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

export function useQuery() {
  const search = useSearch();
  return new URLSearchParams(search);
}

const STATES = new Set(["loading", "empty", "error"]);

/**
 * ?state=loading|empty|error → that state, else "ready".
 * ?f=<frameId> → the handoff frame to reproduce ("3.3_B"), else null.
 * Screens read both to set their initial UI (open dialog, selected row…).
 */
export function useScreenState() {
  const q = useQuery();
  const s = q.get("state");
  return {
    state: STATES.has(s) ? s : "ready",
    frame: q.get("f") || null,
    query: q,
  };
}

export function useFrame() {
  return useQuery().get("f") || null;
}

/** Close on Escape while `active`. */
export function useEscape(active, onEscape) {
  useEffect(() => {
    if (!active || !onEscape) return undefined;
    const h = (e) => {
      if (e.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [active, onEscape]);
}
