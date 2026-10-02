import React, { useState } from "react";
import { QrCode } from "./QrCode.jsx";
import { Button } from "./Button.jsx";
import { copyText } from "../../lib/sms.js";
import { vietQrPayload } from "../../lib/vietqr.js";
import { vnd } from "../../lib/format.js";

// VietQR block (README): QR 210–232, rows Số tiền / Ngân hàng / Số tài
// khoản / Chủ tài khoản / Nội dung, "Sao chép nội dung", note.
export function VietQrBlock({
  amount,
  bank, // { bankName, bin, account, holder, content }
  qrSize = 232,
  heading = "Chuyển khoản · VietQR",
  note = "Ghi đúng nội dung để Bonia tự ghi nhận, thường trong vài phút.",
  rows, // override which rows to show
  style,
}) {
  const [copied, setCopied] = useState(false);
  const payload = vietQrPayload({ bin: bank.bin, account: bank.account, amount, content: bank.content });
  const list = rows || [
    ["Số tiền", vnd(amount), { mono: true, weight: 500 }],
    ["Ngân hàng", bank.bankName],
    ["Số tài khoản", bank.account, { mono: true }],
    ["Chủ tài khoản", bank.holder],
    ["Nội dung", bank.content, { mono: true, weight: 500 }],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, ...style }}>
      {heading && (
        <div style={{ fontFamily: "var(--bn-mono)", fontSize: 10, letterSpacing: "0.2em", color: "var(--bn-muted)", textTransform: "uppercase" }}>
          {heading}
        </div>
      )}
      <QrCode value={payload} size={qrSize} padding={14} style={{ alignSelf: "center" }} label="Mã VietQR chuyển khoản" />
      <div style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: "9px 10px", fontSize: 13.5 }}>
        {list.map(([k, v, o = {}]) => (
          <React.Fragment key={k}>
            <span style={{ color: "var(--bn-muted)" }}>{k}</span>
            <span style={{ fontFamily: o.mono ? "var(--bn-mono)" : undefined, fontWeight: o.weight }}>{v}</span>
          </React.Fragment>
        ))}
      </div>
      <Button variant="secondary" size="sm" block onClick={async () => setCopied(await copyText(bank.content))} style={{ height: 46 }}>
        {copied ? "Đã chép nội dung" : "Sao chép nội dung"}
      </Button>
      {note && <div style={{ fontSize: 12.5, color: "var(--bn-muted)", lineHeight: 1.5 }}>{note}</div>}
    </div>
  );
}
