// Bonia Tiếp tân · Tài chính (handoff 16, founder 2026-10-10): the finance account's calls, from the backend
// (bonia-backend routes/finance.ts). The same login as the hotel app.
import { call, token } from "../api.js";

const BASE = import.meta.env.VITE_API_BASE || "https://api.bonia.net";

export const financeApi = {
  calls: (days = 30) => call("GET", `/reception/web/finance/calls?days=${days}`),
  call: (id) => call("GET", `/reception/web/finance/calls/${encodeURIComponent(id)}`),
  done: (id, done = true) => call("POST", `/reception/web/finance/calls/${encodeURIComponent(id)}/done`, { done }),
  // Gọi ra: the campaigns (the backend's routes/finance.ts, "Gọi ra")
  campaigns: () => call("GET", "/reception/web/finance/campaigns"),
  campaign: (id) => call("GET", `/reception/web/finance/campaigns/${encodeURIComponent(id)}`),
  live: (id) => call("GET", `/reception/web/finance/campaigns/${encodeURIComponent(id)}/live`),
  rows: (id, params = {}) => call("GET", `/reception/web/finance/campaigns/${encodeURIComponent(id)}/rows?${query(params)}`),
  row: (id, rowId) => call("GET", `/reception/web/finance/campaigns/${encodeURIComponent(id)}/rows/${encodeURIComponent(rowId)}`),
  addRows: (id, rows) => call("POST", `/reception/web/finance/campaigns/${encodeURIComponent(id)}/rows`, { rows }),
  update: (id, body) => call("PATCH", `/reception/web/finance/campaigns/${encodeURIComponent(id)}`, body),
  create: (body) => call("POST", "/reception/web/finance/campaigns", body),
  understand: (headers, rows) => call("POST", "/reception/web/finance/campaigns/understand", { headers, rows }),
  opening: (columns, row) => call("POST", "/reception/web/finance/campaigns/opening", { columns, row }),
  check: (phones) => call("POST", "/reception/web/finance/campaigns/check", { phones }),
  testCall: (body) => call("POST", "/reception/web/finance/test-call", body),
  dnc: () => call("GET", "/reception/web/finance/dnc"),
};

const query = (params) => new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")).toString();

async function fetchBlob(path) {
  const t = token.get();
  let res;
  try {
    res = await fetch(BASE + path, { headers: t ? { Authorization: `Bearer ${t}` } : {} });
  } catch {
    throw { status: 0, error: "network" };
  }
  if (!res.ok) throw { status: res.status, error: res.status === 404 ? "not_found" : "failed" };
  return res.blob();
}

/** A call's recording as a playable URL (an <audio> tag can't send the login). */
export async function financeRecordingUrl(id) {
  return URL.createObjectURL(await fetchBlob(`/reception/web/finance/calls/${encodeURIComponent(id)}/recording`));
}

/** Xuất Excel: the backend writes the file for the filter (or a campaign's whole list); the browser saves it. */
export async function downloadExport(params, name = "lich-su") {
  const blob = await fetchBlob(`/reception/web/finance/export?${query(params)}`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const day = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  a.href = url;
  a.download = `${name}-${day}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
