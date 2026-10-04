// DEMO ENGINE for Thử Bonia. Production runs the test call on the same voice
// agent as real calls (browser audio → voice-agent → GPT-Live with this hotel's
// settings; not billed). Until that bridge exists, this answers from the
// hotel's current Cài đặt so the loop "gọi → Sửa → gọi lại" already works:
// a correction saved as "• Khi khách nói "…": …" wins over everything else.
//
// reply(settings, history, guestText) → { reply, understood, name, room, type,
// urgent, promised, end }

/** Prices the way people say them: 850 nghìn, 1 triệu 4, 2 triệu. */
const fmtK = (n) => {
  const v = Number(n);
  if (!v) return "";
  if (v < 1000000) return `${Math.round(v / 1000)} nghìn`;
  const m = Math.floor(v / 1000000);
  const rest = Math.round((v % 1000000) / 100000);
  return rest ? `${m} triệu ${rest}` : `${m} triệu`;
};
const fold = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").toLowerCase();

/** The owner's corrections from Thông tin khác: [[guestLine, answer]]. */
function corrections(extra) {
  return (extra || "")
    .split("\n")
    .map((l) => l.match(/^•\s*Khi khách nói "(.*)":\s*(.+)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]);
}

function similar(a, b) {
  const wa = new Set(fold(a).split(/\W+/).filter((w) => w.length > 1));
  const wb = fold(b).split(/\W+/).filter((w) => w.length > 1);
  if (!wa.size || !wb.length) return 0;
  return wb.filter((w) => wa.has(w)).length / Math.max(wa.size, wb.length);
}

export function scriptReply({ f, rooms }, history, text) {
  const t = fold(text);
  const fix = corrections(f.extra).map(([q, a]) => [similar(q, text), a]).sort((x, y) => y[0] - x[0])[0];
  if (fix && fix[0] >= 0.5) return { reply: fix[1], understood: { "Câu hỏi": text.slice(0, 40) }, type: "Hỏi thông tin", promised: "" };

  const english = /^(hi|hello|do you|can you|i |i'd|how much|is there)/i.test(text.trim());
  if (english) {
    if (!f.english) return { reply: "Dạ em xin lỗi, em chỉ nói được tiếng Việt ạ. Em ghi lại để bên em gọi lại mình nha.", understood: { "Ngôn ngữ": "Tiếng Anh" }, type: "Lời nhắn", promised: "Bên em sẽ gọi lại" };
    const r = rooms.find((x) => x.dOn) || rooms[0];
    return { reply: `Yes, we have rooms tonight. A ${r.name} is ${Number(r.wd).toLocaleString("en-US")} VND per night. May I have your name?`, understood: { "Ngôn ngữ": "Tiếng Anh", "Loại phòng": r.name }, type: "Đặt phòng", promised: "" };
  }
  if (/tai khoan|chuyen khoan|stk|so tk/.test(t)) {
    return { reply: "Dạ em không đọc số tài khoản qua điện thoại ạ. Bên em sẽ nhắn tin cách chuyển khoản cho mình.", understood: { "Câu hỏi": "Số tài khoản" }, type: "Lời nhắn", promised: "Bên em sẽ nhắn cách chuyển khoản" };
  }
  if (/\b(may lanh|dieu hoa|bi hu|hu roi|hong roi|bi hong|khong chay|chay nuoc|mat dien|mat nuoc|cup dien|cup nuoc)\b/.test(t)) {
    const room = (text.match(/phòng\s*(\d{3})/i) || [])[1] || "";
    return { reply: "Dạ em báo kỹ thuật lên ngay cho mình ạ.", understood: { "Việc": "Máy lạnh không chạy", "Mức": "Gấp" }, room, type: "Khách đang ở", urgent: true, promised: "Em báo kỹ thuật lên ngay" };
  }
  if (/\b(dau xe|cho dau|do xe|o to|xe hoi|gui xe|hem)\b/.test(t)) {
    return { reply: f.directions ? `Dạ ${f.directions.charAt(0).toLowerCase()}${f.directions.slice(1)}` : "Dạ em chưa có thông tin chỗ đậu xe, em ghi lại để bên em báo lại mình nha.", understood: { "Câu hỏi": "Chỗ đậu ô tô" }, type: "Hỏi thông tin", promised: "" };
  }
  if (/\b(theo gio|gio dau|bao nhieu)\b/.test(t) && !/\b(dem|cuoi tuan)\b/.test(t)) {
    if (!f.quote) return { reply: "Dạ bên em sẽ nhắn giá cho mình qua số này ạ.", understood: { "Câu hỏi": "Giá theo giờ" }, type: "Hỏi thông tin", promised: "Bên em sẽ nhắn giá" };
    const r = rooms.find((x) => x.hOn);
    if (!r) return { reply: "Dạ bên em không nhận khách theo giờ ạ.", understood: { "Câu hỏi": "Giá theo giờ" }, type: "Hỏi thông tin", promised: "" };
    return { reply: `Dạ có ạ. Phòng ${r.name} 2 giờ đầu ${fmtK(r.h2)}, mỗi giờ sau ${fmtK(r.hn)} ạ.`, understood: { "Câu hỏi": "Giá theo giờ" }, type: "Hỏi thông tin", promised: "" };
  }
  const asked = history.filter((h) => h.w === "B").length;
  if (/dat|deluxe|cuoi tuan|phong .* dem|2 dem|con phong/.test(t) || history.some((h) => h.w === "K" && /đặt|Deluxe/.test(h.text))) {
    const r = rooms.find((x) => /deluxe/i.test(x.name)) || rooms.find((x) => x.dOn) || rooms[0];
    if (asked <= 1) return { reply: `Dạ bên em có phòng ${r.name}${f.quote ? `, cuối tuần ${fmtK(r.we)} một đêm` : ""} ạ. Cho em xin tên mình ạ?`, understood: { "Loại phòng": r.name, "Ngày": "Cuối tuần · 2 đêm" }, type: "Đặt phòng", promised: "" };
    const name = text.trim().split(/\s+/).slice(-1)[0].replace(/[.!?]/g, "");
    return { reply: "Dạ rồi, bên em sẽ nhắn tin xác nhận lại qua số điện thoại này ạ. Em cảm ơn mình.", understood: { "Loại phòng": r.name, "Ngày": "Cuối tuần · 2 đêm" }, name: name ? `chị ${name.charAt(0).toUpperCase()}${name.slice(1)}` : "", type: "Đặt phòng", promised: "Bên em sẽ nhắn tin xác nhận lại" };
  }
  if (/cam on|tam biet|bye|thoi nha|ok em/.test(t)) return { reply: f.closing || "Dạ em cảm ơn mình ạ.", understood: {}, type: "Hỏi thông tin", promised: "", end: true };
  return { reply: "Dạ em ghi lại rồi ạ, bên em sẽ báo lại mình.", understood: { "Nội dung": text.slice(0, 60) }, type: "Lời nhắn", promised: "Bên em sẽ báo lại" };
}
