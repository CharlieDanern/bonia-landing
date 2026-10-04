import React, { useState } from "react";
import { RequestDetail } from "../components/Request.jsx";
import { DAYS, title as titleOf } from "../data/sample.js";
import { DeskHeader, PhoneTabs, useLayout } from "../layout.jsx";
import { useApp } from "../state.jsx";

// Lịch sử (handoff 13): every call and request, grouped by day; search by
// number or name (accents ignored); filters; a row opens the same detail.

const MONO = "'JetBrains Mono', monospace";
const SERIF = "'Source Serif 4', Georgia, serif";
const EASE = "cubic-bezier(.2,.8,.2,1)";

const fold = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s/g, "");

const FILTERS = [["all", "Tất cả"], ["open", "Cần xử lý"], ["done", "Đã xử lý"], ["auto", "Bonia tự xong"], ["urgent", "Gấp"]];
const TEST = { all: () => true, open: (r) => r.status === "open", done: (r) => r.status === "done", auto: (r) => r.status === "auto", urgent: (r) => r.urgent };

function statusOf(r) {
  if (r.status === "open") return ["Cần xử lý", "Cần xử lý", "#7B4A2D"];
  if (r.status === "auto") return ["✓ Bonia tự xong", "✓ Bonia", "#4A6B3A"];
  return [`✓ Đã xử lý · ${r.doneBy}`, "✓ Đã xử lý", "#4A6B3A"];
}

