// Cài đặt §01–§11 + Tài khoản (frames 3.6 A–Q).
// Owners: settings-a (§01–§05), settings-b (§06–§11, Tài khoản, Trợ giúp).
// Each section's values are plain data; screens keep a dirty copy and call
// saveSettings(section, values) when the user presses Lưu.

// mark: ok = ✓ · review = Cần xem lại · setup = Cần cài
export const SECTIONS = [
  { n: "01", title: "Khách sạn", summary: "Sân Nhài · khu Quận 3 cũ · nhận 14:00, trả 12:00 · lễ tân 24/7", mark: "ok" },
  { n: "02", title: "Phòng & giá", summary: "14 phòng · 5 loại · theo giờ, qua đêm, theo ngày", mark: "review" },
  { n: "03", title: "Đặt phòng", summary: "Ghi yêu cầu, khách sạn xác nhận · gợi ý tối đa 2 phòng khác", mark: "ok" },
  { n: "04", title: "Khách đang ở", summary: "16 loại việc · 5 báo ngay", mark: "ok" },
  { n: "05", title: "Nhân viên & khẩn cấp", summary: "7 người nhận báo · 7 tình huống khẩn cấp", mark: "setup" },
  {
    n: "06",
    title: "Cách nghe máy",
    summary: "\"Dạ khách sạn Sân Nhài xin nghe ạ.\" · giọng nữ miền Bắc · tiếng Anh",
    mark: "ok",
  },
  {
    n: "07",
    title: "Kết nối",
    summary: "Giữ số 0900 000 300 · khi không bắt máy · chưa kết nối phần mềm khách sạn",
    mark: "ok",
  },
  { n: "08", title: "Hôm nay & thông báo tạm", summary: "7 công tắc · 1 dòng đang bật", mark: "ok" },
  { n: "09", title: "Tin nhắn cho khách", summary: "6 mẫu tin · tiếng Việt và tiếng Anh", mark: "ok" },
  { n: "10", title: "Thông báo", summary: "Mọi yêu cầu · im lặng 23:00–6:00, trừ việc gấp", mark: "ok" },
  { n: "11", title: "Bảo mật & dữ liệu", summary: "Xác minh bằng số gọi + tên · giữ ghi âm 30 ngày", mark: "ok" },
];

// Settings Nav uses its own short marks (TT Settings Nav).
export const NAV_MARK_TEXT = { ok: "✓", review: "Xem lại", setup: "Cần cài" };

// Empty / manual-setup list (3.6 O): every card has an example, not a blank form.
export const EMPTY_SECTIONS = [
  { n: "01", summary: "Ví dụ: nhận 14:00, trả 12:00, lễ tân 24/7", mark: "setup" },
  { n: "02", summary: "Ví dụ: Superior · 1 giường 1m6 · 550.000đ/đêm", mark: "setup" },
  { n: "03", summary: "Mặc định: ghi yêu cầu, khách sạn xác nhận", mark: "ok" },
  { n: "04", summary: "16 loại việc có sẵn, chọn người nhận", mark: "setup" },
  { n: "05", summary: "Thêm người nhận báo · khẩn cấp đã có số", mark: "setup" },
  { n: "06", summary: "Mặc định: “Dạ khách sạn … xin nghe ạ.”", mark: "setup" },
  { n: "07", summary: "Chưa chuyển cuộc gọi", mark: "setup" },
  { n: "08", summary: "7 công tắc có sẵn", mark: "ok" },
  { n: "09", summary: "6 mẫu có sẵn", mark: "ok" },
  { n: "10", summary: "Mặc định: mọi yêu cầu", mark: "ok" },
  { n: "11", summary: "Mặc định: số gọi + tên · 30 ngày", mark: "ok" },
];

