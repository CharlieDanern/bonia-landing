import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  Phone,
  PhoneForwarded,
  Bell,
  Shield,
  Lock,
  ChevronDown,
  ArrowRight,
  PhoneOff,
  Eye,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Fade-in on scroll wrapper
// ---------------------------------------------------------------------------
function FadeIn({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
// Demo calls for animated hero sequence
const demoSpamCall = {
  phone: "028 7300 1234",
  tag: "Rác",
  summary: "Tư vấn bảo hiểm nhân thọ miễn phí",
  transcript: [
    {
      role: "bonia",
      text: "Xin chào, đây là trợ lý của Charlie. Bạn gọi có việc gì ạ?",
    },
    { role: "caller", text: "Bên em tư vấn bảo hiểm nhân thọ cho anh ạ." },
    { role: "bonia", text: "Dạ, mình ghi nhận. Cảm ơn bạn." },
  ],
};

const demoImportantCall = {
  phone: "0901 234 567",
  tag: "Quan trọng",
  summary: "Giao hàng Shopee, giao lúc 5h được không?",
  transcript: [
    {
      role: "bonia",
      text: "Xin chào, đây là trợ lý của Charlie. Bạn gọi có việc gì ạ?",
    },
    { role: "caller", text: "Mình giao hàng Shopee, giao lúc 5h được không?" },
    { role: "bonia", text: "Dạ để mình nhắn lại cho Charlie nhé." },
  ],
};

const faqs = [
  {
    q: "Bonia có nghe lén cuộc gọi của tôi không?",
    a: "Không. Bonia chỉ hoạt động khi bạn không bắt máy. Khi bạn nghe điện thoại, Bonia hoàn toàn không can thiệp và không nghe nội dung cuộc gọi.",
  },
  {
    q: "Bonia có ảnh hưởng đến OTP ngân hàng không?",
    a: "Không. Bonia không chặn SMS, không can thiệp OTP. Mọi mã xác thực vẫn hoạt động bình thường.",
  },
  {
    q: "Bonia có ghi âm cuộc gọi của tôi không?",
    a: "Không ghi âm cuộc gọi bạn trực tiếp nghe. Bonia chỉ xử lý cuộc gọi được chuyển hướng khi bạn không trả lời và lưu tóm tắt để bạn xem lại.",
  },
  {
    q: "Danh bạ của tôi có bị lộ không?",
    a: "Không. Danh bạ được mã hóa một chiều ngay trên điện thoại trước khi gửi đi. Bonia không lưu số gốc và không dùng danh bạ cho quảng cáo.",
  },
  {
    q: "Tôi có mất phí khi dùng Bonia không?",
    a: "Bonia hoàn toàn miễn phí. Phí chuyển hướng (nếu có) phụ thuộc vào nhà mạng của bạn. Bạn có thể tắt bất cứ lúc nào.",
  },
  {
    q: "Tôi có thể tắt Bonia bất cứ lúc nào không?",
    a: "Có. Bạn chỉ cần hủy chuyển hướng cuộc gọi trong phần cài đặt nhà mạng. Không ràng buộc dài hạn.",
  },
  {
    q: "Cuộc gọi có bị chuyển ngay lập tức không?",
    a: "Không. Điện thoại vẫn đổ chuông bình thường. Chỉ khi bạn không trả lời sau ~15–20 giây, cuộc gọi mới chuyển sang Bonia.",
  },
  {
    q: "Nếu là cuộc gọi khẩn cấp thì sao?",
    a: "Nếu bạn nghe máy, Bonia không hoạt động. Nếu lỡ cuộc gọi quan trọng, bạn có thể gọi lại ngay sau khi nhận thông báo.",
  },
  {
    q: "Nếu là người thân gọi thì sao?",
    a: "Nếu bạn không bắt máy, Bonia sẽ trả lời lịch sự như một trợ lý. Bạn sẽ nhận thông báo ngay để quyết định có cần gọi lại hay không.",
  },
  {
    q: "Bonia có phân loại chính xác không?",
    a: "Bonia sử dụng AI để phân tích nội dung cuộc gọi. Bạn có thể báo lại nếu phân loại chưa đúng để hệ thống cải thiện theo thời gian.",
  },
  {
    q: "Người gọi có biết tôi đang dùng Bonia không?",
    a: "Họ chỉ nghe một trợ lý AI trả lời. Không có thông báo nào cho biết bạn đang dùng ứng dụng.",
  },
  {
    q: "Bonia có làm hao pin hay làm chậm điện thoại không?",
    a: "Không. Bonia hoạt động thông qua chuyển hướng cuộc gọi, không chạy nền liên tục trên điện thoại.",
  },
  {
    q: "Bonia có thay thế ứng dụng điện thoại mặc định không?",
    a: "Không. Bạn vẫn dùng điện thoại như bình thường. Bonia chỉ xử lý khi bạn không trả lời.",
  },
  {
    q: "Bonia có lưu trữ nội dung cuộc gọi lâu dài không?",
    a: "Bonia chỉ lưu thông tin cần thiết để bạn xem lại trong app. Bạn có thể xóa lịch sử bất cứ lúc nào.",
  },
];

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
function App() {
  // Form
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success");

  // Hero phone animation — 5 scenes cycling
  // 0: lock screen + spam notif  1: spam detail  2: lock screen + important notif  3: important detail  4: calling
  const [scene, setScene] = useState(0);
  const [notifVisible, setNotifVisible] = useState(false);
  useEffect(() => {
    const durations = [3200, 3800, 3200, 3500, 2800];
    let notifTimer;
    if (scene === 0 || scene === 2) {
      setNotifVisible(false);
      notifTimer = setTimeout(() => setNotifVisible(true), 600);
    }
    const sceneTimer = setTimeout(() => {
      setScene((prev) => (prev + 1) % 5);
    }, durations[scene]);
    return () => {
      clearTimeout(sceneTimer);
      if (notifTimer) clearTimeout(notifTimer);
    };
  }, [scene]);
  const isLockScreen = scene === 0 || scene === 2;
  const isDetail = scene === 1 || scene === 3;
  const isCalling = scene === 4;
  const isSpam = scene <= 1;
  const currentCall = isSpam ? demoSpamCall : demoImportantCall;

  // FAQ
  const [openFaq, setOpenFaq] = useState(null);

  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxOsS2N_LZnJ335QtATbdOckCfTuk-a0-iKDqEXAK8YEkbMN1W8AUn_yocfj3CGjXyX/exec";

  const showNotification = (message, type = "success") => {
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
    setTimeout(() => setShowModal(false), 4000);
  };

  const isValidPhone = (value) => {
    const digits = value.replace(/\D/g, "");
    return (
      (digits.length === 10 && digits.startsWith("0")) ||
      (digits.length === 11 && digits.startsWith("84")) ||
      (digits.length === 12 && digits.startsWith("84"))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      showNotification(
        "Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.",
        "error",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new URLSearchParams();
      formData.append("phone", phone);
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: formData,
      });
      showNotification("Cảm ơn bạn đã đăng ký! Chúng tôi sẽ liên hệ sớm.");
      setPhone("");
    } catch {
      showNotification("Có lỗi xảy ra. Vui lòng thử lại.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 overflow-x-hidden">
      {/* ── Toast ── */}
      {showModal && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
          <div
            className={`${
              modalType === "success"
                ? "bg-green-50 border-green-500 text-green-800"
                : "bg-red-50 border-red-500 text-red-800"
            } border-l-4 p-4 rounded-lg shadow-lg max-w-sm`}
          >
            <div className="flex items-center gap-3">
              {modalType === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <PhoneOff className="h-5 w-5 text-red-500 flex-shrink-0" />
              )}
              <p className="text-sm font-medium flex-1">{modalMessage}</p>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Bonia" className="h-8" />
            <span className="text-lg font-bold text-[#191970] tracking-tight">
              Bonia
            </span>
          </div>
          <a
            href="#signup"
            className="text-sm font-medium text-[#191970] hover:text-indigo-600 transition-colors"
          >
            Đăng ký miễn phí
          </a>
        </div>
      </header>

      {/* ── 1. Hero ── */}
      <section className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="container mx-auto px-5 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
            {/* Left — Copy */}
            <div>
              <FadeIn>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#191970] leading-tight md:leading-[1.15] lg:leading-[1.2] tracking-tight">
                  80% cuộc gọi lạ là spam.
                  <br />
                  Đừng bắt máy vô ích nữa.
                </h1>
              </FadeIn>
              <FadeIn delay={100}>
                <p className="mt-6 text-gray-600 text-lg leading-relaxed max-w-lg">
                  Bonia nghe máy thay bạn khi bạn không trả lời.
                </p>
                <p className="mt-1 text-gray-600 text-lg leading-relaxed max-w-lg">
                  AI hỏi lý do cuộc gọi và báo lại cho bạn ngay lập tức.
                </p>
                <p className="mt-1 text-gray-600 text-lg leading-relaxed max-w-lg">
                  Bạn chỉ trả lời những cuộc gọi đáng nghe.
                </p>
              </FadeIn>
              <FadeIn delay={200}>
                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href="#signup"
                    className="inline-flex items-center gap-2 bg-[#191970] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0f0f50] transition-colors shadow-lg shadow-indigo-900/20"
                  >
                    Đăng ký miễn phí
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center gap-2 text-[#191970] px-6 py-3 rounded-xl font-semibold border-2 border-gray-200 hover:border-[#191970] transition-colors"
                  >
                    Xem cách hoạt động
                  </a>
                </div>
              </FadeIn>
            </div>

            {/* Right — Animated phone demo */}
            <FadeIn delay={300} className="flex justify-center">
              <div className="relative">
                <div className="w-[280px] sm:w-[300px] bg-gray-950 rounded-[3rem] p-3 shadow-2xl">
                  <div className="rounded-[2.4rem] overflow-hidden h-[520px] sm:h-[560px] relative">
                    {/* ── Layer 1: Lock Screen ── */}
                    <div
                      className={`absolute inset-0 flex flex-col transition-opacity duration-500 ${isLockScreen ? "opacity-100 z-20" : "opacity-0 z-0"}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950" />
                      <div className="relative z-10 flex items-center justify-between px-7 pt-4 pb-1">
                        <span className="text-xs font-medium text-white/80">
                          9:41
                        </span>
                        <div className="w-24 h-[26px] bg-black rounded-full" />
                        <div className="w-4 h-2.5 border border-white/50 rounded-sm relative">
                          <div className="absolute inset-0.5 bg-white/50 rounded-[1px]" />
                        </div>
                      </div>
                      <div className="relative z-10 text-center mt-10">
                        <p className="text-white/50 text-xs">
                          Chủ nhật, 1 tháng 3
                        </p>
                        <p className="text-white text-5xl font-extralight mt-1 tracking-tight">
                          9:41
                        </p>
                      </div>
                      <div
                        className={`relative z-10 mx-3 mt-8 transition-all duration-500 ease-out ${notifVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"}`}
                      >
                        <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-3.5 border border-white/10">
                          <div className="flex items-center gap-1.5 mb-1">
                            <img
                              src="/logo.png"
                              alt=""
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">
                              Bonia
                            </span>
                            <span className="text-[10px] text-white/40 ml-auto">
                              bây giờ
                            </span>
                          </div>
                          <p
                            className={`text-xs font-bold mb-0.5 ${isSpam ? "text-[#FCA5A5]" : "text-[#5EEAD4]"}`}
                          >
                            {currentCall.tag.toUpperCase()}
                          </p>
                          <p className="text-xs font-medium text-white/90">
                            {currentCall.phone}
                          </p>
                          <p className="text-[11px] text-white/50 mt-0.5 line-clamp-1">
                            {currentCall.summary}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ── Layer 2: Call Detail (real screenshots) ── */}
                    <div
                      className={`absolute inset-0 transition-opacity duration-500 ${isDetail ? "opacity-100 z-20" : "opacity-0 z-0"}`}
                    >
                      <img
                        src={
                          isSpam
                            ? "/screenshots/detail-spam.png"
                            : "/screenshots/detail-important.png"
                        }
                        alt="Bonia call detail"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>

                    {/* ── Layer 3: Calling Screen ── */}
                    <div
                      className={`absolute inset-0 flex flex-col transition-opacity duration-500 ${isCalling ? "opacity-100 z-20" : "opacity-0 z-0"}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950" />
                      <div className="relative z-10 flex items-center justify-between px-7 pt-4 pb-1">
                        <span className="text-xs font-medium text-white/80">
                          9:41
                        </span>
                        <div className="w-24 h-[26px] bg-black rounded-full" />
                        <div className="w-4 h-2.5 border border-white/50 rounded-sm relative">
                          <div className="absolute inset-0.5 bg-white/50 rounded-[1px]" />
                        </div>
                      </div>
                      <div className="relative z-10 flex-1 flex flex-col items-center justify-center -mt-10">
                        <p className="text-white/90 text-xl font-bold">
                          {demoImportantCall.phone}
                        </p>
                        <p className="text-white/50 text-sm mt-2">
                          đang gọi...
                        </p>
                      </div>
                      <div className="relative z-10 flex justify-center pb-14">
                        <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                          <PhoneOff className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── 2. Problem Framing ── */}
      <section className="py-24 md:py-32 bg-gray-50">
        <div className="container mx-auto px-5 sm:px-6 max-w-4xl">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#191970] leading-tight tracking-tight">
              Bao nhiêu cuộc gọi mỗi ngày
              <br className="hidden sm:block" />
              là không đáng trả lời?
            </h2>
          </FadeIn>

          <div className="mt-14 grid md:grid-cols-2 gap-10 md:gap-16">
            <FadeIn delay={100}>
              <div>
                <p className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-5">
                  Những cuộc gọi phiền
                </p>
                <ul className="space-y-3.5">
                  {[
                    "Chào vay, thẻ tín dụng",
                    "Lừa đảo, mạo danh cơ quan",
                    "Tư vấn tài chính, chứng khoán",
                    "Khảo sát, quảng cáo",
                    "Đòi nợ người liên quan",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-gray-600"
                    >
                      <PhoneOff className="w-4 h-4 text-red-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={200}>
              <div>
                <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-5">
                  Nhưng cũng có thể là
                </p>
                <ul className="space-y-3.5">
                  {[
                    "Shipper giao hàng",
                    "Tài xế Grab, XanhSM",
                    "HR gọi phỏng vấn",
                    "Đối tác công việc",
                    "Người quen gọi từ số lạ",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-gray-700 font-medium"
                    >
                      <Phone className="w-4 h-4 text-teal-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={300}>
            <p className="mt-14 text-lg text-[#191970] font-semibold">
              Vấn đề không phải là cuộc gọi.
            </p>
            <p className="mt-2 text-lg text-[#191970] font-semibold">
              Vấn đề là bạn không biết đó là gì trước khi bắt máy.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── 3. Solution + Benefits (Consolidated) ── */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-5 sm:px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
            {/* Left — Content */}
            <div>
              <FadeIn>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#191970] leading-tight tracking-tight">
                  Bonia là lớp bảo vệ giữa bạn và spam
                </h2>
                <p className="mt-4 text-gray-500 text-lg leading-relaxed">
                  Khi bạn không bắt máy sau 15-20s, Bonia tự động tiếp nhận cuộc
                  gọi và cho bạn biết mọi thứ.
                </p>
              </FadeIn>

              <div className="mt-10 space-y-6">
                {[
                  {
                    icon: <Phone className="w-5 h-5" />,
                    title: "Nghe máy thay bạn",
                    desc: "Trò chuyện ngắn với người gọi bằng giọng AI tự nhiên.",
                  },
                  {
                    icon: <Eye className="w-5 h-5" />,
                    title: "Xác định lý do gọi",
                    desc: "Phân loại cuộc gọi: quan trọng, spam, giao hàng, telesale...",
                  },
                  {
                    icon: <Bell className="w-5 h-5" />,
                    title: "Thông báo tóm tắt ngay",
                    desc: "Push notification tóm tắt nội dung cuộc gọi.",
                  },
                  {
                    icon: <Shield className="w-5 h-5" />,
                    title: "Bạn toàn quyền kiểm soát",
                    desc: "Gọi lại, chặn số, hoặc bỏ qua. Bật / tắt bất cứ lúc nào.",
                  },
                ].map((item, i) => (
                  <FadeIn key={i} delay={i * 100}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#191970]/10 text-[#191970] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#191970] text-base">
                          {item.title}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>

            {/* Right — Call list screenshot in phone frame */}
            <FadeIn delay={200} className="flex justify-center">
              <div className="w-[240px] sm:w-[260px] bg-gray-950 rounded-[2.8rem] p-2.5 shadow-2xl">
                <div className="rounded-[2.2rem] overflow-hidden">
                  <img
                    src="/screenshots/calllist.png"
                    alt="Bonia danh sách cuộc gọi"
                    className="w-full"
                  />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── 4. How It Works — Visual Timeline ── */}
      <section id="how-it-works" className="py-24 md:py-32 bg-gray-50">
        <div className="container mx-auto px-5 sm:px-6 max-w-5xl">
          <FadeIn>
            <p className="text-sm font-semibold text-[#191970] uppercase tracking-wider mb-3">
              Cách hoạt động
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#191970] tracking-tight">
              Chỉ 3 bước đơn giản
            </h2>
          </FadeIn>

          {/* Desktop: horizontal timeline */}
          <div className="mt-16 hidden md:block">
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute top-6 left-[calc(16.67%-0px)] right-[calc(16.67%-0px)] h-0.5 bg-[#191970]/15" />

              <div className="grid grid-cols-3 gap-6">
                {[
                  {
                    step: "1",
                    icon: <PhoneForwarded className="w-5 h-5" />,
                    title: "Bật chuyển hướng",
                    desc: "Điện thoại vẫn đổ chuông bình thường. Chỉ khi bạn không bắt máy, cuộc gọi mới chuyển sang Bonia.",
                  },
                  {
                    step: "2",
                    icon: <Phone className="w-5 h-5" />,
                    title: "Bonia tiếp nhận",
                    desc: "Bonia hỏi mục đích cuộc gọi, trò chuyện ngắn với người gọi, và phân loại nội dung.",
                  },
                  {
                    step: "3",
                    icon: <Bell className="w-5 h-5" />,
                    title: "Bạn nhận thông báo",
                    desc: "Biết người gọi là ai, gọi vì việc gì. Chọn hành động chỉ với một chạm.",
                  },
                ].map((item, i) => (
                  <FadeIn key={i} delay={i * 150}>
                    <div className="flex flex-col items-center text-center">
                      {/* Step circle on the line */}
                      <div className="w-12 h-12 rounded-full bg-[#191970] text-white flex items-center justify-center mb-6 relative z-10 shadow-lg shadow-[#191970]/20">
                        {item.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-[#191970] mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed max-w-[260px]">
                        {item.desc}
                      </p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile: vertical timeline */}
          <div className="mt-14 md:hidden">
            <div className="relative">
              {/* Vertical connecting line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[#191970]/15" />

              <div className="space-y-10">
                {[
                  {
                    step: "1",
                    icon: <PhoneForwarded className="w-5 h-5" />,
                    title: "Bật chuyển hướng",
                    desc: "Điện thoại vẫn đổ chuông bình thường. Chỉ khi bạn không bắt máy, cuộc gọi mới chuyển sang Bonia.",
                  },
                  {
                    step: "2",
                    icon: <Phone className="w-5 h-5" />,
                    title: "Bonia tiếp nhận",
                    desc: "Bonia hỏi mục đích cuộc gọi, trò chuyện ngắn với người gọi, và phân loại nội dung.",
                  },
                  {
                    step: "3",
                    icon: <Bell className="w-5 h-5" />,
                    title: "Bạn nhận thông báo",
                    desc: "Biết người gọi là ai, gọi vì việc gì. Chọn hành động chỉ với một chạm.",
                  },
                ].map((item, i) => (
                  <FadeIn key={i} delay={i * 150}>
                    <div className="flex items-start gap-5">
                      <div className="w-10 h-10 rounded-full bg-[#191970] text-white flex items-center justify-center flex-shrink-0 relative z-10 shadow-lg shadow-[#191970]/20">
                        {item.icon}
                      </div>
                      <div className="pt-1">
                        <h3 className="text-base font-semibold text-[#191970] mb-1">
                          {item.title}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Real-World Examples ── */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-5 sm:px-6 max-w-5xl">
          <FadeIn>
            <p className="text-sm font-semibold text-[#191970] uppercase tracking-wider mb-3">
              Ví dụ thực tế
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#191970] tracking-tight">
              Bonia xử lý cho bạn
            </h2>
          </FadeIn>

          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {[
              {
                scenario: "Khi shipper gọi",
                quote: "Giao hàng Shopee, mình giao lúc 5h được không?",
                result: "Bạn biết đó là giao hàng — gọi lại ngay nếu cần.",
                borderColor: "border-l-teal-400",
                tagClass: "bg-teal-50 text-teal-700",
                tag: "Giao hàng",
              },
              {
                scenario: "Khi HR gọi phỏng vấn",
                quote: "Bên anh muốn trao đổi về CV ứng tuyển...",
                result: "Không bỏ lỡ cơ hội quan trọng.",
                borderColor: "border-l-blue-400",
                tagClass: "bg-blue-50 text-blue-700",
                tag: "Quan trọng",
              },
              {
                scenario: "Khi là quảng cáo",
                quote: "Tư vấn bảo hiểm miễn phí...",
                result: "Bonia nhận diện — bạn không mất thời gian.",
                borderColor: "border-l-red-400",
                tagClass: "bg-red-50 text-red-700",
                tag: "Spam",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 150}>
                <div
                  className={`bg-white rounded-2xl p-6 border border-gray-100 border-l-4 ${item.borderColor} h-full flex flex-col hover:shadow-md hover:border-gray-200 transition-all duration-300`}
                >
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.tagClass} w-fit mb-4`}
                  >
                    {item.tag}
                  </span>
                  <h3 className="font-semibold text-[#191970] mb-3">
                    {item.scenario}
                  </h3>
                  <p className="text-gray-500 text-sm italic mb-4 flex-1">
                    "{item.quote}"
                  </p>
                  <p className="text-sm text-gray-700 font-medium">
                    {item.result}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Privacy & Trust ── */}
      <section className="py-24 md:py-32 bg-gray-50">
        <div className="container mx-auto px-5 sm:px-6 max-w-4xl">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#191970] tracking-tight">
              Riêng tư & an toàn
            </h2>
          </FadeIn>

          <div className="mt-14 grid md:grid-cols-2 gap-12">
            <FadeIn delay={100}>
              <div className="flex items-start gap-5">
                <div className="w-11 h-11 rounded-xl bg-[#191970]/10 text-[#191970] flex items-center justify-center flex-shrink-0 mt-1">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#191970] mb-2">
                    Chỉ xử lý khi bạn không bắt máy
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Bonia không nghe lén. Không can thiệp cuộc gọi đang diễn ra.
                    Bonia chỉ hoạt động khi bạn không trả lời cuộc gọi sau
                    khoảng 15s.
                  </p>
                  <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                    Bạn có thể hủy chuyển hướng bất kỳ lúc nào.
                  </p>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={200}>
              <div className="flex items-start gap-5">
                <div className="w-11 h-11 rounded-xl bg-[#191970]/10 text-[#191970] flex items-center justify-center flex-shrink-0 mt-1">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#191970] mb-2">
                    Danh bạ của bạn được bảo vệ
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">
                    Số điện thoại trong danh bạ được chuyển thành chuỗi mã một
                    chiều trên thiết bị của bạn trước khi gửi đi.
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">
                    Chúng tôi không lưu danh bạ gốc của bạn.
                  </p>
                  {/* <div className="bg-white rounded-xl p-4 font-mono text-sm border border-gray-100">
                    <span className="text-gray-400">0909 291 268</span>
                    <span className="mx-2 text-gray-300">→</span>
                    <span className="text-[#191970] font-medium">
                      7f3a9c1d...
                    </span>
                  </div>
                  <p className="mt-3 text-gray-400 text-xs">
                    Chuỗi này không thể đảo ngược lại số gốc.
                  </p> */}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── 7. FAQ — 2 columns ── */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-5 sm:px-6 max-w-5xl">
          <FadeIn>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#191970] tracking-tight mb-14">
              Câu hỏi thường gặp
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-3">
            {faqs.map((faq, i) => (
              <FadeIn key={i} delay={i * 50}>
                <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors duration-300 h-fit">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-semibold text-[#191970] text-sm pr-3">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      openFaq === i
                        ? "max-h-48 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="px-5 pb-5 text-gray-500 text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Final CTA — Navy Gradient ── */}
      <section id="signup" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#191970] via-[#0f0f50] to-[#191970]" />
        {/* Subtle dot pattern for depth */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 container mx-auto px-5 sm:px-6 py-24 md:py-32">
          <div className="max-w-2xl mx-auto text-center">
            <FadeIn>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight">
                Đừng để spam quyết định
                <span className="sm:hidden"> </span>
                <br className="hidden sm:block" />
                thời gian của bạn.
              </h2>
              <p className="mt-4 text-white/60 text-lg">
                Hãy để Bonia giúp bạn chỉ trả lời những cuộc gọi đáng nghe.
              </p>
            </FadeIn>

            <FadeIn delay={150}>
              <form
                onSubmit={handleSubmit}
                className="mt-10 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại của bạn"
                  className="flex-1 px-5 py-3.5 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm focus:border-white/50 focus:outline-none transition-colors text-white placeholder-white/40"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-white hover:bg-gray-100 disabled:bg-gray-400 disabled:cursor-not-allowed text-[#191970] px-7 py-3.5 rounded-xl font-semibold transition-colors shadow-lg whitespace-nowrap"
                >
                  {isSubmitting ? "Đang gửi..." : "Đăng ký trải nghiệm"}
                </button>
              </form>
            </FadeIn>

            <FadeIn delay={250}>
              <div className="mt-6 flex flex-wrap justify-center gap-5 text-white/50 text-sm">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Miễn phí dùng thử</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Hủy bất cứ khi nào</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mọi nhà mạng</span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100">
        <div className="container mx-auto px-5 sm:px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <img src="/logo.png" alt="Bonia" className="h-8" />
                <span className="text-lg font-bold text-[#191970] tracking-tight">
                  Bonia
                </span>
              </div>
              <p className="text-gray-500 text-sm max-w-sm">
                Trợ lý AI sàng lọc cuộc gọi. Biết ai gọi và vì sao — trước khi
                bạn quyết định nghe.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-3">
                Liên kết
              </h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-[#191970] transition-colors"
                  >
                    Cách hoạt động
                  </a>
                </li>
                <li>
                  <a
                    href="#signup"
                    className="hover:text-[#191970] transition-colors"
                  >
                    Đăng ký
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-3">
                Pháp lý
              </h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <a
                    href="/privacy.html"
                    className="hover:text-[#191970] transition-colors"
                  >
                    Chính sách bảo mật
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400">
              © 2026 Bonia. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
