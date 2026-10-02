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

// ── Interactive onboarding (login-onboarding screens) ─────────────────────
// Everything below drives the live demo; the frame-exact values above stay
// the source for the drawn states.

// 3.1 E: sources are read one after another (seconds since "Tìm"). `count`
// is how many facts each adds; together they make the 41 of 3.1 F. The
// drawn frame is t = 9.6: three read, Agoda missing, Facebook at 4/6 → 37.
export const SEARCH_TIMELINE = [
  { id: "web", start: 0, end: 2, count: 9 },
  { id: "maps", start: 2, end: 4, count: 10 },
  { id: "booking", start: 4, end: 6.5, count: 14 },
  { id: "agoda", start: 6.5, end: 7.5, count: 0 },
  { id: "facebook", start: 7.5, end: 10.5, count: 6 },
  { id: "traveloka", start: 10.5, end: 12.5, count: 2 },
];
export const SEARCH_FRAME_T = 9.6;

// §01 rows hidden behind "+ 12 thông tin khác…".
export const REVIEW_01_MORE = [
  { id: "ten-khac", label: "Tên khác", value: "Sân Nhài Hotel", source: "GOOGLE MAPS" },
  { id: "duong-vao", label: "Đường vào", value: "Hẻm xe hơi từ Võ Hữu Lân, cổng sơn trắng", source: "GOOGLE MAPS" },
  { id: "gui-xe", label: "Gửi xe", value: "Xe máy miễn phí trong hẻm · ô tô gửi bãi đầu hẻm", source: "BOOKING.COM" },
  { id: "tien-ich", label: "Tiện ích", value: "23 tiện ích: wifi, máy lạnh, tủ lạnh nhỏ, ấm đun nước…", source: "BOOKING.COM" },
  { id: "giay-to", label: "Giấy tờ", value: "CCCD hoặc hộ chiếu khi nhận phòng", source: "BOOKING.COM" },
  { id: "thanh-toan", label: "Thanh toán", value: "Tiền mặt, chuyển khoản, thẻ", source: "BOOKING.COM" },
  { id: "dien-thoai", label: "Điện thoại", value: "0900 000 300", mono: true, source: "GOOGLE MAPS" },
  { id: "gan-day", label: "Gần đây", value: "Hồ Con Rùa 5 phút đi bộ", source: "GOOGLE MAPS" },
  { id: "ngon-ngu", label: "Lễ tân nói", value: "Tiếng Việt, tiếng Anh", source: "TRANG WEB" },
  { id: "thu-cung", label: "Thú cưng", value: "Không nhận thú cưng", source: "BOOKING.COM" },
  { id: "hut-thuoc", label: "Hút thuốc", value: "Không hút thuốc trong phòng", source: "BOOKING.COM" },
  { id: "thang-may", label: "Thang máy", value: "Có thang máy", source: "BOOKING.COM" },
];

// What Bonia says about a room once its price is confirmed (3.1 H box).
export const ROOM_SAY = {
  "tieu-chuan": "không cửa sổ, giường 1m6",
  superior: "có cửa sổ, giường 1m6",
  "superior-2": "có cửa sổ, 2 giường 1m2",
  deluxe: "ban công hướng phố, giường 1m8, có bồn tắm",
  "gia-dinh": "2 giường 1m6",
};

// §02 questions, asked one at a time ("CẦN BẠN ĐIỀN · 1/4").
export const REVIEW_02_ASK = [
  { id: "theo-gio", text: "Bạn có nhận khách theo giờ không?", short: "theo giờ", options: ["Có · 2 giờ đầu + mỗi giờ sau", "Không nhận theo giờ"] },
  { id: "qua-dem", text: "Bạn có bán qua đêm không?", short: "giá qua đêm", options: ["Có · nhận sau 21:00", "Không bán qua đêm"] },
  { id: "ngay-le", text: "Ngày lễ tính giá thế nào?", short: "ngày lễ", options: ["Như cuối tuần", "Báo giá riêng từng dịp", "Không đổi giá"] },
  { id: "giuong-phu", text: "Có giường phụ không?", short: "giường phụ", options: ["Có · tính thêm", "Không có giường phụ"] },
];

