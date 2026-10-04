// Sample requests and the two scripted live calls (handoff 13, tt3-data.js),
// with the review fixes of 2026-10-04: Bonia is the hotel's own receptionist,
// so it says "bên em" / "em báo dọn phòng", never "em báo khách sạn".
// A request carries one plain summary, not fixed fields (founder 2026-10-04):
// calls nobody foresaw still read right, and nothing gets squeezed into labels.

export const GREETING = "Dạ khách sạn Sân Nhài xin nghe ạ.";
const G = GREETING;

/** Card title: the guest's name, else "Phòng N", else the number. */
export const title = (r) => r.name || (r.room ? `Phòng ${r.room}` : r.number);

/** The text "Sao chép" puts on the clipboard, to paste into whatever channel the hotel uses. */
export const copyText = (r) => [r.urgent ? "GẤP" : "", r.type, title(r), r.number, r.summary].filter(Boolean).join(" · ");

const R = (o) => ({ summary: "", transcript: [], len: "0:30", status: "open", urgent: false, ...o });

export const REQUESTS = [
  R({ id: "kevin", name: "anh Kevin", number: "0900 000 341", type: "Đặt phòng", day: 0, at: "13:52", len: "0:38",
    summary: "Khách nói tiếng Anh. Muốn đặt phòng Deluxe ban công đêm thứ Bảy 10/10, 1 đêm, 2 người. Bonia đã báo 850.000đ/đêm cuối tuần.",
    transcript: [["B", G], ["K", "Hi, do you have a Deluxe room for Saturday night, the 10th?"], ["B", "Yes, a Deluxe room with a balcony is 850,000 VND per night at the weekend. May I have your name?"], ["K", "Kevin."], ["B", "Thank you, Kevin. We'll text you to confirm shortly."]] }),
  R({ id: "205", room: "205", number: "0900 000 325", type: "Khách đang ở", day: 0, at: "13:12", len: "0:16",
    summary: "Xin thêm 2 khăn tắm.",
    transcript: [["B", G], ["K", "Em ơi cho chị xin thêm 2 khăn tắm phòng 205 nha."], ["B", "Dạ em báo dọn phòng mang lên cho chị ạ."]] }),
  R({ id: "sophie", name: "chị Sophie", number: "0900 000 358", type: "Dịch vụ", day: 0, at: "11:40", len: "0:44",
    summary: "Khách nói tiếng Anh. Cần xe 4 chỗ đón ở sân bay Tân Sơn Nhất lúc 01:30 sáng thứ Sáu 9/10, 1 người. Bonia đã báo 380.000đ + 150.000đ phụ thu đêm.",
    transcript: [["B", G], ["K", "Hello, can you pick me up at Tan Son Nhat airport at 1:30 on Friday morning?"], ["B", "Yes. A 4-seat car is 380,000 VND, plus 150,000 VND night surcharge. How many people?"], ["K", "Just me."], ["B", "Noted. We'll text you to confirm the pickup."]] }),
  R({ id: "huong", name: "chị Hương", number: "0900 000 329", type: "Quên đồ", day: 0, at: "10:22", len: "0:29",
    summary: "Trả phòng 304 hôm qua, bỏ quên sạc máy tính màu trắng. Nhờ kiểm tra rồi gọi lại.",
    transcript: [["B", G], ["K", "Hôm qua chị trả phòng 304, chắc chị bỏ quên cái sạc máy tính màu trắng."], ["B", "Dạ em ghi lại rồi ạ. Bên em kiểm tra xong sẽ gọi lại cho chị ạ."]] }),
  R({ id: "nuoc", number: "0900 000 367", type: "Lời nhắn", day: 0, at: "09:05", len: "0:24",
    summary: "Nhà cung cấp nước suối hẹn giao hàng chiều nay, nhờ gọi lại xác nhận giờ giao.",
    transcript: [["B", G], ["K", "Anh bên nước suối Sài Gòn, chiều nay anh giao hàng, em báo quầy gọi lại xác nhận giờ giúp anh."], ["B", "Dạ em ghi lại rồi, bên em sẽ gọi lại anh xác nhận giờ ạ."]] }),
  R({ id: "hem", number: "0900 000 344", type: "Hỏi thông tin", day: 0, at: "14:05", len: "0:22", status: "auto",
    summary: "Hỏi ô tô vào hẻm được không. Bonia trả lời: ô tô vào tới cửa, gửi ở bãi đầu hẻm 40.000đ một lượt.",
    transcript: [["B", G], ["K", "Em ơi ô tô vào hẻm khách sạn được không em?"], ["B", "Dạ hẻm ô tô vào tới cửa ạ. Ô tô gửi ở bãi đầu hẻm, 40 nghìn một lượt ạ."], ["K", "Ok cảm ơn em."]] }),
  R({ id: "long", name: "anh Long", number: "0900 000 352", type: "Đặt phòng", day: 0, at: "11:20", len: "0:51", status: "done", doneBy: "iPhone quầy", doneAt: "11:31",
    summary: "Đặt Superior đêm thứ Sáu 9/10, 2 người lớn và 1 bé 4 tuổi. Bonia đã báo 620.000đ/đêm, bé ngủ chung miễn phí.",
    transcript: [["B", G], ["K", "Cho anh đặt Superior đêm thứ Sáu, hai người lớn một bé 4 tuổi."], ["B", "Dạ Superior cuối tuần 620 nghìn một đêm, bé dưới 6 tuổi ngủ chung miễn phí ạ. Cho em xin tên anh ạ?"], ["K", "Long."], ["B", "Dạ bên em sẽ nhắn tin xác nhận lại qua số này ạ."]] }),
  R({ id: "gio", number: "0900 000 351", type: "Hỏi thông tin", day: 0, at: "09:42", len: "0:14", status: "auto",
    summary: "Hỏi giờ nhận phòng. Bonia trả lời: nhận từ 14:00, trả trước 12:00.",
    transcript: [["B", G], ["K", "Mấy giờ nhận phòng vậy em?"], ["B", "Dạ nhận phòng từ 14 giờ, trả phòng trước 12 giờ trưa ạ."]] }),
  R({ id: "103", room: "103", number: "0900 000 303", type: "Khách đang ở", day: 0, at: "08:30", len: "0:11", status: "done", doneBy: "Máy tính quầy", doneAt: "08:36",
    summary: "Mượn bàn ủi.",
    transcript: [["B", G], ["K", "Phòng 103 cho chị mượn cái bàn ủi nha."], ["B", "Dạ em báo dọn phòng mang lên cho chị ạ."]] }),
  R({ id: "mai", name: "chị Mai", number: "0900 000 318", type: "Đổi/hủy", day: 1, at: "16:40", len: "0:33", status: "done", doneBy: "iPhone quầy", doneAt: "17:02",
    summary: "Muốn dời phòng Family đã đặt từ 12/10 sang 19/10, vẫn 2 đêm.",
    transcript: [["B", G], ["K", "Chị đặt phòng Family ngày 12, giờ chị muốn dời sang 19 được không em?"], ["B", "Dạ em ghi lại rồi, bên em kiểm tra phòng ngày 19 xong sẽ nhắn lại chị ạ."]] }),
  R({ id: "401", room: "401", number: "0900 000 340", type: "Khiếu nại", day: 1, at: "22:15", len: "0:27", status: "done", urgent: true, doneBy: "iPhone quầy", doneAt: "22:20",
    summary: "Phòng bên cạnh hát karaoke ồn, khách không ngủ được.",
    transcript: [["B", G], ["K", "Phòng 401 nè em, bên cạnh hát karaoke ồn quá không ngủ được."], ["B", "Dạ em xin lỗi chị, em cho người xử lý ngay cho chị ạ."]] }),
  R({ id: "giogio", number: "0900 000 362", type: "Hỏi thông tin", day: 1, at: "15:08", len: "0:19", status: "auto",
    summary: "Hỏi giá theo giờ. Bonia trả lời: Standard 200.000đ 2 giờ đầu, 50.000đ mỗi giờ sau.",
    transcript: [["B", G], ["K", "Bên em có phòng theo giờ không, bao nhiêu em?"], ["B", "Dạ có ạ. Phòng Standard 2 giờ đầu 200 nghìn, mỗi giờ sau 50 nghìn ạ."]] }),
  R({ id: "phuc", name: "anh Phúc", number: "0900 000 371", type: "Đặt phòng", day: 2, at: "10:12", len: "0:46", status: "done", doneBy: "Máy tính quầy", doneAt: "10:30",
    summary: "Đặt Suite từ Chủ nhật 11/10, 2 đêm, 3 người. Bonia đã báo 1.400.000đ/đêm.",
    transcript: [["B", G], ["K", "Anh muốn đặt Suite từ Chủ nhật, 2 đêm, 3 người."], ["B", "Dạ Suite 1 triệu 4 một đêm ạ. Cho em xin tên anh ạ?"], ["K", "Phúc."], ["B", "Dạ bên em sẽ nhắn tin xác nhận lại qua số này ạ."]] }),
  R({ id: "sang", number: "0900 000 384", type: "Hỏi thông tin", day: 2, at: "08:02", len: "0:12", status: "auto",
    summary: "Hỏi có bữa sáng không. Bonia trả lời: chưa có, đầu hẻm có quán ăn sáng từ 6 giờ.",
    transcript: [["B", G], ["K", "Bên em có bữa sáng không em?"], ["B", "Dạ bên em chưa có bữa sáng ạ, đầu hẻm có quán ăn sáng mở từ 6 giờ ạ."]] }),
];

