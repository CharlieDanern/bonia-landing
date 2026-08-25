// Bonia Connect portal — live chat stream (SSE, GET /rm/stream).
//
// ══ WHY SSE AND NOT A WEBSOCKET ══════════════════════════════════════
// The consumer is a desktop browser tab and the payload is one-way
// (server → rep). EventSource reconnects on its own with Last-Event-ID,
// needs no ping/pong liveness protocol, and rides the ordinary HTTP path —
// same origin allowlist, same auth realm, same nginx vhost. A WebSocket
// would add a second socket lifecycle to own for zero extra capability, and
// this product already has one it owes a fix (the consumer live-call feed,
// with a known half-open-socket problem). Chat shares nothing with it.
//
// ══ THIS IS AN ACCELERATOR, NEVER A SOURCE OF TRUTH ══════════════════
// Every message this delivers is also returned by GET /rm/leads/:id/messages,
// which Pipeline2 polls every 10s while a thread is open. If this file
// never manages to connect — a stream refused at the tab cap, a corporate
// proxy that buffers text/event-stream, an expired token — the portal
// behaves exactly as it did before it existed, just 10s slower. Nothing
// here may ever be the only path to a correct screen.
//
// ══ THE TOKEN IS IN THE URL. THAT IS A REAL TRADEOFF ═════════════════
// The EventSource API cannot set request headers — there is no option for
// it, in any browser — so the RM JWT goes in as ?token=. Consequences,
// stated rather than hidden:
//   • The token lands in browser history, in any Referer sent from this
//     page, and in every access log that records the query string.
//   • The backend must NOT log query strings for this path. VERIFY THIS
//     WHENEVER THE LOGGING CONFIG CHANGES: Fastify's default pino request
//     serializer logs `request.url` verbatim, query string included, so
//     "safe" is a property someone actively maintains, not a default.
//   • nginx's access log has the same problem via $request.
// It is survivable because an RM token is a 12h session token re-mintable
// from /rm/login, and because ONLY this endpoint accepts a query token —
// every other /rm/* route still demands the Authorization header.
//
// ══ MODULE SINGLETON ═════════════════════════════════════════════════
// One EventSource per browser tab, owned here. App.jsx opens it with the
// session and closes it with the session; Pipeline2 subscribes and
// unsubscribes freely without ever cycling the socket. Tab-switching inside
// the portal must not reconnect — the server caps a rep at 3 concurrent
// streams, and a reconnect storm would burn that cap.

import { API_BASE, getToken } from "./api.js";

const PATH = "/rm/stream";

// Reconnect backoff for HARD failures only (see onerror below). Capped at
// 30s: the poll is already covering correctness, so a portal left open
// overnight against a down API must cost one request every 30s, not one a
// second. Jittered so N tabs reopened together do not synchronise.
const BACKOFF_MS = [1000, 2000, 4000, 8000, 15000, 30000];

let source = null;
let attempt = 0;
let retryTimer = null;
let wanted = false; // the session wants a stream (App.jsx says so)
let listenersBound = false;

const listeners = new Set();

/**
 * Register a handler for incoming chat events.
 *
 * The handler receives the server's wire shape verbatim:
 *   { lead_id, message_id, from_rm, text, at, contains_contact_info }
 *
 * Returns an unsubscribe function. Handlers are called inside a try/catch —
 * one throwing subscriber must not stop the others or kill the stream.
 */
export function subscribeChat(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(event) {
  for (const fn of [...listeners]) {
    try {
      fn(event);
    } catch (err) {
      console.warn("[chat-stream] subscriber threw", err);
    }
  }
}

function clearRetry() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
}

function scheduleRetry() {
  if (!wanted || retryTimer) return;
  const base = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
  attempt += 1;
  const delay = base + Math.random() * 500;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    open();
  }, delay);
}

function close() {
  if (source) {
    // Drop the handlers first: closing an EventSource can synchronously
    // fire onerror in some browsers, which would schedule a retry for a
    // stream we are deliberately tearing down.
    source.onopen = null;
    source.onmessage = null;
    source.onerror = null;
    try {
      source.close();
    } catch {
      /* already gone */
    }
    source = null;
  }
}

function open() {
  if (!wanted || source) return;
  const token = getToken();
  // No token = no session. Do not retry into a 401 loop; App.jsx calls
  // connectChatStream() again on the next successful login.
  if (!token) return;
  if (typeof EventSource === "undefined") return; // ancient browser: poll only

  let es;
  try {
    es = new EventSource(`${API_BASE}${PATH}?token=${encodeURIComponent(token)}`);
  } catch {
    scheduleRetry();
    return;
  }
  source = es;

  es.onopen = () => {
    attempt = 0; // a clean connect earns a fresh backoff ladder
  };

  es.onmessage = (e) => {
    // Fires for `event: message` frames. Server pings arrive as `event: ping`
    // and land on the listener below instead — they carry no payload and
    // exist only so a dead peer surfaces as a failed write server-side.
    let payload;
    try {
      payload = JSON.parse(e.data);
    } catch {
      return; // a malformed frame is not worth killing the stream over
    }
    if (payload && payload.message_id && payload.lead_id) emit(payload);
  };

  es.addEventListener("ping", () => {
    // Liveness only. Nothing to do — but receiving one proves the whole
    // chain (nginx buffering included) is passing frames through.
  });

  es.onerror = () => {
    // TWO DIFFERENT FAILURES SHARE THIS EVENT:
    //  • readyState === CONNECTING — a transport blip. The browser is
    //    already retrying on its own schedule (the server's `retry:`).
    //    Touching it here would mean two retry loops fighting.
    //  • readyState === CLOSED — a hard failure the browser will NOT retry:
    //    a non-200 response (401 expired token, 429 at the 3-tab cap), or a
    //    CORS rejection. This is ours to back off and retry.
    if (es.readyState === EventSource.CLOSED) {
      close();
      scheduleRetry();
    }
  };
}

function onOnline() {
  // Network came back. Reset the ladder — the long backoff was earned by an
  // outage that has just ended.
  if (!wanted) return;
  attempt = 0;
  clearRetry();
  if (!source) open();
}

function onVisible() {
  // A laptop that slept for an hour wakes with a dead-but-CONNECTING socket
  // and a backoff timer that may be minutes out. Coming back to the tab is
  // the strongest signal we get that someone wants fresh data now.
  if (!wanted || document.visibilityState !== "visible") return;
  if (!source || source.readyState === EventSource.CLOSED) {
    attempt = 0;
    clearRetry();
    close();
    open();
  }
}

/** Open the stream for the current session. Idempotent. */
export function connectChatStream() {
  wanted = true;
  if (!listenersBound && typeof window !== "undefined") {
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    listenersBound = true;
  }
  attempt = 0;
  clearRetry();
  open();
}

/** Close the stream and stop retrying. Called when the session ends. */
export function disconnectChatStream() {
  wanted = false;
  clearRetry();
  close();
  attempt = 0;
}

/** Diagnostics: "off" | "connecting" | "open". Never drives correctness. */
export function chatStreamState() {
  if (!source) return "off";
  return source.readyState === EventSource.OPEN ? "open" : "connecting";
}
