// Khách sạn Sân Nhài: sample hotel (brief §6). Fake numbers, fake street.
// Owner: today-billing (Hôm nay). Shared read-only by the shell.

export const HOTEL = {
  name: "Khách sạn Sân Nhài",
  shortName: "Sân Nhài",
  smsName: "San Nhai Hotel", // sender line in English SMS
  smsNameVi: "KS San Nhai", // sender line in Vietnamese SMS (sent không dấu)
  phone: "0900 000 300", // hotline = counter phone = login number
  carrier: "Vinaphone",
  address: "18/4 Võ Hữu Lân, phường Xuân Hòa",
  area: "khu Quận 3 cũ, TP.HCM",
  landmark: "hẻm xe hơi, gần Hồ Con Rùa",
  floors: 7,
  rooms: 14,
  checkIn: "14:00",
  checkOut: "12:00",
  frontDesk: "24/7",
  greeting: "Dạ khách sạn Sân Nhài xin nghe ạ.",
  voice: "giọng nữ miền Bắc",
  english: true,
  takesDeposit: true, // confirm → Chờ cọc (else Đã xác nhận)
  depositNights: 1,
  // Forwarding (placeholders to verify before launch, README).
  forwardTarget: "0900 000 399",
  forwardCode: "**61*0900000399#",
  cancelForwardCode: "##61#",
  listenWhen: "khi lễ tân không bắt máy",
  referral: { via: "VNPT", code: "HCM-0123" },
  sector: "luu-tru", // src/data/sectors.js: sets the app's words (Lịch phòng…)
  supportPhone: "1900 000 300",
  supportHours: "08:00–22:00",
};

// Sidebar status line. Shape AND colour change (README), so it never
// relies on colour alone.
export const LINE_STATUSES = {
  ok: { text: "Đang nghe máy", color: "var(--bn-ok)", radius: "50%" },
  warn: { text: "Cần kiểm tra đường dây", color: "var(--bn-urgent)", radius: "2px" },
  off: { text: "Bonia đang tắt", color: "var(--bn-muted)", radius: "2px" },
  paused: { text: "Đã tạm dừng", color: "var(--bn-urgent)", radius: "2px" },
};

// Line health shown in the Hôm nay status block and §07.
export const LINE = {
  status: "ok", // ok | warn | off | paused
  listening: true, // big toggle at the top of Hôm nay
  forwarding: true,
  lastCall: "14:05",
  lastCheck: "06:00",
  calendarUpdated: "08:10",
  normalDailyCalls: 20,
  silentThreshold: "im hơn 6 giờ ban ngày",
  // Warning variant (3.2 B)
  silentSince: "18:00 hôm qua",
  calendarStaleSince: "hôm qua 08:10",
};

export const MINUTES = {
  monthLabel: "Tháng 10",
  periodLabel: "1/10 – 8/10",
  used: 73.4,
  included: 250,
  overage: 0,
  alertAt: 200, // 80%
};

// "Bonia nhận thay quầy 23 cuộc · Đặt phòng 5 · Khách đang ở 6 · Gấp 1"
export const TODAY_STATS = {
  handled: 23,
  bookings: 5,
  inHouse: 6,
  urgent: 1,
  yesterdayCalls: 19,
};

export const ARRIVALS = [
  { name: "Anh Minh", roomType: "superior", eta: "~18:00" },
  { name: "Chị Trang", roomType: "tieu-chuan", eta: "~21:00" },
];

// One hotel login, many devices; each device names itself (3.0 H).
export const DEVICES = [
  { id: "may-tinh-quay", name: "Máy tính quầy", lastSeen: "Đang dùng", current: true },
  { id: "iphone-quay", name: "iPhone quầy", lastSeen: "Lần cuối 14:18" },
  { id: "may-chi-diep", name: "Máy chị Diệp", lastSeen: "Lần cuối hôm qua 22:40" },
];

export const DEVICE_NAME_SUGGESTIONS = ["Máy tính quầy", "iPhone quầy", "Máy chị Diệp"];

// "Bonia đã biết 28/30 điều khách hay hỏi" (3.6 A; 3.2 C shows 24/30).
export const KNOWLEDGE = { known: 28, total: 30 };

// 3.2 C first day: "Bonia đã biết 24/30 điều khách hay hỏi" + what's missing.
export const FIRST_DAY_KNOWLEDGE = {
  known: 24,
  total: 30,
  missing: ["giá qua đêm", "ngày lễ", "giường phụ", "cọc khi đặt qua điện thoại", "ai trực đêm", "ai sửa chữa"],
};
