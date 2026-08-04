// All user-visible copy for the landing page, both languages.
// VI is the default; EN is the investor/international mirror.

export const COPY_VI = {
  brand: "Bonia",
  nav: ["Tính năng", "Hướng dẫn", "Câu hỏi"],
  hero: {
    eyebrow: "Trợ lý nghe máy bằng tiếng Việt",
    title: "Bonia nghe máy giúp bạn,",
    titleAccent: "khi bạn không tiện trả lời.",
    sub: "Khi bạn không bắt máy, Bonia tự động trả lời, khéo léo tìm hiểu mục đích cuộc gọi và gửi tóm tắt về điện thoại của bạn — bằng tiếng Việt, chi tiết và rõ ràng.",
    storesNote: "Có mặt trên iOS & Android — miễn phí, không quảng cáo",
  },
  problem: {
    eyebrow: "Vấn đề",
    title: "Mỗi ngày bạn nhận hàng chục cuộc gọi.",
    sub: "Phần lớn là Telesales, lừa đảo, hoặc số lạ. Một số ít là quan trọng — và bạn không có cách nào biết trước.",
    spam: {
      label: "Cuộc gọi không mong muốn",
      items: [
        "Telesales bảo hiểm, bất động sản",
        "Số lạ gọi nhiều lần trong ngày",
        "Lừa đảo giả danh ngân hàng, công an",
        "Đòi nợ thay, đe doạ",
      ],
    },
    important: {
      label: "Cuộc gọi bạn cần biết",
      items: [
        "Shipper giao hàng đến nơi",
        "Nhà tuyển dụng, đối tác công việc",
        "Bệnh viện, trường học của con",
        "Người thân dùng số điện thoại lạ",
      ],
    },
  },
  solution: {
    eyebrow: "Giải pháp",
    title: "Một trợ lý lịch sự, trả lời bằng tiếng Việt tự nhiên.",
    sub: "Bonia hoạt động như một thư ký riêng — khéo léo tìm hiểu mục đích cuộc gọi, ghi lại nội dung, và để bạn quyết định có gọi lại hay không.",
    features: [
      {
        title: "Trả lời tự nhiên bằng tiếng Việt",
        body: "Bonia hiểu giọng vùng miền và các tình huống thường gặp ở Việt Nam — từ shipper, đối tác, đến số lạ.",
      },
      {
        title: "Tóm tắt gửi ngay về điện thoại",
        body: "Sau mỗi cuộc gọi, bạn nhận một thông báo ngắn gọn: ai gọi, vì việc gì, có cần gọi lại không.",
      },
      {
        title: "Chặn quấy rối tự động",
        body: "Tiếp thị, robocall, lừa đảo bị nhận diện và đánh dấu — không làm phiền bạn nữa.",
      },
      {
        title: "Nghe trực tiếp khi cần",
        body: "Khi Bonia đang xử lý một cuộc gọi quan trọng, bạn có thể theo dõi trực tiếp và nhận máy chỉ với một chạm — nói chuyện ngay với người gọi. Bạn luôn là người quyết định.",
      },
    ],
  },
  how: {
    eyebrow: "Cách dùng",
    title: "Cài đặt một lần, Yên tâm trọn đời!",
    steps: [
      {
        n: "01",
        title: "Chuyển hướng cuộc gọi nhỡ",
        body: "Bật chuyển hướng cuộc gọi sang số Bonia khi bạn không bắt máy hoặc cuộc gọi nhỡ. Mất khoảng 30 giây.",
      },
      {
        n: "02",
        title: "Bonia trả lời thay bạn",
        body: "Khi bạn không nghe máy, Bonia nhận cuộc gọi, hỏi tên người gọi và mục đích, ghi lại nội dung.",
      },
      {
        n: "03",
        title: "Bạn nhận tóm tắt qua thông báo",
        body: "Mở điện thoại — bạn thấy ngay ai gọi, vì việc gì, và có thể quyết định bước tiếp theo.",
      },
    ],
  },
  examples: {
    eyebrow: "Ví dụ thực tế",
    title: "Ba tình huống bạn gặp mỗi tuần.",
    cards: [
      {
        kind: "Telesales",
        time: "16:48",
        quote:
          "Em chào anh, em bên bảo hiểm nhân thọ ABC, em muốn giới thiệu gói sản phẩm mới…",
        meta: "Đã chặn — không cần phản hồi",
      },
      {
        kind: "Shipper",
        time: "14:32",
        quote:
          "Em là shipper Giao Hàng Tiết Kiệm, đang ở dưới nhà chị. Đơn 198k, chị xuống nhận giúp em ạ.",
        meta: "Quan trọng — gọi lại ngay",
      },
      {
        kind: "Nhà tuyển dụng",
        time: "10:15",
        quote:
          "Tôi là Linh, phòng nhân sự công ty XYZ. Muốn hẹn anh phỏng vấn vào thứ Sáu này, 9 giờ sáng.",
        meta: "Quan trọng — gọi lại hôm nay",
      },
    ],
  },
  privacy: {
    items: [
      {
        title: "Dữ liệu tự động xoá sau 30 ngày",
        body: "Sau 30 ngày, dữ liệu tự động xoá khỏi máy chủ — bạn cũng có thể xoá bất kỳ lúc nào.",
      },
      {
        title: "Không bán dữ liệu, không quảng cáo",
        body: "Bonia không dùng dữ liệu của bạn để kinh doanh hay bán cho bên thứ ba.",
      },
    ],
  },
  concerns: {
    eyebrow: "Băn khoăn thường gặp",
    title: "Ba điều người Việt lo lắng nhất.",
    items: [
      {
        q: "Có bất lịch sự khi để AI nghe máy thay không?",
        a: 'Bonia chỉ nghe máy khi bạn nhỡ cuộc gọi hoặc đang bận. Bonia mở lời như một người thân/thư ký đang cầm máy giùm — "Dạ alo, mình gọi có việc gì ạ?" — đúng phép xã giao tiếng Việt, không xưng mình là máy hay AI. Với người thân hoặc bạn bè trong danh bạ, bạn có thể cài đặt để Bonia trả lời theo ý bạn.',
      },
      {
        q: "Bonia nói có tự nhiên như người không?",
        a: 'Bonia được huấn luyện riêng cho tiếng Việt — giọng Bắc, Nam đều hiểu, biết dùng "dạ", "ạ", xưng hô đúng vai. Không phải giọng tổng đài đọc kịch bản. Bạn có thể nghe thử khi cài đặt App trước khi sử dụng.',
      },
      {
        q: "Nếu là cuộc gọi khẩn cấp thì sao?",
        a: 'Bonia nhận diện từ khoá khẩn cấp ("tai nạn", "bệnh viện", "cấp cứu"…), ghi nhận thông tin, kết thúc cuộc gọi gọn gàng và lập tức báo cho bạn biết. Số trong danh bạ ưu tiên (bố mẹ, vợ/chồng, con) cũng được Bonia xử lý gọn ghẽ.',
      },
    ],
  },
  faq: {
    eyebrow: "Câu hỏi thường gặp",
    title: "Những điều bạn có thể đang băn khoăn.",
    items: [
      {
        q: "Bonia có thay tôi nghe máy hoàn toàn không?",
        a: "Bonia nhận khi bạn không bắt máy hoặc đang bận. Và bất cứ lúc nào bạn muốn, bạn có thể nhận máy trực tiếp để tự nói chuyện với người gọi — bạn luôn là người quyết định.",
      },
      {
        q: "Tôi có cần cài thêm app gì không?",
        a: "Không. Bonia hoạt động qua tính năng chuyển hướng cuộc gọi sẵn có trên điện thoại của bạn.",
      },
      {
        q: "Bonia hoạt động trên điện thoại nào?",
        a: "Mọi điện thoại di động dùng SIM Việt Nam đều dùng được — iPhone, Android, hay điện thoại cơ bản.",
      },
      {
        q: "Có mất phí cuộc gọi không?",
        a: "Người gọi không mất thêm phí. Bạn chỉ trả phí thuê bao cuộc gọi theo gói cước thông thường. Đây là phí do Nhà mạng thu, Bonia không thu bất kỳ phí nào.",
      },
      {
        q: "Bonia có nghe lén tôi không?",
        a: "Không. Bonia chỉ kích hoạt khi có cuộc gọi đến mà bạn không bắt máy. Ngoài lúc đó, Bonia không truy cập micro.",
      },
      {
        q: "Tôi có thể nghe lại nguyên văn cuộc gọi không?",
        a: "Bạn có thể xem lại bản chuyển ngữ (Transcription) của cuộc gọi.",
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
        a: "Bạn tải Bonia trên App Store hoặc Google Play, mở app và làm theo hướng dẫn. Việc kích hoạt chuyển hướng cuộc gọi mất khoảng 2 phút.",
      },
    ],
  },
  cta: {
    eyebrow: "Tải ứng dụng",
    titleLead: "Đã có mặt trên",
    titleAccent: "iOS & Android.",
    sub: "Tải Bonia, kích hoạt chuyển hướng cuộc gọi trong hai phút — và không bao giờ phải nghe spam nữa.",
    stat1: { value: "2 phút", label: "Thời gian cài" },
    stat2: { value: "0đ", label: "Miễn phí trọn đời" },
    stat3: { value: "SIM Việt Nam", label: "Mọi nhà mạng" },
  },
  footer: {
    company: "Công ty TNHH Duy Nhiên Investment",
    addr: "120 N2 Mega Village, Đường Võ Chí Công, phường Long Trường, TP.HCM",
    mst: "MST: 0319376631",
    rights: "© 2026 Bonia. Mọi quyền được bảo lưu.",
  },
};


