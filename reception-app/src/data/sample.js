// Sample requests and the two scripted live calls (handoff 13, tt3-data.js),
// with the review fixes of 2026-10-04: Bonia is the hotel's own receptionist,
// so it says "bên em" / "em báo dọn phòng", never "em báo khách sạn".

export const GREETING = "Dạ khách sạn Sân Nhài xin nghe ạ.";
const G = GREETING;

/** Card title: the guest's name, else "Phòng N", else the number. */
export const title = (r) => r.name || (r.room ? `Phòng ${r.room}` : r.number);

/**
 * The text "Sao chép" puts on the clipboard, to paste into whatever channel the
 * hotel uses. Fields keep their labels so "2" reads "Số người: 2".
 */
export const copyText = (r) =>
  [r.type, title(r), r.number, ...(r.fields || []).map(([k, v]) => `${k}: ${v}`), r.said ? `Bonia đã nói: ${r.said}` : ""]
    .filter(Boolean)
    .join(" · ");

const R = (o) => ({ fields: [], transcript: [], len: "0:30", status: "open", urgent: false, ...o });

export const REQUESTS = [
  R({ id: "kevin", name: "anh Kevin", number: "0900 000 341", type: "Đặt phòng", day: 0, at: "13:52", len: "0:38",
    fields: [["Loại phòng", "Deluxe ban công"], ["Ngày", "T7 10/10 · 1 đêm"], ["Số người", "2"], ["Ngôn ngữ", "Tiếng Anh"], ["Giá đã báo", "850.000đ/đêm cuối tuần"]],
    said: "Bên em sẽ nhắn tin xác nhận lại",
    transcript: [["B", G], ["K", "Hi, do you have a Deluxe room for Saturday night, the 10th?"], ["B", "Yes, a Deluxe room with a balcony is 850,000 VND per night at the weekend. May I have your name?"], ["K", "Kevin."], ["B", "Thank you, Kevin. We'll text you to confirm shortly."]] }),
  R({ id: "205", room: "205", number: "0900 000 325", type: "Khách đang ở", day: 0, at: "13:12", len: "0:16",
    fields: [["Việc", "Xin thêm 2 khăn tắm"]], said: "Em báo dọn phòng mang lên",
    transcript: [["B", G], ["K", "Em ơi cho chị xin thêm 2 khăn tắm phòng 205 nha."], ["B", "Dạ em báo dọn phòng mang lên cho chị ạ."]] }),
  R({ id: "sophie", name: "chị Sophie", number: "0900 000 358", type: "Dịch vụ", day: 0, at: "11:40", len: "0:44",
    fields: [["Việc", "Đón sân bay Tân Sơn Nhất"], ["Lúc", "01:30 thứ Sáu 9/10"], ["Xe", "4 chỗ · 1 người"], ["Giá đã báo", "380.000đ + 150.000đ phụ thu đêm"]], said: "Bên em sẽ nhắn tin xác nhận lại",
    transcript: [["B", G], ["K", "Hello, can you pick me up at Tan Son Nhat airport at 1:30 on Friday morning?"], ["B", "Yes. A 4-seat car is 380,000 VND, plus 150,000 VND night surcharge. How many people?"], ["K", "Just me."], ["B", "Noted. We'll text you to confirm the pickup."]] }),
  R({ id: "huong", name: "chị Hương", number: "0900 000 329", type: "Quên đồ", day: 0, at: "10:22", len: "0:29",
    fields: [["Đồ", "Sạc máy tính màu trắng"], ["Phòng", "304 · trả phòng hôm qua"]], said: "Bên em kiểm tra xong sẽ gọi lại",
    transcript: [["B", G], ["K", "Hôm qua chị trả phòng 304, chắc chị bỏ quên cái sạc máy tính màu trắng."], ["B", "Dạ em ghi lại rồi ạ. Bên em kiểm tra xong sẽ gọi lại cho chị ạ."]] }),
  R({ id: "nuoc", number: "0900 000 367", type: "Lời nhắn", day: 0, at: "09:05", len: "0:24",
    fields: [["Nội dung", "Nhà cung cấp nước suối hẹn giao chiều nay"], ["Cần", "Gọi lại xác nhận giờ giao"]], said: "Bên em sẽ gọi lại anh",
    transcript: [["B", G], ["K", "Anh bên nước suối Sài Gòn, chiều nay anh giao hàng, em báo quầy gọi lại xác nhận giờ giúp anh."], ["B", "Dạ em ghi lại rồi, bên em sẽ gọi lại anh xác nhận giờ ạ."]] }),
  R({ id: "hem", number: "0900 000 344", type: "Hỏi thông tin", day: 0, at: "14:05", len: "0:22", status: "auto",
    fields: [["Câu hỏi", "Ô tô vào hẻm được không"], ["Bonia trả lời", "Vào tới cửa · gửi bãi đầu hẻm 40.000đ"]], said: "Ô tô vào tới cửa được ạ",
    transcript: [["B", G], ["K", "Em ơi ô tô vào hẻm khách sạn được không em?"], ["B", "Dạ hẻm ô tô vào tới cửa ạ. Ô tô gửi ở bãi đầu hẻm, 40 nghìn một lượt ạ."], ["K", "Ok cảm ơn em."]] }),
  R({ id: "long", name: "anh Long", number: "0900 000 352", type: "Đặt phòng", day: 0, at: "11:20", len: "0:51", status: "done", doneBy: "iPhone quầy", doneAt: "11:31",
    fields: [["Loại phòng", "Superior"], ["Ngày", "T6 9/10 · 1 đêm"], ["Số người", "2 người lớn · 1 bé 4 tuổi"], ["Giá đã báo", "620.000đ/đêm"]], said: "Bên em sẽ nhắn tin xác nhận lại",
    transcript: [["B", G], ["K", "Cho anh đặt Superior đêm thứ Sáu, hai người lớn một bé 4 tuổi."], ["B", "Dạ Superior cuối tuần 620 nghìn một đêm, bé dưới 6 tuổi ngủ chung miễn phí ạ. Cho em xin tên anh ạ?"], ["K", "Long."], ["B", "Dạ bên em sẽ nhắn tin xác nhận lại qua số này ạ."]] }),
  R({ id: "gio", number: "0900 000 351", type: "Hỏi thông tin", day: 0, at: "09:42", len: "0:14", status: "auto",
    fields: [["Câu hỏi", "Giờ nhận phòng"], ["Bonia trả lời", "Nhận 14:00 · trả trước 12:00"]], said: "Nhận phòng từ 14 giờ",
    transcript: [["B", G], ["K", "Mấy giờ nhận phòng vậy em?"], ["B", "Dạ nhận phòng từ 14 giờ, trả phòng trước 12 giờ trưa ạ."]] }),
  R({ id: "103", room: "103", number: "0900 000 303", type: "Khách đang ở", day: 0, at: "08:30", len: "0:11", status: "done", doneBy: "Máy tính quầy", doneAt: "08:36",
    fields: [["Việc", "Mượn bàn ủi"]], said: "Em báo dọn phòng mang lên",
    transcript: [["B", G], ["K", "Phòng 103 cho chị mượn cái bàn ủi nha."], ["B", "Dạ em báo dọn phòng mang lên cho chị ạ."]] }),
  R({ id: "mai", name: "chị Mai", number: "0900 000 318", type: "Đổi/hủy", day: 1, at: "16:40", len: "0:33", status: "done", doneBy: "iPhone quầy", doneAt: "17:02",
    fields: [["Đặt cũ", "Family · 12/10 · 2 đêm"], ["Muốn đổi", "Sang 19/10 · 2 đêm"]], said: "Bên em kiểm tra xong sẽ nhắn lại",
    transcript: [["B", G], ["K", "Chị đặt phòng Family ngày 12, giờ chị muốn dời sang 19 được không em?"], ["B", "Dạ em ghi lại rồi, bên em kiểm tra phòng ngày 19 xong sẽ nhắn lại chị ạ."]] }),
  R({ id: "401", room: "401", number: "0900 000 340", type: "Khiếu nại", day: 1, at: "22:15", len: "0:27", status: "done", urgent: true, doneBy: "iPhone quầy", doneAt: "22:20",
    fields: [["Việc", "Ồn từ quán karaoke bên cạnh"], ["Mức", "Gấp"]], said: "Em cho người xử lý ngay",
    transcript: [["B", G], ["K", "Phòng 401 nè em, bên cạnh hát karaoke ồn quá không ngủ được."], ["B", "Dạ em xin lỗi chị, em cho người xử lý ngay cho chị ạ."]] }),
  R({ id: "giogio", number: "0900 000 362", type: "Hỏi thông tin", day: 1, at: "15:08", len: "0:19", status: "auto",
    fields: [["Câu hỏi", "Giá theo giờ"], ["Bonia trả lời", "Standard 200.000đ 2 giờ đầu · 50.000đ mỗi giờ sau"]], said: "Báo giá theo giờ",
    transcript: [["B", G], ["K", "Bên em có phòng theo giờ không, bao nhiêu em?"], ["B", "Dạ có ạ. Phòng Standard 2 giờ đầu 200 nghìn, mỗi giờ sau 50 nghìn ạ."]] }),
  R({ id: "phuc", name: "anh Phúc", number: "0900 000 371", type: "Đặt phòng", day: 2, at: "10:12", len: "0:46", status: "done", doneBy: "Máy tính quầy", doneAt: "10:30",
    fields: [["Loại phòng", "Suite"], ["Ngày", "CN 11/10 · 2 đêm"], ["Số người", "3"], ["Giá đã báo", "1.400.000đ/đêm"]], said: "Bên em sẽ nhắn tin xác nhận lại",
    transcript: [["B", G], ["K", "Anh muốn đặt Suite từ Chủ nhật, 2 đêm, 3 người."], ["B", "Dạ Suite 1 triệu 4 một đêm ạ. Cho em xin tên anh ạ?"], ["K", "Phúc."], ["B", "Dạ bên em sẽ nhắn tin xác nhận lại qua số này ạ."]] }),
  R({ id: "sang", number: "0900 000 384", type: "Hỏi thông tin", day: 2, at: "08:02", len: "0:12", status: "auto",
    fields: [["Câu hỏi", "Có bữa sáng không"], ["Bonia trả lời", "Chưa có bữa sáng · quán ăn sáng đầu hẻm"]], said: "Chưa có bữa sáng",
    transcript: [["B", G], ["K", "Bên em có bữa sáng không em?"], ["B", "Dạ bên em chưa có bữa sáng ạ, đầu hẻm có quán ăn sáng mở từ 6 giờ ạ."]] }),
];

