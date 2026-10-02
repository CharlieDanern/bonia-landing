import React from "react";
import { AppLayout, RequestList } from "../../components/shell/index.js";
import { useScreenState } from "../../lib/hooks.js";

// STUB — replaced by the requests screen agent.
// Owns: /yeu-cau/:id? (3.3 A–L). Frames: src/frames/requests.js.
// Data: src/data/requests.js (+ store actions confirmRequest, markMessaged…).

export function Requests({ id }) {
  const { state } = useScreenState();
  const mode = state === "loading" ? "loading" : state === "empty" ? "empty" : "all";
  return (
    <AppLayout active="yeu-cau" mainStyle={{ flexDirection: "row", overflow: "hidden" }}>
      <RequestList selectedId={id} mode={mode} />
      <div style={{ flex: 1, minWidth: 0, background: "#fff" }} />
    </AppLayout>
  );
}
