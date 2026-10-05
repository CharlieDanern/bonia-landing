// The hotel profile schema (HOTEL_SETTINGS_FIELDS.md v2, founder go 2026-10-04).
// Plain data, no imports: the same file drives Cài đặt, the AI import and the
// live-prompt generator.
//
// Every field has:
//   label   what the owner sees
//   type    text · mono · area · time · hours · number · chips (one) · multi ·
//           tags (free chips) · toggle · list (rows; cols = column labels)
//   kind    D fact · C business policy · Q permission (what Bonia may say/do)
//   live    1 always in the call prompt · 2 if the budget allows, else a one-line
//           summary + backend · 3 backend lookup only · 0 not part of any prompt
//   note    a locked line shown under the field (a system rule, not editable)
//   opts    options for chips / multi
//
// A stored value is { v, st, src, alts } (see hotelValue below).

export const FIELDS = {
  // 01 · Thông tin chung
  name: { label: "Tên khách sạn", type: "text", kind: "D", live: 1 },
  aliases: { label: "Tên khác khách hay gọi", type: "tags", kind: "D", live: 1 },
  type: { label: "Loại chỗ nghỉ", type: "chips", kind: "D", live: 1, opts: ["Khách sạn", "Khách sạn mini", "Nhà nghỉ", "Homestay", "Farmstay, resort", "Căn hộ dịch vụ", "Villa"] },
  hotline: { label: "Hotline, điện thoại quầy", type: "mono", kind: "D", live: 3 },
  deskHours: { label: "Giờ quầy có người", type: "hours", kind: "D", live: 1 },
  afterHours: { label: "Ngoài giờ quầy (tới khuya, bị khóa ngoài)", type: "area", kind: "C", live: 2 },
  languages: { label: "Ngôn ngữ phục vụ", type: "multi", kind: "D", live: 1, opts: ["Tiếng Việt", "Tiếng Anh", "Tiếng Trung", "Tiếng Hàn", "Tiếng Nhật", "Tiếng Nga"] },
  legal: { label: "Pháp nhân, mã số thuế", type: "text", kind: "D", live: 3 },

  // 02 · Vị trí & đường đi
  address: { label: "Địa chỉ", type: "text", kind: "D", live: 1 },
  addressOld: { label: "Địa chỉ cũ khách quen gọi", type: "text", kind: "D", live: 1 },
  landmark: { label: "Mốc dễ tìm", type: "text", kind: "D", live: 1 },
  directions: { label: "Đường vào", type: "text", kind: "D", live: 2 },
  parking: { label: "Gửi xe máy, ô tô", type: "text", kind: "D", live: 1 },
  sights: { label: "Điểm tham quan gần", type: "list", kind: "D", live: 3, cols: ["Nơi", "Khoảng cách"] },
  transport: { label: "Ga, sân bay, bến xe", type: "list", kind: "D", live: 3, cols: ["Nơi", "Khoảng cách"] },
  howToGet: { label: "Cách đi tới", type: "area", kind: "D", live: 3 },
  nearby: { label: "Ăn uống, ATM, nhà thuốc quanh đây", type: "list", kind: "D", live: 3, cols: ["Nơi", "Ghi chú"] },

  // 03 · Nhận & trả phòng
  checkin: { label: "Giờ nhận phòng", type: "time", kind: "D", live: 1 },
  checkout: { label: "Giờ trả phòng", type: "time", kind: "D", live: 1 },
  earlyLate: { label: "Nhận sớm, trả trễ", type: "text", kind: "C", live: 2, note: "Bonia không tự hứa nhận sớm, trả trễ" },
  idDocs: { label: "Giấy tờ khi nhận phòng", type: "multi", kind: "C", live: 2, opts: ["CCCD", "VNeID", "Hộ chiếu", "Bằng lái xe"] },
  minAge: { label: "Tuổi nhận phòng, trẻ dưới 18 đi một mình", type: "text", kind: "C", live: 3 },
  checkinDeposit: { label: "Cọc khi nhận phòng", type: "text", kind: "C", live: 2 },
  luggage: { label: "Giữ hành lý", type: "toggle", kind: "D", live: 3, on: "Có giữ hành lý cho khách" },

  // 04 · Phòng & giá (chung cho mọi phòng; từng loại phòng ở ROOM_FIELDS)
  roomAmenities: { label: "Tiện nghi có ở mọi phòng", type: "multi", kind: "D", live: 2, opts: ["Máy lạnh", "Quạt", "Wifi", "Nước nóng", "TV", "Tủ lạnh", "Máy sấy tóc", "Ấm siêu tốc", "Nước suối", "Két sắt", "Bàn làm việc"] },
  priceBasis: { label: "Giá tính theo", type: "chips", kind: "D", live: 1, opts: ["Theo phòng", "Theo người"] },
  priceTax: { label: "Thuế, phí dịch vụ", type: "chips", kind: "D", live: 1, opts: ["Giá đã gồm thuế, phí", "Chưa gồm thuế, phí"] },
  priceIncludes: { label: "Giá đã gồm (từng món cụ thể)", type: "tags", kind: "D", live: 1 },
  weekendNights: { label: "Đêm tính giá cuối tuần", type: "multi", kind: "D", live: 1, opts: ["Thứ Sáu", "Thứ Bảy", "Chủ nhật"] },
  extraPerson: { label: "Trẻ em và người thêm", type: "list", kind: "C", live: 2, cols: ["Ai", "Phụ thu"] },
  minNights: { label: "Số đêm tối thiểu", type: "text", kind: "C", live: 2 },
  holidays: { label: "Ngày lễ, Tết (ngày cụ thể)", type: "list", kind: "C", live: 3, cols: ["Ngày, vd 30/4–2/5", "Giá"] },
  promos: { label: "Khuyến mãi, combo", type: "list", kind: "D", live: 2, cols: ["Tên", "Chi tiết, hạn"] },

  // 05 · Chính sách
  children: { label: "Trẻ em", type: "text", kind: "C", live: 2 },
  pets: { label: "Thú cưng", type: "chips", kind: "C", live: 1, opts: ["Không nhận", "Nhận, có phụ thu", "Nhận miễn phí"] },
  smoking: { label: "Hút thuốc", type: "chips", kind: "C", live: 2, opts: ["Không hút trong phòng", "Có phòng hút thuốc"] },
  deposit: { label: "Đặt cọc khi đặt phòng", type: "area", kind: "C", live: 2, note: "Bonia không đọc số tài khoản, không nói đã nhận tiền" },
  changeDate: { label: "Đổi ngày", type: "text", kind: "C", live: 2 },
  cancel: { label: "Hủy phòng, hoàn cọc, không đến", type: "area", kind: "C", live: 2 },
  payment: { label: "Cách thanh toán", type: "multi", kind: "C", live: 2, opts: ["Tiền mặt", "Chuyển khoản", "Thẻ", "Ví điện tử"] },
  vat: { label: "Hóa đơn VAT", type: "toggle", kind: "C", live: 3, on: "Có xuất hóa đơn VAT" },
  houseRules: { label: "Giờ yên tĩnh, tiệc, khách ngoài", type: "area", kind: "C", live: 3 },

  // 06 · Tiện nghi & dịch vụ
  amenities: { label: "Tiện nghi chung", type: "multi", kind: "D", live: 1, opts: ["Hồ bơi", "Thang máy", "Nhà hàng", "Quầy bar", "Phòng gym", "Spa, massage", "Khu BBQ", "Vườn", "Sân chơi trẻ em", "Phòng họp", "Giặt ủi", "Đưa đón sân bay", "Thuê xe máy", "Bãi đỗ ô tô"] },
  wifi: { label: "Wi-Fi", type: "text", kind: "D", live: 2 },
  breakfast: { label: "Bữa sáng", type: "text", kind: "D", live: 1 },
  dining: { label: "Nhà hàng, đặt món, BBQ", type: "text", kind: "D", live: 2 },
  activities: { label: "Hoạt động, trải nghiệm", type: "list", kind: "D", live: 2, cols: ["Hoạt động", "Đã gồm trong giá phòng, hay giá"] },
  services: { label: "Dịch vụ có phí", type: "list", kind: "D", live: 3, cols: ["Dịch vụ", "Giá"] },
  housekeeping: { label: "Dọn phòng", type: "text", kind: "D", live: 3 },
  dayVisit: { label: "Khách vãng lai vào chơi", type: "text", kind: "C", live: 3 },
  groups: { label: "Đoàn, sự kiện", type: "text", kind: "C", live: 2 },

  // 07 · Nhận yêu cầu đặt phòng
  askFor: { label: "Hỏi khách khi đặt", type: "multi", kind: "Q", live: 1, opts: ["Tên", "Ngày nhận phòng", "Số đêm", "Số người lớn", "Trẻ em và tuổi", "Giờ tới", "Yêu cầu riêng", "Email"] },
  groupSize: { label: "Đoàn từ bao nhiêu người thì chủ gọi lại", type: "number", kind: "Q", live: 1 },
  channels: { label: "Kênh đặt phòng", type: "list", kind: "D", live: 3, cols: ["Kênh", "Đường dẫn"] },

  // 08 · Cách nghe máy
  greeting: { label: "Khi nhấc máy", type: "text", kind: "Q", live: 1 },
  voice: { label: "Giọng", type: "voice", kind: "Q", live: 0 },
  english: { label: "Tiếng Anh", type: "toggle", kind: "Q", live: 1, on: "Khách nói tiếng Anh thì Bonia trả lời bằng tiếng Anh" },
  quote: { label: "Báo giá", type: "chips", kind: "Q", live: 1, opts: ["Giá từng đêm", "Tổng tiền", "Không báo giá"] },
  disclose: { label: "Báo khách đây là trợ lý tự động", type: "toggle", kind: "Q", live: 1, on: "Có, nói ngay sau lời chào" },
  upsell: { label: "Giới thiệu thêm combo, hoạt động", type: "toggle", kind: "Q", live: 1, on: "Khi hợp lý, tối đa 1 lần mỗi cuộc gọi" },
  wifiPass: { label: "Đọc mật khẩu Wi-Fi qua điện thoại", type: "toggle", kind: "Q", live: 1, on: "Có (Bonia không biết người gọi có đang ở không)" },

  // 09 · Thông tin khác
  extra: { label: "Điều khác Bonia nên biết", type: "area", kind: "D", live: 3 },
  faq: { label: "Hỏi – đáp", type: "list", kind: "D", live: 3, cols: ["Khách hỏi", "Trả lời"] },
  fixes: { label: "Câu đã sửa trong Thử Bonia", type: "list", kind: "Q", live: 1, cols: ["Khi khách nói", "Bonia nên nói"] },
};

