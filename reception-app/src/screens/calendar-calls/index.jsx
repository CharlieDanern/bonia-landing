import React from "react";
import { AppLayout, CallList, Page, PageHeader } from "../../components/shell/index.js";
import { useScreenState } from "../../lib/hooks.js";

// STUB — replaced by the calendar-calls screen agent.
// Owns: /lich (3.4 A–G), /cuoc-goi/:id? (3.5 A–F).
// Frames: src/frames/calendar-calls.js. Data: src/data/calendar.js, calls.js.

export function Calendar() {
  return (
    <AppLayout active="lich-phong">
      <Page padding="32px 36px">
        <PageHeader title="Lịch phòng" />
      </Page>
    </AppLayout>
  );
}

export function Calls({ id }) {
  const { state } = useScreenState();
  const mode = state === "loading" ? "loading" : state === "empty" ? "empty" : "all";
  return (
    <AppLayout active="cuoc-goi" mainStyle={{ flexDirection: "row", overflow: "hidden" }}>
      <CallList selectedId={id} mode={mode} />
      <div style={{ flex: 1, minWidth: 0, background: "#fff" }} />
    </AppLayout>
  );
}