// ── §01 Khách sạn ────────────────────────────────────────────────────
export const S01 = {
  otherNames: ["Sân Nhài", "San Nhai Hotel"],
  landmark: "Gần Hồ Con Rùa, hẻm xe hơi, cổng sơn trắng",
  parking: "Xe máy miễn phí trong sảnh · ô tô bãi gần đó ~40.000đ/lượt",
  checkIn: "14:00",
  checkOut: "12:00",
  frontDesk: "24/7",
  amenities: [
    "Wifi",
    "Thang máy",
    "Máy lạnh",
    "Tủ lạnh",
    "Bồn tắm",
    "Ăn sáng",
    "Giặt ủi",
    "Giữ hành lý",
    "Thuê xe máy",
    "Đưa đón sân bay",
    "Hồ bơi",
    "Phòng tập",
    "Nhà hàng",
    "Cho thú cưng",
    "Phòng hút thuốc",
    "Lối cho xe lăn",
  ],
  // 12 on (Nước nóng, TV, Ấm siêu tốc, Gửi xe máy are on but not in the 16 chips).
  amenitiesOn: [
    "Wifi",
    "Thang máy",
    "Máy lạnh",
    "Tủ lạnh",
    "Giặt ủi",
    "Giữ hành lý",
    "Thuê xe máy",
    "Đưa đón sân bay",
    "Gửi xe máy",
    "Nước nóng",
    "TV",
    "Ấm siêu tốc",
  ],
  amenitiesUnconfirmed: ["Bồn tắm"], // dashed: found online, not confirmed
  airport: { source: "TRANG WEB", car4: 380000, car7: 430000, nightExtra: 150000, nightHours: "22:00–05:00" },
};

// ── §02 Phòng & giá (brief §6 table) ─────────────────────────────────
export const S02 = {
  rooms: [
    {
      id: "tieu-chuan",
      name: "Tiêu chuẩn",
      window: false,
      bed: "1 giường 1m6",
      area: 15,
      max: "2 người lớn + 1 bé dưới 6 tuổi",
      count: 4,
      hourly: { first2h: 180000, perHour: 40000 },
      overnight: 350000,
      daily: { weekday: 450000, weekend: 500000 },
      otaPrice: 520000,
    },
    {
      id: "superior",
      name: "Superior",
      window: true,
      bed: "1 giường 1m6",
      area: 18,
      max: "2 người lớn + 1 bé",
      count: 4,
      hourly: { first2h: 220000, perHour: 50000 },
      overnight: 420000,
      daily: { weekday: 550000, weekend: 620000 },
      otaPrice: 690000,
    },
    {
      id: "superior-2",
      name: "Superior 2 giường",
      window: true,
      bed: "2 giường 1m2",
      area: 20,
      max: "2 người lớn + 1 bé",
      count: 2,
      hourly: { first2h: 220000, perHour: 50000 },
      overnight: 420000,
      daily: { weekday: 580000, weekend: 650000 },
      otaPrice: 720000,
    },
    {
      id: "deluxe",
      name: "Deluxe ban công hướng phố",
      window: true,
      bed: "1 giường 1m8, bồn tắm",
      area: 24,
      max: "2 người lớn (+1 giường phụ)",
      count: 2,
      hourly: null, // không nhận
      overnight: 550000,
      daily: { weekday: 750000, weekend: 850000 },
      otaPrice: 920000,
      extraBed: 150000,
    },
    {
      id: "gia-dinh",
      name: "Gia đình",
      window: true,
      bed: "2 giường 1m6",
      area: 30,
      max: "4 người lớn + 2 bé dưới 6 tuổi",
      count: 2,
      hourly: null,
      overnight: null,
      daily: { weekday: 950000, weekend: 1100000 },
      otaPrice: 1250000,
    },
  ],
  bedOptions: ["1 giường 1m6", "1 giường 1m8", "2 giường 1m2", "2 giường 1m6"],
  hourlyWindow: "08:00–22:00",
  overnightWindow: "từ 22:00 tới 12:00 hôm sau",
  weekendNights: ["T6", "T7"],
  monthly: false,
  holidays: [
    { label: "30/4 – 1/5", rule: "Tăng 25%", refund: "hoàn được" },
    { label: "2/9", rule: "Tăng 25%", refund: "hoàn được" },
    { label: "Tết · mùng 1–5", rule: "Tăng 50%", refund: "trả trước, không hoàn", strict: true },
  ],
  priceSpeech: "total", // perNight | total | none
  priceSpeechOptions: [
    { id: "perNight", label: "Giá từng đêm" },
    { id: "total", label: "Tổng tiền" },
    { id: "none", label: "Không nói giá, ghi lại để khách sạn báo" },
  ],
  children: "Bé dưới 6 tuổi ngủ chung miễn phí; 6–11 tuổi +100.000đ; từ 12 tuổi tính như người lớn",
};