export const DAYS = ["Hôm nay", "Hôm qua", "Thứ Ba 6/10"];

/**
 * Scripted live calls for the demo. lines: [secondFromPickup, "B"|"K", text];
 * fields: [label, secondHeard, value]; writing: the seconds Bonia spends
 * recording the request; notifyAt: when the desk has been told.
 */
export const SCRIPTS = {
  booking: {
    number: "0900 000 336", end: 41, type: "Đặt phòng", urgent: false, name: "chị Ngân", nameAt: 21,
    lines: [[0, "B", G], [3, "K", "Alo em ơi, cuối tuần này bên em có phòng nào có ban công không?"], [8, "B", "Dạ bên em có phòng Deluxe ban công hướng phố, cuối tuần 850 nghìn một đêm ạ. Mình định ở từ ngày nào ạ?"], [15, "K", "Tối thứ Sáu tới Chủ nhật, hai người."], [19, "B", "Dạ cho em xin tên mình ạ?"], [21, "K", "Ngân."], [23, "B", "Dạ em nhắc lại: Deluxe ban công, nhận phòng thứ Sáu 9/10, trả phòng Chủ nhật 11/10, 2 đêm, 2 người, tên chị Ngân. Đúng không chị?"], [31, "K", "Đúng rồi em."], [33, "B", "Dạ chị đợi em xíu nha."], [36, "B", "Dạ rồi, bên em sẽ nhắn tin xác nhận lại qua số điện thoại này ạ. Em cảm ơn chị."]],
    writing: [34.2, 36], notifyAt: 36,
    fields: [["Loại phòng", 8, "Deluxe ban công"], ["Ngày", 15, "T6 9/10 → CN 11/10 · 2 đêm"], ["Số người", 15, "2"], ["Tên", 21, "chị Ngân"], ["Giá đã báo", 8, "850.000đ/đêm cuối tuần"]],
    said: "Bên em sẽ nhắn tin xác nhận lại",
  },
  urgent: {
    number: "0900 000 362", end: 17, type: "Khách đang ở", urgent: true, room: "302", roomAt: 2.5,
    lines: [[0, "B", G], [2, "K", "Em ơi phòng 302 nè, máy lạnh phòng chị chảy nước ướt hết sàn rồi em ơi."], [7, "B", "Dạ em báo kỹ thuật lên ngay cho chị ạ."], [10, "B", "Chị để đồ điện xa chỗ nước giúp em nha."], [15, "K", "Ừ, cảm ơn em."]],
    writing: [8.6, 9.8], notifyAt: 9.8,
    fields: [["Phòng", 2.5, "302"], ["Việc", 4, "Máy lạnh chảy nước, ướt sàn"], ["Mức", 4, "Gấp"]],
    said: "Em báo kỹ thuật lên ngay",
  },
};
