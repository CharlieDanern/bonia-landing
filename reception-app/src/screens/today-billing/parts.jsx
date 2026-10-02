import React, { useEffect, useState } from "react";
import { Button, Dialog, QrCode, SideSheet, TextInput, Spinner } from "../../components/ui/index.js";
import { copyText, dialCodeHref } from "../../lib/sms.js";
import { vietQrPayload } from "../../lib/vietqr.js";
import { vnd } from "../../lib/format.js";
import { nowHHMM } from "../../lib/clock.js";
import { useIsMobile } from "../../lib/hooks.js";
import "./today-billing.css";

// Pieces shared by Hôm nay, Thanh toán and Đã tạm dừng. Local variants of
// shared components where the frames draw them slightly differently.

export const mono = { fontFamily: "var(--bn-mono)" };
export const serif = { fontFamily: "var(--bn-serif)" };

/** Wraps a screen so local CSS (today-billing.css) applies; adds no box. */
export function Scope({ children }) {
  return (
    <div className="tb-scope" style={{ display: "contents" }}>
      {children}
    </div>
  );
}

/** Mono label (10–11px, 0.2em, uppercase). */
export function Eyebrow({ size = 10.5, color = "var(--bn-muted)", spacing = "0.2em", style, children }) {
  return (
    <div style={{ ...mono, fontSize: size, letterSpacing: spacing, textTransform: "uppercase", color, ...style }}>{children}</div>
  );
}

// Hôm nay pills: 10px, 0.12em, 4×8, r10 (detail size, wider tracking than
// the shared StatusPill). Fills have no border, outlines have 1px.
const PILL = {
  urgent: { background: "var(--bn-urgent-bg)", color: "var(--bn-urgent)" },
  overdue: { border: "1px solid var(--bn-urgent)", color: "var(--bn-urgent)" },
  processing: { background: "var(--bn-processing-bg)", color: "var(--bn-ink-2)" },
  new: { border: "1px solid var(--bn-clay)", color: "var(--bn-clay)" },
  type: { border: "1px solid var(--bn-hairline)", color: "var(--bn-ink-2)" },
  conflict: { border: "1px solid var(--bn-urgent-line)", color: "var(--bn-urgent)", background: "#fff" },
  done: { border: "1px solid var(--bn-hairline)", color: "var(--bn-muted)" },
};

export function Pill({ kind = "type", style, children }) {
  return (
    <span
      style={{
        ...mono,
        fontSize: 10,
        letterSpacing: "0.12em",
        padding: "4px 8px",
        borderRadius: 10,
        whiteSpace: "nowrap",
        lineHeight: "normal",
        flex: "none",
        ...PILL[kind],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** Static skeleton block / bar (pulses gently; frozen in screenshots). */
export function Block({ w, h, r = 14, bg = "var(--bn-skeleton)", style }) {
  return <span className="tb-pulse" style={{ display: "block", width: w, height: h, borderRadius: r, background: bg, flex: "none", ...style }} />;
}

/** Centered error (3.2 E, 3.7 D): mono label, serif 32, body, Thử lại. */
export function ErrorState({ title, body, onRetry, retrying, footnote, style }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>
      <div
        role="alert"
        style={{ maxWidth: 560, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}
      >
        <Eyebrow size={11} color="var(--bn-urgent)">
          Không tải được
        </Eyebrow>
        <div style={{ ...serif, fontSize: 32, lineHeight: 1.2 }}>{title}</div>
        <div style={{ fontSize: 15.5, lineHeight: 1.6, color: "var(--bn-ink-2)" }}>{body}</div>
        <Button size="md" loading={retrying} onClick={onRetry} style={{ padding: "0 24px" }}>
          Thử lại
        </Button>
        {footnote && <div style={{ ...mono, fontSize: 11, letterSpacing: "0.12em", color: "var(--bn-muted)" }}>{footnote}</div>}
      </div>
    </div>
  );
}

/** Copy button whose label confirms the copy for a moment. */
export function CopyButton({ text, label, done = "Đã chép", variant = "secondary", size = "sm", style, block }) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!ok) return undefined;
    const t = setTimeout(() => setOk(false), 1800);
    return () => clearTimeout(t);
  }, [ok]);
  return (
    <Button variant={variant} size={size} block={block} style={style} onClick={async () => setOk(await copyText(text))}>
      {ok ? done : label}
    </Button>
  );
}