// ── §03 Đặt phòng ────────────────────────────────────────────────────
export const S03 = {
  mode: "record", // answer | record | (book: locked)
  modes: [
    { id: "answer", title: "Chỉ trả lời thông tin", sub: "Bonia nói giá và phòng trống, không ghi yêu cầu" },
    { id: "record", title: "Ghi yêu cầu, khách sạn xác nhận", sub: "Mặc định · khách được báo khách sạn sẽ nhắn xác nhận" },
    {
      id: "book",
      title: "Tự đặt phòng",
      sub: "Cần kết nối phần mềm quản lý khách sạn (sắp có)",
      locked: true,
    },
  ],
  checkCalendar: true,
  suggestMax: 2,
  groupOver: 10,
  askFields: [
    { id: "ten", label: "Tên", on: true },
    { id: "gio-toi", label: "Giờ tới", on: true },
    { id: "yeu-cau", label: "Yêu cầu đặc biệt", on: true },
    { id: "email", label: "Email", on: false },
    { id: "quoc-tich", label: "Quốc tịch", on: false },
  ],
  earlyLate: true,
  earlyLateFee: 50000,
  deposit: { nights: 1, method: "chuyển khoản" },
  freeCancelHours: 24,
};

// ── §04 Khách đang ở: 16 tasks × Trả lời / Ghi yêu cầu / Báo ngay ────
export const S04_TASKS = [
  { id: "khan", label: "Xin khăn", note: "", answer: false, record: true, notify: false, who: "Dọn phòng · cô Hai" },
  { id: "don-phong", label: "Dọn phòng", note: "", answer: false, record: true, notify: false, who: "Dọn phòng" },
  {
    id: "nuoc-uong",
    label: "Nước uống",
    note: "2 chai miễn phí mỗi ngày",
    answer: true,
    record: true,
    notify: false,
    who: "Dọn phòng",
  },
  {
    id: "do-dung",
    label: "Đồ dùng (bàn chải, dầu gội)",
    note: "",
    answer: false,
    record: true,
    notify: false,
    who: "Dọn phòng",
  },
  { id: "goi-chan", label: "Gối, chăn", note: "", answer: false, record: true, notify: false, who: "Dọn phòng" },
  {
    id: "wifi",
    label: "Wifi không vào được",
    note: "SanNhai_Guest · mật khẩu sannhai2026",
    answer: true,
    record: true,
    notify: false,
    who: "Kỹ thuật · anh Tư",
  },
  { id: "may-lanh", label: "Máy lạnh", note: "", answer: false, record: true, notify: true, who: "Kỹ thuật · anh Tư" },
  { id: "nuoc-nong", label: "Nước nóng", note: "", answer: false, record: true, notify: true, who: "Kỹ thuật · anh Tư" },
  { id: "tv", label: "TV", note: "", answer: false, record: true, notify: false, who: "Kỹ thuật · anh Tư" },
  { id: "khoa-cua", label: "Khóa cửa / mất thẻ phòng", note: "", answer: false, record: true, notify: true, who: "Lễ tân" },
  {
    id: "phong-on",
    label: "Phòng bên ồn",
    note: "",
    answer: false,
    record: true,
    notify: true,
    who: "Lễ tân · đêm: anh Phong",
  },
  {
    id: "hanh-ly",
    label: "Giữ hành lý",
    note: "Miễn phí ngày trả phòng",
    answer: true,
    record: false,
    notify: false,
    who: "Lễ tân",
  },
  { id: "bao-thuc", label: "Gọi báo thức", note: "", answer: false, record: true, notify: false, who: "Lễ tân" },
  {
    id: "giat-ui",
    label: "Giặt ủi",
    note: "35.000đ/kg · tối thiểu 2kg · lấy hôm sau",
    answer: true,
    record: true,
    notify: false,
    who: "Dọn phòng",
  },
  {
    id: "thue-xe",
    label: "Thuê xe máy",
    note: "Số 120.000đ · tay ga 180.000đ/ngày",
    answer: true,
    record: true,
    notify: false,
    who: "Lễ tân",
  },
  { id: "taxi", label: "Gọi taxi", note: "Grab / Xanh SM", answer: true, record: false, notify: true, who: "Lễ tân" },
];