export const DAYS = ["Hôm nay", "Hôm qua", "Thứ Ba 6/10"];

/**
 * Scripted live calls for the demo. lines: [secondFromPickup, "B"|"K", text];
 * summary: [secondFrom, text], what "Bonia đã hiểu" shows as the call goes (the
 * last one is the request it files); writing: the seconds Bonia spends
 * recording the request; notifyAt: when the desk has been told.
 */
export const SCRIPTS = {
  booking: {
    number: "0900 000 336", end: 41, type: "Đặt phòng", urgent: false, name: "chị Ngân", nameAt: 21,
    lines: [[0, "B", G], [3, "K", "Alo em ơi, cuối tuần này bên em có phòng nào có ban công không?"], [8, "B", "Dạ bên em có phòng Deluxe ban công hướng phố, cuối tuần 850 nghìn một đêm ạ. Mình định ở từ ngày nào ạ?"], [15, "K", "Tối thứ Sáu tới Chủ nhật, hai người."], [19, "B", "Dạ cho em xin tên mình ạ?"], [21, "K", "Ngân."], [23, "B", "Dạ em nhắc lại: Deluxe ban công, nhận phòng thứ Sáu 9/10, trả phòng Chủ nhật 11/10, 2 đêm, 2 người, tên chị Ngân. Đúng không chị?"], [31, "K", "Đúng rồi em."], [33, "B", "Dạ chị đợi em xíu nha."], [36, "B", "Dạ rồi, bên em sẽ nhắn tin xác nhận lại qua số điện thoại này ạ. Em cảm ơn chị."]],
    writing: [34.2, 36], notifyAt: 36,
    summary: [
      [8, "Hỏi phòng có ban công cuối tuần này. Bonia đã báo Deluxe ban công 850.000đ/đêm cuối tuần."],
      [15, "Muốn phòng Deluxe ban công từ tối thứ Sáu 9/10 tới Chủ nhật 11/10, 2 người. Bonia đã báo 850.000đ/đêm cuối tuần."],
      [33, "Đặt phòng Deluxe ban công từ thứ Sáu 9/10 tới Chủ nhật 11/10, 2 đêm, 2 người. Bonia đã báo 850.000đ/đêm cuối tuần."],
    ],
  },
  urgent: {
    number: "0900 000 362", end: 17, type: "Khách đang ở", urgent: true, room: "302", roomAt: 2.5,
    lines: [[0, "B", G], [2, "K", "Em ơi phòng 302 nè, máy lạnh phòng chị chảy nước ướt hết sàn rồi em ơi."], [7, "B", "Dạ em báo kỹ thuật lên ngay cho chị ạ."], [10, "B", "Chị để đồ điện xa chỗ nước giúp em nha."], [15, "K", "Ừ, cảm ơn em."]],
    writing: [8.6, 9.8], notifyAt: 9.8,
    summary: [[2.5, "Máy lạnh phòng 302 có sự cố."], [4, "Máy lạnh phòng 302 chảy nước, ướt hết sàn."]],
  },
};
