// Copy for bonia.vn/retail, from the handoff prototype's DATA
// ("Bonia Retail.dc.html", which includes the founder's own edits). The old
// §01 "Ví dụ" examples were dropped from the design and are not carried over.
//
// FAQ "Tôi có cần cài thêm app gì không?" (founder 2026-10-01): "tải 1 app duy
// nhất là Bonia" (the design's "Không…" contradicted the Tải app section).

export const SPAM = [
  "Telesales bảo hiểm, bất động sản",
  "Số lạ gọi nhiều lần trong ngày",
  "Lừa đảo giả danh ngân hàng, công an",
  "Đòi nợ thay, đe doạ",
];

export const IMPORTANT = [
  "Shipper giao hàng đến nơi",
  "Nhà tuyển dụng, đối tác công việc",
  "Bệnh viện, trường học của con",
  "Người thân dùng số điện thoại lạ",
];

export const FEATURES = [
  {
    title: "Trả lời tự nhiên bằng tiếng Việt",
    body: "Bonia hiểu giọng vùng miền và các tình huống thường gặp ở Việt Nam, từ shipper, đối tác, đến số lạ.",
  },
  {
    title: "Tóm tắt gửi ngay về điện thoại",
    body: "Sau mỗi cuộc gọi, bạn nhận một thông báo ngắn gọn: ai gọi, vì việc gì, có cần gọi lại không.",
  },
  {
    title: "Nghe trực tiếp khi cần",
    body: "Khi Bonia đang xử lý một cuộc gọi quan trọng, bạn có thể theo dõi trực tiếp và nhận máy chỉ với một chạm. Bạn luôn là người quyết định.",
  },
];

export const STEPS = [
  {
    title: "Chuyển hướng cuộc gọi nhỡ",
    body: "Bật chuyển hướng cuộc gọi sang số Bonia khi bạn không bắt máy hoặc cuộc gọi nhỡ. Mất khoảng 30 giây.",
  },
  {
    title: "Bonia trả lời thay bạn",
    body: "Khi bạn không nghe máy, Bonia nhận cuộc gọi, hỏi tên người gọi và mục đích, ghi lại nội dung.",
  },
  {
    title: "Bạn nhận tóm tắt qua thông báo",
    body: "Mở điện thoại, bạn thấy ngay ai gọi, vì việc gì, và có thể quyết định bước tiếp theo.",
  },
];

export const FREE_POINTS = [
  "Bonia luôn miễn phí, giúp bạn và người thân phòng tránh cuộc gọi lừa đảo và làm phiền.",
  "Không quảng cáo trong app.\nKhông kinh doanh, không chia sẻ dữ liệu của bạn với bất kỳ bên nào.",
  "Nhà mạng có thể tính phí chuyển hướng cuộc gọi theo gói cước của bạn. Bonia không thu phí cuộc gọi.",
];

export const CONCERNS = [
  {
    q: "Có bất lịch sự khi để AI nghe máy thay không?",
    a: "Bonia chỉ nghe máy khi bạn nhỡ cuộc gọi hoặc đang bận. Bonia mở lời như một người thân hay thư ký đang cầm máy giùm, “Dạ alo, mình gọi có việc gì ạ?”, đúng phép xã giao tiếng Việt. Với người thân, bạn bè trong danh bạ, bạn có thể cài để Bonia trả lời theo ý bạn.",
  },
  {
    q: "Bonia nói có tự nhiên như người không?",
    a: "Bonia được huấn luyện riêng cho tiếng Việt: hiểu giọng Bắc, Nam, biết dùng “dạ”, “ạ”, xưng hô đúng vai. Không phải giọng tổng đài đọc kịch bản. Bạn có thể nghe thử trong app trước khi dùng.",
  },
  {
    q: "Nếu là cuộc gọi khẩn cấp thì sao?",
    a: "Bonia nhận diện từ khoá khẩn cấp (“tai nạn”, “bệnh viện”, “cấp cứu”…), ghi nhận thông tin, kết thúc cuộc gọi gọn gàng và lập tức báo cho bạn. Số trong danh bạ ưu tiên (bố mẹ, vợ chồng, con) cũng được xử lý như vậy.",
  },
];

export const PRIVACY = [
  {
    title: "Dữ liệu tự động xoá sau 30 ngày",
    body: "Sau 30 ngày, dữ liệu tự động xoá khỏi máy chủ. Bạn cũng có thể xoá bất kỳ lúc nào.",
  },
  {
    title: "Không bán dữ liệu, không quảng cáo",
    body: "Bonia không dùng dữ liệu của bạn để kinh doanh hay bán cho bên thứ ba.",
  },
];

export const FAQ = [
  {
    q: "Bonia có thay tôi nghe máy hoàn toàn không?",
    a: "Bonia nhận khi bạn không bắt máy hoặc đang bận. Bất cứ lúc nào bạn muốn, bạn có thể nhận máy trực tiếp để tự nói chuyện với người gọi.",
  },
  {
    q: "Tôi có cần cài thêm app gì không?",
    a: "Chỉ cần tải 1 app duy nhất là Bonia. Sau đó Bonia hoạt động qua tính năng chuyển hướng cuộc gọi sẵn có trên điện thoại của bạn.",
  },
  {
    q: "Bonia hoạt động trên điện thoại nào?",
    a: "Mọi điện thoại iPhone và Android dùng SIM Việt Nam đều dùng được.",
  },
  {
    q: "Có mất phí cuộc gọi không?",
    a: "Người gọi không mất thêm phí. Bạn chỉ trả phí chuyển hướng theo gói cước thông thường. Đây là phí do nhà mạng thu, Bonia không thu bất kỳ phí nào.",
  },
  {
    q: "Bonia có nghe lén tôi không?",
    a: "Không. Bonia chỉ kích hoạt khi có cuộc gọi đến mà bạn không bắt máy. Ngoài lúc đó, Bonia không truy cập micro.",
  },
  {
    q: "Tôi có thể nghe lại nguyên văn cuộc gọi không?",
    a: "Bạn có thể xem lại bản chuyển ngữ của cuộc gọi.",
  },
  {
    q: "Bonia có chặn được lừa đảo giả danh không?",
    a: "Bonia nhận diện được nhiều mẫu lừa đảo phổ biến và cảnh báo bạn. Nhưng bạn vẫn nên cẩn trọng và xác minh thông tin.",
  },
  {
    q: "Tôi có thể tạm tắt Bonia không?",
    a: "Có. Bạn tắt chuyển hướng cuộc gọi là Bonia ngừng hoạt động. Bật lại bất cứ khi nào.",
  },
  {
    q: "Có hỗ trợ tiếng Anh không?",
    a: "Trong giai đoạn này, Bonia chỉ hỗ trợ tiếng Việt. Tiếng Anh sẽ được thêm vào trong tương lai.",
  },
  {
    q: "Làm sao bắt đầu sử dụng?",
    a: "Bạn tải Bonia trên App Store hoặc Google Play, mở app và làm theo hướng dẫn. Việc bật chuyển hướng cuộc gọi mất khoảng 2 phút.",
  },
];

export const STATS = [
  { v: "2 phút", l: "Thời gian cài" },
  { v: "0đ", l: "Miễn phí trọn đời" },
  { v: "SIM Việt Nam", l: "Mọi nhà mạng" },
];
