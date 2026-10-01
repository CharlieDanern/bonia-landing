/* §02 "Dễ cài, dễ sửa" sample data (handoff v5 prototype CFG_STEPS, VOICES,
 * TONES and CFG, copied verbatim). Business names, prices and promos are
 * made up; the section says so under the grid. The settings shown (voices,
 * uploads, calendar, customer recognition) are advertised ahead of
 * availability, per Charlie.
 *
 * The prototype's CFG_TITLES repeats the step titles word for word, so the
 * window title reads STEPS[tab][0]. Phone numbers are plain here and go
 * through nb() where they are shown. */

// [title, description] for the five tabs; the title is also the window title.
export const STEPS = [
  ["Giọng nói & cách nói chuyện", "Chọn giọng, viết lời chào, chọn giọng điệu."],
  ["Kiến thức", "Bảng giá, dịch vụ, sản phẩm, ưu đãi, tài liệu."],
  ["Lịch", "Giờ làm, chỗ trống, người phụ trách."],
  ["Thông tin khách hàng", "Khách quen, lịch sử, ghi chú cho lễ tân."],
  ["Các thông tin quan trọng khác", "Địa chỉ, giờ mở cửa, việc cần báo ngay."],
];

// The two voices calls really use (founder 2026-09-29: show 2, not the
// prototype's 3): bossa, Northern female, and vesper, Southern male.
export const VOICES = [
  ["Giọng nữ miền Bắc", "Nhẹ nhàng, rõ chữ"],
  ["Giọng nam miền Nam", "Trầm, chắc chắn"],
];

export const TONES = ["Thân thiện", "Trang trọng", "Ngắn gọn"];

export const DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/* Per sector:
 * calNote, cal [name, 7 days on/off (T2…CN), note], calSay
 * cust [name, phone, note], custSay
 * urgent (the owner's "báo ngay" rule), short (name for the short greeting)
 * file, ext, fileNote, prices [k, v], promos [k, v], promoSay, docs [ext, name]
 * faqQ, faqA, extra [k, v] (hours, address, parking; extraSay reads 1 and 2) */
