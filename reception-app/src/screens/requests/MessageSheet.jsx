import React, { useEffect, useRef, useState } from "react";
import { Button, CloseButton, Dialog, QrCode } from "../../components/ui/index.js";
import { useIsMobile } from "../../lib/hooks.js";
import { copyText, smsCountLabel, smsHref } from "../../lib/sms.js";
import { useStore } from "../../store/index.jsx";
import { decisionLine, sheetEyebrow, smsLangLabel, smsText, toGsm } from "./text.js";

// "Xác nhận và nhắn khách", step 2 (3.3 B). The decision is already saved
// (step 1 ✓). The message always leaves from the hotel's own phone:
//   desktop → Sao chép + a QR of the sms: link for the counter phone
//   phone   → Mở tin nhắn (sms: link with the text filled in)
// Opening the SMS app is not "sent": onDone(via) only makes the app ask.

export function MessageSheet({ r, open, onClose, onDone }) {
  const state = useStore();
  const mobile = useIsMobile();
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const opened = useRef(false);

  useEffect(() => {
    if (open && r) {
      setText(smsText(state, r));
      setEditing(false);
      setCopied(false);
      opened.current = false;
    }
    // Only when the sheet opens: later edits must not reset the text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, r?.id]);

  if (!open || !r) return null;

  const body = toGsm(text);
  const href = smsHref(r.phone, body);
  const close = () => {
    // Desktop: the QR was on screen, so ask afterwards. Phone: asked only
    // if "Mở tin nhắn" was tapped.
    if (!mobile || opened.current) onDone(mobile ? "sms" : "qr");
    else onClose();
  };
  const toggleEdit = () => {
    if (editing) setText(toGsm(text));
    setEditing(!editing);
  };
  const copy = async () => {
    if (await copyText(body)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const stepBox = (n, done, title, sub) => (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "12px 14px",
        border: done ? "1px solid var(--bn-hairline)" : "2px solid var(--bn-clay)",
        borderRadius: 10,
        minWidth: 0,
      }}
    >
      <span style={{ fontFamily: "var(--bn-mono)", fontSize: 12, color: done ? "var(--bn-ok)" : "var(--bn-clay)", whiteSpace: "nowrap" }}>
        {n}
        {done ? " ✓" : ""}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: 13, color: "var(--bn-ink-2)" }}>{sub}</span>
      </div>
    </div>
  );

  const bubble = editing ? (
    <textarea
      aria-label="Nội dung tin nhắn"
      value={text}
      autoFocus
      onChange={(e) => setText(e.target.value)}
      onBlur={() => setText(toGsm(text))}
      rows={mobile ? 6 : 5}
      style={{
        width: "100%",
        maxWidth: 440,
        padding: "13px 15px",
        borderRadius: "18px 18px 18px 4px",
        border: "2px solid var(--bn-clay)",
        background: "#fff",
        fontSize: 14.5,
        lineHeight: 1.5,
        resize: "vertical",
        outline: 0,
      }}
    />
  ) : (
    <div
      style={{
        alignSelf: "flex-start",
        maxWidth: 440,
        padding: "14px 16px",
        borderRadius: "18px 18px 18px 4px",
        background: "var(--bn-processing-bg)",
        fontSize: 14.5,
        lineHeight: 1.5,
        overflowWrap: "anywhere",
      }}
    >
      {body}
    </div>
  );

  return (
    <Dialog open={open} onClose={close} bare width={820} label="Nhắn khách">
      <div style={{ padding: mobile ? "20px 16px 16px" : "26px 32px 18px", display: "flex", flexDirection: "column", gap: 16, borderBottom: "1px solid var(--bn-hairline-2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
          <span style={{ fontFamily: "var(--bn-mono)", fontSize: 11, letterSpacing: "0.2em", color: "var(--bn-muted)" }}>{sheetEyebrow(r)}</span>
          {/* Inline-text size, as drawn; the hit area stays 35px. */}
          <CloseButton onClick={close} style={{ width: "auto", height: 19, lineHeight: "19px" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 10 }}>
          {stepBox(1, true, "Đã ghi quyết định", decisionLine(r))}
          {stepBox(2, false, "Nhắn khách", `Gửi từ điện thoại quầy ${state.hotel.phone}`)}
        </div>
      </div>

      <div
        style={{
          padding: mobile ? "18px 16px" : "22px 32px",
          display: "grid",
          gridTemplateColumns: mobile ? "minmax(0,1fr)" : "minmax(0,1fr) 232px",
          gap: 28,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{smsLangLabel(r)}</span>
            <span aria-live="polite" style={{ fontFamily: "var(--bn-mono)", fontSize: 11, color: "var(--bn-muted)", whiteSpace: "nowrap" }}>
              {smsCountLabel(body)}
            </span>
          </div>
          {bubble}
          <div style={{ fontSize: 13, color: "var(--bn-muted)", lineHeight: 1.5 }}>
            {r.status === "cho-coc"
              ? "Thông tin chuyển khoản cọc bạn tự gửi riêng. Bonia không điền số tài khoản vào tin nhắn."
              : "Tin gửi từ điện thoại quầy, không có dấu để vừa một tin."}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {mobile && (
              <Button
                size="lg"
                href={href}
                onClick={() => {
                  opened.current = true;
                  // Let the sms: link open before the sheet goes away.
                  setTimeout(() => onDone("sms"), 300);
                }}
                style={{ flex: "1 1 100%" }}
              >
                Mở tin nhắn
              </Button>
            )}
            <Button variant={mobile ? "secondary" : "primary"} size="sm" onClick={copy} style={{ padding: "0 20px", ...(mobile ? { flex: 1, height: 48 } : null) }}>
              {copied ? "Đã chép" : "Sao chép"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleEdit}
              style={{ padding: "0 18px", ...(mobile ? { flex: 1, height: 48 } : null) }}
            >
              {editing ? "Lưu tin" : "Sửa tin"}
            </Button>
          </div>
        </div>
        {!mobile && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", textAlign: "center" }}>
            <QrCode value={href} size={200} label="Mã QR mở tin nhắn trên điện thoại quầy" />
            <span style={{ fontSize: 13, color: "var(--bn-ink-2)", lineHeight: 1.45 }}>Quét bằng điện thoại quầy, tin nhắn mở sẵn để gửi.</span>
          </div>
        )}
      </div>

      <div
        style={{
          padding: mobile ? "14px 16px" : "14px 32px",
          background: "var(--bn-cream-3)",
          borderTop: "1px solid var(--bn-hairline-2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          fontSize: 13.5,
          color: "var(--bn-ink-2)",
        }}
      >
        <span>Ứng dụng không biết tin đã được gửi hay chưa. Lát nữa Bonia sẽ hỏi bạn.</span>
        <Button variant="secondary" size="xs" onClick={close}>
          Đóng
        </Button>
      </div>
    </Dialog>
  );
}
