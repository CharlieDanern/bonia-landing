import React, { useEffect, useState } from "react";
import { AppLayout } from "../../components/shell/index.js";
import { Button } from "../../components/ui/index.js";
import { useStore } from "../../store/index.jsx";
import { decimal, percent, vnd } from "../../lib/format.js";
import { useIsMobile, useScreenState } from "../../lib/hooks.js";
import { invoiceLines } from "./invoice.js";
import { mono, serif, Eyebrow, Block, ErrorState, Scope, VietQrCard, BillingInfoSheet, useRetry } from "./parts.jsx";

// Thanh toán (3.7 A–D). 999.000đ/tháng chưa gồm VAT, gồm 250 phút; phút vượt
// 4.000đ, tính theo giây. Payment is a bank transfer with the VietQR code;
// Bonia records it from the transfer content (BONIA TT 7F3K2Q).
//
// Frames: default 3.7 A · ?f=3.7_B or ?state=empty (trial) · ?state=loading
// (3.7 C) · ?state=error (3.7 D).

// Billing info edits have no store action; keep them for the session here.
let savedInfo = null;

function useBillingInfo(initial) {
  const [info, setInfo] = useState(savedInfo || initial);
  const save = (v) => {
    savedInfo = v;
    setInfo(v);
  };
  return [info, save];
}

export function Billing() {
  const { state: initial, frame } = useScreenState();
  const first = frame === "3.7_B" ? "empty" : initial;
  const [view, retry, retrying, setView] = useRetry(first);
  useEffect(() => setView(first), [first, setView]);

  return (
    <AppLayout active="none">
      <Scope>
      {view === "loading" ? (
        <BillingLoading />
      ) : view === "error" ? (
        <ErrorState
          title="Hóa đơn chưa tải được."
          body="Nếu bạn vừa chuyển khoản, tiền không mất; Bonia ghi nhận theo nội dung BONIA TT 7F3K2Q. Thử lại sau ít phút."
          onRetry={retry}
          retrying={retrying}
          style={{ padding: 16 }}
        />
      ) : view === "empty" ? (
        <Trial />
      ) : (
        <BillingReady />
      )}
      </Scope>
    </AppLayout>
  );
}

function Title({ eyebrow }) {
  const mobile = useIsMobile();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="tt-eyebrow">{eyebrow}</div>
      <h2 className="tt-page-title" style={{ fontSize: mobile ? 32 : 40 }}>
        Thanh toán
      </h2>
    </div>
  );
}

const box = (pad = "18px 20px", gap = 8, r = 14) => ({
  background: "#fff",
  border: "1px solid var(--bn-hairline)",
  borderRadius: r,
  padding: pad,
  display: "flex",
  flexDirection: "column",
  gap,
});

