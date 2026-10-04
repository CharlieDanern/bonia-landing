// DEMO ENGINE for Thử Bonia. Production runs the test call on the same voice
// agent as real calls (browser audio → voice-agent → GPT-Live with this hotel's
// settings; not billed). Until that bridge exists, this answers from the
// hotel's current Cài đặt so the loop "gọi → Sửa → gọi lại" already works:
// a correction saved from "Sửa" (Cài đặt · Đã sửa trong Thử Bonia) wins over
// everything else.
//
// scriptReply(settings, history, guestText) → { reply, summary, name, room,
// type, urgent, end }

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

import { flat } from "../data/settings.js";

function similar(a, b) {
  const wa = new Set(fold(a).split(/\W+/).filter((w) => w.length > 1));
  const wb = fold(b).split(/\W+/).filter((w) => w.length > 1);
  if (!wa.size || !wb.length) return 0;
  return wb.filter((w) => wa.has(w)).length / Math.max(wa.size, wb.length);
}

export function scriptReply(settings, history, text) {
  const f = flat(settings);
  const rooms = settings.rooms;
  const quotes = f.quote !== "Không báo giá";
  const t = fold(text);
  const fix = (f.fixes || []).map(([q, a]) => [similar(q, text), a]).sort((x, y) => y[0] - x[0])[0];
  if (fix && fix[0] >= 0.5) return { reply: fix[1], summary: `Hỏi: ${text} Bonia trả lời theo điều chủ đã dặn.`, type: "Hỏi thông tin" };

  const english = /^(hi|hello|do you|can you|i |i'd|how much|is there)/i.test(text.trim());
  if (english) {
    if (!f.english) return { reply: "Dạ em xin lỗi, em chỉ nói được tiếng Việt ạ. Em ghi lại để bên em gọi lại mình nha.", summary: "Khách nói tiếng Anh, cần gọi lại.", type: "Lời nhắn" };
    const r = rooms.find((x) => x.daily?.on) || rooms[0];
    return { reply: `Yes, we have rooms. A ${r.name} is ${Number(r.daily.wd).toLocaleString("en-US")} VND per night. May I have your name?`, summary: `Khách nói tiếng Anh, hỏi phòng cho 2 người tối nay. Bonia đã báo ${r.name} ${Number(r.daily.wd).toLocaleString("vi-VN")}đ/đêm.`, type: "Đặt phòng" };
  }
  if (/tai khoan|chuyen khoan|stk|so tk/.test(t)) {
    return { reply: "Dạ em không đọc số tài khoản qua điện thoại ạ. Bên em sẽ nhắn tin cách chuyển khoản cho mình.", summary: "Xin số tài khoản để chuyển cọc. Cần nhắn khách cách chuyển khoản.", type: "Lời nhắn" };
  }
  if (/\b(may lanh|dieu hoa|bi hu|hu roi|hong roi|bi hong|khong chay|chay nuoc|mat dien|mat nuoc|cup dien|cup nuoc)\b/.test(t)) {
    const room = (text.match(/phòng\s*(\d{3})/i) || [])[1] || "";
    return { reply: "Dạ em báo kỹ thuật lên ngay cho mình ạ.", summary: `Máy lạnh ${room ? `phòng ${room} ` : ""}không chạy.`, room, type: "Khách đang ở", urgent: true };
  }
  if (/\b(dau xe|cho dau|do xe|o to|xe hoi|gui xe|hem)\b/.test(t)) {
    return { reply: f.directions ? `Dạ ${f.directions.charAt(0).toLowerCase()}${f.directions.slice(1)}` : "Dạ em chưa có thông tin chỗ đậu xe, em ghi lại để bên em báo lại mình nha.", summary: f.directions ? `Hỏi chỗ đậu ô tô. Bonia trả lời: ${f.directions}` : "Hỏi chỗ đậu ô tô. Bonia chưa có thông tin, cần gọi lại.", type: f.directions ? "Hỏi thông tin" : "Lời nhắn" };
  }
  if (/\b(theo gio|gio dau|bao nhieu)\b/.test(t) && !/\b(dem|cuoi tuan)\b/.test(t)) {
    if (!quotes) return { reply: "Dạ bên em sẽ nhắn giá cho mình qua số này ạ.", summary: "Hỏi giá theo giờ. Cần nhắn giá cho khách.", type: "Lời nhắn" };
    const r = rooms.find((x) => x.hourly?.on);
    if (!r) return { reply: "Dạ bên em không nhận khách theo giờ ạ.", summary: "Hỏi phòng theo giờ. Bonia trả lời: không nhận khách theo giờ.", type: "Hỏi thông tin" };
    return { reply: `Dạ có ạ. Phòng ${r.name} 2 giờ đầu ${fmtK(r.hourly.h2)}, mỗi giờ sau ${fmtK(r.hourly.hn)} ạ.`, summary: `Hỏi giá theo giờ. Bonia trả lời: ${r.name} ${Number(r.hourly.h2).toLocaleString("vi-VN")}đ 2 giờ đầu, ${Number(r.hourly.hn).toLocaleString("vi-VN")}đ mỗi giờ sau.`, type: "Hỏi thông tin" };
  }
  const asked = history.filter((h) => h.w === "B").length;
  if (/dat|deluxe|cuoi tuan|phong .* dem|2 dem|con phong/.test(t) || history.some((h) => h.w === "K" && /đặt|Deluxe/.test(h.text))) {
    const r = rooms.find((x) => /deluxe/i.test(x.name)) || rooms.find((x) => x.daily?.on) || rooms[0];
    const we = r.daily?.we || r.daily?.wd;
    if (asked <= 1) return { reply: `Dạ bên em có phòng ${r.name}${quotes ? `, cuối tuần ${fmtK(we)} một đêm` : ""} ạ. Cho em xin tên mình ạ?`, summary: `Muốn đặt ${r.name} cuối tuần này, 2 đêm.${quotes ? ` Bonia đã báo ${Number(we).toLocaleString("vi-VN")}đ/đêm cuối tuần.` : ""}`, type: "Đặt phòng" };
    const name = text.trim().split(/\s+/).slice(-1)[0].replace(/[.!?]/g, "");
    return { reply: "Dạ rồi, bên em sẽ nhắn tin xác nhận lại qua số điện thoại này ạ. Em cảm ơn mình.", summary: `Đặt ${r.name} cuối tuần này, 2 đêm.${quotes ? ` Bonia đã báo ${Number(we).toLocaleString("vi-VN")}đ/đêm cuối tuần.` : ""}`, name: name ? `chị ${name.charAt(0).toUpperCase()}${name.slice(1)}` : "", type: "Đặt phòng" };
  }
  if (/cam on|tam biet|bye|thoi nha|ok em/.test(t)) return { reply: f.closing || "Dạ em cảm ơn mình ạ.", end: true };
  return { reply: "Dạ em ghi lại rồi ạ, bên em sẽ báo lại mình.", summary: `${text.replace(/^(em ơi|alo|dạ)[, ]*/i, "")}`.slice(0, 160), type: "Lời nhắn" };
}
