// The backend of Bonia Tiếp tân (bonia-backend routes/reception-web.ts):
// login by a code pushed to the owner's Bonia app, the saved Cài đặt, and
// the AI lookup, and (handoff 14) QR sign-in, Bonia on/off and Hôm nay.
// Demo mode never calls it. VITE_API_BASE overrides the host.

const BASE = import.meta.env.VITE_API_BASE || "https://api.bonia.net";
const KEY = "tt.token";

export const token = {
  get() {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(t) {
    try {
      if (t) localStorage.setItem(KEY, t);
      else localStorage.removeItem(KEY);
    } catch {
      // storage blocked: the login lasts this page only
    }
  },
};

/** One call; throws { status, error } (status 0 = no network). A refused token is forgotten. */
async function call(method, path, body) {
  const t = token.get();
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(t ? { Authorization: `Bearer ${t}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw { status: 0, error: "network" };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !path.includes("/login/")) token.set(null);
    throw { status: res.status, ...data };
  }
  return data;
}

export const api = {
  requestCode: (phone) => call("POST", "/reception/web/login/code", { phone }),
  verify: (phone, code) => call("POST", "/reception/web/login/verify", { phone, code }),
  me: () => call("GET", "/reception/web/me"),
  saveProfile: (profile, version, sector) => call("PUT", "/reception/web/profile", { profile, version, ...(sector ? { sector } : {}) }),
  startImport: (input) => call("POST", "/reception/web/import", input),
  importStatus: (id) => call("GET", `/reception/web/import/${encodeURIComponent(id)}`),
  pickImport: (id, index) => call("POST", `/reception/web/import/${encodeURIComponent(id)}/pick`, { index }),
  // handoff 14: QR sign-in, Bonia on/off, Hôm nay, the Orb tip
  qrStart: () => call("POST", "/reception/web/login/qr", {}),
  qrPoll: (id, secret) => call("GET", `/reception/web/login/qr/${encodeURIComponent(id)}?s=${encodeURIComponent(secret)}`),
  state: () => call("GET", "/reception/web/state"),
  setActive: (on) => call("PUT", "/reception/web/active", { on }),
  readback: (text, until) => call("POST", "/reception/web/today/readback", { text, until }),
  saveToday: (note) => call("PUT", "/reception/web/today", note),
  clearToday: () => call("DELETE", "/reception/web/today"),
  tipSeen: () => call("POST", "/reception/web/tip-seen", {}),
  // Thử Bonia: one test call on the Cài đặt on screen → { ticket, url }
  testCall: (profile) => call("POST", "/reception/web/test-call", { profile }),
  // Cần xử lý: what Bonia recorded on the business's calls
  requests: (days = 7) => call("GET", `/reception/web/requests?days=${days}`),
  doneRequest: (id, done = true) => call("POST", `/reception/web/requests/${encodeURIComponent(id)}/done`, { done }),
  // Lịch sử: every call of the last days (founder 2026-10-07)
  calls: (days = 8) => call("GET", `/reception/web/calls?days=${days}`),
  // Trực tiếp: a one-use ticket for the live-call feed → { ticket, url }
  liveTicket: () => call("POST", "/reception/web/live-ticket", {}),
};

/** A call's recording as a playable URL: fetched with the login (an <audio> tag can't send it), kept as a Blob. */
export async function recordingUrl(id) {
  const t = token.get();
  let res;
  try {
    res = await fetch(`${BASE}/reception/web/calls/${encodeURIComponent(id)}/recording`, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
  } catch {
    throw { status: 0, error: "network" };
  }
  if (!res.ok) throw { status: res.status, error: res.status === 404 ? "no_recording" : "failed" };
  return URL.createObjectURL(await res.blob());
}
