// The hotel profile schema (HOTEL_SETTINGS_FIELDS.md v2, founder go 2026-10-04).
// Plain data, no imports: the same file drives Cài đặt, the AI import and the
// live-prompt generator.
//
// Every field has:
//   label   what the owner sees
//   type    text · mono · area · time · hours · number · chips (one) · multi ·
//           tags (free chips) · toggle · list (rows; cols = column labels) ·
//           promos ([{ title, from, to, details, price }]: dates YYYY-MM-DD) ·
//           holidays ([{ title, from, to, price }]: dates YYYY-MM-DD; Vietnam's holidays offered in a picker) ·
//           phones (string[]: one number per box) · priced ([{ name, included, price, note }]: included in the
//           room price (a note), or its own price) · sms ({ opening, parts, extra, thanks }: the confirmation SMS
//           the app writes after a booking, change or cancellation; the owner sends it)
//   kind    D fact · C business policy · Q permission (what Bonia may say/do)
//   live    1 always in the call prompt · 2 if the budget allows, else a one-line
//           summary + backend · 3 backend lookup only · 0 not part of any prompt
//   note    a locked line shown under the field (a system rule, not editable)
//   ph      the placeholder of an empty field
//   opt     often empty: the placeholder adds "Để trống nếu không có", and an empty one never asks "Cần bạn điền"
//   more    multi: the owner can add items of their own besides opts
//   rows    area: the textarea's height in lines (default 3)
//   say     the label in the prompts when the owner's label carries a hint
//   opts    options for chips / multi
//
// A stored value is { v, st, src, alts } (see hotelValue below).