export function History() {
  const app = useApp();
  const { phone, device } = useLayout();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);
  const base = app.reqs.filter((r) => !q || fold(titleOf(r) + r.number).includes(fold(q)));
  const list = base.filter(TEST[filter]);
  const groups = DAYS.map((day, i) => ({ day, rows: list.filter((r) => r.day === i).sort((a, b) => b.at.localeCompare(a.at)) })).filter((g) => g.rows.length);
  const or = app.reqs.find((r) => r.id === openId) || null;
  const detail = (radius) => (
    <RequestDetail
      r={or}
      when={or ? `${DAYS[or.day]} ${or.at}` : ""}
      radius={radius}
      copied={or && app.copied === or.id}
      onClose={() => setOpenId(null)}
      onCopy={() => or && app.copy(or)}
      onDone={() => or && app.markDone(or.id, device)}
    />
  );
  const filterBtns = (h, fs) =>
    FILTERS.map(([k, l]) => {
      const on = filter === k;
      const n = base.filter(TEST[k]).length;
      return (
        <button key={k} type="button" onClick={() => setFilter(k)} style={{ height: h, padding: "0 14px", borderRadius: h / 2, border: `1px solid ${on ? "#1F1B16" : "#D9D0BF"}`, background: on ? "#1F1B16" : "#fff", color: on ? "#F7F3EC" : k === "urgent" ? "#A0412D" : "#1F1B16", fontSize: fs, whiteSpace: "nowrap", flex: "none" }}>
          {l}
          {!phone && <span style={{ fontFamily: MONO, fontSize: 11, opacity: 0.8 }}> {n}</span>}
        </button>
      );
    });
  const empty = !groups.length && <div style={{ padding: phone ? "12px 2px" : "24px 4px", fontSize: 14, color: "#6E6255" }}>Không có cuộc gọi nào.</div>;

  if (phone) {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: "var(--tt-top)", bottom: "calc(57px + var(--tt-bot))", overflow: "auto" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "6px 16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={{ fontFamily: SERIF, fontSize: 28 }}>Lịch sử</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm số điện thoại hoặc tên" style={{ height: 46, width: "100%", border: "1px solid #D9D0BF", borderRadius: 23, padding: "0 18px", fontSize: 15, background: "#fff", color: "#1F1B16", flex: "none" }} />
            <div className="tt-scroll-x" style={{ display: "flex", gap: 6, margin: "0 -16px", padding: "0 16px", flex: "none" }}>{filterBtns(44, 14)}</div>
            {empty}
            {groups.map((g) => (
              <div key={g.day} style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.18em", color: "#6E6255", textTransform: "uppercase", padding: "4px 2px 6px" }}>{g.day}</span>
                {g.rows.map((r) => {
                  const s = statusOf(r);
                  return (
                    <div key={r.id} role="button" tabIndex={0} onClick={() => setOpenId(r.id)} onKeyDown={(e) => { if (e.key === "Enter") setOpenId(r.id); }} style={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr)", gap: 10, minHeight: 60, padding: "10px 4px", borderTop: "1px solid #E4DCCB", cursor: "pointer" }}>
                      <span style={{ fontFamily: MONO, fontSize: 12, color: "#6E6255", paddingTop: 2 }}>{r.at}</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{titleOf(r)}</span>
                          <span style={{ fontSize: 12, color: s[2], whiteSpace: "nowrap" }}>{s[1]}</span>
                        </div>
                        <span style={{ fontSize: 13, color: "#4A4239", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(r.urgent ? "Gấp · " : "") + r.type} · {(r.fields[0] || ["", ""])[1]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <PhoneTabs active={1} />
        <div style={{ position: "absolute", left: 0, right: 0, top: "calc(var(--tt-top) + 7px)", bottom: 0, transform: or ? "none" : "translateY(105%)", transition: `transform 450ms ${EASE}`, zIndex: 6, boxShadow: "0 -8px 28px rgba(31,27,22,0.14)", borderRadius: "20px 20px 0 0", pointerEvents: or ? "auto" : "none" }}>
          {detail("20px 20px 0 0")}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
      <DeskHeader active={1} />
      <div style={{ position: "absolute", left: 40, top: 88, width: "min(860px, calc(100% - 580px))", bottom: 0, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm số điện thoại hoặc tên" style={{ height: 44, width: 320, border: "1px solid #D9D0BF", borderRadius: 22, padding: "0 18px", fontSize: 14, background: "#fff", color: "#1F1B16" }} />
          {filterBtns(38, 13.5)}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", display: "flex", flexDirection: "column", gap: 18, paddingBottom: 28 }}>
          {empty}
          {groups.map((g) => (
            <div key={g.day} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0 8px 6px" }}>
                <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.18em", color: "#6E6255", textTransform: "uppercase" }}>{g.day}</span>
                <span style={{ fontFamily: MONO, fontSize: 10.5, color: "#6E6255" }}>{g.rows.length} CUỘC</span>
              </div>
              {g.rows.map((r) => {
                const s = statusOf(r);
                const t = titleOf(r);
                const sel = openId === r.id;
                return (
                  <div key={r.id} role="button" tabIndex={0} onClick={() => setOpenId(r.id)} onKeyDown={(e) => { if (e.key === "Enter") setOpenId(r.id); }} className="h-white" style={{ display: "grid", gridTemplateColumns: "52px minmax(0,1.1fr) 140px minmax(0,1.6fr) 150px", gap: 14, alignItems: "center", minHeight: 56, padding: "8px 12px", borderTop: "1px solid #E4DCCB", borderRadius: 8, background: sel ? "#FFFFFF" : "transparent", boxShadow: `inset 0 0 0 1px ${sel ? "#7B4A2D" : "transparent"}`, cursor: "pointer" }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, color: "#6E6255" }}>{r.at}</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t}</span>
                      <span style={{ fontFamily: MONO, fontSize: 11.5, color: "#6E6255" }}>{t === r.number ? "" : r.number}</span>
                    </div>
                    <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      {r.urgent && <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", padding: "3px 6px", borderRadius: 8, background: "#F6E7E1", color: "#A0412D" }}>GẤP</span>}
                      <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.1em", padding: "3px 6px", borderRadius: 8, border: "1px solid #D9D0BF", color: "#4A4239", textTransform: "uppercase", whiteSpace: "nowrap" }}>{r.type}</span>
                    </span>
                    <span style={{ fontSize: 13.5, color: "#4A4239", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.fields.map((f) => f[1]).join(" · ")}</span>
                    <span style={{ fontSize: 12.5, color: s[2], textAlign: "right", whiteSpace: "nowrap" }}>{s[0]}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", right: 40, top: 88, width: 460, bottom: 24, opacity: or ? 1 : 0, transform: or ? "none" : "translateX(40px)", pointerEvents: or ? "auto" : "none", transition: `transform 450ms ${EASE}, opacity 300ms ease` }}>
        {detail(18)}
      </div>
    </div>
  );
}
