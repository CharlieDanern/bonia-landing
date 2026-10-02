// Đăng nhập + Bắt đầu (frames 3.0 A–H, 3.1 A–N).
// Owner: login-onboarding.

export const ONBOARDING_STEPS = ["Tìm", "Xem lại", "Nghe máy", "Số điện thoại", "Gọi thử"];

// URL slugs for /bat-dau/:step
export const STEP_SLUGS = ["tim", "xem-lai", "nghe-may", "so-dien-thoai", "goi-thu"];

export const LOGIN = {
  phone: "0900 000 300",
  wrongPhone: "0900 000 311", // 3.0 G: number without the Bonia app
  sampleCode: "482913",
  resendSeconds: 45,
  attemptsLeft: 3,
};

export const SEARCH_FORM = {
  name: "Khách sạn Sân Nhài",
  area: "Quận 3, TP.HCM",
  links: ["booking.com/hotel/vn/san-nhai"],
};

// 3.1 C: same-name results.
export const MATCHES = [
  {
    id: "san-nhai",
    name: "Khách sạn Sân Nhài",
    address: "18/4 Võ Hữu Lân, phường Xuân Hòa, TP.HCM",
    meta: "GOOGLE MAPS · 4,6★ · 214 ĐÁNH GIÁ",
    photo: true,
  },
  { id: "homestay", name: "Sân Nhài Homestay", address: "Phường 8, Đà Lạt, Lâm Đồng", meta: "GOOGLE MAPS · 41 ĐÁNH GIÁ", photo: true },
  { id: "nha-nghi", name: "Nhà nghỉ Sân Nhài", address: "Phường Linh Xuân, TP.HCM", meta: "FACEBOOK", photo: false },
];

// 3.1 A chips, 3.1 E sources (they stream in one by one; no % bar).
// state: read | notFound | reading | waiting
export const AI_SOURCES = [
  { id: "web", label: "Trang web khách sạn", chip: "TRANG WEB", detail: "", state: "read" },
  { id: "maps", label: "Google Maps", chip: "GOOGLE MAPS", detail: "đường đi, 214 đánh giá", state: "read" },
  { id: "booking", label: "Booking.com", chip: "BOOKING.COM", detail: "5 loại phòng, 23 tiện ích", state: "read" },
  { id: "agoda", label: "Agoda", chip: "AGODA", detail: "", state: "notFound" },
  { id: "facebook", label: "Facebook", chip: "FACEBOOK", detail: "", state: "reading" },
  { id: "traveloka", label: "Traveloka", chip: "TRAVELOKA", detail: "", state: "waiting" },
];

export const SEARCH_PROGRESS = { found: 37, eta: "khoảng 1 phút" };

// 3.1 F: five cards that add up to 41 (18/12/4/5/2), 8 cần điền.
export const REVIEW_CARDS = [
  { n: "01", title: "Khách sạn", sum: "Sân Nhài · khu Quận 3 cũ · nhận 14:00 hay 13:00? · lễ tân 24/7", found: 18, need: 1 },
  {
    n: "02",
    title: "Phòng & giá",
    sum: "14 phòng · 5 loại · giá Booking.com cần đổi sang giá bán qua điện thoại",
    found: 12,
    need: 4,
  },
  { n: "03", title: "Đặt phòng", sum: "Ghi yêu cầu, khách sạn xác nhận · hủy miễn phí trước 24 giờ", found: 4, need: 1 },
  { n: "04", title: "Khách đang ở", sum: "Wifi, giữ hành lý, giặt ủi, thuê xe máy, đưa đón sân bay", found: 5, need: 0 },
  { n: "05", title: "Nhân viên & khẩn cấp", sum: "Lễ tân 24/7 · 7 tình huống khẩn cấp có sẵn", found: 2, need: 2 },
];

