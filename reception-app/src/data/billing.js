// Thanh toán + Đã tạm dừng (frames 3.7 A–D, 3.8 A–B).
// Owner: today-billing.
// 999.000đ/tháng chưa gồm VAT, gồm 250 phút; phút vượt 4.000đ, tính theo giây.

export const PLAN = {
  price: 999000,
  includedMinutes: 250,
  overagePerMinute: 4000,
  vatRate: 0.1,
  note: "Chưa gồm VAT · gồm 250 phút · phút vượt 4.000đ/phút, tính theo giây",
};

// Invoice for September: 999.000 + 12,5 × 4.000 = 50.000, VAT 10% 104.900
export const INVOICE = {
  month: "9/2026",
  due: "10/10",
  status: "unpaid", // unpaid | paid
  lines: [
    { label: "Gói tháng 9 · 250 phút", amount: 999000 },
    { label: "Phút vượt · 12,5 phút × 4.000đ", amount: 50000 },
    { label: "VAT 10%", amount: 104900 },
  ],
  total: 1153900,
};

export const PAYMENT_HISTORY = [
  { label: "Tháng 8 · trả 6/9", amount: 1098900, paid: true },
  { label: "Tháng 7 · trả 4/8", amount: 1098900, paid: true },
];

export const BILLING_INFO = {
  company: "Công ty TNHH Sân Nhài",
  taxId: "0300000300",
  address: "18/4 Võ Hữu Lân, P. Xuân Hòa",
  email: "ketoan@sannhai.vn",
};

// Placeholder bank (README: verify before launch). No BIN on purpose: the
// QR then carries plain transfer details, not a payable VietQR payload.
export const BANK = {
  bankName: "Ngân hàng mẫu",
  bin: null,
  account: "0000 0000 3000",
  holder: "CONG TY BONIA",
  content: "BONIA TT 7F3K2Q",
};

// 3.7 B: still on trial, no invoice yet.
export const TRIAL = {
  daysLeft: 12,
  endsOn: "20/10",
  minutesUsed: 18.2,
  firstInvoiceOn: "1/11",
};

// 3.8 A reminder strip (shown on Hôm nay, demo clock Thứ Sáu 10/10 09:00).
export const OVERDUE_REMINDER = {
  daysLeft: 3,
  clockLabel: "THỨ SÁU 10/10 · 09:00",
  text: "Hóa đơn tháng 9 (1.153.900đ) quá hạn từ 10/10. Bonia Tiếp tân sẽ tạm dừng ngày 13/10 nếu chưa thanh toán.",
};

// 3.8 B: the only screen while suspended. Callers never fall through to
// the personal Bonia assistant: the hotel turns forwarding off instead.
export const SUSPENSION = {
  since: "13/10",
  cancelCode: "##61#",
  carrier: "Vinaphone",
  keepDays: 90,
  amount: 1153900,
};