/**
 * VietQR card (3.7 A full, 3.8 B compact). Local variant of VietQrBlock:
 * the frames use gap 16/14, a header row with the amount on 3.8 B, and
 * fewer rows there.
 */
export function VietQrCard({ amount, bank, compact = false, style }) {
  const mobile = useIsMobile();
  const payload = vietQrPayload({ bin: bank.bin, account: bank.account, amount, content: bank.content });
  const rows = compact
    ? [
        ["Số tài khoản", bank.account, { mono: true }],
        ["Nội dung", bank.content, { mono: true, weight: 500 }],
      ]
    : [
        ["Số tiền", vnd(amount), { mono: true, weight: 500 }],
        ["Ngân hàng", bank.bankName],
        ["Số tài khoản", bank.account, { mono: true }],
        ["Chủ tài khoản", bank.holder],
        ["Nội dung", bank.content, { mono: true, weight: 500 }],
      ];
  const qrSize = compact ? 210 : 232;
  return (
    <section
      aria-label="Chuyển khoản"
      style={{
        background: "#fff",
        border: "1px solid var(--bn-hairline)",
        borderRadius: 16,
        padding: mobile ? 20 : 24,
        display: "flex",
        flexDirection: "column",
        gap: compact ? 14 : 16,
        alignSelf: "start",
        ...style,
      }}
    >
      {compact ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <Eyebrow size={10}>Cần trả</Eyebrow>
          <span style={{ ...mono, fontSize: 22 }}>{vnd(amount)}</span>
        </div>
      ) : (
        <Eyebrow size={10}>Chuyển khoản · VietQR</Eyebrow>
      )}
      <QrCode
        value={payload}
        size={qrSize}
        padding={compact ? 12 : 14}
        label={`Mã VietQR chuyển ${vnd(amount)}, nội dung ${bank.content}`}
        style={{ alignSelf: "center", maxWidth: "100%", height: "auto", aspectRatio: "1 / 1" }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: compact ? "8px 10px" : "9px 10px", fontSize: 13.5 }}>
        {rows.map(([k, v, o = {}]) => (
          <React.Fragment key={k}>
            <span style={{ color: "var(--bn-muted)" }}>{k}</span>
            <span style={{ fontFamily: o.mono ? "var(--bn-mono)" : undefined, fontWeight: o.weight }}>{v}</span>
          </React.Fragment>
        ))}
      </div>
      <CopyButton text={bank.content} label="Sao chép nội dung" done="Đã chép nội dung" block style={{ height: 46 }} />
      {!compact && (
        <div style={{ fontSize: 12.5, color: "var(--bn-muted)", lineHeight: 1.5 }}>
          Ghi đúng nội dung để Bonia tự ghi nhận, thường trong vài phút.
        </div>
      )}
    </section>
  );
}

/** Code tile: "##61#" / "**61*…#" with Bấm để … + Sao chép mã. */
export function DialCode({ code, action, style }) {
  const mobile = useIsMobile();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: mobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: mobile ? "stretch" : "center",
        gap: 12,
        padding: "12px 14px",
        background: "var(--bn-cream-2)",
        borderRadius: 10,
        ...style,
      }}
    >
      <span style={{ ...mono, fontSize: 26, overflowWrap: "anywhere" }}>{code}</span>
      <span style={{ display: "flex", gap: 8 }}>
        <Button size="sm" href={dialCodeHref(code)} style={{ padding: "0 18px", flex: mobile ? 1 : "none" }}>
          {action}
        </Button>
        <CopyButton text={code} label="Sao chép mã" done="Đã chép mã" style={{ padding: "0 18px", flex: mobile ? 1 : "none" }} />
      </span>
    </div>
  );
}

/** "Xem mã chuyển cuộc gọi": the forwarding code, ready to dial again. */
export function ForwardCodeSheet({ open, onClose, hotel }) {
  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title="Mã chuyển cuộc gọi"
      width={480}
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 24 }}>
        <div style={{ fontSize: 14, color: "var(--bn-ink-2)", lineHeight: 1.55 }}>
          Bấm mã này trên điện thoại quầy {hotel.phone} ({hotel.carrier}). Khi lễ tân không bắt máy, cuộc gọi sẽ chuyển tới Bonia.
        </div>
        <DialCode code={hotel.forwardCode} action="Bấm để cài" />
        <div style={{ fontSize: 13, color: "var(--bn-muted)", lineHeight: 1.5 }}>
          Đã cài rồi mà vẫn không có cuộc gọi? Gọi hỗ trợ {hotel.supportPhone} ({hotel.supportHours}).
        </div>
      </div>
    </SideSheet>
  );
}

