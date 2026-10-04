// Tài khoản & thanh toán (Cài đặt §05) sample data. Plan facts are fixed:
// 999.000đ/tháng chưa VAT, 250 phút, phút vượt 4.000đ tính theo giây.

export const PLAN = { name: "Gói Tiếp tân", price: 999000, minutes: 250, overPerMin: 4000 };

export const USAGE = { month: "Tháng 10", used: 73.4 };

export const INVOICE = {
  month: "Tháng 9",
  paid: false,
  lines: [["Gói tháng", 999000], ["Vượt 12,5 phút × 4.000đ", 50000], ["VAT 10%", 104900]],
  total: 1153900,
  bank: "Vietcombank",
  account: "0000 0000 3000",
  holder: "CÔNG TY BONIA",
  content: "BONIA TT 7F3K2Q",
};

export const BILLING_INFO = { company: "Công ty TNHH Sân Nhài", taxId: "0300 000 300", email: "ketoan@sannhai.vn" };

export const PAY_HISTORY = [
  { m: "Tháng 9", v: 1153900, s: "Chưa thanh toán", paid: false },
  { m: "Tháng 8", v: 1098900, s: "✓ 03/09 · chuyển khoản", paid: true },
  { m: "Tháng 7", v: 1098900, s: "✓ 02/08 · chuyển khoản", paid: true },
];

export const ACCOUNT = { login: "0900 000 300", sector: "Lưu trú", referral: { via: "VNPT", code: "HCM-0123" } };

export const DEVICES = [
  { n: "Máy tính quầy", s: "Đang dùng · Chrome trên Windows", phone: false },
  { n: "iPhone quầy", s: "Ứng dụng Bonia · 5 phút trước", phone: true },
  { n: "Máy chị Diệp", s: "Trình duyệt · hôm qua", phone: null },
];
