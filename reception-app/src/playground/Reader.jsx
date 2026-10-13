import React, { useRef, useState } from "react";
import { api } from "../api.js";
import { MONO } from "../ui.js";
import { ACCEPT, readBody } from "./files.js";

// "Bonia đã đọc" (founder 2026-10-13, phase 2): the partner drops his client's menu, price list or promotion; Bonia
// reads it (the backend's model) and shows what she understood, which he checks, edits, then adds to "Thông tin cho
// Bonia" (or uses in place of the sample's). Several files at once (founder 2026-10-14: "1 for promotion, 1 for price
// lists"): each its own card and, once added, its own section under the title Bonia gave it.

const ERRORS = {
  type: "Chưa đọc được loại tệp này. Dùng PDF, ảnh, Word hoặc Excel.",
  too_large: "Tệp lớn quá (tối đa 6 MB). Chia nhỏ tệp hoặc chụp ảnh từng trang.",
  empty: "Tệp trống.",
  too_many: "Hôm nay đã đọc nhiều tệp. Mai thử tiếp nhé.",
  full: "Thông tin cho Bonia sẽ vượt giới hạn ký tự. Rút gọn phần này, hoặc xóa bớt thông tin cũ rồi thêm lại.",
  read_failed: "Bonia chưa đọc được tệp này. Thử lại, hoặc chép nội dung vào ô bên trên.",
  network: "Không kết nối được tới Bonia. Thử lại sau ít phút.",
};
const eyebrow = { fontFamily: MONO, fontSize: 9, letterSpacing: "0.18em", color: "#6E6255" };
const PER_PICK = 5;

/**
 * d: the size tokens; business / sector: what the file is about; isSample: the knowledge is still the sample's (then
 * the read text replaces it by default); onAdd([{ title, text }], "append" | "replace") → null, or "full" when it would
 * not fit (nothing is added then); disabled: during a call.
 */
