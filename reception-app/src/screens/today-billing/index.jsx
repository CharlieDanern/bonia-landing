import React from "react";
import { AppLayout, Page, PageHeader } from "../../components/shell/index.js";
import { DEMO_LABEL } from "../../lib/clock.js";
import { useScreenState } from "../../lib/hooks.js";

// STUB — replaced by the today-billing screen agent.
// Owns: /hom-nay (3.2 A–E, 3.8 A), /thanh-toan (3.7 A–D), /tam-dung (3.8 B).
// Frames: src/frames/today-billing.js. Data: src/data/hotel.js, billing.js.

export function Today() {
  const { state } = useScreenState();
  return (
    <AppLayout active="hom-nay">
      <Page>
        <PageHeader eyebrow={DEMO_LABEL} title="Hôm nay" />
        <div data-state={state} />
      </Page>
    </AppLayout>
  );
}

export function Billing() {
  return (
    <AppLayout active="none">
      <Page>
        <PageHeader eyebrow="Thanh toán · Tháng 10/2026" title="Thanh toán" />
      </Page>
    </AppLayout>
  );
}

export function Paused() {
  return (
    <AppLayout active="none" status="paused" counts={{}}>
      <Page>
        <PageHeader title="Đã tạm dừng" />
      </Page>
    </AppLayout>
  );
}
