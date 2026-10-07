/* § 02's lookup demo (handoff v6 `LK`). The app's web lookup reads places
 * to stay only (hotel sites, Google Maps, Booking.com, Agoda…), so the demo
 * always shows a hotel, whatever sector the page is on (founder 2026-10-07):
 * Khách sạn Sân Nhài, the fictional hotel of the app's own samples
 * (reception-app data/settings.js), with the app's field labels.
 *
 * A row is [label, value, source] for a value Bonia found, or
 * [label, null, null, options, fill] when Bonia needs the owner: options are
 * [value, source?] tiles; `fill` marks a field Bonia didn't find (CẦN BẠN
 * ĐIỀN) rather than sources that disagree.
 *
 * `edit` is step 04's inline edit: [row index, new value, what Bonia says on
 * the next call]. Here the owner corrects a room price read on Agoda to the
 * hotel's own, as the app asks them to. */

export const HOTEL = {
  noun: "khách sạn",
  name: "Khách sạn Sân Nhài",
  area: "Quận 3, TP.HCM",
  rows: [
    ["Địa chỉ", "27 đường Sân Nhài, phường Xuân Hòa", "Booking.com"],
    ["Giờ nhận phòng", null, null, [["13:00", "trang web"], ["14:00", "Booking.com"]]],
    ["Giờ trả phòng", "12:00", "trang web"],
    ["Deluxe ban công", "920.000đ/đêm cuối tuần", "Agoda"],
    ["Tiện nghi chung", "Wi-Fi miễn phí · Thang máy · Đưa đón sân bay", "Booking.com"],
    ["Thú cưng", null, null, [["Không nhận"], ["Nhận, có phụ thu"]], true],
  ],
  edit: [3, "850.000đ/đêm cuối tuần", "Dạ phòng Deluxe ban công cuối tuần là 850 nghìn một đêm ạ."],
};

// The four step cards: [number, title, line, the second the step starts at].
export const STEPS = [
  ["01", "Nhập tên cơ sở", "Setup cực kỳ đơn giản", 0],
  ["02", "Bonia tự tìm trên mạng", "Google Maps và Websites online.", 4.2],
  ["03", "Xem lại, sửa, rồi Lưu", "Đối chiếu và xác nhận thông tin", 9],
  ["04", "Chỉnh sửa trực tiếp", "Bonia sẽ cập nhật ngay lập tức.", 14],
];

// The timeline, in seconds (handoff v6 "§02: AI lookup demo").
export const T = {
  search: STEPS[1][3], // the wait screen
  review: STEPS[2][3], // the filled-in fields
  edit: STEPS[3][3], // the rest confirmed, one value edited
  end: 19,
};

// What step 02 reads: the business's own site and Google Maps first, then
// every other source its rows name.
export function sourcesOf(d) {
  const named = d.rows.flatMap((r) => [r[2], ...(r[3] || []).map((o) => o[1])]);
  const others = [...new Set(named.filter((x) => x && x !== "trang web" && x !== "Google Maps"))];
  return [`Trang web ${d.noun}`, "Google Maps", ...others];
}