// 3.1 G §01 review rows. confirmed=false draws the dashed AI border.
export const REVIEW_01 = {
  allRightCount: 15,
  rows: [
    { id: "ten", label: "Tên", value: "Khách sạn Sân Nhài", source: "GOOGLE MAPS", confirmed: true },
    {
      id: "dia-chi",
      label: "Địa chỉ",
      value: "18/4 Võ Hữu Lân, phường Xuân Hòa · hẻm xe hơi, gần Hồ Con Rùa",
      source: "GOOGLE MAPS",
      confirmed: false,
    },
    {
      id: "nhan-phong",
      label: "Giờ nhận phòng",
      conflict: [
        { value: "14:00", source: "BOOKING.COM" },
        { value: "13:00", source: "TRANG WEB" },
      ],
      selected: 0,
    },
    { id: "tra-phong", label: "Giờ trả phòng", value: "12:00", mono: true, source: "BOOKING.COM", confirmed: true },
    { id: "le-tan", label: "Lễ tân", value: "24/7", source: "FACEBOOK", confirmed: true },
  ],
  question: {
    text: "Khách tới khuya thì sao?",
    options: ["Bấm chuông hoặc gọi lễ tân", "Lễ tân mở cửa cả đêm", "Báo trước giờ tới"],
    selected: 0,
  },
  more: "+ 12 thông tin khác: tên khác, đường vào, gửi xe, 23 tiện ích, giấy tờ, thanh toán…",
  say: "“Dạ khách sạn nhận phòng từ 14 giờ và trả phòng trước 12 giờ trưa ạ. Nếu anh chị tới khuya thì bấm chuông hoặc gọi lễ tân, lễ tân trực 24/7 ạ.”",
};

// 3.1 H: prices are always confirmed one by one ("Đúng hết" skips them).
export const REVIEW_02_PRICES = [
  { id: "tieu-chuan", name: "Tiêu chuẩn", meta: "không cửa sổ · 1 giường 1m6 · 4 phòng", ota: 520000, mine: 450000, confirmed: true },
  { id: "superior", name: "Superior", meta: "cửa sổ · 1 giường 1m6 · 4 phòng", ota: 690000, mine: 550000, confirmed: true },
  { id: "superior-2", name: "Superior 2 giường", meta: "cửa sổ · 2 giường 1m2 · 2 phòng", ota: 720000, mine: 720000, confirmed: false },
  { id: "deluxe", name: "Deluxe ban công hướng phố", meta: "1 giường 1m8, bồn tắm · 2 phòng", ota: 920000, mine: 920000, confirmed: false },
  { id: "gia-dinh", name: "Gia đình", meta: "2 giường 1m6 · 2 phòng", ota: 1250000, mine: 1250000, confirmed: false },
];

export const REVIEW_02_QUESTIONS = [
  { id: "theo-gio", text: "Bạn có nhận khách theo giờ không?", options: ["Có · 2 giờ đầu + mỗi giờ sau", "Không nhận theo giờ"] },
  { id: "qua-dem", text: "Giá qua đêm" },
  { id: "ngay-le", text: "Ngày lễ" },
  { id: "giuong-phu", text: "Giường phụ" },
];

// 3.1 I
export const LISTEN = {
  greeting: "Dạ khách sạn Sân Nhài xin nghe ạ.",
  voices: ["giọng nữ miền Bắc", "giọng nam miền Nam"],
  voice: 0,
  english: true,
};

// 3.1 J
export const PHONE_SETUP = {
  mode: "keep", // keep | vnpt
  number: "0900 000 300",
  carriers: ["Viettel", "Vinaphone", "MobiFone", "Vietnamobile"],
  carrier: "Vinaphone",
  whenOptions: ["Khi không bắt máy", "Khi máy bận", "Cả hai", "Mọi cuộc gọi"],
  when: 0,
  code: "**61*0900000399#",
};

// 3.1 K–N: test call.
export const TEST_CALL = {
  caller: "0900 000 347",
  callerName: "Chị Diệp",
  elapsed: "0:38",
  timeout: "2:00",
  bubbles: [
    { who: "bonia", text: "Dạ khách sạn Sân Nhài xin nghe ạ." },
    { who: "guest", text: "Alo em ơi, tối nay còn phòng đôi có cửa sổ không em?" },
    {
      who: "bonia",
      text: "Dạ tối nay bên em còn phòng Superior có cửa sổ, giường 1m6, giá 550 nghìn một đêm ạ. Anh chị đi mấy người ạ?",
    },
    { who: "guest", text: "Hai người lớn thôi. Giữ cho chị một phòng nha." },
    { who: "bonia", text: "Dạ vâng, cho em xin tên người đặt ạ?" },
  ],
  draft: [
    { label: "Loại phòng", value: "Superior" },
    { label: "Ngày", value: "Tối nay, 1 đêm" },
    { label: "Người", value: "2 người lớn" },
    { label: "Tên", value: "đang hỏi…", pending: true },
  ],
  done: {
    duration: "1:12",
    billed: "1,2",
    summary: "Superior · tối nay 8/10 → 9/10, 1 đêm · 2 người lớn · Bonia báo 550.000đ",
  },
};

// 3.2 C: what is still missing on a first day.
export const MISSING = ["giá qua đêm", "ngày lễ", "giường phụ", "cọc khi đặt qua điện thoại", "ai trực đêm", "ai sửa chữa"];