// ── §05 Nhân viên & khẩn cấp (people live in staff.js) ────────────────
export const S05 = {
  urgentMinutes: 15,
  normalMinutes: 60,
  escalateAfter: 5, // urgent not opened → next on duty, then the owner
  transfer: { on: true, number: "0900 000 300" }, // loops: number forwards to Bonia
  emergencies: [
    {
      id: "chay",
      label: "Cháy / khói",
      number: "114",
      say: "Dạ anh chị ra ngay lối thoát hiểm cầu thang bộ, gọi 114. Em báo lễ tân và chủ ngay.",
      who: "Lễ tân, chị Diệp",
    },
    {
      id: "gas",
      label: "Mùi gas",
      number: "114",
      say: "Anh chị đừng bật công tắc điện, mở cửa sổ, ra khỏi phòng và gọi 114.",
      who: "Kỹ thuật, chị Diệp",
    },
    {
      id: "cap-cuu",
      label: "Cấp cứu",
      number: "115",
      say: "Anh chị gọi 115 ngay. Em báo lễ tân lên phòng hỗ trợ.",
      who: "Lễ tân, chị Diệp",
    },
    {
      id: "an-ninh",
      label: "An ninh, người lạ, đánh nhau",
      number: "113",
      say: "Anh chị khóa cửa phòng và gọi 113. Em báo lễ tân ngay.",
      who: "Lễ tân, chị Diệp",
    },
    { id: "ngap", label: "Ngập nước, vỡ ống", number: null, say: "Em báo kỹ thuật lên ngay ạ.", who: "Anh Tư, chị Diệp" },
    {
      id: "tre-lac",
      label: "Trẻ lạc",
      number: "113",
      say: "Em báo lễ tân hỗ trợ tìm ngay; nếu cần anh chị gọi 113.",
      who: "Lễ tân, chị Diệp",
    },
    { id: "khoa-ngoai", label: "Khách bị khóa ngoài", number: null, say: "Em báo lễ tân mở cửa cho anh chị ạ.", who: "Lễ tân" },
  ],
};

// ── §06 Cách nghe máy ────────────────────────────────────────────────
export const S06 = {
  greeting: "Dạ khách sạn Sân Nhài xin nghe ạ.",
  voices: [
    { id: "bac-nu", label: "giọng nữ miền Bắc" },
    { id: "nam-nam", label: "giọng nam miền Nam" },
  ],
  voice: "bac-nu",
  english: true,
  address: "Bonia xưng “em”, gọi khách “anh/chị”",
  announceAssistant: false,
  announceLine: "Em là trợ lý tự động của khách sạn, em ghi lại để lễ tân xử lý ngay ạ.",
  upsells: [
    { id: "dua-don", label: "Đưa đón sân bay · khi khách nói đi máy bay", on: true },
    { id: "thue-xe", label: "Thuê xe máy · khi khách hỏi đi chơi", on: true },
    { id: "tra-tre", label: "Trả phòng trễ · khi khách hỏi giờ trả phòng", on: true },
  ],
  spam: "Cuộc gọi spam, không liên quan: từ chối lịch sự.",
  extraKnowledge: "",
  extraKnowledgePlaceholder: "Ví dụ: khách hỏi hóa đơn đỏ thì ghi lại để chủ gửi.",
};

