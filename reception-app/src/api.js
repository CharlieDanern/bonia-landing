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
  // Cần xử lý: what Bonia recorded on the business's calls
  requests: (days = 7) => call("GET", `/reception/web/requests?days=${days}`),
  doneRequest: (id, done = true) => call("POST", `/reception/web/requests/${encodeURIComponent(id)}/done`, { done }),
};
