// Bonia Tiếp tân · Tài chính (handoff 16, founder 2026-10-10): the finance account's calls, from the backend
// (bonia-backend routes/finance.ts). The same login as the hotel app.
import { call, token } from "../api.js";

const BASE = import.meta.env.VITE_API_BASE || "https://api.bonia.net";

export const financeApi = {
  calls: (days = 30) => call("GET", `/reception/web/finance/calls?days=${days}`),
  call: (id) => call("GET", `/reception/web/finance/calls/${encodeURIComponent(id)}`),
  done: (id, done = true) => call("POST", `/reception/web/finance/calls/${encodeURIComponent(id)}/done`, { done }),
};

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

/** Xuất Excel: the backend writes the file for the filter; the browser saves it. */
export async function downloadExport(params) {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")).toString();
  const blob = await fetchBlob(`/reception/web/finance/export?${q}`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const day = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  a.href = url;
  a.download = `lich-su-${day}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
