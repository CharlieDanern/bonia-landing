// SMS helpers. Messages go out from the hotel's own phone (never Bonia,
// never Zalo): on a phone we open the SMS app with an sms: link, on a desktop
// we show the text to copy plus a QR that opens the same sms: link.

/** Drop Vietnamese diacritics ("không dấu") so one SMS holds 160 chars. */
export function stripAccents(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/** 160 chars fit one SMS; longer texts split into 153-char parts. */
export function smsParts(text) {
  const n = String(text ?? "").length;
  if (n === 0) return 0;
  return n <= 160 ? 1 : Math.ceil(n / 153);
}

/** "188 ký tự · 2 tin" */
export function smsCountLabel(text) {
  const n = String(text ?? "").length;
  return `${n} ký tự · ${smsParts(text)} tin`;
}

/** sms: URI with a prefilled body (works on iOS and Android). */
export function smsHref(phone, body) {
  const to = String(phone ?? "").replace(/[^\d+]/g, "");
  return `sms:${to}${body ? `?&body=${encodeURIComponent(body)}` : ""}`;
}

export function telHref(phone) {
  return `tel:${String(phone ?? "").replace(/[^\d+]/g, "")}`;
}

/** USSD-style forwarding code as a dial link (# must be escaped). */
export function dialCodeHref(code) {
  return `tel:${encodeURIComponent(code)}`;
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for http:// previews where the async clipboard is blocked.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
