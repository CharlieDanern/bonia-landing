/* § 02's lookup demo (handoff v6 `LK`): one sample business per sector, as
 * the receptionist app's first-run lookup would fill it in (reception-app
 * Settings.jsx: LookupOffer → LookupWait → FieldRow). v6 also has a spa
 * sample; the page has no spa sector (removed 2026-10-01), so it isn't here.
 *
 * A row is [label, value, source] for a value Bonia found, or
 * [label, null, null, options, fill] when Bonia needs the owner: options are
 * [value, source?] tiles; `fill` marks a field Bonia didn't find (CẦN BẠN
 * ĐIỀN) rather than sources that disagree.
 *
 * `edit` is step 04's inline edit: [row index, new value, what Bonia says on
 * the next call]. */

export const LK = {
  "phong-kham": {
    noun: "phòng khám",
    name: "Nha khoa Hoa Ngà",
    short: "Nha khoa Hoa Ngà",
    area: "Quận 3, TP.HCM",
    rows: [
      ["Địa chỉ", "210 Võ Văn Tần, Quận 3", "Google Maps"],
      ["Giờ làm", null, null, [["T2–T7 · 8:00–20:00", "trang web"], ["T2–CN · 8:00–19:00", "Google Maps"]]],
      ["Cạo vôi, đánh bóng", "300.000đ", "trang web"],
      ["Niềng răng", "từ 25.000.000đ", "Facebook"],
      ["Bác sĩ", "BS Vy · BS Khang · BS Thư", "trang web"],
      ["Bảo hiểm", null, null, [["Có nhận bảo hiểm"], ["Không nhận"]], true],
    ],
    edit: [2, "250.000đ", "Dạ cạo vôi và đánh bóng bên em là 250 nghìn ạ."],
  },
  "khach-san": {
    noun: "khách sạn",
    name: "Homestay Nhà Sò Điệp",
    short: "Nhà Sò Điệp",
    area: "Mũi Né, Lâm Đồng",
    rows: [
      ["Địa chỉ", "12 Nguyễn Đình Chiểu, Hàm Tiến", "Google Maps"],
      ["Nhận phòng từ", null, null, [["13:00", "trang web"], ["14:00", "Booking.com"]]],
      ["Trả phòng trước", "12:00", "Booking.com"],
      ["Đôi hướng biển", "1.150.000đ/đêm cuối tuần", "Agoda"],
      ["Tiện nghi", "Wi-Fi · Hồ bơi · Đưa đón sân bay", "Booking.com"],
      ["Thú cưng", null, null, [["Không nhận"], ["Nhận, có phụ phí"]], true],
    ],
    edit: [3, "990.000đ/đêm cuối tuần", "Dạ phòng đôi hướng biển cuối tuần là 990 nghìn một đêm ạ."],
  },
  "nha-hang": {
    noun: "nhà hàng",
    name: "Nhà hàng Bếp Sen",
    short: "Bếp Sen",
    area: "Quận 1, TP.HCM",
    rows: [
      ["Địa chỉ", "15 Lý Tự Trọng, Quận 1", "Google Maps"],
      ["Giờ mở cửa", null, null, [["10:00–22:00", "Google Maps"], ["10:30–22:30", "Foody"]]],
      ["Sức chứa", "120 khách · phòng riêng 20 khách", "trang web"],
      ["Món nổi bật", "Lẩu cá kèo · Gỏi ngó sen", "Foody"],
      ["Gửi xe", "Xe máy miễn phí", "Google Maps"],
      ["Đặt cọc nhóm đông", null, null, [["Từ 10 khách cọc 30%"], ["Không cần cọc"]], true],
    ],
    edit: [2, "150 khách · phòng riêng 30 khách", "Dạ bên em nhận tối đa 150 khách, phòng riêng 30 khách ạ."],
  },
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
