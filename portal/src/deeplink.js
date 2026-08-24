// Bonia Connect portal — email deep links.
//
// Every transactional email ends in one button, and until now that button
// could only land the rep on the app's front door: App.jsx kept the route in
// useState and the only path branch was `pathname.includes("dang-ky")`. A
// "Khách vừa nhắn tin" mail therefore asked the rep to find the lead again by
// hand — the one thing the email already knew.
//
// The contract is a query string on the SPA entry point:
//
//   https://bonia.vn/app/?t=pipeline&lead=<uuid>
//
//   t     offers | pipeline | account   (the three nav keys in Portal)
//   lead  a lead_id UUID — selected and scrolled to inside Pipeline2
//
// Two properties this file exists to guarantee:
//
//  1. An emailed link is almost always opened LOGGED OUT (different device,
//     no token in that browser). So the target is stashed in sessionStorage
//     at boot and applied after login, not thrown away at the login screen.
//  2. The params are stripped from the URL as soon as they are captured, so
//     a refresh — or the rep leaving the tab open for a day — does not yank
//     them back to a lead they already dealt with.
//
// Anything unparseable is dropped in silence: a mangled link must still open
// a working portal, never an error.

const TABS = new Set(["offers", "pipeline", "account"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STASH_KEY = "bonia_rm_deeplink";

/**
 * Parse `?t=&lead=` out of a search string.
 * @returns {{tab: string, lead: string|null}|null} null when there is nothing
 *          usable — the caller then leaves the default tab alone.
 */
export function readDeepLink(search) {
  let q;
  try {
    q = new URLSearchParams(search || "");
  } catch {
    return null;
  }
  if (!q.has("t") && !q.has("lead")) return null;

  const rawTab = (q.get("t") || "").trim().toLowerCase();
  const rawLead = (q.get("lead") || "").trim().toLowerCase();
  const lead = UUID_RE.test(rawLead) ? rawLead : null;
  // A lead only exists on Pipeline, so `&lead=` alone is a complete link —
  // the sender does not have to remember to also say `?t=pipeline`.
  const tab = TABS.has(rawTab) ? rawTab : lead ? "pipeline" : null;
  if (!tab) return null; // both halves invalid → default tab, no complaint
  return { tab, lead };
}

/** Drop t/lead from the address bar, keeping path, hash and any other param. */
export function stripDeepLinkParams() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("t") && !url.searchParams.has("lead")) return;
    url.searchParams.delete("t");
    url.searchParams.delete("lead");
    const qs = url.searchParams.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`
    );
  } catch {
    /* history unavailable — the link still worked, just leaves the query up */
  }
}

export function stashTarget(target) {
  try {
    sessionStorage.setItem(STASH_KEY, JSON.stringify(target));
  } catch {
    /* private mode / quota — the in-memory target still covers this session */
  }
}

/** Read the stash WITHOUT consuming it (it is cleared only once applied). */
export function peekStashedTarget() {
  try {
    const raw = sessionStorage.getItem(STASH_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw);
    if (!t || !TABS.has(t.tab)) return null;
    return { tab: t.tab, lead: UUID_RE.test(t.lead || "") ? t.lead : null };
  } catch {
    return null;
  }
}

export function clearStashedTarget() {
  try {
    sessionStorage.removeItem(STASH_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Capture whatever is in the address bar right now: stash it, then clean the
 * URL. Called once at module load (before React renders, so no first paint on
 * the wrong tab) and again on popstate.
 */
export function captureDeepLink() {
  const target = readDeepLink(window.location.search);
  if (!target) return null;
  stashTarget(target);
  stripDeepLinkParams();
  return target;
}

// Boot capture. Import order guarantees this runs before <App/> mounts.
if (typeof window !== "undefined") captureDeepLink();
