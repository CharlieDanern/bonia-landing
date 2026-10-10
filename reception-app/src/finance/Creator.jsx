import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useLayout } from "../layout.jsx";
import { MONO, SERIF } from "../ui.js";
import { financeApi } from "./api.js";
import { FinHeader, FinPhoneTabs, useCompany } from "./common.jsx";
import {
  CONCURRENCY, Choice, DAYS, GAP_LABEL, PLAN_MAX, Toggle, checkRows, dayMinutes, daysLabel, estimate, fmt, holidayDates, readSheet, retryLabel,
  spaced, windowsLabel,
} from "./outbound-common.jsx";

// Tạo chiến dịch gọi (handoff 16 "Tao Chien Dich", AI-first): 1 Chuẩn bị danh sách (three rules, an example
// sheet), 2 Tải lên và kiểm tra (the browser reads the file; the model says what each column means; every number is
// checked; "Được nhắc tới" decides what Bonia may say; the model writes row 1's opening line), 3 Cách gọi,
// 4 Xem lại và bắt đầu (Gọi thử, Lưu nháp, Bắt đầu gọi). The summary card on the right carries the estimate.

const MAX_ROWS = 20_000;
const SAMPLE = [
  ["Số ĐT", "Họ tên", "Xưng hô", "Ngày sinh", "Thu nhập/tháng", "Đã vay trước?", "Máy quan tâm", "Cửa hàng ghé", "Ghi chú tư vấn"],
  ["0900 000 181", "Trần Thảo Vy", "chị", "14/03/1994", "18 triệu", "Có · 2024", "iPhone 17", "Quận 10 · 05/10", "Hỏi trả trước 20%"],
  ["0900 000 182", "Lê Văn Đạt", "anh", "02/11/1988", "25 triệu", "Không", "Galaxy S26", "Thủ Đức · 06/10", ""],
  ["0900 000 183", "Phạm Hà My", "em", "21/07/1999", "", "Không", "iPhone 17 Pro", "Quận 7 · 07/10", "Muốn góp 12 tháng"],
];
const DEFAULTS = {
  script: "default", caller: "bonia", concurrency: 20, days: [1, 2, 3, 4, 5, 6], skip_holidays: true, windows: [["08:30", "11:30"], ["13:30", "17:00"]],
  retries: 1, retry_gap: "2h", callback_mode: "manager", order: "file", start: "now", start_at: "",
};
const STEPS = [["Chuẩn bị danh sách"], ["Tải lên và kiểm tra"], ["Cách gọi"], ["Xem lại và bắt đầu"]];
const STAGES = { reading: [8, "Đang đọc file…"], understanding: [45, "Bonia đang hiểu ý nghĩa từng cột…"], checking: [80, "Đang kiểm tra từng số…"], done: [100, ""] };

async function saveSheet(rows, name) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), "Danh sách");
  XLSX.writeFile(wb, name);
}
const baseName = (f) => f.replace(/\.(xlsx|xls|csv)$/i, "").replace(/[-_]+/g, " ").trim();

