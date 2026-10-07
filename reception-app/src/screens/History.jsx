import React, { useState } from "react";
import { RequestDetail } from "../components/Request.jsx";
import { DAYS, title as titleOf } from "../data/sample.js";
import { DeskHeader, PhoneTabs, useLayout } from "../layout.jsx";
import { useApp } from "../state.jsx";
import { EASE, MONO, SERIF, dims } from "../ui.js";

// Lịch sử (handoff 13, full width per the founder 2026-10-04): every call and
// request grouped by day; search by number or name (accents ignored);
// filters; a row opens the request panel over the right side of the list.

const fold = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s/g, "");

const FILTERS = [["all", "Tất cả"], ["open", "Cần xử lý"], ["done", "Đã xử lý"], ["auto", "Bonia tự xong"], ["urgent", "Gấp"]];
const TEST = { all: () => true, open: (r) => r.status === "open", done: (r) => r.status === "done", auto: (r) => r.status === "auto", urgent: (r) => r.urgent };

function statusOf(r) {
  if (r.status === "open") return ["Cần xử lý", "Cần xử lý", "#7B4A2D"];
  if (r.status === "auto") return ["✓ Bonia tự xong", "✓ Bonia", "#4A6B3A"];
  return [`✓ Đã xử lý · ${r.doneBy}`, "✓ Đã xử lý", "#4A6B3A"];
}