export function Reader({ d, business, sector, isSample, onAdd, disabled = false }) {
  const [items, setItems] = useState([]); // { id, name, state: reading | done | error, title, summary, text, err }
  const [note, setNote] = useState("");
  const [over, setOver] = useState(false);
  const input = useRef(null);
  const seq = useRef(0);
  const set = (id, p) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const drop = (id) => setItems((xs) => xs.filter((x) => x.id !== id));

  const read = async (file) => {
    const id = ++seq.current;
    setItems((xs) => [...xs, { id, name: file.name, state: "reading" }]);
    try {
      const body = await readBody(file);
      const r = await api.playgroundRead({ ...body, business, sector });
      if (!r.text) set(id, { state: "error", err: r.summary || ERRORS.read_failed });
      else set(id, { state: "done", title: r.title || file.name.replace(/\.[^.]+$/, ""), summary: r.summary, text: r.text });
    } catch (e) {
      set(id, { state: "error", err: ERRORS[e?.error] || (e?.status === 413 ? ERRORS.too_large : ERRORS.network) });
    }
  };
  const take = (files) => {
    const all = [...(files || [])];
    setNote(all.length > PER_PICK ? `Mỗi lần đọc tối đa ${PER_PICK} tệp: đã đọc ${PER_PICK} tệp đầu, chọn tiếp các tệp còn lại sau.` : "");
    for (const f of all.slice(0, PER_PICK)) read(f);
  };
  // add one card, or every card read; a card that would not fit stays, with why
  const add = (list, mode) => {
    const err = onAdd(list.map((x) => ({ title: x.title, text: x.text })), mode);
    if (err) return setItems((xs) => xs.map((x) => (list.some((y) => y.id === x.id) ? { ...x, warn: ERRORS[err] || ERRORS.full } : x)));
    return setItems((xs) => xs.filter((x) => !list.some((y) => y.id === x.id)));
  };
  const done = items.filter((x) => x.state === "done");

  const btn = (primary) => ({ height: d.btnSm, padding: "0 12px", borderRadius: d.btnSm / 2, fontSize: d.fs.small, whiteSpace: "nowrap" });
  return (
    <div
      onDragOver={(e) => { if (disabled) return; e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) take(e.dataTransfer.files); }}
      style={{ display: "flex", flexDirection: "column", gap: 8, padding: over ? 8 : 0, margin: over ? -8 : 0, borderRadius: 10, border: over ? "1.5px dashed #7B4A2D" : "1.5px dashed transparent", background: over ? "#FBF5EC" : "transparent" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button type="button" className="b-ghost" disabled={disabled} onClick={() => input.current?.click()} style={{ ...btn(), height: d.btn, borderRadius: d.btn / 2, padding: "0 14px" }}>Tải tệp lên</button>
        <span style={{ fontSize: d.fs.tiny, color: "#6E6255", lineHeight: 1.45, flex: 1, minWidth: 160 }}>Thực đơn, bảng giá, khuyến mãi: PDF, ảnh, Word, Excel. Chọn nhiều tệp cùng lúc hoặc kéo thả vào đây.</span>
        <input ref={input} type="file" accept={ACCEPT} multiple hidden onChange={(e) => { take(e.target.files); e.target.value = ""; }} />
      </div>
      {note && <span style={{ fontSize: d.fs.tiny, color: "#A0412D", lineHeight: 1.45 }}>{note}</span>}
      {done.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "8px 12px", borderRadius: 10, background: "#F1F3EA", border: "1px solid #D6DEC8" }}>
          <span style={{ fontSize: d.fs.small, color: "#4A4239", flex: 1, minWidth: 140 }}>Bonia đã đọc {done.length} tệp.</span>
          <button type="button" className="b-primary" disabled={disabled} onClick={() => add(done, isSample ? "replace" : "append")} style={btn(true)}>{isSample ? "Dùng tất cả thay thông tin mẫu" : "Thêm tất cả vào thông tin"}</button>
        </div>
      )}
      {items.map((x) => (
        <div key={x.id} style={{ display: "flex", flexDirection: "column", gap: 7, padding: "10px 12px", borderRadius: 10, border: `1px solid ${x.state === "error" ? "#EBCFC4" : "#E4DCCB"}`, background: x.state === "done" ? "#FBF7F0" : "#fff" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
            <span style={{ ...eyebrow, color: x.state === "error" ? "#A0412D" : x.state === "done" ? "#4A6B3A" : "#7B4A2D", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {x.state === "reading" ? "BONIA ĐANG ĐỌC…" : x.state === "done" ? "BONIA ĐÃ ĐỌC" : "CHƯA ĐỌC ĐƯỢC"} · {x.name}
            </span>
            {x.state !== "reading" && <button type="button" onClick={() => drop(x.id)} aria-label="Bỏ" style={{ fontSize: d.fs.small, color: "#6E6255" }}>✕</button>}
          </div>
          {x.state === "reading" && <span style={{ fontSize: d.fs.small, color: "#6E6255" }}>Bonia đang đọc từng dòng, chừng 10–30 giây…</span>}
          {x.state === "error" && <span style={{ fontSize: d.fs.small, color: "#A0412D", lineHeight: 1.5 }}>{x.err}</span>}
          {x.state === "done" && (
            <>
              <input value={x.title} maxLength={60} onChange={(e) => set(x.id, { title: e.target.value })} aria-label="Tiêu đề phần này"
                style={{ height: d.input - 4, border: "1px solid #D9D0BF", borderRadius: 8, padding: "0 10px", fontSize: d.fs.body, fontWeight: 600, background: "#fff", color: "#1F1B16" }} />
              {x.summary && <span style={{ fontSize: d.fs.small, color: "#4A4239", lineHeight: 1.45 }}>{x.summary}</span>}
              <textarea rows={8} value={x.text} onChange={(e) => set(x.id, { text: e.target.value })} style={{ width: "100%", border: "1px solid #D9D0BF", borderRadius: 8, padding: "7px 10px", fontSize: d.fs.small, lineHeight: 1.5, background: "#fff", color: "#1F1B16", resize: "vertical" }} />
              <span style={{ fontSize: d.fs.tiny, color: "#6E6255" }}>Xem lại giá và tên món trước khi thêm: Bonia trả lời khách đúng theo phần này.</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button type="button" className="b-primary" disabled={disabled} onClick={() => add([x], isSample ? "replace" : "append")} style={btn(true)}>{isSample ? "Dùng thay thông tin mẫu" : "Thêm vào thông tin"}</button>
                <button type="button" className="b-ghost" disabled={disabled} onClick={() => add([x], isSample ? "append" : "replace")} style={btn()}>{isSample ? "Thêm vào cuối thông tin mẫu" : "Thay toàn bộ thông tin"}</button>
              </div>
              {x.warn && <span role="alert" style={{ fontSize: d.fs.tiny, color: "#A0412D", lineHeight: 1.45 }}>{x.warn}</span>}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
