import { callAudio } from "./links.js";
import { nb } from "./sectors.js";

/* The three demo calls in the § 00 player, one per sector: real calls to the
 * test line (2026-10-01, prompt v3), chosen by the founder, cleaned and tightened
 * (public/reception/demo/bonia-call-0N.mp3). Generated from each call's record
 * and audio; times are seconds into the MP3.
 *
 * An event is either speech { s: "Bonia" | "Khách", at, text } (a bubble at the
 * line's onset; long turns split where Bonia pauses between sentences) or a
 * look-up { tool, at, dur, detail, slots?, rows? }: busy ("đang tra…", orb
 * thinking) from `at` for `dur` seconds, the real time the backend took, then
 * its results. A slot is { t, free?, pick? } (taken unless `free`; `pick` is when
 * the caller chose it). `result` is the request card, shown when the request was
 * recorded. `end` is the MP3's length. */
export const CALLS = [
  {
    sector: "phong-kham",
    tag: "Phòng khám · Đặt lịch",
    title: "Đặt cạo vôi sáng thứ Bảy",
    biz: "Nha khoa Hoa Ngà",
    caller: "Khách · " + nb("0900 000 102"),
    src: callAudio(1),
    end: 52.65,
    events: [
      { s: "Bonia", at: 0.35, text: "Dạ Nha khoa Hoa Ngà xin nghe ạ." },
      { s: "Khách", at: 2.47, text: "Em ơi, anh muốn đặt cái lịch cạo vôi sáng thứ Bảy này á, bên em còn giờ trống không?" },
      { tool: "Xem lịch", at: 8.71, dur: 2.27, detail: "Cạo vôi · bác sĩ Vy · T7 24/10 · buổi sáng", slots: [{ t: "8:30" }, { t: "9:00" }, { t: "9:30", free: 1 }, { t: "10:00", free: 1, pick: 21.14 }, { t: "10:30" }] },
      { s: "Bonia", at: 9.13, text: "Dạ đợi em một chút nha." },
      { s: "Bonia", at: 11.59, text: "Dạ, sáng thứ Bảy 24 tháng 10 bên em còn trống 9 giờ rưỡi với 10 giờ của bác sĩ Vy." },
      { s: "Bonia", at: 17.61, text: "Mình muốn chọn giờ nào ạ?" },
      { s: "Khách", at: 19.84, text: "Thì cho anh 10 giờ đi." },
      { s: "Khách", at: 22.28, text: "Với lại cho anh hỏi một chút xíu là nếu mà cạo vôi hay là khám tổng quát á thì giá bên em như thế nào vậy?" },
      { s: "Bonia", at: 29.44, text: "Dạ, khám tổng quát bên em miễn phí." },
      { s: "Bonia", at: 31.74, text: "Còn cạo vôi, đánh bóng hai hàm từ 200.000 đến 300.000 đồng tùy mức vôi à." },
      { s: "Khách", at: 36.99, text: "À, ok. Vậy em đặt giùm anh cái lịch 10 giờ… 10 giờ sáng nha." },
      { tool: "Ghi yêu cầu", at: 41.87, dur: 1.83, detail: "Cạo vôi · T7 24/10 · 10:00 · bác sĩ Vy", rows: [["Trạng thái", "Chờ lễ tân xác nhận"]] },
      { s: "Bonia", at: 42.0, text: "Dạ để em ghi lại yêu cầu đặt lịch nha." },
      { s: "Bonia", at: 45.66, text: "Dạ, bên em sẽ nhắn tin xác nhận lại lịch hẹn qua số điện thoại này ạ." },
      { s: "Bonia", at: 49.96, text: "Cảm ơn mình đã gọi tới Nha khoa Hoa Ngà ạ." },
    ],
    result: {
      at: 43.7,
      tag: "Đặt hẹn",
      main: "Cạo vôi · bác sĩ Vy",
      sub: "T7 24/10 · 10:00 · khách chưa cho tên",
      badge: "Chờ xác nhận",
      action: "Xác nhận",
    },
  },
  {
    sector: "khach-san",
    tag: "Khách sạn · Đặt phòng",
    title: "Đặt phòng đôi tối thứ Bảy",
    biz: "Homestay Nhà Sò Điệp",
    caller: "Anh Duy · " + nb("0900 000 201"),
    src: callAudio(2),
    end: 50.59,
    events: [
      { s: "Bonia", at: 0.35, text: "Dạ Nhà Sò Điệp xin nghe ạ." },
      { s: "Khách", at: 2.29, text: "Em ơi, anh muốn đặt cái phòng tối thứ Bảy này á, cho hai người. Bên em còn không?" },
      { tool: "Xem phòng trống", at: 7.33, dur: 2.32, detail: "T7 10/10 → CN 11/10 · 2 khách", slots: [{ t: "Đôi hướng biển · 1.150.000đ", free: 1, pick: 22.25 }, { t: "Đôi tiêu chuẩn · 850.000đ", free: 1 }, { t: "Gia đình · hết" }, { t: "Nhóm · hết" }], rows: [["Gồm", "Ăn sáng"]] },
      { s: "Bonia", at: 7.78, text: "Dạ, em coi giúp phòng tối thứ Bảy này cho hai người nha." },
      { s: "Bonia", at: 11.74, text: "Dạ, tối thứ Bảy này còn phòng đôi hướng biển, 1 triệu 150 ngàn một đêm, và phòng đôi tiêu chuẩn, 850 ngàn một đêm." },
      { s: "Bonia", at: 18.32, text: "Đều gồm ăn sáng. Mình muốn chọn phòng nào ạ?" },
      { s: "Khách", at: 21.11, text: "À, cho anh cái phòng hướng biển đi." },
      { s: "Bonia", at: 24.28, text: "Dạ, mình cho em xin tên người đặt để em ghi nhận yêu cầu đặt phòng đôi hướng biển tối thứ Bảy này cho hai người ạ?" },
      { s: "Khách", at: 29.75, text: "Anh tên Duy." },
      { s: "Bonia", at: 31.92, text: "Dạ, em xin nhắc lại: phòng đôi hướng biển, tối thứ Bảy này, một đêm, cho hai người, tên Duy, đúng không ạ?" },
      { s: "Khách", at: 38.43, text: "Đúng rồi." },
      { tool: "Ghi yêu cầu", at: 39.35, dur: 1.4, detail: "Đôi hướng biển · T7 10/10 · 1 đêm · 2 khách", rows: [["Trạng thái", "Chờ xác nhận"]] },
      { s: "Bonia", at: 41.64, text: "Dạ, bên em sẽ nhắn tin xác nhận lại qua số điện thoại này ạ." },
      { s: "Bonia", at: 44.56, text: "Cảm ơn mình, chúc mình buổi chiều vui vẻ ạ." },
      { s: "Khách", at: 46.99, text: "OK, cảm ơn." },
      { s: "Bonia", at: 49.48, text: "Dạ vâng ạ." },
    ],
    result: {
      at: 40.75,
      tag: "Đặt phòng",
      main: "Anh Duy · Đôi hướng biển",
      sub: "T7 10/10 → CN 11/10 · 2 khách · 1.150.000đ",
      badge: "Chờ xác nhận",
      action: "Xác nhận",
    },
  },
  {
    sector: "nha-hang",
    tag: "Nhà hàng · Đặt bàn",
    title: "Đặt bàn 4 người tối thứ Sáu",
    biz: "Nhà hàng Bếp Sen",
    caller: "Anh Tuấn · " + nb("0900 000 401"),
    src: callAudio(3),
    end: 50.07,
    events: [
      { s: "Bonia", at: 0.35, text: "Dạ Bếp Sen xin nghe ạ." },
      { s: "Khách", at: 2.77, text: "Em ơi, anh muốn đặt bàn tối thứ Sáu này cho khoảng 4 người á, thì bên em còn trống không? Khoảng 7 giờ ạ." },
      { tool: "Xem bàn trống", at: 8.92, dur: 2.5, detail: "T6 9/10 · 19:00 · 4 khách", slots: [{ t: "Sảnh chính", free: 1, pick: 20.83 }, { t: "Phòng riêng tầng 2 · từ 8 khách" }, { t: "Sân vườn · hết" }] },
      { s: "Bonia", at: 9.32, text: "Dạ em coi bàn trống tối thứ Sáu lúc 7 giờ cho bốn khách ạ." },
      { s: "Bonia", at: 12.42, text: "Dạ, tối thứ Sáu lúc 7 giờ, sảnh chính bên em đang còn bàn cho bốn khách ạ." },
      { s: "Bonia", at: 17.24, text: "Mình chọn sảnh chính nha?" },
      { s: "Khách", at: 18.81, text: "OK, OK. Cho anh… cho anh đặt cái sảnh chính đi." },
      { s: "Bonia", at: 22.75, text: "Dạ, mình cho em xin tên để bên em ghi nhận đặt bàn ạ." },
      { s: "Khách", at: 26.58, text: "Anh tên Tuấn." },
      { s: "Bonia", at: 28.79, text: "Dạ, em nhắc lại: một yêu cầu đặt bàn tên Tuấn, bốn khách, tối thứ Sáu ngày 09 tháng 10 lúc 7 giờ ở sảnh chính, đúng không ạ?" },
      { s: "Khách", at: 37.58, text: "Đúng rồi." },
      { tool: "Ghi yêu cầu", at: 39.37, dur: 1.35, detail: "Sảnh chính · T6 9/10 · 19:00 · 4 khách", rows: [["Trạng thái", "Chờ lễ tân xác nhận"]] },
      { s: "Bonia", at: 39.75, text: "Dạ, bên em sẽ nhắn tin xác nhận lại qua số điện thoại này ạ." },
      { s: "Bonia", at: 43.97, text: "Cảm ơn mình, hẹn gặp lại ạ." },
      { s: "Khách", at: 45.94, text: "OK, OK. Cảm ơn em." },
      { s: "Bonia", at: 48.5, text: "Dạ, em cảm ơn anh ạ." },
    ],
    result: {
      at: 40.72,
      tag: "Đặt bàn",
      main: "Anh Tuấn · 4 khách",
      sub: "T6 9/10 · 19:00 · sảnh chính",
      badge: "Chờ xác nhận",
      action: "Xác nhận",
    },
  },
];

export default CALLS;