export function FinanceCreate() {
  const { phone } = useLayout();
  const [, go] = useLocation();
  const { short } = useCompany();
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [sheet, setSheet] = useState(null); // { file, headers, rows }
  const [stage, setStage] = useState("idle"); // idle · reading · understanding · checking · done · error
  const [err, setErr] = useState("");
  const [columns, setColumns] = useState([]);
  const [blocked, setBlocked] = useState({ dnc: new Set(), recent: new Set() });
  const [recentMode, setRecentMode] = useState("skip");
  const [opening, setOpening] = useState({ text: "", busy: false });
  const [badOpen, setBadOpen] = useState(false);
  const [s, setS] = useState(DEFAULTS);
  const [name, setName] = useState("");
  const [testNum, setTestNum] = useState("");
  const [test, setTest] = useState({ state: "idle", msg: "" });
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);
  const [drag, setDrag] = useState(false);
  const fileInput = useRef(null);
  const main = useRef(null);

  const phoneCol = columns.find((c) => c.kind === "phone")?.name || "";
  const check = useMemo(() => (sheet && phoneCol ? checkRows(sheet.rows, phoneCol) : null), [sheet, phoneCol]);
  const dncN = check ? check.good.filter((g) => blocked.dnc.has(g.phone)).length : 0;
  const recentN = check ? check.good.filter((g) => blocked.recent.has(g.phone) && !blocked.dnc.has(g.phone)).length : 0;
  const N = check ? Math.min(MAX_ROWS, check.good.length - dncN - (recentMode === "skip" ? recentN : 0)) : 0;
  const ready = stage === "done" && !!phoneCol && N > 0;
  const est = estimate(N, s);
  const hours = dayMinutes(s.windows) / 60;
  const okWindows = s.windows.length > 0 && s.windows.every(([a, z]) => /^\d{2}:\d{2}$/.test(a) && /^\d{2}:\d{2}$/.test(z) && a < z);
  const okStart = s.start === "now" || (s.start_at && Date.parse(s.start_at) > Date.now());

  const goStep = (n) => { setStep(n); setMaxStep((m) => Math.max(m, n)); if (main.current) main.current.scrollTop = 0; };

  /** Read the file, ask what the columns mean, check every number. */
  const take = async (file) => {
    setErr(""); setStage("reading"); setSheet(null); setColumns([]); setOpening({ text: "", busy: false }); setBadOpen(false);
    try {
      const { headers, rows } = await readSheet(file);
      if (!headers.length || !rows.length) throw new Error("Không thấy dòng nào. Dòng đầu là tên cột, mỗi dòng sau là một khách.");
      if (rows.length > MAX_ROWS) throw new Error(`File có ${fmt(rows.length)} dòng; mỗi chiến dịch tối đa ${fmt(MAX_ROWS)} dòng.`);
      setSheet({ file: file.name, headers, rows });
      setStage("understanding");
      const u = await financeApi.understand(headers, rows.slice(0, 3));
      setColumns(u.columns);
      setStage("checking");
      const pc = u.columns.find((c) => c.kind === "phone")?.name;
      if (pc) {
        const good = checkRows(rows, pc).good.map((g) => g.phone);
        const b = await financeApi.check(good);
        setBlocked({ dnc: new Set(b.dnc), recent: new Set(b.recent) });
      }
      setStage("done");
      if (!name) setName(baseName(file.name));
    } catch (e) {
      setStage("error");
      setErr(e?.message || (e?.status === 0 ? "Không kết nối được. Thử lại." : "Không đọc được file. Thử lại."));
    }
  };

  // "Ví dụ: Bonia mở đầu cuộc gọi với dòng 1": written again when a switch changes
  const mentionKey = columns.map((c) => `${c.name}:${c.mention ? 1 : 0}`).join("|");
  useEffect(() => {
    if (stage !== "done" || !sheet?.rows?.[0] || !columns.length) return undefined;
    let live = true;
    setOpening((o) => ({ ...o, busy: true }));
    const t = setTimeout(() => {
      financeApi.opening(columns, sheet.rows[0]).then((r) => { if (live) setOpening({ text: r.text, busy: false }); }).catch(() => { if (live) setOpening({ text: "", busy: false }); });
    }, 600);
    return () => { live = false; clearTimeout(t); };
  }, [stage, mentionKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const setMention = (nm, on) => setColumns((cs) => cs.map((c) => (c.name === nm ? { ...c, mention: on } : c)));
  const setPhoneCol = (nm) => {
    setColumns((cs) => cs.map((c) => (c.name === nm ? { ...c, kind: "phone", mention: false, meaning: c.meaning || "Số điện thoại để gọi" } : c.kind === "phone" ? { ...c, kind: "other" } : c)));
    if (sheet) {
      const good = checkRows(sheet.rows, nm).good.map((g) => g.phone);
      financeApi.check(good).then((b) => setBlocked({ dnc: new Set(b.dnc), recent: new Set(b.recent) })).catch(() => {});
    }
  };

  const settings = () => ({
    ...s, start_at: s.start === "scheduled" && s.start_at ? new Date(s.start_at).toISOString() : null, call_recent: recentMode === "keep",
    holiday_dates: holidayDates(),
  });
  const save = async (start) => {
    setSaving(true);
    try {
      const r = await financeApi.create({
        name: name.trim() || baseName(sheet.file), source: { file: sheet.file, rows_in_file: sheet.rows.length }, columns, rows: sheet.rows, settings: settings(), start,
      });
      setCreated({ campaign: r.campaign, start });
      if (!start) go(`/goi-ra/${r.campaign.id}`);
    } catch (e) {
      setErr(e?.error === "no_rows" ? "Không còn số nào để gọi sau khi bỏ số sai, số trùng và số không gọi." : "Không lưu được chiến dịch. Thử lại.");
    }
    setSaving(false);
  };
  const testCall = async () => {
    setTest({ state: "calling", msg: "" });
    try {
      await financeApi.testCall({ phone: testNum, columns, row: sheet.rows[0], note: "" });
      setTest({ state: "done", msg: `Hãy nghe máy, Bonia đang gọi tới ${spaced(testNum)}` });
    } catch (e) {
      setTest({ state: "error", msg: e?.status === 403 ? "Số này chưa được đăng ký dùng thử." : e?.error === "phone" ? "Số điện thoại chưa đúng." : "Chưa gọi được. Thử lại sau." });
    }
  };

  const canNext = step === 1 ? true : step === 2 ? ready : step === 3 ? okWindows && s.days.length > 0 && okStart : !created && !!name.trim();
  const nextLabel = step === 1 ? "Tôi đã có file" : step < 4 ? "Tiếp tục" : s.start === "now" ? "Bắt đầu gọi" : "Lên lịch";
  const next = () => { if (!canNext || saving) return; if (step < 4) goStep(step + 1); else save(true); };
  const subs = [
    "Càng nhiều thông tin càng tốt",
    ready ? `${fmt(N)} số hợp lệ` : "Excel hoặc CSV",
    `${s.concurrency} cuộc cùng lúc`,
    created ? (created.start ? "Đã bắt đầu" : "Đã lưu nháp") : "Gọi thử, xác nhận",
  ];
  const startText = s.start === "now" ? "Ngay" : s.start_at ? new Date(s.start_at).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "—";

  // ── the pieces ──
  const lbl = { fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.18em", color: "#6E6255" };
  const card = { borderRadius: 12, background: "#fff", border: "1px solid #D9D0BF" };
  const head = (t) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={lbl}>BƯỚC {step} / 4</span>
      <h1 style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 24 }}>{t}</h1>
    </div>
  );
  const row = (label, sub, control, first) => (
    <div style={{ display: "grid", gridTemplateColumns: phone ? "1fr" : "200px minmax(0,1fr)", gap: phone ? 8 : 16, padding: "12px 14px", borderTop: first ? "none" : "1px solid #EFE9DD", alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingTop: phone ? 0 : 6 }}>
        <span style={{ fontSize: 12.5 }}>{label}</span>
        {sub && <span style={{ fontSize: 11.5, color: "#6E6255" }}>{sub}</span>}
      </div>
      <div style={{ minWidth: 0 }}>{control}</div>
    </div>
  );
  const select = (value, onChange, options, disabled) => (
    <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} style={{ height: 34, width: "100%", maxWidth: 360, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 10px", fontSize: 12.5, background: "#fff", color: "#1F1B16" }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
  const time = { height: 34, width: 78, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 10px", fontFamily: MONO, fontSize: 12.5 };

  const step1 = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {head("Chuẩn bị danh sách")}
      <p style={{ margin: 0, fontSize: 13, color: "#4A4239", lineHeight: 1.55, maxWidth: 620 }}>Cung cấp danh sách khách hàng cần gọi cho chiến dịch này. Thông tin chi tiết sẽ giúp Bonia duy trì cuộc nói chuyện tốt hơn.</p>
      <div style={{ display: "grid", gridTemplateColumns: phone ? "1fr" : "repeat(3, 1fr)", gap: 10 }}>
        {[["01", "Dòng đầu là tên cột", "Mô tả chi tiết về loại thông tin"], ["02", "Mỗi dòng một khách", "Không để nhiều khách cùng 1 dòng"], ["03", "Cột số điện thoại", "Cột bắt buộc"]].map(([n, t, d]) => (
          <div key={n} style={{ ...card, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: "#7B4A2D" }}>{n}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{t}</span>
            <span style={{ fontSize: 12, color: "#4A4239" }}>{d}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <span style={lbl}>VÍ DỤ MỘT FILE TỐT</span>
        <button type="button" onClick={() => saveSheet(SAMPLE, "vi-du-danh-sach-goi.xlsx")} style={{ border: 0, background: "none", padding: 0, color: "#7B4A2D", fontSize: 12.5, cursor: "pointer" }}>Tải file ví dụ (.xlsx)</button>
      </div>
      <div style={{ ...card, overflow: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 12, minWidth: 900 }}>
          <thead>
            <tr>{["", ..."ABCDEFGHI"].map((h, i) => <th key={i} style={{ padding: "6px 10px", background: "#F7F3EC", borderRight: "1px solid #EFE9DD", borderBottom: "1px solid #E4DCCB", fontFamily: MONO, fontSize: 10, fontWeight: 400, color: "#6E6255", minWidth: i ? 90 : 30 }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {SAMPLE.map((r, i) => (
              <tr key={i}>
                <td style={{ padding: "8px 10px", background: "#F7F3EC", borderRight: "1px solid #EFE9DD", borderBottom: "1px solid #EFE9DD", fontFamily: MONO, fontSize: 10, color: "#6E6255", textAlign: "center" }}>{i + 1}</td>
                {r.map((v, j) => <td key={j} style={{ padding: "8px 10px", borderRight: "1px solid #EFE9DD", borderBottom: "1px solid #EFE9DD", fontWeight: i ? 400 : 600, fontFamily: i && !j ? MONO : undefined, whiteSpace: "nowrap" }}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "#4A4239" }}>
        <span>• Định dạng Excel (.xlsx) hoặc CSV. Tối đa {fmt(MAX_ROWS)} dòng mỗi chiến dịch.</span>
        <span>• Số điện thoại định dạng tự do: 0900 000 181, 0900000181, +84 900 000 181.</span>
      </div>
    </div>
  );

  const pct = STAGES[stage]?.[0] ?? 0;
  const bad = check ? [...check.wrong, ...check.duplicate].sort((a, b) => a.n - b.n) : [];
  const cols4 = phone ? "1fr 1fr" : "repeat(4, 1fr)";
  const step2 = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {head("Tải lên và kiểm tra")}
      <input ref={fileInput} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) take(f); }} />
      {(stage === "idle" || stage === "error") && (
        <button type="button" onClick={() => fileInput.current?.click()} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) take(f); }} style={{ height: 112, borderRadius: 12, border: `1px dashed ${drag ? "#7B4A2D" : "#C9BCA5"}`, background: drag ? "#FBF5EC" : "#F7F3EC", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer" }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Kéo thả file Excel (.xlsx) hoặc CSV vào đây</span>
          <span style={{ fontSize: 13, color: "#6E6255" }}>hoặc bấm để chọn file</span>
        </button>
      )}
      {stage === "error" && <span style={{ fontSize: 12.5, color: "#A0412D" }}>{err}</span>}
      {["reading", "understanding", "checking"].includes(stage) && (
        <div style={{ ...card, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span>{sheet?.file || "…"}</span><span style={{ fontFamily: MONO, color: "#6E6255" }}>{pct}%</span></div>
          <div style={{ height: 4, borderRadius: 2, background: "#EFE9DD", overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: "#7B4A2D", transition: "width 600ms ease" }} /></div>
          <span style={{ fontSize: 12.5, color: "#4A4239" }}>{stage === "reading" ? "Đang đọc file…" : stage === "understanding" ? `Đã đọc ${fmt(sheet?.rows.length)} dòng · Bonia đang hiểu ý nghĩa từng cột…` : "Đang kiểm tra từng số…"}</span>
        </div>
      )}
      {stage === "done" && sheet && (
        <>
          <div style={{ ...card, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12.5, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><span style={{ color: "#4A6B3A" }}>✓</span> <b style={{ fontWeight: 500 }}>{sheet.file}</b> <span style={{ color: "#6E6255" }}>· {fmt(sheet.rows.length)} dòng · {sheet.headers.length} cột</span></span>
            <button type="button" onClick={() => fileInput.current?.click()} style={{ height: 30, padding: "0 12px", borderRadius: 15, border: "1px solid #D9D0BF", background: "#fff", fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap" }}>Chọn file khác</button>
          </div>
          {!phoneCol && (
            <div style={{ ...card, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, borderColor: "#A0412D" }}>
              <span style={{ fontSize: 12.5 }}>Bonia chưa tìm thấy cột số điện thoại. Cột nào là số để gọi?</span>
              {select("", setPhoneCol, [["", "Chọn cột…"], ...sheet.headers.map((h) => [h, h])])}
            </div>
          )}
          {check && (
            <div style={{ display: "grid", gridTemplateColumns: cols4, gap: 10 }}>
              <div style={{ ...card, padding: "12px 14px", borderColor: "#7B4A2D", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 22 }}>{fmt(N)}</span><span style={{ fontSize: 12.5, color: "#4A4239" }}>số sẽ được gọi</span>
              </div>
              <div style={{ ...card, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 22, color: check.wrong.length ? "#A0412D" : "#1F1B16" }}>{fmt(check.wrong.length)}</span><span style={{ fontSize: 12.5, color: "#4A4239" }}>số sai, bỏ qua</span>
              </div>
              <div style={{ ...card, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 22 }}>{fmt(check.duplicate.length)}</span><span style={{ fontSize: 12.5, color: "#4A4239" }}>số trùng, bỏ qua</span>
              </div>
              <div style={{ ...card, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontFamily: MONO, fontSize: 22 }}>{fmt(recentN)}</span><span style={{ fontSize: 12.5, color: "#4A4239" }}>đã gọi trong 7 ngày qua</span>
                {recentN > 0 && (
                  <div style={{ display: "flex", background: "#F7F3EC", border: "1px solid #D9D0BF", borderRadius: 9, padding: 2, gap: 2, alignSelf: "flex-start", marginTop: 4 }}>
                    {[["skip", `Bỏ qua ${fmt(recentN)} số này`], ["keep", "Vẫn gọi"]].map(([k, l]) => <button key={k} type="button" onClick={() => setRecentMode(k)} style={{ height: 26, padding: "0 9px", border: 0, borderRadius: 7, background: recentMode === k ? "#1F1B16" : "transparent", color: recentMode === k ? "#F7F3EC" : "#1F1B16", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>{l}</button>)}
                  </div>
                )}
              </div>
            </div>
          )}
          {dncN > 0 && <span style={{ fontSize: 12.5, color: "#4A4239" }}>Bỏ qua thêm {fmt(dncN)} số khách đã xin không gọi nữa.</span>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
            <span style={lbl}>BONIA ĐÃ ĐỌC {columns.length} CỘT</span>
            <span style={{ fontSize: 12.5, color: "#4A4239" }}>Tắt “Được nhắc tới” với thông tin chỉ để Bonia hiểu khách, không nói ra</span>
          </div>
          <div style={{ ...card, overflow: "hidden" }}>
            {!phone && (
              <div style={{ display: "grid", gridTemplateColumns: "160px 180px minmax(0,1fr) 100px", gap: 12, padding: "9px 14px", borderBottom: "1px solid #E4DCCB" }}>
                {["CỘT TRONG FILE", "DÒNG 1", "BONIA HIỂU LÀ", "ĐƯỢC NHẮC TỚI"].map((h, i) => <span key={h} style={{ ...lbl, fontSize: 9, textAlign: i === 3 ? "right" : "left" }}>{h}</span>)}
              </div>
            )}
            {columns.map((c, i) => {
              const v = String(sheet.rows[0]?.[c.name] ?? "");
              const tag = (t, dark) => <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.12em", padding: "2px 6px", borderRadius: 5, marginLeft: 8, whiteSpace: "nowrap", background: dark ? "#1F1B16" : "transparent", color: dark ? "#F7F3EC" : "#6E6255", border: `1px solid ${dark ? "#1F1B16" : "#D9D0BF"}` }}>{t}</span>;
              return (
                <div key={c.name} style={{ display: "grid", gridTemplateColumns: phone ? "minmax(0,1fr) 44px" : "160px 180px minmax(0,1fr) 100px", gap: phone ? 6 : 12, alignItems: "center", padding: "9px 14px", borderTop: i ? "1px solid #EFE9DD" : "none", background: c.kind === "phone" ? "#FAF7F1" : "#fff", fontSize: 12.5 }}>
                  {phone ? (
                    <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                      <span style={{ fontWeight: 500 }}>{c.name} <span style={{ fontFamily: MONO, fontSize: 11, color: "#6E6255", fontWeight: 400 }}>{v}</span></span>
                      <span style={{ color: "#4A4239" }}>{c.meaning}{c.kind === "phone" && tag("SỐ ĐỂ GỌI", true)}{c.sensitive && tag("NHẠY CẢM")}</span>
                    </span>
                  ) : (
                    <>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                      <span style={{ fontFamily: MONO, fontSize: 11.5, color: "#4A4239", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.kind === "phone" ? spaced(v) : v}</span>
                      <span style={{ display: "flex", alignItems: "center", minWidth: 0 }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.meaning}</span>{c.kind === "phone" && tag("SỐ ĐỂ GỌI", true)}{c.sensitive && tag("NHẠY CẢM")}</span>
                    </>
                  )}
                  <span style={{ display: "flex", justifyContent: "flex-end" }}>{c.kind !== "phone" && <Toggle on={c.mention} onChange={(on) => setMention(c.name, on)} label={`Được nhắc tới: ${c.name}`} />}</span>
                </div>
              );
            })}
          </div>
          <span style={{ ...lbl, marginTop: 4 }}>VÍ DỤ: BONIA MỞ ĐẦU CUỘC GỌI VỚI DÒNG 1</span>
          <div style={{ ...card, padding: "10px 14px 14px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.14em", color: "#6E6255" }}>BONIA</span>
            <div style={{ maxWidth: "92%", padding: "9px 13px", borderRadius: 12, background: "#EFE4D6", border: "1px solid #E4D5C1", fontSize: 13, lineHeight: 1.5, opacity: opening.busy ? 0.55 : 1, transition: "opacity 200ms" }}>
              {opening.text || (opening.busy ? "Bonia đang viết…" : "Chưa viết được câu mở đầu.")}
            </div>
          </div>
          {bad.length > 0 && (
            <>
              <button type="button" onClick={() => setBadOpen(!badOpen)} style={{ alignSelf: "flex-start", border: 0, background: "none", padding: 0, color: "#7B4A2D", fontSize: 12.5, cursor: "pointer" }}>{badOpen ? "Ẩn dòng bị bỏ qua" : `Xem ${fmt(bad.length)} dòng bị bỏ qua`}</button>
              {badOpen && (
                <div style={{ ...card, overflow: "hidden", fontSize: 12.5 }}>
                  {bad.slice(0, 5).map((b) => (
                    <div key={b.n} style={{ display: "grid", gridTemplateColumns: "80px minmax(0,1fr)", gap: 10, padding: "7px 12px", borderBottom: "1px solid #EFE9DD" }}>
                      <span style={{ fontFamily: MONO, fontSize: 11.5, color: "#6E6255" }}>Dòng {b.n}</span><span>{b.why}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px", color: "#6E6255" }}>
                    <span>{bad.length > 5 ? `và ${fmt(bad.length - 5)} dòng khác` : ""}</span>
                    <button type="button" onClick={() => saveSheet([["Dòng", "Lý do", ...sheet.headers], ...bad.map((b) => [b.n, b.why, ...sheet.headers.map((h) => b.row[h] ?? "")])], "dong-bi-bo-qua.xlsx")} style={{ border: 0, background: "none", padding: 0, color: "#7B4A2D", fontSize: 12.5, cursor: "pointer" }}>Tải danh sách dòng bị bỏ qua</button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );

  const step3 = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {head("Cách gọi")}
      <div style={card}>
        {row("Kịch bản", null, select("default", () => {}, [["default", "Kịch bản gọi ra của công ty"]], true), true)}
        {row("Số hiển thị khi gọi", null, select("bonia", () => {}, [["bonia", "Số tổng đài Bonia · bản dùng thử"]], true))}
      </div>
      <div style={card}>
        {row("Số cuộc gọi cùng lúc", `Gói hiện tại: tối đa ${PLAN_MAX}`, (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{CONCURRENCY.map((n) => <Choice key={n} mono h={32} on={s.concurrency === n} onClick={() => setS({ ...s, concurrency: n })}>{n}</Choice>)}</div>
            <span style={{ fontSize: 12.5, color: "#4A4239", lineHeight: 1.5 }}>Bonia gọi tối đa {s.concurrency} khách cùng một lúc. Nhiều cuộc cùng lúc thì danh sách xong sớm hơn, nhưng số khách quan tâm cũng dồn về tư vấn viên nhanh hơn.</span>
          </div>
        ), true)}
      </div>
      <div style={card}>
        {row("Ngày gọi", null, (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {DAYS.map((l, i) => { const on = s.days.includes(i + 1); return <Choice key={l} copper h={32} on={on} style={{ minWidth: 40, padding: "0 8px" }} onClick={() => setS({ ...s, days: on ? s.days.filter((x) => x !== i + 1) : [...s.days, i + 1].sort() })}>{l}</Choice>; })}
            <span style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 10, fontSize: 12.5 }}><Toggle on={s.skip_holidays} onChange={(on) => setS({ ...s, skip_holidays: on })} label="Nghỉ ngày lễ" />Nghỉ ngày lễ</span>
          </div>
        ), true)}
        {row("Khung giờ gọi", hours > 0 ? `${String(Math.round(hours * 10) / 10).replace(".", ",")} giờ mỗi ngày` : "Chưa có khung giờ hợp lệ", (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {s.windows.map(([a, z], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input value={a} onChange={(e) => setS({ ...s, windows: s.windows.map((w, j) => (j === i ? [e.target.value, w[1]] : w)) })} style={time} />
                <span style={{ fontSize: 12.5, color: "#6E6255" }}>đến</span>
                <input value={z} onChange={(e) => setS({ ...s, windows: s.windows.map((w, j) => (j === i ? [w[0], e.target.value] : w)) })} style={time} />
                {s.windows.length > 1 && <button type="button" aria-label="Xoá khung giờ" onClick={() => setS({ ...s, windows: s.windows.filter((_, j) => j !== i) })} style={{ border: 0, background: "none", color: "#6E6255", fontSize: 14, cursor: "pointer" }}>✕</button>}
              </div>
            ))}
            {s.windows.length < 4 && <button type="button" onClick={() => setS({ ...s, windows: [...s.windows, ["18:00", "20:00"]] })} style={{ alignSelf: "flex-start", border: 0, background: "none", padding: 0, color: "#7B4A2D", fontSize: 12.5, cursor: "pointer" }}>+ Thêm khung giờ</button>}
            {!okWindows && <span style={{ fontSize: 12, color: "#A0412D" }}>Giờ viết dạng 08:30, giờ bắt đầu trước giờ kết thúc.</span>}
          </div>
        ))}
      </div>
      <div style={card}>
        {row("Khách không nghe máy", null, (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12.5, color: "#6E6255" }}>Gọi lại</span>
            {[0, 1, 2, 3].map((n) => <Choice key={n} h={32} on={s.retries === n} onClick={() => setS({ ...s, retries: n })}>{n ? `${n} lần` : "Không"}</Choice>)}
            {s.retries > 0 && (
              <>
                <span style={{ fontSize: 12.5, color: "#6E6255", marginLeft: 6 }}>cách nhau</span>
                <select value={s.retry_gap} onChange={(e) => setS({ ...s, retry_gap: e.target.value })} style={{ height: 32, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 8px", fontSize: 12.5, background: "#fff" }}>
                  {Object.entries(GAP_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </>
            )}
          </div>
        ), true)}
        {row("Khách hẹn gọi lại", null, (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <Choice h={32} on>Tư vấn viên gọi</Choice>
            <span style={{ height: 32, padding: "0 11px", borderRadius: 8, border: "1px dashed #D9D0BF", color: "#6E6255", fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 8 }}>Bonia tự gọi lại đúng giờ hẹn <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: "0.14em" }}>SẮP CÓ</span></span>
          </div>
        ))}
        {row("Thứ tự gọi", null, (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[["file", "Theo thứ tự trong file"], ["new_first", "Ưu tiên khách mới thêm"]].map(([k, l]) => <Choice key={k} h={32} on={s.order === k} onClick={() => setS({ ...s, order: k })}>{l}</Choice>)}
          </div>
        ))}
      </div>
      <div style={card}>
        {row("Bắt đầu", null, (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {[["now", "Ngay khi xác nhận"], ["scheduled", "Lên lịch"]].map(([k, l]) => <Choice key={k} h={32} on={s.start === k} onClick={() => setS({ ...s, start: k })}>{l}</Choice>)}
            {s.start === "scheduled" && <input type="datetime-local" value={s.start_at} onChange={(e) => setS({ ...s, start_at: e.target.value })} style={{ height: 32, border: `1px solid ${okStart ? "#D9D0BF" : "#A0412D"}`, borderRadius: 8, padding: "0 8px", fontFamily: MONO, fontSize: 12.5 }} />}
          </div>
        ), true)}
      </div>
    </div>
  );

  const review = [
    ["Danh sách", sheet ? `${fmt(N)} số · ${columns.length} cột thông tin · ${sheet.file}` : "Chưa tải lên", 2],
    ["Kịch bản", "Kịch bản gọi ra của công ty", 3],
    ["Số hiển thị", "Số tổng đài Bonia · bản dùng thử", 3],
    ["Cùng lúc", `${s.concurrency} cuộc`, 3],
    ["Ngày và giờ", `${daysLabel(s.days)} · ${windowsLabel(s.windows)}${s.skip_holidays ? " · nghỉ lễ" : ""}`, 3],
    ["Không nghe máy", retryLabel(s), 3],
    ["Khách hẹn gọi lại", "Tư vấn viên gọi", 3],
    ["Bắt đầu", s.start === "now" ? "Ngay khi xác nhận" : startText, 3],
  ];
  const step4 = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {head("Xem lại và bắt đầu")}
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12.5, color: "#4A4239" }}>Tên chiến dịch</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder={`Ví dụ: Khách quan tâm iPhone · tháng 10`} style={{ height: 36, maxWidth: 460, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 12px", fontSize: 13, background: "#fff" }} />
      </label>
      <div style={{ ...card, overflow: "hidden" }}>
        {review.map(([k, v, st], i) => (
          <div key={k} style={{ display: "grid", gridTemplateColumns: phone ? "110px minmax(0,1fr) auto" : "200px minmax(0,1fr) auto", gap: 12, padding: "12px 14px", borderTop: i ? "1px solid #EFE9DD" : "none", fontSize: 12.5, alignItems: "center" }}>
            <span style={{ color: "#6E6255" }}>{k}</span>
            <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{v}</span>
            {!created && <button type="button" onClick={() => goStep(st)} style={{ border: 0, background: "none", padding: 0, color: "#7B4A2D", fontSize: 12.5, cursor: "pointer" }}>Sửa</button>}
          </div>
        ))}
      </div>
      <div style={{ ...card, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Gọi thử cho chính bạn trước</span>
        <span style={{ fontSize: 12.5, color: "#6E6255" }}>Bonia gọi đúng kịch bản này tới số của bạn, coi bạn như khách ở dòng 1 của danh sách.</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input value={testNum} onChange={(e) => setTestNum(e.target.value)} placeholder="Số của bạn" inputMode="tel" style={{ height: 34, width: 180, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 10px", fontFamily: MONO, fontSize: 12.5, background: "#fff" }} />
          <button type="button" disabled={test.state === "calling" || !testNum.trim() || !sheet} onClick={testCall} style={{ height: 34, padding: "0 14px", borderRadius: 17, border: "1px solid #D9D0BF", background: "#fff", fontSize: 12.5, cursor: "pointer" }}>{test.state === "calling" ? "Đang gọi…" : test.state === "idle" ? "Gọi thử cho tôi" : "Gọi thử lại"}</button>
          {test.msg && <span style={{ fontSize: 12.5, color: test.state === "error" ? "#A0412D" : "#4A6B3A" }}>{test.msg}</span>}
        </div>
      </div>
      {err && step === 4 && <span style={{ fontSize: 12.5, color: "#A0412D" }}>{err}</span>}
      {created?.start && (
        <div style={{ ...card, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", borderColor: "#C9D8BF", background: "#F4F7EF" }}>
          <span style={{ color: "#4A6B3A", fontSize: 13.5 }}>{created.campaign.status === "scheduled" ? `✓ Đã lên lịch, Bonia bắt đầu gọi lúc ${startText}.` : `✓ Chiến dịch đã bắt đầu. Bonia đang gọi ${s.concurrency} khách đầu tiên.`}</span>
          <button type="button" onClick={() => go(`/goi-ra/${created.campaign.id}`)} style={{ height: 34, padding: "0 16px", borderRadius: 17, border: 0, background: "#7B4A2D", color: "#fff", fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap" }}>Xem trực tiếp →</button>
        </div>
      )}
    </div>
  );

  const summary = [
    ["Danh sách", ready ? `${fmt(N)} số` : "—"], ["Cùng lúc", `${s.concurrency} cuộc`], ["Ngày gọi", daysLabel(s.days)], ["Khung giờ", windowsLabel(s.windows) || "—"],
    ["Gọi lại", retryLabel(s)], ["Bắt đầu", startText],
  ];
  const aside = (
    <div style={{ borderRadius: 14, background: "#fff", border: "1px solid #D9D0BF", overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #EFE9DD" }}><span style={lbl}>TÓM TẮT</span></div>
      <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
        {summary.map(([k, v]) => <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12.5 }}><span style={{ color: "#4A4239" }}>{k}</span><span style={{ color: v === "—" ? "#6E6255" : "#1F1B16", textAlign: "right" }}>{v}</span></div>)}
      </div>
      <div style={{ padding: "12px 14px", background: "#F7F3EC", borderTop: "1px solid #EFE9DD", display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ ...lbl, fontSize: 9 }}>ƯỚC TÍNH GỌI XONG</span>
        <span style={{ fontFamily: MONO, fontSize: 24, lineHeight: 1.1 }}>{ready && est ? (okWindows && s.days.length ? est.text : "Chưa đủ giờ gọi") : "—"}</span>
        <span style={{ fontSize: 12, color: "#4A4239", lineHeight: 1.45 }}>{ready && est ? est.note : "Tải danh sách lên để xem ước tính."}</span>
      </div>
    </div>
  );
  const footer = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "14px 0", borderTop: "1px solid #D9D0BF" }}>
      <button type="button" onClick={() => goStep(Math.max(1, step - 1))} style={{ visibility: step > 1 && !created ? "visible" : "hidden", height: 36, padding: "0 16px", borderRadius: 18, border: "1px solid #D9D0BF", background: "#fff", fontSize: 13, cursor: "pointer" }}>Quay lại</button>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {step === 2 && !ready && <span style={{ fontSize: 12.5, color: "#6E6255" }}>Tải file lên để tiếp tục</span>}
        {step === 4 && !created && <button type="button" disabled={saving || !name.trim()} onClick={() => save(false)} style={{ height: 36, padding: "0 16px", borderRadius: 18, border: "1px solid #D9D0BF", background: "#fff", fontSize: 13, cursor: "pointer" }}>Lưu nháp</button>}
        {!created && <button type="button" onClick={next} disabled={!canNext || saving} style={{ height: 36, padding: "0 20px", borderRadius: 18, border: 0, background: canNext ? "#7B4A2D" : "#C9BCA5", color: "#fff", fontSize: 13, cursor: canNext ? "pointer" : "not-allowed" }}>{saving ? "Đang lưu…" : nextLabel}</button>}
      </div>
    </div>
  );
  const content = [step1, step2, step3, step4][step - 1];

  if (phone) {
    return (
      <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
        <div ref={main} style={{ position: "absolute", left: 0, right: 0, top: "var(--tt-top)", bottom: "calc(57px + var(--tt-bot))", overflow: "auto" }}>
          <div style={{ padding: "10px 16px 0", display: "flex", flexDirection: "column", gap: 12 }}>
            <Link href="/goi-ra" style={{ fontSize: 12.5, color: "#7B4A2D" }}>← Gọi ra</Link>
            <span style={{ fontSize: 12.5, color: "#4A4239" }}>Tạo chiến dịch gọi · {short}</span>
            {content}
            {aside}
            {footer}
          </div>
        </div>
        <FinPhoneTabs active={1} />
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, background: "#F2EEE6", overflow: "hidden" }}>
      <FinHeader active={1} />
      <div style={{ position: "absolute", left: 28, top: 72, width: 220, display: "flex", flexDirection: "column", gap: 6 }}>
        <Link href="/goi-ra" style={{ fontSize: 12.5, color: "#7B4A2D" }}>← Gọi ra</Link>
        <span style={{ fontFamily: SERIF, fontSize: 22, margin: "8px 0 14px" }}>Tạo chiến dịch gọi</span>
        {STEPS.map(([l], i) => {
          const n = i + 1, on = step === n, done = maxStep > n || (n === 4 && !!created), ok = n <= maxStep && !created;
          return (
            <button key={l} type="button" onClick={() => ok && goStep(n)} style={{ display: "flex", gap: 12, alignItems: "flex-start", textAlign: "left", padding: "9px 8px", borderRadius: 10, border: 0, background: on ? "#fff" : "transparent", cursor: ok ? "pointer" : "default" }}>
              <span style={{ width: 22, height: 22, borderRadius: 11, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 10.5, border: `1px solid ${on || done ? "#7B4A2D" : "#D9D0BF"}`, background: on ? "#7B4A2D" : "#fff", color: on ? "#fff" : done ? "#7B4A2D" : "#6E6255" }}>{done && !on ? "✓" : n}</span>
              <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{ fontSize: 13, fontWeight: on ? 600 : 500, color: n <= maxStep ? "#1F1B16" : "#6E6255" }}>{l}</span>
                <span style={{ fontSize: 11.5, color: "#6E6255" }}>{subs[i]}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 296, right: 28 + 328 + 28, top: 56, bottom: 0, display: "flex", flexDirection: "column", maxWidth: 780 }}>
        <div ref={main} style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "16px 4px 24px" }}>{content}</div>
        {footer}
      </div>
      <div style={{ position: "absolute", right: 28, width: 328, top: 72 }}>{aside}</div>
    </div>
  );
}