export const FIELDS = {
  // 01 · Thông tin chung
  name: { label: "Tên khách sạn", type: "text", kind: "D", live: 1 },
  aliases: { label: "Tên khác khách hay gọi", type: "tags", kind: "D", live: 1 },
  type: { label: "Loại chỗ nghỉ", type: "chips", kind: "D", live: 1, opts: ["Khách sạn", "Khách sạn mini", "Nhà nghỉ", "Homestay", "Resort", "Farmstay", "Căn hộ dịch vụ", "Villa"] },
  // founder 2026-10-05: one box per number, and a button for more
  hotline: { label: "Hotline, điện thoại quầy", type: "phones", kind: "D", live: 3 },
  deskHours: { label: "Giờ quầy có người", type: "hours", kind: "D", live: 1 },
  afterHours: { label: "Lưu ý khác", say: "Lưu ý về quầy lễ tân", type: "area", kind: "C", live: 2, ph: "Vd: tới sau 22:00 thì gọi trước; cổng khóa lúc 23:00" },
  languages: { label: "Ngôn ngữ phục vụ", type: "multi", kind: "D", live: 1, opts: ["Tiếng Việt", "Tiếng Anh", "Tiếng Trung", "Tiếng Hàn", "Tiếng Nhật", "Tiếng Nga"] },

  // 02 · Vị trí & đường đi
  address: { label: "Địa chỉ", type: "text", kind: "D", live: 1 },
  addressOld: { label: "Địa chỉ cũ", type: "text", kind: "D", live: 1, opt: true },
  landmark: { label: "Mốc dễ tìm", type: "text", kind: "D", live: 1 },
  directions: { label: "Đường vào", type: "text", kind: "D", live: 2, opt: true },
  parking: { label: "Gửi xe máy, ô tô", type: "text", kind: "D", live: 1 },
  sights: { label: "Điểm tham quan gần", type: "list", kind: "D", live: 3, cols: ["Nơi", "Khoảng cách"] },
  transport: { label: "Ga, sân bay, bến xe", type: "list", kind: "D", live: 3, cols: ["Nơi", "Khoảng cách"] },
  nearby: { label: "Tiện ích xung quanh (ATM, nhà thuốc, cửa hàng tiện lợi...)", say: "Tiện ích xung quanh", type: "list", kind: "D", live: 3, cols: ["Nơi", "Ghi chú"] },

  // 03 · Nhận & trả phòng
  checkin: { label: "Giờ nhận phòng", type: "time", kind: "D", live: 1 },
  checkout: { label: "Giờ trả phòng", type: "time", kind: "D", live: 1 },
  earlyLate: { label: "Chính sách nhận và trả phòng sớm/trễ", say: "Nhận phòng sớm, trả phòng trễ", type: "text", kind: "C", live: 2, ph: "Cần quản lý xác nhận", note: "Bonia không tự hứa nhận sớm, trả trễ" },
  idDocs: { label: "Giấy tờ khi nhận phòng", type: "multi", kind: "C", live: 2, opts: ["CCCD", "VNeID", "Hộ chiếu", "Bằng lái xe"] },
  minAge: { label: "Tuổi nhận phòng, trẻ dưới 18 đi một mình", type: "text", kind: "C", live: 3, opt: true },
  checkinDeposit: { label: "Cọc khi nhận phòng", type: "text", kind: "C", live: 2, opt: true },
  luggage: { label: "Giữ hành lý", type: "toggle", kind: "D", live: 3, on: "Có giữ hành lý cho khách" },

  // 04 · Phòng & giá (chung cho mọi phòng; từng loại phòng ở ROOM_FIELDS)
  // Wi-Fi is in Tiện nghi chung (founder 2026-10-05: every hotel has it)
  roomAmenities: { label: "Tiện nghi có ở mọi phòng", type: "multi", kind: "D", live: 2, more: true, opts: ["Máy lạnh", "Quạt", "Nước nóng", "TV", "Tủ lạnh", "Máy sấy tóc", "Ấm siêu tốc", "Nước suối", "Két sắt", "Bàn làm việc"] },
  priceTax: { label: "Thuế, phí dịch vụ", type: "chips", kind: "D", live: 1, opts: ["Giá đã gồm thuế, phí", "Chưa gồm thuế, phí"] },
  priceIncludes: { label: "Giá đã gồm (ăn sáng buffet, tea party...)", say: "Giá đã gồm", type: "tags", kind: "D", live: 1 },
  weekendNights: { label: "Đêm tính giá cuối tuần", type: "multi", kind: "D", live: 1, opts: ["Thứ Sáu", "Thứ Bảy", "Chủ nhật"] },
  extraPerson: { label: "Trẻ em và người thêm", type: "list", kind: "C", live: 2, cols: ["Ai", "Phụ thu"] },
  minNights: { label: "Số đêm tối thiểu", type: "text", kind: "C", live: 2, opt: true, ph: "Vd: Tết tối thiểu 2 đêm" },
  // founder 2026-10-05: we know Vietnam's holidays (data/vnHolidays.js); the owner picks them and sets the price
  holidays: { label: "Ngày lễ, Tết", type: "holidays", kind: "C", live: 3, opt: true },
  // founder 2026-10-05: a promotion is posted every so often, so each one has its own title, dates, details and price
  promos: { label: "Khuyến mãi, combo", type: "promos", kind: "D", live: 2, opt: true },

  // 05 · Chính sách
  pets: { label: "Thú cưng", type: "chips", kind: "C", live: 1, opts: ["Không nhận", "Nhận, có phụ thu", "Nhận miễn phí"] },
  smoking: { label: "Hút thuốc", type: "multi", kind: "C", live: 2, opts: ["Không hút trong phòng", "Có khu hút thuốc", "Có phòng hút thuốc"] },
  deposit: { label: "Đặt cọc khi đặt phòng", type: "area", kind: "C", live: 2, note: "Bonia không đọc số tài khoản, không nói đã nhận tiền" },
  // the policy itself, never "liên hệ bộ phận đặt phòng": the caller is already talking to it (founder 2026-10-05)
  changeDate: { label: "Đổi ngày", type: "text", kind: "C", live: 2, ph: "Vd: đổi miễn phí nếu báo trước 3 ngày, tùy phòng trống" },
  cancel: { label: "Hủy phòng, hoàn cọc, không đến", type: "area", kind: "C", live: 2 },
  payment: { label: "Cách thanh toán", type: "multi", kind: "C", live: 2, opts: ["Tiền mặt", "Chuyển khoản", "Thẻ", "Ví điện tử"] },
  vat: { label: "Hóa đơn VAT", type: "toggle", kind: "C", live: 3, on: "Có xuất hóa đơn VAT" },
  houseRules: { label: "Giờ yên tĩnh, tiệc, khách ngoài", type: "area", kind: "C", live: 3, opt: true },
  policyOther: { label: "Chính sách khác", type: "area", kind: "C", live: 2, opt: true },

  // 06 · Tiện nghi & dịch vụ
  amenities: { label: "Tiện nghi chung", type: "multi", kind: "D", live: 1, more: true, opts: ["Wi-Fi miễn phí", "Hồ bơi", "Thang máy", "Nhà hàng", "Quầy bar", "Phòng gym", "Spa, massage", "Khu BBQ", "Vườn", "Sân chơi trẻ em", "Phòng họp", "Giặt ủi", "Đưa đón sân bay", "Thuê xe máy", "Bãi đỗ ô tô"] },
  breakfast: { label: "Bữa sáng", type: "text", kind: "D", live: 1 },
  dining: { label: "Nhà hàng, đặt món, BBQ", type: "area", rows: 4, kind: "D", live: 2, opt: true },
  // founder 2026-10-05: a button for "đã gồm trong giá phòng", else a price, so every owner writes it the same way
  activities: { label: "Hoạt động, trải nghiệm", type: "priced", kind: "D", live: 2, opt: true },
  services: { label: "Dịch vụ có phí", type: "list", kind: "D", live: 3, opt: true, cols: ["Dịch vụ", "Giá"] },
  // how often a room is cleaned and towels, sheets changed during a stay, and how a guest asks for more
  housekeeping: { label: "Dọn phòng", type: "text", kind: "D", live: 3, ph: "Vd: dọn mỗi ngày 9:00–15:00, thay khăn mỗi ngày, ga giường 2 ngày một lần" },
  dayVisit: { label: "Khách vãng lai vào chơi", type: "text", kind: "C", live: 3, opt: true, ph: "Vd: khách ngoài vào hồ bơi 100.000đ/người" },
  groups: { label: "Đoàn, sự kiện", type: "text", kind: "C", live: 2, opt: true },

  // 07 · Nhận yêu cầu đặt phòng
  askFor: { label: "Hỏi khách khi đặt", type: "multi", kind: "Q", live: 1, opts: ["Tên", "Ngày nhận phòng", "Số đêm", "Số người", "Trẻ em và tuổi", "Giờ tới", "Yêu cầu riêng", "Email"] },
  groupSize: { label: "Số lượng khách đặt cần quản lý tư vấn trực tiếp", type: "number", kind: "Q", live: 1 },
  channels: { label: "Kênh đặt phòng", type: "list", kind: "D", live: 3, opt: true, cols: ["Kênh", "Đường dẫn"] },
  // founder 2026-10-06: the owner picks what the confirmation SMS says; never in Bonia's prompts
  smsConfirm: { label: "Tin nhắn xác nhận", type: "sms", kind: "Q", live: 0, opt: true },

  // 08 · Cách nghe máy
  greeting: { label: "Khi nhấc máy", type: "text", kind: "Q", live: 1 },
  voice: { label: "Giọng", type: "voice", kind: "Q", live: 0 },
  english: { label: "Tiếng Anh", type: "toggle", kind: "Q", live: 1, on: "Khách nói tiếng Anh thì Bonia trả lời bằng tiếng Anh" },

  // 09 · Thông tin khác
  extra: { label: "Điều khác Bonia nên biết", type: "area", rows: 7, kind: "D", live: 3, opt: true },
  faq: { label: "Hỏi – đáp", type: "list", kind: "D", live: 3, opt: true, cols: ["Khách hỏi", "Trả lời"] },
};