// ── §07 Kết nối ──────────────────────────────────────────────────────
export const S07 = {
  numberMode: "keep", // keep | vnpt
  number: "0900 000 300",
  carrier: "Vinaphone",
  carriers: ["Viettel", "Vinaphone", "MobiFone", "Vietnamobile"],
  when: "no-answer",
  whenOptions: [
    { id: "no-answer", label: "Khi không bắt máy" },
    { id: "busy", label: "Khi máy bận" },
    { id: "both", label: "Cả hai" },
    { id: "all", label: "Mọi cuộc gọi" },
  ],
  forwardCode: "**61*0900000399#",
  lineHealth: { status: "Bình thường", lastCall: "14:05", lastCheck: "06:00 ✓", threshold: "im hơn 6 giờ ban ngày" },
  pms: { connected: false },
  webSearch: {
    on: true,
    last: "Lần tìm gần nhất 2/10 · 41 thông tin",
    sources: [
      { id: "web", label: "TRANG WEB", ok: true },
      { id: "maps", label: "GOOGLE MAPS", ok: true },
      { id: "booking", label: "BOOKING.COM", ok: true },
      { id: "agoda", label: "AGODA", ok: false },
      { id: "facebook", label: "FACEBOOK", ok: true },
    ],
  },
};

// ── §08 Hôm nay & thông báo tạm ──────────────────────────────────────
// "Hết phòng tối nay" is also the big switch on Hôm nay: on → tonight 0
// for every room type, off → the calendar's own numbers come back.
export const SWITCHES = [
  { id: "het-phong-toi-nay", label: "Hết phòng tối nay", say: "“Dạ tối nay bên em hết phòng rồi ạ.”", on: false },
  {
    id: "khong-theo-gio-hom-nay",
    label: "Không nhận khách theo giờ hôm nay",
    say: "“Dạ hôm nay bên em không nhận theo giờ ạ.”",
    on: false,
  },
  {
    id: "khong-theo-gio-sau-20",
    label: "Không nhận khách theo giờ sau 20:00",
    say: "“Dạ sau 8 giờ tối bên em không nhận theo giờ ạ.”",
    on: true,
  },
  { id: "ngung-dat-phong", label: "Ngưng nhận đặt phòng", say: "“Dạ hiện bên em tạm ngưng nhận đặt phòng ạ.”", on: false },
  {
    id: "khong-ai-o-quay",
    label: "Không có ai ở quầy",
    say: "“Dạ lễ tân đang bận, em ghi lại để lễ tân gọi lại ngay ạ.”",
    on: false,
  },
  { id: "thang-may-hu", label: "Thang máy hư", say: "“Dạ thang máy đang tạm ngưng, mong anh chị thông cảm ạ.”", on: false },
  { id: "cup-nuoc-dien", label: "Cúp nước / cúp điện", say: "“Dạ khu vực đang cúp, khách sạn đang xử lý ạ.”", on: false },
];

export const TEMP_NOTICE = {
  on: true,
  text: "Thang máy đang bảo trì tới 17:00",
  until: "17:00",
  untilLabel: "hôm nay 17:00",
  say: "“Dạ hiện thang máy đang bảo trì tới 5 giờ chiều, mong anh chị thông cảm ạ.”",
};