// §03–§05 (not drawn in this round: same row / question pattern as §01).
export const REVIEW_SECTIONS = {
  "03": {
    lead: "Bonia chỉ ghi yêu cầu. Khách sạn xác nhận từng đặt phòng.",
    rows: [
      { id: "huy", label: "Hủy phòng", value: "Miễn phí trước 24 giờ", source: "BOOKING.COM" },
      { id: "tre-em", label: "Trẻ em", value: "Dưới 6 tuổi ngủ chung miễn phí", source: "BOOKING.COM" },
      { id: "nhan-som", label: "Nhận sớm, trả trễ", value: "Tùy phòng trống, hỏi lễ tân", source: "TRANG WEB" },
      { id: "dat-truoc", label: "Đặt trước", value: "Nhận đặt trước tới 3 tháng", source: "BOOKING.COM" },
    ],
    locked: "Tự đặt phòng — Cần kết nối phần mềm quản lý khách sạn (sắp có)",
    questions: [
      {
        id: "coc",
        text: "Khách đặt qua điện thoại có cần cọc không?",
        options: ["Cọc 1 đêm", "Cọc 50%", "Không cần cọc"],
      },
    ],
    say: "“Dạ em ghi lại yêu cầu đặt phòng của anh chị, lễ tân sẽ gọi lại để xác nhận ạ. Hủy miễn phí trước 24 giờ ạ.”",
  },
  "04": {
    rows: [
      { id: "wifi", label: "Wifi", value: "Miễn phí trong phòng", source: "BOOKING.COM" },
      { id: "hanh-ly", label: "Giữ hành lý", value: "Miễn phí trong ngày trả phòng", source: "BOOKING.COM" },
      { id: "giat-ui", label: "Giặt ủi", value: "Có, tính theo ký", source: "BOOKING.COM" },
      { id: "xe-may", label: "Thuê xe máy", value: "Có, hỏi lễ tân", source: "GOOGLE MAPS" },
      { id: "san-bay", label: "Đưa đón sân bay", value: "Có, tính phí, báo trước 1 ngày", source: "BOOKING.COM" },
    ],
    questions: [],
    say: "“Dạ khách sạn có giữ hành lý miễn phí trong ngày trả phòng, anh chị cứ gửi ở quầy lễ tân ạ.”",
  },
  "05": {
    rows: [
      { id: "le-tan-05", label: "Lễ tân", value: "Trực 24/7", source: "FACEBOOK" },
      { id: "khan-cap", label: "Khẩn cấp", value: "7 tình huống có sẵn: cháy, cấp cứu, mất an ninh…", source: null },
    ],
    questions: [
      { id: "truc-dem", text: "Ai trực đêm?", options: ["Lễ tân trực quầy", "Chủ khách sạn", "Bảo vệ"] },
      { id: "sua-chua", text: "Ai sửa chữa khi hỏng đồ trong phòng?", options: ["Kỹ thuật của khách sạn", "Lễ tân gọi thợ ngoài", "Chủ khách sạn"] },
    ],
    say: "“Dạ em báo ngay cho người trực đêm của khách sạn ạ. Anh chị chờ em một chút nha.”",
  },
};

// 3.1 J: forwarding code per "Bonia nghe khi nào" (GSM codes, Bonia's number).
export const FORWARD_PREFIX = ["**61*", "**67*", "**004*", "**21*"];
export const FORWARD_TARGET = "0900000399";

// 3.1 K–M: the simulated test call. Times are call seconds; the call clock
// runs CALL_SPEED× real time so the whole 1:12 call plays in ~30 s. Bubbles
// stream word by word over `dur`. The drawn frame 3.1 L is t = 38.
export const CALL_SPEED = 2.5;
export const CALL_RING_SECONDS = 5; // real seconds on 3.1 K before Bonia picks up
export const CALL_FRAME_T = 38;
export const CALL_END = 72;
export const CALL_SCRIPT = [
  { at: 1, dur: 2, who: "bonia", text: "Dạ khách sạn Sân Nhài xin nghe ạ." },
  { at: 5, dur: 4, who: "guest", text: "Alo em ơi, tối nay còn phòng đôi có cửa sổ không em?" },
  {
    at: 11,
    dur: 7,
    who: "bonia",
    text: "Dạ tối nay bên em còn phòng Superior có cửa sổ, giường 1m6, giá 550 nghìn một đêm ạ. Anh chị đi mấy người ạ?",
  },
  { at: 22, dur: 4, who: "guest", text: "Hai người lớn thôi. Giữ cho chị một phòng nha." },
  { at: 30, dur: 3, who: "bonia", text: "Dạ vâng, cho em xin tên người đặt ạ?" },
  { at: 41, dur: 3, who: "guest", text: "Chị tên Diệp, gọi số này luôn nha em." },
  { at: 47, dur: 6, who: "bonia", text: "Dạ em ghi lại yêu cầu rồi ạ. Lễ tân sẽ gọi lại cho chị để xác nhận phòng ạ." },
  { at: 58, dur: 2, who: "guest", text: "Ừ, cảm ơn em." },
  { at: 62, dur: 2, who: "bonia", text: "Dạ em cảm ơn chị ạ." },
];
// When each draft field fills in (call seconds).
export const CALL_DRAFT_TIMES = { type: 11, "Loại phòng": 11, Ngày: 11, Người: 22, Tên: 30, name: 41 };

// 3.0 H suggestions.
export const DEVICE_SUGGESTIONS = ["Máy tính quầy", "iPhone quầy", "Máy chị Diệp"];