/** Section → cards → field keys. §04 also renders the room cards (ROOM_FIELDS). */
export const SECTIONS = [
  { key: "s1", n: "01", title: "Thông tin chung", cards: [["Khách sạn", ["name", "aliases", "type", "languages", "hotline"]], ["Quầy lễ tân", ["deskHours", "afterHours"]]] },
  { key: "s2", n: "02", title: "Vị trí & đường đi", cards: [["Địa chỉ", ["address", "addressOld", "landmark", "directions", "parking"]], ["Quanh đây", ["sights", "transport", "nearby"]]] },
  { key: "s3", n: "03", title: "Nhận & trả phòng", cards: [["Giờ giấc", ["checkin", "checkout", "earlyLate"]], ["Khi nhận phòng", ["idDocs", "minAge", "checkinDeposit", "luggage"]]] },
  { key: "s4", n: "04", title: "Phòng & giá", cards: [["Chung cho mọi phòng", ["roomAmenities", "priceTax", "priceIncludes", "weekendNights", "extraPerson", "minNights"]]], rooms: true },
  { key: "s5", n: "05", title: "Chính sách", cards: [["Khách", ["pets", "smoking", "houseRules", "policyOther"]], ["Cọc, đổi, hủy", ["deposit", "changeDate", "cancel", "payment", "vat"]]] },
  { key: "s6", n: "06", title: "Tiện nghi & dịch vụ", cards: [["Tiện nghi", ["amenities", "housekeeping"]], ["Ăn uống", ["breakfast", "dining"]], ["Hoạt động, dịch vụ", ["activities", "services", "dayVisit", "groups"]]] },
  { key: "s7", n: "07", title: "Nhận yêu cầu đặt phòng", cards: [["Khi khách muốn đặt", ["askFor", "groupSize", "channels"]], ["Tin nhắn xác nhận", ["smsConfirm"]]] },
  { key: "s8", n: "08", title: "Cách nghe máy", cards: [["Lời chào", ["greeting"]], ["Giọng, ngôn ngữ", ["voice", "english"]]] },
  { key: "s9", n: "09", title: "Thông tin khác", cards: [["Thông tin khác", ["extra", "faq"]]] },
  // founder 2026-10-05: last, because promotions change every so often
  { key: "s10", n: "10", title: "Lễ Tết, khuyến mãi", cards: [["Ngày lễ, Tết", ["holidays"]], ["Khuyến mãi", ["promos"]]] },
];

