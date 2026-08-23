// Bonia Connect portal — API client.
//
// Cross-origin by design (bonia.vn → api.bonia.net), so auth is a bearer
// token in localStorage, never a cookie (Safari blocks third-party
// cookies). A 401 anywhere clears the session and bounces to login.

const BASE = import.meta.env.VITE_API_BASE || "https://api.bonia.net";
const TOKEN_KEY = "bonia_rm_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

class ApiError extends Error {
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
  if (res.status === 401 && path !== "/rm/login") {
    clearToken();
    window.dispatchEvent(new Event("bonia:signed-out"));
  }
  if (!res.ok) throw new ApiError(res.status, json);
  return json;
}

export const api = {
  login: (username, password) =>
    request("/rm/login", { method: "POST", body: { username, password } }),
  me: () => request("/rm/me"),
  marketplace: () => request("/rm/marketplace"),
  bid: (intentId, amountVnd) =>
    request(`/rm/intents/${intentId}/bid`, {
      method: "POST",
      body: { amount_vnd: amountVnd },
    }),
  offers: () => request("/rm/offers"),
  products: () => request("/rm/products"),
  // Bid-tab v2 — rep-owned cards
  cards: () => request("/rm/cards"),
  createCard: (body) => request("/rm/cards", { method: "POST", body }),
  updateCard: (id, body) => request(`/rm/cards/${id}`, { method: "PUT", body }),
  uploadCardMedia: (id, body) =>
    request(`/rm/cards/${id}/media`, { method: "POST", body }),
  submitProduct: (body) =>
    request("/rm/products/submit", { method: "POST", body }),
  setOffer: (productId, amountVnd) =>
    request(`/rm/offers/${productId}`, {
      method: "POST",
      body: { amount_vnd: amountVnd },
    }),
  leads: () => request("/rm/leads"),
  disposition: (leadId, state, note) =>
    request(`/rm/leads/${leadId}/disposition`, {
      method: "POST",
      body: { state, note },
    }),
  confirmApproval: (leadId) =>
    request(`/rm/leads/${leadId}/confirm-approval`, { method: "POST" }),
  denyApproval: (leadId, reason) =>
    request(`/rm/leads/${leadId}/deny-approval`, {
      method: "POST",
      body: { reason },
    }),
  claimPayment: (claimId) => request(`/rm/claims/${claimId}/payment`),
  // Pipeline v2 + registration + wallet
  register: (body) => request("/rm/register", { method: "POST", body }),
  registerVerify: (body) => request("/rm/register/verify", { method: "POST", body }),
  messages: (leadId) => request(`/rm/leads/${leadId}/messages`),
  sendMessage: (leadId, text) =>
    request(`/rm/leads/${leadId}/messages`, { method: "POST", body: { text } }),
  outcome: (leadId, body) =>
    request(`/rm/leads/${leadId}/outcome`, { method: "POST", body }),
  ledger: () => request("/rm/wallet/ledger"),
  updateAccount: (body) => request("/rm/account", { method: "PUT", body }),
};

// ── Formatting (VN conventions from the design handoff) ──────────────
export const vnd = (n) =>
  n == null ? "—" : `${Math.round(n).toLocaleString("de-DE")}đ`;

export function countdown(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return { text: "đang đóng", urgent: true };
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return {
    text: h >= 1 ? `còn ${h}g ${m}p` : `còn ${m}p ${String(s).padStart(2, "0")}s`,
    urgent: ms < 2 * 3600000,
  };
}

// Design vocabulary ↔ backend lead states.
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

export const STAGE_FILTERS = [
  { key: "all", label: "Tất cả", match: () => true },
  { key: "call", label: "Cần gọi", match: (s) => ["moi", "da_goi"].includes(s) },
  {
    key: "consulting",
    label: "Đang tư vấn",
    match: (s) => ["dang_tu_van", "hen_goi_lai", "da_nop_ho_so"].includes(s),
  },
  { key: "won", label: "Thành công", match: (s) => s === "duoc_duyet" },
];