// ── §09 Tin nhắn cho khách ───────────────────────────────────────────
export const S09 = {
  templates: [
    {
      id: "xac-nhan",
      label: "Xác nhận đặt phòng",
      vi: "[Tên ngắn khách sạn]: Chào [Tên khách], khách sạn xác nhận [Loại phòng] từ [Ngày nhận], [Số đêm] đêm, tổng [Tổng tiền]. Khách sạn sẽ nhắn thông tin cọc. Nhận phòng 14:00.",
      en: "[Hotel short name]: Dear [Guest name], we confirm your request: [Room type], [Check-in] ([Nights] nights), total [Total]. We will text deposit details (1 night). Check-in 14:00.",
    },
    { id: "theo-gio", label: "Xác nhận đặt theo giờ (trung tính)", vi: "", en: "" },
    { id: "tu-choi", label: "Từ chối", vi: "", en: "" },
    { id: "doi-huy", label: "Đã nhận yêu cầu đổi/hủy", vi: "", en: "" },
    { id: "dich-vu", label: "Xác nhận dịch vụ", vi: "", en: "" },
    { id: "quen-do", label: "Trả lời quên đồ", vi: "", en: "" },
  ],
  insertChips: ["Tên khách", "Loại phòng", "Ngày nhận", "Số đêm", "Tổng tiền", "Tên ngắn khách sạn"],
  unaccented: true,
  // Preview with anh Long's data (sent không dấu).
  preview:
    "KS San Nhai: Chao anh Long, khach san xac nhan Superior tu 9/10, 1 dem, tong 620.000d. Khach san se nhan thong tin coc. Nhan phong 14:00.",
};

// ── §10 Thông báo ────────────────────────────────────────────────────
export const S10 = {
  scope: "all", // all | urgent
  quietHours: { on: true, range: "23:00–06:00" },
  dailySummary: { on: true, at: "22:00" },
  minutesAlert: true, // 80% and 100%
};

// ── §11 Bảo mật & dữ liệu ────────────────────────────────────────────
export const S11 = {
  neverSay: "Bonia không nói khách nào đang ở, số phòng, ngày ở, số điện thoại của khách khác, mã cửa phòng",
  verify: "phone-name",
  verifyOptions: [
    { id: "phone", label: "Số gọi trùng số đặt phòng" },
    { id: "phone-name", label: "Số gọi + tên người đặt", note: "mặc định" },
    { id: "name-date", label: "Tên + ngày nhận phòng" },
  ],
  keepRecordings: 30,
  keepOptions: [7, 30, 90],
};

// ── Tài khoản: activity log (3.6 M). Newest first. ───────────────────
// Frame 3.6 M is drawn later in the day; rows marked `later` happen after
// the 14:20 demo clock, so the store starts without them.
export const ACTIVITY = [
  { t: "21:04", d: "iPhone quầy", a: "Đánh dấu đã nhận cọc · anh Long", later: true },
  { t: "20:15", d: "Máy tính quầy", a: "Lịch phòng Deluxe T6: 2 → 1", later: true },
  { t: "14:24", d: "Máy tính quầy", a: "Xác nhận · chờ cọc · anh Kevin", later: true },
  { t: "14:12", d: "Máy tính quầy", a: "Giao cho anh Tư · phòng 302" },
  { t: "11:20", d: "iPhone quầy", a: "Đã nhắn khách · anh Long" },
  { t: "11:18", d: "iPhone quầy", a: "Xác nhận · chờ cọc · anh Long" },
  { t: "10:41", d: "iPhone quầy", a: "Giao cho cô Hai · quên đồ phòng 304" },
  { t: "08:10", d: "Máy tính quầy", a: "Thêm đặt phòng · Mr. Tanaka · Agoda" },
  { t: "07:55", d: "Máy chị Diệp", a: "Bật “Không nhận khách theo giờ sau 20:00”" },
  { t: "Hôm qua", d: "iPhone quầy", a: "Xong · phòng 401 · phòng bên ồn" },
];