/** Section → cards → field keys. §04 also renders the room cards (ROOM_FIELDS). */
export const SECTIONS = [
  { key: "s1", n: "01", title: "Thông tin chung", cards: [["Khách sạn", ["name", "aliases", "type", "languages", "hotline", "legal"]], ["Quầy lễ tân", ["deskHours", "afterHours"]]] },
  { key: "s2", n: "02", title: "Vị trí & đường đi", cards: [["Địa chỉ", ["address", "addressOld", "landmark", "directions", "parking"]], ["Quanh đây", ["sights", "transport", "howToGet", "nearby"]]] },
  { key: "s3", n: "03", title: "Nhận & trả phòng", cards: [["Giờ giấc", ["checkin", "checkout", "earlyLate"]], ["Khi nhận phòng", ["idDocs", "minAge", "checkinDeposit", "luggage"]]] },
  { key: "s4", n: "04", title: "Phòng & giá", cards: [["Chung cho mọi phòng", ["roomAmenities", "priceBasis", "priceTax", "priceIncludes", "weekendNights", "extraPerson", "minNights"]], ["Lễ Tết, khuyến mãi", ["holidays", "promos"]]], rooms: true },
  { key: "s5", n: "05", title: "Chính sách", cards: [["Khách", ["children", "pets", "smoking", "houseRules"]], ["Cọc, đổi, hủy", ["deposit", "changeDate", "cancel", "payment", "vat"]]] },
  { key: "s6", n: "06", title: "Tiện nghi & dịch vụ", cards: [["Tiện nghi", ["amenities", "wifi", "housekeeping"]], ["Ăn uống", ["breakfast", "dining"]], ["Hoạt động, dịch vụ", ["activities", "services", "dayVisit", "groups"]]] },
  { key: "s7", n: "07", title: "Nhận yêu cầu đặt phòng", cards: [["Khi khách muốn đặt", ["askFor", "groupSize", "channels"]]] },
  { key: "s8", n: "08", title: "Cách nghe máy", cards: [["Lời chào", ["greeting"]], ["Giọng, ngôn ngữ", ["voice", "english"]], ["Bonia được", ["quote", "disclose", "upsell", "wifiPass"]]] },
  { key: "s9", n: "09", title: "Thông tin khác", cards: [["Thông tin khác", ["extra", "faq"]], ["Đã sửa trong Thử Bonia", ["fixes"]]] },
];

