import React, { useState } from "react";
import { Dialog } from "./Dialog.jsx";
import { Button } from "./Button.jsx";
import { QrCode } from "./QrCode.jsx";
import { copyText, smsHref } from "../../lib/sms.js";

// Invite a notification receiver (README "Invite card", frame 3.6 F):
// link + Sao chép, QR for their phone, iPhone home-screen note, privacy
// note. "Gửi qua tin nhắn" opens the SMS app on this device (sms: link).
export function InviteCard({
  open,
  onClose,
  name = "anh Tư", // as used mid-sentence
  title, // defaults to "Mời {Name} nhận báo"
  group = "KỸ THUẬT",
  link = "bonia.vn/r/7F3K-tu",
  phone,
  onDone,
}) {
  const [copied, setCopied] = useState(false);
  const Name = name.charAt(0).toUpperCase() + name.slice(1);
  const url = `https://${link}`;
  return (
    <Dialog open={open} onClose={onClose} eyebrow={`Mời người nhận báo · ${group}`} title={title || `Mời ${name} nhận báo`} width={640}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 180px", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--bn-ink-2)" }}>
            {Name} mở đường dẫn trên điện thoại của mình, bấm{" "}
            <span style={{ color: "var(--bn-ink)", fontWeight: 600 }}>Nhận thông báo</span> là xong. Không cần cài thêm ứng dụng.
          </div>
          <div
            style={{
              height: 46,
              border: "1px solid var(--bn-hairline)",
              borderRadius: 10,
              padding: "0 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "var(--bn-mono)",
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{link}</span>
            <button
              type="button"
              onClick={async () => setCopied(await copyText(url))}
              style={{ fontFamily: "var(--bn-sans)", color: "var(--bn-clay)", fontWeight: 500 }}
            >
              {copied ? "Đã chép" : "Sao chép"}
            </button>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--bn-muted)", lineHeight: 1.5 }}>
            iPhone: mở bằng Safari, bấm Chia sẻ → Thêm vào Màn hình chính, rồi mở từ biểu tượng mới.
          </div>
          <div style={{ fontSize: 12.5, color: "var(--bn-muted)" }}>
            {Name} chỉ thấy số phòng và việc, không thấy tên hay số của khách.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <QrCode value={url} size={172} padding={10} label={`Mã QR mời ${name}`} />
          <span style={{ fontSize: 12, color: "var(--bn-ink-2)" }}>Quét bằng điện thoại {name}</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button
          variant="secondary"
          size="sm"
          href={smsHref(phone, `Bonia Tiếp tân: mời ${name} nhận báo việc. Mở: ${url}`)}
          style={{ height: 46, padding: "0 20px" }}
        >
          Gửi qua tin nhắn
        </Button>
        <Button size="sm" onClick={onDone || onClose} style={{ height: 46, padding: "0 22px" }}>
          Xong
        </Button>
      </div>
    </Dialog>
  );
}