/** One room type. Prices: daily (ngày thường / cuối tuần), overnight, hourly, monthly. */
export const ROOM_FIELDS = {
  name: { label: "Tên loại phòng", type: "text", live: 1 },
  aliases: { label: "Tên khác dễ nhớ", type: "tags", live: 2 },
  count: { label: "Số phòng", type: "number", live: 3 },
  bed: { label: "Giường", type: "text", live: 2 },
  maxAdults: { label: "Người lớn tối đa", type: "number", live: 1 },
  maxChildren: { label: "Trẻ em tối đa", type: "number", live: 2 },
  size: { label: "Diện tích (m²)", type: "number", live: 3 },
  view: { label: "View, cửa sổ, ban công", type: "text", live: 2 },
  floor: { label: "Tầng, thang", type: "text", live: 3 },
  extras: { label: "Tiện nghi riêng", type: "tags", live: 3 },
  extraBed: { label: "Giường phụ, nôi", type: "text", live: 2 },
  // what is specific to this room type (founder 2026-10-05); every room has a private bathroom, so that field went
  notes: { label: "Lưu ý", type: "area", live: 2 },
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

/** The placeholder of an empty field: its example, and that it may stay empty. */
export const placeholderOf = (def) => [def.ph, def.opt && "Để trống nếu không có"].filter(Boolean).join(". ") || undefined;

/** Where a value came from. */
export const SOURCE_LABEL = { site: "trang web", booking: "Booking.com", agoda: "Agoda", tripcom: "Trip.com", traveloka: "Traveloka", airbnb: "Airbnb", tripadvisor: "TripAdvisor", gmaps: "Google Maps", facebook: "Facebook", other: "nguồn khác", owner: "chủ nhập", test: "Thử Bonia" };

/**
 * A stored value: { v, st, src, alts }
 *   v     the value (string · number · boolean · string[] · list rows [[a, b], …] · hours {from, to, allDay})
 *   st    "ok" confirmed by the owner · "new" found by AI, not confirmed · "conflict" sources disagree (see alts)
 *   src   { t: SOURCE_LABEL key, url, at }
 *   alts  [{ v, src }] other values when st = "conflict"
 */
export const hotelValue = (v, st = "ok", src = null, alts = null) => ({ v, st, ...(src ? { src } : {}), ...(alts ? { alts } : {}) });

export const isEmpty = (v) =>
  v == null || v === "" || (Array.isArray(v) && v.every((x) => x === "" || x == null)) || (typeof v === "object" && !Array.isArray(v) && "allDay" in v && !v.allDay && !v.from && !v.to);
