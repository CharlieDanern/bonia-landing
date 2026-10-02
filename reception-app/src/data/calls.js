// Cuộc gọi hôm nay (TT Call List, frames 3.5 A–F).
// Owner: calendar-calls (Cuộc gọi). Reports also feed Trợ giúp (settings-b).

export const CALLS = [
  {
    id: "a",
    time: "14:05",
    who: "0900 000 344",
    phone: "0900 000 344",
    tags: ["HỎI THÔNG TIN"],
    summary: "Hỏi ô tô vào hẻm được không, chỉ chỗ gửi xe gần đó",
  },
  {
    id: "kevin",
    time: "14:02",
    who: "Anh Kevin",
    phone: "0900 000 341",
    lang: "en",
    tags: ["ĐẶT PHÒNG"],
    summary: "Deluxe ban công T6 → CN, tới khoảng 23:00",
    billedMin: "3,1",
    requestId: "kevin",
  },
  {
    id: "302",
    time: "13:58",
    who: "Phòng 302",
    urgent: true,
    tags: ["KHÁCH ĐANG Ở"],
    summary: "Máy lạnh không lạnh, đã báo kỹ thuật",
    requestId: "302",
  },
  {
    id: "ngan",
    time: "13:47",
    who: "Chị Ngân",
    phone: "0900 000 336",
    tags: ["ĐẶT PHÒNG"],
    summary: "Deluxe ban công T6 9/10 → CN 11/10, 2 người lớn",
    billedMin: "2,6",
    duration: "2:36",
    position: "0:52", // player position in the frame
    requestId: "ngan",
    requestLabel: "Đặt phòng · Deluxe T6 → CN",
    transcript: [
      { who: "bonia", text: "Dạ khách sạn Sân Nhài xin nghe ạ." },
      { who: "guest", text: "Em ơi cuối tuần này còn phòng có ban công không em?" },
      {
        who: "bonia",
        text: "Dạ còn phòng Deluxe ban công hướng phố, giường 1m8 có bồn tắm, cuối tuần 850 nghìn một đêm ạ. Chị ở từ tối nào tới hôm nào ạ?",
      },
      { who: "guest", text: "Thứ Sáu tới Chủ nhật, hai người." },
      {
        who: "bonia",
        text: "Dạ thứ Sáu 9 tới Chủ nhật 11 là 2 đêm, tổng 1 triệu 700 nghìn ạ. Em ghi lại yêu cầu, khách sạn sẽ nhắn xác nhận và thông tin cọc 1 đêm cho chị. Cho em xin tên ạ?",
      },
      { who: "guest", text: "Chị tên Ngân." },
      { who: "bonia", text: "Dạ em cảm ơn chị Ngân. Khách sạn sẽ nhắn chị sớm ạ." },
    ],
  },
  {
    id: "thu",
    time: "13:30",
    who: "Chị Thu",
    phone: "0900 000 318",
    tags: ["THEO GIỜ"],
    summary: "Superior 15:00–17:00 hôm nay",
    requestId: "thu",
  },
  {
    id: "205",
    time: "13:12",
    who: "Phòng 205",
    tags: ["KHÁCH ĐANG Ở"],
    summary: "Xin thêm 2 khăn tắm",
    requestId: "205",
  },
  {
    id: "spam",
    time: "12:40",
    who: "0900 000 377",
    phone: "0900 000 377",
    tags: ["RÁC"],
    summary: "Mời vay tiêu dùng · Bonia từ chối lịch sự",
  },
  {
    id: "bao",
    time: "11:58",
    who: "Anh Bảo",
    tags: ["ĐỔI/HỦY"],
    summary: "Dời Tiêu chuẩn T7 → CN, số gọi trùng số đặt",
    requestId: "bao",
  },
  {
    id: "sophie",
    time: "11:40",
    who: "Chị Sophie",
    lang: "en",
    tags: ["DỊCH VỤ"],
    summary: "Đón Tân Sơn Nhất 01:30 sáng thứ Sáu",
    requestId: "sophie",
  },
  {
    id: "long",
    time: "11:05",
    who: "Anh Long",
    phone: "0900 000 352",
    tags: ["ĐẶT PHÒNG"],
    summary: "Superior đêm T6 9/10, 2 người lớn, 1 bé",
    billedMin: "2,4",
    requestId: "long",
  },
  {
    id: "huong",
    time: "10:22",
    who: "Chị Hương",
    phone: "0900 000 329",
    tags: ["QUÊN ĐỒ"],
    summary: "Quên sạc máy tính phòng 304",
    requestId: "huong",
  },
];

// Báo cuộc gọi này có vấn đề (3.5 B)
export const REPORT_REASONS = [
  "Bonia hiểu sai",
  "Nói sai thông tin",
  "Không nghe rõ khách",
  "Xử lý sai yêu cầu",
  "Khác",
];

// Trợ giúp · Cuộc gọi đã báo (3.6 N). Ngân's report is added when the
// user reports it in 3.5 B; this is the older, answered one.
export const REPORTS = [
  {
    id: "r-0510",
    callLabel: "0900 000 361 · 5/10 21:12",
    reason: "Không nghe rõ khách",
    status: "da-tra-loi",
    answer: {
      by: "ĐỘI BONIA · 5/10 22:05",
      text: "Khách gọi từ chỗ rất ồn, Bonia hỏi lại 3 lần rồi ghi lời nhắn để lễ tân gọi lại, đúng cách xử lý. Chúng tôi đã chỉnh để Bonia đề nghị gọi lại sớm hơn, sau 2 lần.",
    },
  },
];

// Example report as drawn in 3.5 B / 3.6 N.
export const SAMPLE_REPORT = {
  callId: "ngan",
  reason: "Nói sai thông tin",
  note: "Bonia báo Deluxe còn phòng nhưng không nói đang có người khác hỏi.",
  sentAt: "14:21",
};