export const CFG = {
  "phong-kham": {
    calNote: "Lịch làm của từng bác sĩ",
    cal: [
      ["Bác sĩ Vy", [1, 1, 1, 1, 1, 1, 1], "T2–T6 cả ngày"],
      ["Bác sĩ Khang", [0, 1, 0, 1, 0, 1, 0], "Tối T3, T5 · T7"],
      ["Bác sĩ Thư", [1, 0, 1, 0, 1, 0, 0], "Sáng T2, T4, T6"],
    ],
    calSay: "Dạ sáng thứ Bảy bác sĩ Vy còn trống 9 giờ rưỡi và 10 giờ ạ.",
    cust: [
      ["Chị Hà", "0900 000 102", "Khách mới · hỏi cạo vôi"],
      ["Anh Đức", "0900 000 108", "Implant · tái khám mỗi 3 tháng"],
      ["Bé An (mẹ: chị Thu)", "0900 000 109", "Răng trẻ em · bác sĩ Vy"],
    ],
    custSay: "Dạ em chào anh Đức ạ. Anh gọi đặt lịch tái khám implant với bác sĩ Khang phải không ạ?",
    urgent: "Chảy máu không cầm, sưng đau nhiều sau nhổ răng: báo bác sĩ trực ngay.",
    short: "Hoa Ngà",
    file: "bang-gia-nha-khoa.xlsx",
    ext: "XLSX",
    fileNote: "Đã đọc 14 dịch vụ",
    prices: [
      ["Cạo vôi", "200.000–300.000đ"],
      ["Trám răng", "từ 300.000đ"],
      ["Niềng răng", "trả góp theo tháng"],
    ],
    promos: [["Khám và tư vấn miễn phí", "Luôn áp dụng"]],
    promoSay: "Dạ bên em khám và tư vấn miễn phí ạ, anh/chị ghé là bác sĩ xem liền.",
    docs: [
      ["PDF", "Quy trình niềng răng.pdf"],
      ["DOCX", "Chăm sóc sau nhổ răng.docx"],
    ],
    faqQ: "Nhổ răng khôn có đau không?",
    faqA: "Dạ bác sĩ sẽ gây tê trước, anh/chị ghé để bác sĩ xem và tư vấn kỹ ạ.",
    extra: [
      ["Giờ mở cửa", "T2–T7 8:00–20:00 · CN sáng"],
      ["Địa chỉ", "142 đường Hoa Sứ, Bình Thạnh"],
      ["Gửi xe", "Xe máy trước cửa, ô tô bãi đối diện"],
    ],
  },
  "khach-san": {
    calNote: "Phòng trống theo ngày",
    cal: [
      ["Đôi hướng biển", [1, 1, 1, 1, 0, 0, 1], "còn 1 tối T7"],
      ["Đôi tiêu chuẩn", [1, 1, 1, 1, 1, 1, 1], "còn 2"],
      ["Gia đình", [1, 1, 1, 0, 0, 0, 1], "hết T6–T7"],
    ],
    calSay: "Dạ tối thứ Bảy còn 1 phòng đôi hướng biển và 2 phòng tiêu chuẩn ạ.",
    cust: [
      ["Anh Minh", "0900 000 201", "Đã ở 2 lần · thích phòng hướng biển"],
      ["Chị Lan", "0900 000 205", "Đi cùng thú cưng nhỏ"],
      ["Công ty Hải Âu", "0900 000 207", "Đặt đoàn · xuất hóa đơn"],
    ],
    custSay: "Dạ em chào anh Minh ạ. Lần này anh vẫn lấy phòng hướng biển như lần trước nha?",
    urgent: "Khách không vào được phòng, mất đồ, cần hỗ trợ ban đêm: báo quản lý ngay.",
    short: "Nhà Sò Điệp",
    file: "gia-phong-2026.pdf",
    ext: "PDF",
    fileNote: "Đã đọc 4 loại phòng",
    prices: [
      ["Đôi hướng biển (T6–CN)", "1.150.000đ"],
      ["Đôi tiêu chuẩn (T6–CN)", "850.000đ"],
      ["Gia đình (T6–CN)", "1.700.000đ"],
    ],
    promos: [["Ở 2 đêm giảm 10%", "T2–T5 · đến 30/11"]],
    promoSay: "Dạ anh/chị ở 2 đêm từ thứ Hai đến thứ Năm thì được giảm 10% ạ.",
    docs: [
      ["PDF", "Nội quy homestay.pdf"],
      ["DOCX", "Hướng dẫn đường đi.docx"],
    ],
    faqQ: "Có cho mang thú cưng không?",
    faqA: "Dạ bên em nhận thú cưng nhỏ ở phòng tầng trệt, anh/chị báo trước giúp em ạ.",
    extra: [
      ["Lễ tân", "7:00–22:00 mỗi ngày"],
      ["Địa chỉ", "Đường Thùy Vân, Bãi Sau, Vũng Tàu"],
      ["Gửi xe", "Ô tô đỗ trong sân"],
    ],
  },
  "nha-hang": {
    calNote: "Bàn và khu vực theo buổi",
    cal: [
      ["Sảnh chính", [1, 1, 1, 1, 1, 1, 1], "12 bàn"],
      ["Phòng riêng tầng 2", [1, 1, 1, 1, 1, 0, 0], "đã kín tối T7, CN"],
      ["Sân vườn", [1, 1, 1, 1, 0, 0, 0], "kín cuối tuần"],
    ],
    calSay: "Dạ tối thứ Sáu 7 giờ còn phòng riêng tầng 2 cho 8 người ạ.",
    cust: [
      ["Anh Tuấn", "0900 000 401", "Hay đặt phòng riêng · 8–10 khách"],
      ["Chị My", "0900 000 403", "Ăn chay"],
      ["Công ty Minh Long", "0900 000 407", "Tiệc cuối năm · xuất hóa đơn"],
    ],
    custSay: "Dạ em chào anh Tuấn ạ. Anh đặt phòng riêng tầng 2 như lần trước nha?",
    urgent: "Đoàn trên 20 khách, khách đến trễ quá 15 phút, phản ánh món ăn: báo quản lý ngay.",
    short: "Bếp Sen",
    file: "thuc-don-bep-sen.pdf",
    ext: "PDF",
    fileNote: "Đã đọc 38 món",
    prices: [
      ["Set 4 người", "1.490.000đ"],
      ["Set 8 người", "2.890.000đ"],
      ["Phòng riêng · tối thiểu", "3.000.000đ"],
    ],
    promos: [["Đặt trước tặng 1 phần lẩu", "Set từ 4 người"]],
    promoSay: "Dạ anh/chị đặt trước set từ 4 người được tặng thêm một phần lẩu ạ.",
    docs: [
      ["PDF", "Thực đơn đầy đủ.pdf"],
      ["DOCX", "Chính sách đặt cọc đoàn.docx"],
    ],
    faqQ: "Có món chay không?",
    faqA: "Dạ bên em có 8 món chay, em đọc anh/chị nghe hoặc nhắn thực đơn qua tin nhắn nha.",
    extra: [
      ["Giờ mở cửa", "10:00–22:00 · bếp nhận order đến 21:30"],
      ["Địa chỉ", "8 đường Sen Hồng, Quận 3"],
      ["Gửi xe", "Có bãi xe máy và ô tô"],
    ],
  },
};

// The "Bonia sẽ nói…" quote for each tab (the prototype's cfgVals `says`).
// Tab 1 follows the chosen tone; tab 5 is built from the address and parking.
export function quote(tab, tone, biz, c) {
  if (tab === 0) {
    return [
      `Dạ ${biz} xin nghe, em chào anh/chị ạ! Anh/chị cần em hỗ trợ gì ạ?`,
      `Dạ, ${biz} xin kính chào quý khách. Quý khách cần hỗ trợ việc gì ạ?`,
      `Dạ ${c.short} nghe. Anh/chị cần gì ạ?`,
    ][tone];
  }
  if (tab === 4) {
    const park = c.extra[2][1];
    return `Dạ bên em ở ${c.extra[1][1]}, ${park.charAt(0).toLowerCase() + park.slice(1)} ạ.`;
  }
  return [null, c.promoSay, c.calSay, c.custSay][tab];
}

// Avatar initial: the name without its "Anh / Chị / Bé / Công ty" prefix.
export const initial = (name) => name.replace(/^(Anh|Chị|Bé|Công ty)\s+/, "").charAt(0);