/**
 * "Kiểm tra ngay" / "Gọi thử": Bonia calls the counter number. Warn first
 * that the counter phone may ring; the demo call always reaches Bonia.
 */
export function TestCallDialog({ open, onClose, onDone, hotel }) {
  const [phase, setPhase] = useState("ask"); // ask | calling | done
  const [at, setAt] = useState("");
  useEffect(() => {
    if (open) setPhase("ask");
  }, [open]);
  useEffect(() => {
    if (phase !== "calling") return undefined;
    const t = setTimeout(() => {
      const time = nowHHMM();
      setAt(time);
      setPhase("done");
      onDone?.(time);
    }, 2400);
    return () => clearTimeout(t);
  }, [phase, onDone]);

  return (
    <Dialog open={open} onClose={phase === "calling" ? undefined : onClose} eyebrow="Gọi thử" width={560}>
      {phase === "done" ? (
        <>
          <div style={{ ...serif, fontSize: 28, lineHeight: 1.2 }}>Cuộc gọi thử tới được Bonia.</div>
          <div style={{ fontSize: 15, color: "var(--bn-ink-2)", lineHeight: 1.55 }}>
            Gọi thử lúc {at} ✓. Chuyển cuộc gọi đang chạy đúng.
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button size="sm" onClick={onClose}>
              Xong
            </Button>
          </div>
        </>
      ) : (
        <>
          <div style={{ ...serif, fontSize: 28, lineHeight: 1.2 }}>Bonia sẽ gọi thử tới {hotel.phone}.</div>
          <div style={{ fontSize: 15, color: "var(--bn-ink-2)", lineHeight: 1.55 }}>
            Máy quầy có thể đổ chuông. Đừng bắt máy, để cuộc gọi chuyển sang Bonia. Mất khoảng 30 giây.
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
            <Button variant="secondary" size="sm" disabled={phase === "calling"} onClick={onClose}>
              Để sau
            </Button>
            <Button size="sm" loading={phase === "calling"} onClick={() => setPhase("calling")}>
              {phase === "calling" ? "Đang gọi thử…" : "Gọi thử ngay"}
            </Button>
          </div>
        </>
      )}
    </Dialog>
  );
}

/** Thông tin xuất hóa đơn (Sửa / Điền thông tin xuất hóa đơn). */
export function BillingInfoSheet({ open, onClose, info, onSave }) {
  const [form, setForm] = useState(info);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    if (open) {
      setForm(info);
      setTried(false);
    }
  }, [open, info]);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const taxOk = /^\d{10}(\d{3})?$/.test(String(form.taxId || "").replace(/\D/g, ""));
  const emailOk = /^\S+@\S+\.\S+$/.test(form.email || "");
  const ok = form.company?.trim() && taxOk && emailOk;
  const save = () => {
    setTried(true);
    if (!ok) return;
    onSave({ ...form, taxId: String(form.taxId).replace(/\D/g, "") });
    onClose();
  };
  return (
    <SideSheet
      open={open}
      onClose={onClose}
      title="Thông tin xuất hóa đơn"
      width={480}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Bỏ thay đổi
          </Button>
          <Button size="sm" onClick={save}>
            Lưu
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingBottom: 24 }}>
        <TextInput label="Tên công ty" value={form.company} onChange={set("company")} error={tried && !form.company?.trim() ? "Điền tên công ty." : undefined} />
        <TextInput
          label="Mã số thuế"
          mono
          inputMode="numeric"
          value={form.taxId}
          onChange={set("taxId")}
          error={tried && !taxOk ? "Mã số thuế có 10 hoặc 13 số." : undefined}
        />
        <TextInput label="Địa chỉ" value={form.address} onChange={set("address")} />
        <TextInput
          label="Email nhận hóa đơn"
          type="email"
          inputMode="email"
          value={form.email}
          onChange={set("email")}
          error={tried && !emailOk ? "Email chưa đúng." : undefined}
        />
      </div>
    </SideSheet>
  );
}

/** Small "loading" wrapper: shows the skeleton for a moment, then content. */
export function useRetry(initial, ms = 900) {
  const [state, setState] = useState(initial);
  const [retrying, setRetrying] = useState(false);
  const retry = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      setState("ready");
    }, ms);
  };
  return [state, retry, retrying, setState];
}

export { Spinner };
