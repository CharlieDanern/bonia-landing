import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";

function App() {
  const [email, setEmail] = useState("");
  const [ctaEmail, setCtaEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCtaSubmitting, setIsCtaSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success"); // 'success' or 'error'

  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxOsS2N_LZnJ335QtATbdOckCfTuk-a0-iKDqEXAK8YEkbMN1W8AUn_yocfj3CGjXyX/exec";

  const showNotification = (message, type = "success") => {
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
    setTimeout(() => setShowModal(false), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email }),
      });

      showNotification(
        "Cảm ơn bạn đã đăng ký! Chúng tôi sẽ liên hệ sớm.",
        "success"
      );
      setEmail("");
    } catch (error) {
      showNotification("Có lỗi xảy ra. Vui lòng thử lại.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCtaSubmit = async (e) => {
    e.preventDefault();
    setIsCtaSubmitting(true);

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: ctaEmail }),
      });

      showNotification(
        "Cảm ơn bạn đã đăng ký! Chúng tôi sẽ liên hệ sớm.",
        "success"
      );
      setCtaEmail("");
    } catch (error) {
      showNotification("Có lỗi xảy ra. Vui lòng thử lại.", "error");
    } finally {
      setIsCtaSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Notification Modal */}
      {showModal && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
          <div
            className={`${
              modalType === "success"
                ? "bg-green-50 border-green-500 text-green-800"
                : "bg-red-50 border-red-500 text-red-800"
            } border-l-4 p-4 rounded-lg shadow-lg max-w-md`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {modalType === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <svg
                    className="h-5 w-5 text-red-500"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{modalMessage}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-5 w-5"
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
      {/* Header */}
      <header className="container mx-auto px-4 sm:px-6 py-6">
        <div className="text-2xl font-bold text-[#000080]">Bonia</div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 md:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#000080] mb-6 leading-tight px-4">
            Dữ liệu của bạn là
            <br />
            định danh và tài sản của bạn
          </h1>
          <p className="text-gray-600 text-base sm:text-lg mb-8 max-w-2xl mx-auto px-4">
            Chúng tôi đang xây dựng một phương pháp mới để giúp bạn kiểm soát,
            bảo vệ và kiếm tiền từ dữ liệu trực tuyến của mình
          </p>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch max-w-md mx-auto px-4"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              className="flex-1 px-4 sm:px-5 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors text-gray-700"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white px-6 sm:px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              {isSubmitting ? "Đang gửi..." : "Đăng ký sớm"}
            </button>
          </form>
        </div>
      </section>

      {/* Problem Cards Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#000080] mb-8 md:mb-12 text-center md:text-left max-w-2xl px-4">
          Bạn có cảm thấy mệt mỏi vì <br className="hidden sm:block" />
          những cuộc gọi telesale hàng ngày?
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-[6px_9px_8px_3px_rgba(0,0,0,0.25)] hover:shadow-[8px_12px_12px_4px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-[#000080] mb-3 sm:mb-4">
              Telesale và Spam
            </h3>
            <p className="text-gray-700 mb-3 sm:mb-4 font-semibold text-sm sm:text-base">
              Cuộc gọi làm phiền và email quảng cáo dồn dập.
            </p>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Người dùng Việt Nam trung bình nhận 5–7 cuộc gọi rác và 10–12
              email quảng cáo mỗi ngày, đa số đều không liên quan nhu cầu, gây
              phiền toái và lãng phí thời gian.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-[6px_9px_8px_3px_rgba(0,0,0,0.25)] hover:shadow-[8px_12px_12px_4px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1">
            <h3 className="text-lg sm:text-xl font-bold text-[#000080] mb-3 sm:mb-4">
              Rò rỉ dữ liệu
            </h3>
            <p className="text-gray-700 mb-3 sm:mb-4 font-semibold text-sm sm:text-base">
              Thông tin về hành vi tiêu dùng bị thu thập và bán cho bên thứ ba.
            </p>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Khoảng 80% người dùng từng bị lộ dữ liệu cá nhân (số điện thoại,
              email…), bị mua bán công khai và dẫn tới spam, lừa đảo, phishing
              liên tục.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-[6px_9px_8px_3px_rgba(0,0,0,0.25)] hover:shadow-[8px_12px_12px_4px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
            <h3 className="text-lg sm:text-xl font-bold text-[#000080] mb-3 sm:mb-4">
              Không có lợi ích
            </h3>
            <p className="text-gray-700 mb-3 sm:mb-4 font-semibold text-sm sm:text-base">
              Dữ liệu của bạn tạo ra giá trị nhưng bạn không nhận được lợi ích.
            </p>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              Ngành quảng cáo số tạo ra hàng tỷ USD doanh thu mỗi năm từ dữ liệu
              người dùng, nhưng chính người tạo dữ liệu lại không nhận được gì.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="max-w-4xl mx-auto text-center mb-12 md:mb-16 px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#000080] mb-4">
            Với Bonia, bạn toàn quyền kiểm soát{" "}
            <br className="hidden sm:block" />
            dữ liệu và kiếm tiền từ nó, <br className="hidden sm:block" />
            bất cứ khi nào bạn muốn
          </h2>
          <p className="text-gray-600 text-base sm:text-lg mt-6">
            Bonia là AI Agent sống trên thiết bị của bạn.
            <br className="hidden sm:block" />
            Mọi dữ liệu được học và lưu trong "Két dữ liệu" riêng tư – không rời
            khỏi máy.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-[6px_9px_8px_3px_rgba(0,0,0,0.25)] hover:shadow-[8px_12px_12px_4px_rgba(0,0,0,0.3)] transition-all duration-300">
            <div className="text-[#000080] font-bold text-xl sm:text-2xl mb-3">
              Bước 1
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#000080] mb-3 sm:mb-4">
              Cài đặt để Bonia chạy tự động trên thiết bị
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4">
              Bonia chỉ đọc các tín hiệu trên thiết bị (lịch, tiêu đề email,
              hành vi web, cảm biến cơ bản...), không theo dõi bạn.
            </p>
            <ul className="space-y-2 text-gray-600 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                <span>Dữ liệu KHÔNG rời khỏi máy.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                <span>Mã hoá cục bộ</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                <span>Không đồng bộ lên cloud</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                <span>Tắt thu thập hành vi bất kỳ</span>
              </li>
            </ul>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-[6px_9px_8px_3px_rgba(0,0,0,0.25)] hover:shadow-[8px_12px_12px_4px_rgba(0,0,0,0.3)] transition-all duration-300">
            <div className="text-[#000080] font-bold text-xl sm:text-2xl mb-3">
              Bước 2
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#000080] mb-3 sm:mb-4">
              Học & xử lý dữ liệu một cách an toàn
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4">
              Học thói quen để phục vụ bạn. Bonia AI Agent tạo 'Hồ sơ quan tâm'
              dạng vector/nhãn, không giữ nội dung thô.
            </p>
            <ul className="space-y-2 text-gray-600 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                <span>Bạn xem, xoá, hoặc chỉnh bất cứ lúc nào.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                <span>Nhật ký học (Activity Log)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                <span>Hồ sơ cá nhân</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                <span>Ngừng bất cứ lúc nào</span>
              </li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-[6px_9px_8px_3px_rgba(0,0,0,0.25)] hover:shadow-[8px_12px_12px_4px_rgba(0,0,0,0.3)] transition-all duration-300">
            <div className="text-[#000080] font-bold text-xl sm:text-2xl mb-3">
              Bước 3
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#000080] mb-3 sm:mb-4">
              Lưu trữ dữ liệu trong Private Data Vault
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4">
              Ứng dụng công nghệ Zero-Knowledge, bạn là người giữ chìa khoá tới
              hồ sơ được lưu trữ trong Data Vault của bạn
            </p>
            <ul className="space-y-2 text-gray-600 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                <span>
                  Không ai truy cập nếu không có chữ ký/đồng ý của bạn.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                <span>Khoá cá nhân</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                <span>Mã hoá đầu-cuối</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                <span>Chia sẻ có hạn mức & thời hạn</span>
              </li>
            </ul>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-[6px_9px_8px_3px_rgba(0,0,0,0.25)] hover:shadow-[8px_12px_12px_4px_rgba(0,0,0,0.3)] transition-all duration-300">
            <div className="text-[#000080] font-bold text-xl sm:text-2xl mb-3">
              Bước 4
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#000080] mb-3 sm:mb-4">
              Chia sẻ tín hiệu theo từng cấp và kiếm tiền
            </h3>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-4">
              Khi các nhãn hàng muốn tiếp cận bạn, họ phải trả tiền. Bonia thay
              bạn đàm phán: chỉ chia sẻ dữ liệu tối thiểu cần cho chiến dịch.
            </p>
            <ul className="space-y-2 text-gray-600 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                <span>Bạn luôn có thể ra lệnh cho Bonia</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                <span>Xem trước dữ liệu sẽ chia sẻ</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                <span>Đặt giá tối thiếu</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                <span>Từ chối/thu hồi sau 1 chạm</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Security Info Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#000080] mb-6 sm:mb-8 text-center px-4">
          Bonia khác biệt về mặt bản chất
        </h2>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          <div className="space-y-4 sm:space-y-6 px-4">
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
              Bonia được tạo ra với sứ mệnh bảo vệ dữ liệu số và mang lại lợi
              ích cho người dùng dựa trên chính tài sản số của họ.
            </p>
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
              Dữ liệu của người dùng được lưu trữ một cách bảo mật và riêng tư
              ngay trên thiết bị mà không bị đồng bộ lên Cloud. Chúng tôi không
              có cách nào lạm dụng dữ liệu của người dùng.
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6 px-4">
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
              Các công ty quảng cáo tạo ra lợi nhuận hàng tỷ USD mỗi năm từ khai
              thác dữ liệu và hành vi người tiêu dùng.
            </p>
            <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
              Các nhãn hàng tiêu tốn nhiều tiền để mua các dữ liệu đó. Bonia nỗ
              lực để tạo ra một môi trường công bằng và hiệu quả cho người dùng,
              từ đó cải thiện trải nghiệm sử dụng internet của họ.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 md:py-16 mb-12 md:mb-16">
        <div className="max-w-4xl mx-auto bg-gradient-to-tr from-[#1193C1] via-[#3DB2DA] via-[#6AD1F4] via-[#AFE3F5] to-[#F5F5F5] rounded-3xl p-8 sm:p-12 md:p-16 shadow-[6px_9px_8px_3px_rgba(0,0,0,0.25)] relative overflow-hidden">
          <div className="relative z-10 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#000080] mb-3 sm:mb-4">
              Bonia AI Agent
            </h2>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#000080] mb-4 sm:mb-6">
              Sẵn sàng bảo vệ và kiếm tiền từ <br className="hidden sm:block" />
              dữ liệu của chính bạn ngay hôm nay?
            </h3>

            <form
              onSubmit={handleCtaSubmit}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch max-w-md mx-auto mb-6"
            >
              <input
                type="email"
                value={ctaEmail}
                onChange={(e) => setCtaEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                className="flex-1 px-4 sm:px-5 py-3 rounded-xl border-2 border-blue-900/30 bg-white/90 focus:bg-white focus:outline-none transition-colors text-gray-700"
                required
              />
              <button
                type="submit"
                disabled={isCtaSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white px-6 sm:px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                {isCtaSubmitting ? "Đang gửi..." : "Đăng ký sớm"}
              </button>
            </form>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-gray-700 text-xs sm:text-sm mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gray-700" />
                <span>Không spam</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gray-700" />
                <span>Hủy bất cứ khi nào</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gray-700" />
                <span>Dữ liệu không rời khỏi thiết bị</span>
              </div>
            </div>

            <p className="text-gray-700 text-xs">1,268+ người đã đăng ký</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="text-2xl font-bold text-[#000080] mb-3">
                Bonia
              </div>
              <p className="text-gray-600 text-sm mb-4 max-w-md">
                Bảo vệ dữ liệu cá nhân của bạn và kiếm tiền từ chính nó. AI
                Agent chạy trên thiết bị của bạn, đảm bảo quyền riêng tư tuyệt
                đối.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Liên kết</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a
                    href="#"
                    className="hover:text-indigo-600 transition-colors"
                  >
                    Về chúng tôi
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-indigo-600 transition-colors"
                  >
                    Cách hoạt động
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-indigo-600 transition-colors"
                  >
                    Liên hệ
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Pháp lý</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <a
                    href="#"
                    className="hover:text-indigo-600 transition-colors"
                  >
                    Chính sách bảo mật
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-indigo-600 transition-colors"
                  >
                    Điều khoản dịch vụ
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-indigo-600 transition-colors"
                  >
                    Chính sách cookie
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2026 Bonia. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
