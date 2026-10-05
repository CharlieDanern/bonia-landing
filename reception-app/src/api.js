// The backend of Bonia Tiếp tân (bonia-backend routes/reception-web.ts):
// login by a code pushed to the owner's Bonia app, the saved Cài đặt, and
// the AI lookup. Demo mode never calls it. VITE_API_BASE overrides the host.

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
  saveProfile: (profile, version) => call("PUT", "/reception/web/profile", { profile, version }),
  startImport: (input) => call("POST", "/reception/web/import", input),
  importStatus: (id) => call("GET", `/reception/web/import/${encodeURIComponent(id)}`),
};
