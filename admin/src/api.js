// Bonia Admin portal — API client.
//
// Same pattern as the RM portal (portal/src/api.js): cross-origin by
// design (bonia.vn → api.bonia.net), bearer token in localStorage, never
// cookies. A 401 anywhere (except login) clears the session and bounces
// back to the login screen.

const BASE = import.meta.env.VITE_API_BASE || "https://api.bonia.net";
const TOKEN_KEY = "bonia_admin_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || `HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* empty body */
  }
  if (res.status === 401 && path !== "/admin-portal/login") {
    clearToken();
    window.dispatchEvent(new Event("bonia:signed-out"));
  }
  if (!res.ok) throw new ApiError(res.status, json);
  return json;
}

export const api = {
  login: (username, password) =>
    request("/admin-portal/login", { method: "POST", body: { username, password } }),
  overview: () => request("/admin-portal/overview"),
  registrations: (status = "pending") =>
    request(`/admin-portal/registrations?status=${status}`),
  approveRegistration: (id, bank) =>
    request(`/admin-portal/registrations/${id}/approve`, {
      method: "POST",
      body: { bank },
    }),
  rejectRegistration: (id) =>
    request(`/admin-portal/registrations/${id}/reject`, { method: "POST", body: {} }),
  cards: (status = "pending") => request(`/admin-portal/cards?status=${status}`),
  reviewCard: (id, body) =>
    request(`/admin-portal/cards/${id}/review`, { method: "POST", body }),
  cardTypes: (bank) =>
    request(`/admin-portal/card-types${bank ? `?bank=${encodeURIComponent(bank)}` : ""}`),
  claims: (state = "disputed") => request(`/admin-portal/claims?state=${state}`),
  resolveClaim: (id, body) =>
    request(`/admin-portal/claims/${id}/resolve`, { method: "POST", body }),
  rms: () => request("/admin-portal/rms"),
  suspendRm: (id) =>
    request(`/admin-portal/rms/${id}/suspend`, { method: "POST", body: {} }),
  unsuspendRm: (id) =>
    request(`/admin-portal/rms/${id}/unsuspend`, { method: "POST", body: {} }),
  bankTxn: (body) => request("/admin-portal/bank-txn", { method: "POST", body }),
  transfers: (limit = 30) => request(`/admin-portal/transfers?limit=${limit}`),
};

// ── Formatting (VN conventions, same as the RM portal) ───────────────
export const vnd = (n) =>
  n == null ? "—" : `${Math.round(n).toLocaleString("de-DE")}đ`;

export const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("vi-VN", {
    hour12: false,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const shortId = (id) => (id == null ? "—" : String(id).slice(0, 8));

// ~20 VN bank names — the BANK_DOMAINS values from the backend
// (src/routes/rm-register.ts), de-duplicated.
export const BANKS = [
  "VPBank",
  "Techcombank",
  "TPBank",
  "VIB",
  "MB Bank",
  "Vietcombank",
  "VietinBank",
  "BIDV",
  "ACB",
  "Sacombank",
  "HDBank",
  "SHB",
  "OCB",
  "MSB",
  "SeABank",
  "VietBank",
  "Eximbank",
  "PVcomBank",
  "LPBank",
];

// Design vocabulary ↔ backend lead states (copied from the RM portal).
export const STAGE_LABEL = {
  moi: "Cần gọi",
  da_goi: "Cần gọi",
  dang_tu_van: "Đang tư vấn",
  hen_goi_lai: "Đang tư vấn",
  da_nop_ho_so: "Đang tư vấn",
  duoc_duyet: "Thành công",
  that_bai: "Thất bại",
  cancelled: "Đã huỷ",
};