function BillingReady() {
  const state = useStore();
  const mobile = useIsMobile();
  const { plan, invoice, history, bank } = state.billing;
  const m = state.minutes;
  const [info, saveInfo] = useBillingInfo(state.billing.info);
  const [edit, setEdit] = useState(false);
  const { lines, total } = invoiceLines(invoice, plan);
  const over = Math.max(0, m.used - m.included);
  const paid = invoice.status === "paid";

  const left = (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
      <Title eyebrow={`Thanh toán · ${m.monthLabel}/2026`} />
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        <div style={box()}>
          <Eyebrow size={10}>Gói</Eyebrow>
          <div style={{ ...serif, fontSize: 30 }}>
            {vnd(plan.price)}
            <span style={{ fontSize: 16, color: "var(--bn-muted)" }}>/tháng</span>
          </div>
          <div style={{ fontSize: 13.5, color: "var(--bn-ink-2)", lineHeight: 1.55 }}>{plan.note}</div>
        </div>
        <div style={box("18px 20px", 10)}>
          <Eyebrow size={10}>Phút tháng này · {m.periodLabel}</Eyebrow>
          <div style={{ ...mono, fontSize: 30 }}>
            {decimal(m.used)} <span style={{ fontSize: 16, color: "var(--bn-muted)" }}>/ {m.included} phút</span>
          </div>
          <div
            role="meter"
            aria-label="Phút đã dùng tháng này"
            aria-valuemin={0}
            aria-valuemax={m.included}
            aria-valuenow={m.used}
            style={{ height: 6, borderRadius: 3, background: "var(--bn-skeleton-2)", overflow: "hidden" }}
          >
            <div style={{ width: percent(m.used, m.included), height: "100%", background: "var(--bn-clay)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", fontSize: 13, color: "var(--bn-ink-2)" }}>
            <span>Phút vượt: {decimal(over)}</span>
            <span>
              Báo khi tới {m.alertAt} phút ({Math.round((m.alertAt / m.included) * 100)}%)
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <Eyebrow size={10}>
            Hóa đơn tháng {invoice.month} · hạn {invoice.due}
          </Eyebrow>
          <span
            style={{
              ...mono,
              fontSize: 9.5,
              letterSpacing: "0.1em",
              padding: "4px 8px",
              borderRadius: 10,
              border: `1px solid ${paid ? "var(--bn-hairline)" : "var(--bn-clay)"}`,
              color: paid ? "var(--bn-muted)" : "var(--bn-clay)",
              whiteSpace: "nowrap",
            }}
          >
            {paid ? "✓ ĐÃ THANH TOÁN" : "CHƯA THANH TOÁN"}
          </span>
        </div>
        <div style={{ background: "#fff", border: "1px solid var(--bn-hairline)", borderRadius: 12 }}>
          {lines.map((l, i) => (
            <div
              key={l.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                minHeight: 48,
                alignItems: "center",
                padding: "0 16px",
                fontSize: 14.5,
                borderTop: i ? "1px solid var(--bn-hairline-2)" : 0,
              }}
            >
              <span>{l.label}</span>
              <span style={{ ...mono, flex: "none" }}>{vnd(l.amount)}</span>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              minHeight: 56,
              alignItems: "center",
              padding: "0 16px",
              fontSize: 16,
              fontWeight: 600,
              borderTop: "1px solid var(--bn-hairline)",
              background: "var(--bn-cream-3)",
            }}
          >
            <span>Tổng</span>
            <span style={{ ...mono, fontSize: 18 }}>{vnd(total)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Eyebrow size={10}>Xuất hóa đơn</Eyebrow>
            <Button variant="link" onClick={() => setEdit(true)} style={{ fontSize: 13, lineHeight: "normal" }} aria-label="Sửa thông tin xuất hóa đơn">
              Sửa
            </Button>
          </div>
          <div style={{ ...box("12px 16px", 0, 12), display: "block", fontSize: 13.5, lineHeight: 1.65, color: "var(--bn-ink-2)" }}>
            <span style={{ color: "var(--bn-ink)", fontWeight: 600 }}>{info.company}</span>
            <br />
            MST {info.taxId} · {info.address}
            <br />
            {info.email}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Eyebrow size={10}>Lịch sử thanh toán</Eyebrow>
          <div style={{ ...box("4px 16px", 0, 12) }}>
            {history.map((h, i) => (
              <div
                key={h.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "9px 0",
                  fontSize: 13.5,
                  borderTop: i ? "1px solid var(--bn-hairline-3)" : 0,
                }}
              >
                <span>{h.label}</span>
                <span style={mono}>
                  {vnd(h.amount)}
                  {h.paid ? " ✓" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BillingInfoSheet open={edit} onClose={() => setEdit(false)} info={info} onSave={saveInfo} />
    </div>
  );

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: mobile ? "20px 16px 24px" : "32px 40px",
        display: "grid",
        gridTemplateColumns: mobile ? "minmax(0,1fr)" : "minmax(0,1fr) 400px",
        alignContent: "start",
        gap: mobile ? 22 : 28,
      }}
    >
      {left}
      {!paid && <VietQrCard amount={total} bank={bank} />}
    </div>
  );
}

/** 3.7 B: on trial, no invoice yet. */
function Trial() {
  const state = useStore();
  const mobile = useIsMobile();
  const { trial, plan } = state.billing;
  const [info, saveInfo] = useBillingInfo(null);
  const [edit, setEdit] = useState(false);
  return (
    <div style={{ padding: mobile ? "20px 16px 24px" : "32px 40px", display: "flex", flexDirection: "column", gap: 18, maxWidth: 900 }}>
      <Title eyebrow="Thanh toán" />
      <div
        style={{
          ...box(mobile ? "18px 20px" : "22px 24px", 6),
          flexDirection: mobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: mobile ? "flex-start" : "center",
          gap: mobile ? 10 : 6,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ ...serif, fontSize: 30 }}>Còn {trial.daysLeft} ngày dùng thử</span>
          <span style={{ fontSize: 14, color: "var(--bn-ink-2)" }}>
            Hết hạn {trial.endsOn}. Sau đó {vnd(plan.price)}/tháng, chưa gồm VAT, gồm {plan.includedMinutes} phút.
          </span>
        </div>
        <span style={{ ...mono, fontSize: 13, color: "var(--bn-ink-2)", whiteSpace: "nowrap" }}>{decimal(trial.minutesUsed)} phút đã dùng</span>
      </div>
      <div
        style={{
          border: "1px dashed var(--bn-dashed)",
          borderRadius: 14,
          padding: mobile ? 24 : 40,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ ...serif, fontSize: 24 }}>Chưa có hóa đơn nào.</div>
        <div style={{ fontSize: 14.5, color: "var(--bn-ink-2)", lineHeight: 1.6, maxWidth: 520 }}>
          Hóa đơn đầu tiên tạo ngày {trial.firstInvoiceOn}, kèm mã VietQR. Điền thông tin xuất hóa đơn trước để hóa đơn ghi đúng tên công ty.
        </div>
        {info ? (
          <div style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--bn-ink-2)" }}>
            <span style={{ color: "var(--bn-ok)" }}>✓ </span>
            {info.company} · MST {info.taxId} ·{" "}
            <Button variant="link" onClick={() => setEdit(true)} style={{ fontSize: 13.5 }}>
              Sửa
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setEdit(true)} style={{ alignSelf: "flex-start" }}>
            Điền thông tin xuất hóa đơn
          </Button>
        )}
      </div>
      <BillingInfoSheet
        open={edit}
        onClose={() => setEdit(false)}
        info={info || { company: "", taxId: "", address: "", email: "" }}
        onSave={saveInfo}
      />
    </div>
  );
}

/** 3.7 C */
function BillingLoading() {
  const mobile = useIsMobile();
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải"
      style={{
        flex: 1,
        padding: mobile ? "20px 16px" : "32px 40px",
        display: "grid",
        gridTemplateColumns: mobile ? "1fr" : "minmax(0,1fr) 400px",
        alignContent: "start",
        gap: 28,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Block w={200} h={12} r={3} bg="var(--bn-skeleton-2)" />
        <Block w={240} h={36} r={4} bg="var(--bn-skeleton-2)" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Block h={130} />
          <Block h={130} />
        </div>
        <Block h={220} r={12} />
      </div>
      <Block h={mobile ? 300 : 520} r={16} />
    </div>
  );
}