/** One room type. Prices: daily (ngày thường / cuối tuần), overnight, hourly, monthly. */
export const ROOM_FIELDS = {
  name: { label: "Tên loại phòng", type: "text", live: 1 },
  aliases: { label: "Tên khách hay gọi", type: "tags", live: 2 },
  count: { label: "Số phòng", type: "number", live: 3 },
  bed: { label: "Giường", type: "text", live: 2 },
  maxAdults: { label: "Người lớn tối đa", type: "number", live: 1 },
  maxChildren: { label: "Trẻ em tối đa", type: "number", live: 2 },
  size: { label: "Diện tích (m²)", type: "number", live: 3 },
  view: { label: "View, cửa sổ, ban công", type: "text", live: 2 },
  bath: { label: "Phòng tắm", type: "chips", live: 2, opts: ["Riêng", "Chung"] },
  floor: { label: "Tầng, thang", type: "text", live: 3 },
  extras: { label: "Tiện nghi riêng", type: "tags", live: 3 },
  extraBed: { label: "Giường phụ, nôi", type: "text", live: 2 },
};

/** Fixed system rules: always in the call prompt, never owner settings. */
export const SYSTEM_RULES = [
  "Không bao giờ nói đã đặt, đã giữ phòng; khách sạn kiểm tra rồi nhắn lại.",
  "Không kiểm tra phòng trống.",
  "Không đọc số tài khoản, không nói đã nhận tiền.",
  "Không tự hứa nhận sớm, trả trễ, giảm giá, hoàn tiền.",
  "Không cho biết ai đang ở phòng nào.",
  "Quên đồ: ghi lại, không nói đã tìm thấy hay không tìm thấy.",
  "Khẩn cấp: cháy 114, cấp cứu 115, an ninh 113.",
];

/** Where a value came from. */
export const SOURCE_LABEL = { site: "trang web", booking: "Booking.com", agoda: "Agoda", tripcom: "Trip.com", airbnb: "Airbnb", tripadvisor: "TripAdvisor", gmaps: "Google Maps", facebook: "Facebook", other: "nguồn khác", owner: "chủ nhập", test: "Thử Bonia" };

/**
 * A stored value: { v, st, src, alts }
 *   v     the value (string · number · boolean · string[] · list rows [[a, b], …] · hours {from, to, allDay})
 *   st    "ok" confirmed by the owner · "new" found by AI, not confirmed · "conflict" sources disagree (see alts)
 *   src   { t: SOURCE_LABEL key, url, at }
 *   alts  [{ v, src }] other values when st = "conflict"
 */
export const hotelValue = (v, st = "ok", src = null, alts = null) => ({ v, st, ...(src ? { src } : {}), ...(alts ? { alts } : {}) });

export const isEmpty = (v) =>
  v == null || v === "" || (Array.isArray(v) && v.length === 0) || (typeof v === "object" && !Array.isArray(v) && "allDay" in v && !v.allDay && !v.from && !v.to);