// ─────────────────────────────────────────────────────────────────────────────
// English copy (investor / international-partner version). The hero's cycling
// TRANSCRIPTS stay Vietnamese in both languages on purpose — they are the
// product artifact itself (a Vietnamese-speaking assistant), not chrome.
// ─────────────────────────────────────────────────────────────────────────────
export const COPY_EN = {
  brand: "Bonia",
  nav: ["Features", "How it works", "FAQ"],
  hero: {
    eyebrow: "The Vietnamese-speaking call assistant",
    title: "Bonia answers your calls,",
    titleAccent: "when you can't pick up.",
    sub: "When you don't answer, Bonia picks up automatically, tactfully finds out why the person is calling, and sends a clear, detailed summary to your phone — all in natural Vietnamese.",
    storesNote: "Available on iOS & Android — free, no ads",
  },
  problem: {
    eyebrow: "The problem",
    title: "You get dozens of calls every day.",
    sub: "Most are telesales, scams, or unknown numbers. A few are genuinely important — and there's no way to tell in advance.",
    spam: {
      label: "Calls you don't want",
      items: [
        "Insurance and real-estate telesales",
        "Unknown numbers calling again and again",
        "Scammers posing as banks or the police",
        "Third-party debt collectors and threats",
      ],
    },
    important: {
      label: "Calls you need to know about",
      items: [
        "A delivery driver at your door",
        "Recruiters and business partners",
        "The hospital, or your child's school",
        "Family calling from an unfamiliar number",
      ],
    },
  },
  solution: {
    eyebrow: "The solution",
    title: "A polite assistant that speaks natural Vietnamese.",
    sub: "Bonia works like a personal secretary — tactfully learning why someone is calling, taking down the details, and letting you decide whether to call back.",
    features: [
      {
        title: "Natural, fluent Vietnamese",
        body: "Bonia understands regional accents and the situations Vietnamese users actually face — delivery drivers, business partners, unknown numbers.",
      },
      {
        title: "A summary, straight to your phone",
        body: "After every call you get a short notification: who called, what they wanted, and whether it's worth calling back.",
      },
      {
        title: "Spam blocked automatically",
        body: "Telemarketing, robocalls, and scams are detected and flagged — they never bother you again.",
      },
      {
        title: "Listen in — and jump in",
        body: "When Bonia is handling an important call, you can follow it live and take over with a single tap — speaking directly with the caller. You're always the one in control.",
      },
    ],
  },
  how: {
    eyebrow: "How it works",
    title: "Set it up once. Peace of mind for life!",
    steps: [
      {
        n: "01",
        title: "Forward your missed calls",
        body: "Turn on call forwarding to Bonia's number for calls you miss or decline. It takes about 30 seconds.",
      },
      {
        n: "02",
        title: "Bonia answers for you",
        body: "When you don't pick up, Bonia takes the call, asks who's calling and why, and records the details.",
      },
      {
        n: "03",
        title: "You get a summary by notification",
        body: "Open your phone and instantly see who called and what it was about — then decide your next move.",
      },
    ],
  },
  examples: {
    eyebrow: "Real-world examples",
    title: "Three calls you get every week.",
    cards: [
      {
        kind: "Telesales",
        time: "16:48",
        quote:
          "Hello sir, I'm calling from ABC Life Insurance — I'd love to tell you about our new product package…",
        meta: "Blocked — no action needed",
      },
      {
        kind: "Delivery",
        time: "14:32",
        quote:
          "Hi, I'm the courier from Giao Hàng Tiết Kiệm, I'm downstairs at your building. Your 198,000₫ COD order — could you come down to collect it?",
        meta: "Important — call back now",
      },
      {
        kind: "Recruiter",
        time: "10:15",
        quote:
          "This is Linh from HR at XYZ Company. We'd like to invite you to interview this Friday at 9 a.m.",
        meta: "Important — call back today",
      },
    ],
  },
  privacy: {
    items: [
      {
        title: "Data auto-deletes after 30 days",
        body: "After 30 days, your data is automatically wiped from our servers — and you can delete it yourself at any time.",
      },
      {
        title: "No data sales, no ads",
        body: "Bonia never monetizes your data or sells it to third parties.",
      },
    ],
  },
  concerns: {
    eyebrow: "Common hesitations",
    title: "The three things Vietnamese users worry about most.",
    items: [
      {
        q: "Isn't it impolite to let an AI answer my calls?",
        a: 'Bonia only picks up when you miss a call or are busy. It opens the way a family member or secretary holding your phone would — "Dạ alo, mình gọi có việc gì ạ?" ("Hello, may I ask what you\'re calling about?") — following proper Vietnamese phone etiquette, and never announcing itself as a machine or an AI. For family and friends in your contacts, you can set exactly how Bonia should respond.',
      },
      {
        q: "Does Bonia actually sound human?",
        a: 'Bonia is trained specifically for Vietnamese — it understands both Northern and Southern accents, knows when to say "dạ" and "ạ" (the particles that mark respectful Vietnamese speech), and addresses each caller with the right form of address. It\'s not a call-center voice reading a script. You can hear it for yourself in the app before going live.',
      },
      {
        q: "What if the call is an emergency?",
        a: 'Bonia recognizes emergency keywords ("accident", "hospital", "emergency"…), captures the details, wraps up the call quickly, and alerts you immediately. Calls from priority contacts — parents, spouse, children — get the same swift handling.',
      },
    ],
  },
  faq: {
    eyebrow: "Frequently asked questions",
    title: "Things you might be wondering.",
    items: [
      {
        q: "Does Bonia take over all my calls?",
        a: "Bonia only answers when you don't pick up or are busy. And at any moment you can take the call yourself and talk directly with the caller — you're always the one in control.",
      },
      {
        q: "Do I need to install anything extra?",
        a: "No. Bonia works through the call-forwarding feature already built into your phone.",
      },
      {
        q: "Which phones does Bonia work on?",
        a: "Any mobile phone with a Vietnamese SIM — iPhone, Android, or even a basic feature phone.",
      },
      {
        q: "Are there call charges?",
        a: "Callers pay nothing extra. You only pay standard call-forwarding rates under your regular mobile plan — that fee goes to your carrier; Bonia itself charges nothing.",
      },
      {
        q: "Is Bonia listening in on me?",
        a: "No. Bonia only activates when an incoming call goes unanswered. Outside of that, it never accesses your microphone.",
      },
      {
        q: "Can I review exactly what was said?",
        a: "Yes — a full transcription of every call is available in the app.",
      },
      {
        q: "Can Bonia block impersonation scams?",
        a: "Bonia recognizes many common scam patterns and warns you. You should still stay cautious and verify important information yourself.",
      },
      {
        q: "Can I turn Bonia off temporarily?",
        a: "Yes. Switch off call forwarding and Bonia stops. Turn it back on whenever you like.",
      },
      {
        q: "Does it support English?",
        a: "At this stage, Bonia speaks Vietnamese only. English support is coming.",
      },
      {
        q: "How do I get started?",
        a: "Download Bonia from the App Store or Google Play, open the app, and follow the guide. Activating call forwarding takes about two minutes.",
      },
    ],
  },
  cta: {
    eyebrow: "Get the app",
    titleLead: "Now available on",
    titleAccent: "iOS & Android.",
    sub: "Download Bonia, activate call forwarding in two minutes — and never take a spam call again.",
    stat1: { value: "2 minutes", label: "Setup time" },
    stat2: { value: "0₫", label: "Free forever" },
    stat3: { value: "Vietnamese SIMs", label: "Every carrier" },
  },
  footer: {
    company: "Công ty TNHH Duy Nhiên Investment",
    addr: "120 N2 Mega Village, Đường Võ Chí Công, phường Long Trường, TP.HCM",
    mst: "Tax ID: 0319376631",
    rights: "© 2026 Bonia. All rights reserved.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Setup-guide copy (HuongDan section). Images stay VN app screenshots in both
// languages — the product UI is Vietnamese.
// ─────────────────────────────────────────────────────────────────────────────
export const HUONGDAN_VI = {
  stepWord: "Bước",
  steps: [
    {
      n: "01",
      title: "Nhập số điện thoại",
      body: "Nhập số và cách xưng hô (ví dụ “anh Duy”). Bonia dùng tên này để nói chuyện thay bạn.",
    },
    {
      n: "02",
      title: "Hiểu cách Bonia hoạt động",
      body: "Bonia trả lời thay bạn bằng cách chuyển hướng cuộc gọi bạn nhỡ hoặc từ chối về số của Bonia.",
    },
    {
      n: "03",
      title: "Bật chuyển hướng cuộc gọi",
      body: "Nhấn từng nút để bật chuyển hướng khi bạn nhỡ hoặc từ chối cuộc gọi.",
      note: "iOS27: app sao chép mã, bạn dán vào bàn phím số.",
    },
    {
      n: "04",
      title: "Kiểm tra chuyển hướng",
      body: "Bonia tự gọi thử đến số của bạn để chắc chắn mọi thứ hoạt động. Khoảng 20–30 giây.",
      note: "Đảm bảo thuê bao còn tiền và không bị khóa chiều gọi đi — nếu không, máy sẽ không chuyển hướng được.",
    },
    {
      n: "05",
      title: "Xong! Tuỳ chỉnh lời chào",
      body: "Chuyển hướng đã hoạt động. Tuỳ chỉnh giọng nói & lời chào, hoặc để mặc định “Alo” và bắt đầu ngay.",
    },
  ],
  dialer: {
    afterStep: "Sau bước 03",
    title: "Bấm nút Gọi",
    bodyLead: "Điện thoại mở màn hình gọi với mã đã điền sẵn. Bạn chỉ cần bấm nút ",
    bodyCallWord: "Gọi",
    bodyTail: " và đợi hệ thống trả lời — không cần nhập gì thêm.",
  },
  header: {
    tag: "Hướng dẫn cài đặt",
    title: "Cài một lần, yên tâm trọn đời.",
    sub: "Không cần rành công nghệ. Hãy liên hệ hotline để chúng tôi hỗ trợ nếu bạn gặp vấn đề trong lúc cài đặt.",
  },
  troubleshooting: {
    tag: "Xử lý sự cố",
    title: "Vấn đề có thể gặp phải trong quá trình cài đặt",
  },
  carrierCard: {
    eyebrow: "Một số SIM có thể gặp tình trạng nhà mạng tạm ẩn chức năng chuyển hướng",
    title: "Gọi tổng đài — chỉ mất 1–2 phút.",
    p1: "Đừng lo — tổng đài viên sẽ hỗ trợ bật chức năng chuyển hướng giúp bạn ngay trong cuộc gọi.",
    p2: "Cuộc gọi tổng đài thường chỉ mất khoảng 30s.",
    step1Label: "01 · GỌI TỔNG ĐÀI",
    step2Label: "02 · ĐỌC CÂU NÀY",
    quote: "“SIM của tôi không bật được chức năng chuyển hướng cuộc gọi, vui lòng hỗ trợ bật giúp tôi.”",
    step3: "Quay lại app, bấm “Thử lại”. Vẫn chưa được? Nhắn Zalo hoặc gọi hỗ trợ Bonia — chúng tôi bật giúp bạn.",
  },
};

export const HUONGDAN_EN = {
  stepWord: "Step",
  steps: [
    {
      n: "01",
      title: "Enter your phone number",
      body: 'Enter your number and how you\'d like to be addressed (e.g. "anh Duy"). Bonia uses this name when speaking on your behalf.',
    },
    {
      n: "02",
      title: "See how Bonia works",
      body: "Bonia answers for you by forwarding the calls you miss or decline to Bonia's number.",
    },
    {
      n: "03",
      title: "Turn on call forwarding",
      body: "Tap each button to enable forwarding for missed and declined calls.",
      note: "On iOS 27: the app copies the code for you — just paste it into the dial pad.",
    },
    {
      n: "04",
      title: "Verify the forwarding",
      body: "Bonia places a test call to your number to confirm everything works. Takes about 20–30 seconds.",
      note: "Make sure your SIM has credit and outbound calling isn't blocked — otherwise forwarding won't go through.",
    },
    {
      n: "05",
      title: "Done! Personalize your greeting",
      body: 'Forwarding is live. Customize the voice and greeting, or keep the default "Alo" and start right away.',
    },
  ],
  dialer: {
    afterStep: "After step 03",
    title: "Tap Call",
    bodyLead: "Your phone opens the dialer with the code already filled in. Just tap ",
    bodyCallWord: "Call",
    bodyTail: " and wait for the network to respond — nothing else to enter.",
  },
  header: {
    tag: "Setup guide",
    title: "Set it up once, peace of mind for life.",
    sub: "No tech skills required. If anything comes up during setup, call our hotline and we'll walk you through it.",
  },
  troubleshooting: {
    tag: "Troubleshooting",
    title: "Issues you might run into during setup",
  },
  carrierCard: {
    eyebrow: "On some SIMs, the carrier temporarily hides the call-forwarding feature",
    title: "Call your carrier — it takes 1–2 minutes.",
    p1: "Don't worry — a support agent will enable call forwarding for you right on the call.",
    p2: "The call itself usually takes about 30 seconds.",
    step1Label: "01 · CALL YOUR CARRIER",
    step2Label: "02 · READ THIS LINE",
    quote: '"My SIM can\'t enable call forwarding — please turn it on for me."',
    step3: 'Return to the app and tap "Try again". Still stuck? Message us on Zalo or call Bonia support — we\'ll get it enabled for you.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Page chrome (nav tag, CTAs, footer labels) — everything outside COPY.
// ─────────────────────────────────────────────────────────────────────────────
export const CHROME_VI = {
  navTag: "tiếng việt",
  storeBadgeLead: "Tải trên",
  colA: "Cột A",
  colB: "Cột B",
  problemQuote:
    "Mỗi cuộc gọi nhỡ là một câu hỏi: có quan trọng không? Bonia trả lời câu hỏi đó cho bạn, trước khi bạn phải bận tâm.",
  concernWord: "Băn khoăn",
  privacyTag: "Riêng tư & tin cậy",
  privacyWord: "Riêng tư",
  trustWord: "Tin cậy",
  navCta: "Tải app",
  footerLinksLabel: "Liên kết",
  links: {
    privacy: "Chính sách bảo mật",
    terms: "Điều khoản sử dụng",
    officialNumbers: "Số chính thức",
    support: "Hỗ trợ",
    deleteAccount: "Xoá tài khoản",
    contact: "Liên hệ",
  },
};

export const CHROME_EN = {
  navTag: "made for vietnam",
  storeBadgeLead: "Get it on",
  colA: "Column A",
  colB: "Column B",
  problemQuote:
    "Every missed call is a question: was it important? Bonia answers that question for you — before you ever have to worry about it.",
  concernWord: "Concern",
  privacyTag: "Privacy & trust",
  privacyWord: "Privacy",
  trustWord: "Trust",
  navCta: "Get the app",
  footerLinksLabel: "Links",
  links: {
    privacy: "Privacy policy",
    terms: "Terms of service",
    officialNumbers: "Official numbers",
    support: "Support",
    deleteAccount: "Delete account",
    contact: "Contact",
  },
};
