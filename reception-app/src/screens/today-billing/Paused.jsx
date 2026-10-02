import React from "react";
import { AppLayout } from "../../components/shell/index.js";
import { useStore } from "../../store/index.jsx";
import { useIsMobile } from "../../lib/hooks.js";
import { SUSPENSION } from "../../data/billing.js";
import { invoiceLines } from "./invoice.js";
import { serif, Eyebrow, Scope, VietQrCard, DialCode } from "./parts.jsx";

// Đã tạm dừng (3.8 B): the only screen while suspended. Callers must never
// fall through to the personal Bonia assistant, so the first job is to turn
// call forwarding off; paying turns Bonia back on with every setting kept.

export function Paused() {
  const state = useStore();
  const mobile = useIsMobile();
  const { invoice, plan, bank } = state.billing;
  const { total } = invoiceLines(invoice, plan);
  const s = SUSPENSION;
  return (
    <AppLayout active="none" status="paused" counts={{}}>
      <Scope>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: mobile ? "20px 16px 24px" : "48px 64px",
          display: "grid",
          gridTemplateColumns: mobile ? "minmax(0,1fr)" : "minmax(0,1fr) 380px",
          alignContent: "start",
          gap: mobile ? 24 : 40,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 22, minWidth: 0 }}>
          <Eyebrow size={11} color="var(--bn-urgent)">
            Đã tạm dừng từ {s.since}
          </Eyebrow>
          <h2 className="tt-page-title" style={{ fontSize: mobile ? 30 : 40, lineHeight: 1.15 }}>
            Bonia Tiếp tân đã tạm dừng vì chưa thanh toán. Cuộc gọi hiện không được chuyển tới Bonia.
          </h2>
          <div
            style={{
              background: "#fff",
              border: "2px solid var(--bn-clay)",
              borderRadius: 14,
              padding: mobile ? "18px 16px" : "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600 }}>Làm ngay: tắt chuyển cuộc gọi</div>
            <div style={{ fontSize: 14, color: "var(--bn-ink-2)", lineHeight: 1.55 }}>
              Để khách gọi đổ thẳng về máy quầy {state.hotel.phone}. Bấm mã trên điện thoại quầy ({s.carrier}).
            </div>
            <DialCode code={s.cancelCode} action="Bấm để tắt" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 14.5, color: "var(--bn-ink-2)", lineHeight: 1.6 }}>
            <span>Trả xong thì Bonia bật lại ngay, mọi cài đặt còn nguyên. Nhớ bấm lại mã chuyển cuộc gọi.</span>
            <span style={{ fontWeight: 600, color: "var(--bn-ink)" }}>Cài đặt của bạn được giữ {s.keepDays} ngày.</span>
          </div>
        </div>
        <VietQrCard compact amount={total} bank={bank} />
      </div>
      </Scope>
    </AppLayout>
  );
}