const pill = { fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.1em", padding: "2px 6px", borderRadius: 8, whiteSpace: "nowrap" };

export function History() {
  const app = useApp();
  const { phone, device } = useLayout();
  const d = dims(phone);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);
  // a real account lists every call (founder 2026-10-07); the demo lists its requests
  const source = app.histRows || app.reqs;
  const base = source.filter((r) => !q || fold(titleOf(r) + r.number + r.summary).includes(fold(q)));
  const list = base.filter(TEST[filter]);
  const days = app.days || DAYS;
  const groups = days.map((day, i) => ({ day, rows: list.filter((r) => r.day === i).sort((a, b) => b.at.localeCompare(a.at)) })).filter((g) => g.rows.length);
  const or = source.find((r) => r.id === openId) || null;
  const detail = (radius) => (
    <RequestDetail
      r={or}
      when={or ? `${days[or.day]} ${or.at}` : ""}
      radius={radius}
      copied={or && app.copied === or.id}
      onClose={() => setOpenId(null)}
      onCopy={() => or && app.copy(or)}
      onDone={() => or && app.markDone(or.id, device)}
    />
  );
  const search = (
    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm số điện thoại, tên hoặc nội dung" style={{ height: d.input, width: phone ? "100%" : 300, border: "1px solid #D9D0BF", borderRadius: d.input / 2, padding: "0 16px", fontSize: d.fs.body, background: "#fff", color: "#1F1B16", flex: "none" }} />
  );
  const filterBtns = FILTERS.map(([k, l]) => {
    const on = filter === k;
    const n = base.filter(TEST[k]).length;
    return (
      <button key={k} type="button" onClick={() => setFilter(k)} style={{ height: d.chip, padding: "0 12px", borderRadius: d.chip / 2, border: `1px solid ${on ? "#1F1B16" : "#D9D0BF"}`, background: on ? "#1F1B16" : "#fff", color: on ? "#F7F3EC" : k === "urgent" ? "#A0412D" : "#1F1B16", fontSize: d.fs.small, whiteSpace: "nowrap", flex: "none" }}>
        {l}
        {!phone && <span style={{ fontFamily: MONO, fontSize: 10, opacity: 0.75 }}> {n}</span>}
      </button>
    );
  });
  const empty = !groups.length && <div style={{ padding: "16px 4px", fontSize: d.fs.body, color: "#6E6255" }}>Không có cuộc gọi nào.</div>;
  const dayHead = (g) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: phone ? "4px 2px 6px" : "0 10px 6px" }}>
      <span style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.18em", color: "#6E6255", textTransform: "uppercase" }}>{g.day}</span>
      {!phone && <span style={{ fontFamily: MONO, fontSize: 9.5, color: "#6E6255" }}>{g.rows.length} CUỘC</span>}
    </div>
  );

  if (phone) {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: "var(--tt-top)", bottom: "calc(57px + var(--tt-bot))", overflow: "auto" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "8px 16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontFamily: SERIF, fontSize: d.fs.h1 }}>Lịch sử</span>
            {search}
            <div className="tt-scroll-x" style={{ display: "flex", gap: 6, margin: "0 -16px", padding: "0 16px", flex: "none" }}>{filterBtns}</div>
            {empty}
            {groups.map((g) => (
              <div key={g.day} style={{ display: "flex", flexDirection: "column" }}>
                {dayHead(g)}
                {g.rows.map((r) => {
                  const s = statusOf(r);
                  return (
                    <div key={r.id} role="button" tabIndex={0} onClick={() => setOpenId(r.id)} onKeyDown={(e) => { if (e.key === "Enter") setOpenId(r.id); }} style={{ display: "grid", gridTemplateColumns: "40px minmax(0,1fr)", gap: 8, padding: "9px 2px", borderTop: "1px solid #E4DCCB", cursor: "pointer" }}>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: "#6E6255", paddingTop: 2 }}>{r.at}</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{titleOf(r)}</span>
                          <span style={{ fontSize: 11, color: s[2], whiteSpace: "nowrap" }}>{s[1]}</span>
                        </div>
                        <span style={{ fontSize: 12, color: "#4A4239", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(r.urgent ? "Gấp · " : "") + r.type} · {r.summary}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <PhoneTabs active={1} />
        <div style={{ position: "absolute", left: 0, right: 0, top: "calc(var(--tt-top) + 7px)", bottom: 0, transform: or ? "none" : "translateY(105%)", transition: `transform 450ms ${EASE}`, zIndex: 6, boxShadow: "0 -8px 28px rgba(31,27,22,0.14)", borderRadius: "18px 18px 0 0", pointerEvents: or ? "auto" : "none" }}>
          {detail("18px 18px 0 0")}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
      <DeskHeader active={1} />
      <div style={{ position: "absolute", left: 48, right: 48, top: 56 + 28, bottom: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: SERIF, fontSize: d.fs.h1, marginRight: 14 }}>Lịch sử</span>
          {search}
          {filterBtns}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column", gap: 16, paddingBottom: 28 }}>
          {empty}
          {groups.map((g) => (
            <div key={g.day} style={{ display: "flex", flexDirection: "column" }}>
              {dayHead(g)}
              {g.rows.map((r) => {
                const s = statusOf(r);
                const t = titleOf(r);
                const sel = openId === r.id;
                return (
                  <div key={r.id} role="button" tabIndex={0} onClick={() => setOpenId(r.id)} onKeyDown={(e) => { if (e.key === "Enter") setOpenId(r.id); }} className="h-white" style={{ display: "grid", gridTemplateColumns: "48px minmax(150px,0.9fr) 150px minmax(0,3fr) 190px", gap: 16, alignItems: "center", minHeight: 44, padding: "6px 10px", borderTop: "1px solid #E4DCCB", borderRadius: 6, background: sel ? "#FFFFFF" : "transparent", boxShadow: `inset 0 0 0 1px ${sel ? "#7B4A2D" : "transparent"}`, cursor: "pointer" }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: "#6E6255" }}>{r.at}</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t}</span>
                      {t !== r.number && <span style={{ fontFamily: MONO, fontSize: 10.5, color: "#6E6255" }}>{r.number}</span>}
                    </div>
                    <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      {r.urgent && <span style={{ ...pill, background: "#F6E7E1", color: "#A0412D" }}>GẤP</span>}
                      <span style={{ ...pill, border: "1px solid #D9D0BF", color: "#4A4239", textTransform: "uppercase" }}>{r.type}</span>
                    </span>
                    <span style={{ fontSize: 12.5, color: "#4A4239", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.summary}</span>
                    <span style={{ fontSize: 11.5, color: s[2], textAlign: "right", whiteSpace: "nowrap" }}>{s[0]}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", right: 48, top: 56 + 28, width: 420, bottom: 28, opacity: or ? 1 : 0, transform: or ? "none" : "translateX(40px)", pointerEvents: or ? "auto" : "none", transition: `transform 450ms ${EASE}, opacity 300ms ease`, boxShadow: or ? "0 12px 40px rgba(31,27,22,0.16)" : "none", borderRadius: 14, zIndex: 4 }}>
        {detail(14)}
      </div>
    </div>
  );
}
