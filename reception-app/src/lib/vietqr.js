// VietQR (NAPAS EMVCo) payload. Needs the bank's 6-digit BIN; the sample
// bank ("Ngân hàng mẫu") has none, so without a BIN we encode the plain
// transfer details instead of a payload a banking app would act on.

function tlv(id, value) {
  const v = String(value);
  return `${id}${String(v.length).padStart(2, "0")}${v}`;
}

function crc16(s) {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function vietQrPayload({ bin, account, amount, content }) {
  const acct = String(account ?? "").replace(/\s/g, "");
  if (!bin) {
    return [`STK ${acct}`, amount ? `So tien ${amount}` : "", content ? `ND ${content}` : ""]
      .filter(Boolean)
      .join(" | ");
  }
  const merchant = tlv("00", "A000000727") + tlv("01", tlv("00", bin) + tlv("01", acct)) + tlv("02", "QRIBFTTA");
  let body =
    tlv("00", "01") +
    tlv("01", amount ? "12" : "11") +
    tlv("38", merchant) +
    tlv("53", "704") +
    (amount ? tlv("54", String(Math.round(amount))) : "") +
    tlv("58", "VN") +
    (content ? tlv("62", tlv("08", content)) : "");
  body += "6304";
  return body + crc16(body);
}
