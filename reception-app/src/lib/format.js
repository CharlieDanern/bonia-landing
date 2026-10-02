// Number formatting the way the frames write it: 1.153.900đ, 73,4, 12,5.

/** 1153900 → "1.153.900" */
export function groupVnd(n) {
  if (n == null || Number.isNaN(n)) return "";
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** 1153900 → "1.153.900đ" */
export function vnd(n) {
  return n == null ? "—" : `${groupVnd(n)}đ`;
}

/** "1.153.900" / "1153900đ" → 1153900 (digits only). */
export function parseVnd(s) {
  const digits = String(s ?? "").replace(/\D/g, "");
  return digits ? Number(digits) : null;
}

/** 73.4 → "73,4"; 250 → "250" (one decimal, Vietnamese comma). */
export function decimal(n, digits = 1) {
  if (n == null) return "";
  const fixed = Number.isInteger(n) ? String(n) : n.toFixed(digits);
  return fixed.replace(".", ",");
}

/** Share used of a minutes allowance, for meter widths: 73.4/250 → "29.4%". */
export function percent(used, total) {
  if (!total) return "0%";
  return `${Math.min(100, (used / total) * 100).toFixed(1)}%`;
}

/** "0900000300" → "0900 000 300" */
export function phone(s) {
  const d = String(s ?? "").replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  return s ?? "";
}

/** Digits only, for tel:/sms: URIs. */
export function phoneDigits(s) {
  return String(s ?? "").replace(/[^\d+]/g, "");
}
