import React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Install & onboarding guide — real app screenshots in an iPhone frame, laid
// out as a compact grid (not long alternating rows). Shares the landing tokens
// (clay / cream / serif).
// ─────────────────────────────────────────────────────────────────────────────
const ACC = "#7B4A2D";
const BG = "#F2EEE6";

// ─── iPhone frame: dark bezel + side buttons, wraps a screenshot OR children ──
function IPhoneFrame({ src, alt, children, width = 190 }) {
  const innerR = Math.round(width * 0.135);
  const outerR = Math.round(width * 0.17);
  const btn = {
    position: "absolute",
    background: "#2f2f31",
    borderRadius: 2,
    zIndex: 0,
  };
  return (
    <div className="relative mx-auto" style={{ width }}>
      {/* left: silence + volume up/down · right: side button */}
      <div style={{ ...btn, left: -2, top: "20%", width: 3, height: 22 }} />
      <div style={{ ...btn, left: -2, top: "31%", width: 3, height: 40 }} />
      <div style={{ ...btn, left: -2, top: "43%", width: 3, height: 40 }} />
      <div style={{ ...btn, right: -2, top: "28%", width: 3, height: 60 }} />
      <div
        className="relative"
        style={{
          padding: 5,
          background: "linear-gradient(150deg,#3a3a3c,#161618)",
          borderRadius: outerR,
          boxShadow:
            "0 22px 48px -22px rgba(31,27,22,0.5), inset 0 0 1px 1px rgba(255,255,255,0.12)",
        }}
      >
        <div
          style={{
            borderRadius: innerR,
            overflow: "hidden",
            background: "#000",
          }}
        >
          {src ? (
            <img src={src} alt={alt} className="block w-full" loading="lazy" />
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

function StepNote({ children }) {
  return (
    <div
      className="mt-3 flex items-start gap-2 px-3 py-2.5"
      style={{
        background: "#FAF3E6",
        border: "1px solid #E7D6B8",
        borderRadius: 10,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#B9852F"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 flex-shrink-0"
      >
        <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      </svg>
      <p className="text-[12.5px] leading-snug" style={{ color: "#7A5B22" }}>
        {children}
      </p>
    </div>
  );
}

// ─── The 5 steps (carrier selection removed; explainer added back) ───
const STEPS = [
  {
    n: "01",
    img: "/onboarding/phone.png",
    title: "Nhập số điện thoại",
    body: "Nhập số và cách xưng hô (ví dụ “anh Duy”). Bonia dùng tên này để nói chuyện thay bạn.",
  },
  {
    n: "02",
    img: "/onboarding/explainer.png",
    title: "Hiểu cách Bonia hoạt động",
    body: "Bonia trả lời thay bạn bằng cách chuyển hướng cuộc gọi bạn nhỡ hoặc từ chối về số của Bonia.",
  },
  {
    n: "03",
    img: "/onboarding/activation.png",
    title: "Bật chuyển hướng cuộc gọi",
    body: "Nhấn từng nút để bật chuyển hướng khi bạn nhỡ hoặc từ chối cuộc gọi.",
    note: "iOS27: app sao chép mã, bạn dán vào bàn phím số.",
  },
  {
    n: "04",
    img: "/onboarding/verification.png",
    title: "Kiểm tra chuyển hướng",
    body: "Bonia tự gọi thử đến số của bạn để chắc chắn mọi thứ hoạt động. Khoảng 20–30 giây.",
    note: "Đảm bảo thuê bao còn tiền và không bị khóa chiều gọi đi — nếu không, máy sẽ không chuyển hướng được.",
  },
  {
    n: "05",
    img: "/onboarding/success.png",
    title: "Xong! Tuỳ chỉnh lời chào",
    body: "Chuyển hướng đã hoạt động. Tuỳ chỉnh giọng nói & lời chào, hoặc để mặc định “Alo” và bắt đầu ngay.",
  },
];

// The "press dial" tile — a real iOS dialer screenshot with the CF code typed
// in, placed right after the activation step to show the action it triggers.
function DialerCard() {
  return (
    <div
      className="flex flex-col p-5"
      style={{
        background: "#fff",
        border: "1px solid #D9D0BF",
        borderRadius: 16,
      }}
    >
      <IPhoneFrame
        src="/onboarding/dialer.png"
        alt="Bấm gọi mã chuyển hướng"
        width={168}
      />
      <div className="mt-5">
        <span className="ff-mono text-[12px]" style={{ color: ACC }}>
          Sau bước 03
        </span>
        <h3
          className="mt-1.5 text-[19px] leading-snug ff-serif"
          style={{ color: "#1F1B16", fontWeight: 500 }}
        >
          Bấm nút Gọi
        </h3>
        <p
          className="mt-2 text-[14px] leading-relaxed"
          style={{ color: "#4A4239" }}
        >
          Điện thoại mở màn hình gọi với mã đã điền sẵn. Bạn chỉ cần bấm nút{" "}
          <span style={{ color: "#1B8A4B", fontWeight: 600 }}>Gọi</span> và đợi
          hệ thống trả lời — không cần nhập gì thêm.
        </p>
      </div>
    </div>
  );
}

function StepCard({ step }) {
  return (
    <div
      className="flex flex-col p-5"
      style={{
        background: "#fff",
        border: "1px solid #D9D0BF",
        borderRadius: 16,
      }}
    >
      <IPhoneFrame src={step.img} alt={step.title} width={168} />
      <div className="mt-5">
        <span className="ff-mono text-[12px]" style={{ color: ACC }}>
          Bước {step.n}
        </span>
        <h3
          className="mt-1.5 text-[19px] leading-snug ff-serif"
          style={{ color: "#1F1B16", fontWeight: 500 }}
        >
          {step.title}
        </h3>
        <p
          className="mt-2 text-[14px] leading-relaxed"
          style={{ color: "#4A4239" }}
        >
          {step.body}
        </p>
        {step.note && <StepNote>{step.note}</StepNote>}
      </div>
    </div>
  );
}

// ─── The carrier-call step (Viettel removed — those users use the SMS path) ───
const HOTLINES = [
  { name: "MobiFone", num: "18001090" },
  { name: "VinaPhone", num: "18001091" },
  { name: "Vietnamobile", num: "789" },
];

export default function HuongDan() {
  return (
    <section
      id="huong-dan"
      className="px-6 sm:px-12 py-20 sm:py-24"
      style={{ background: BG }}
    >
      <header className="max-w-3xl">
        <div className="flex items-baseline gap-3 mb-6">
          <span className="text-[12px] ff-mono" style={{ color: ACC }}>
            № 04
          </span>
          <span
            className="text-[11px] uppercase tracking-[0.22em]"
            style={{ color: "#7A6F62" }}
          >
            Hướng dẫn cài đặt
          </span>
        </div>
        <h2
          className="text-[36px] sm:text-[44px] md:text-[52px] leading-[1.05] tracking-tight ff-serif"
          style={{ color: "#1F1B16", fontWeight: 400 }}
        >
          Cài một lần, yên tâm trọn đời.
        </h2>
        <p
          className="mt-5 text-[17px] sm:text-[18px] leading-relaxed max-w-2xl"
          style={{ color: "#4A4239" }}
        >
          Không cần rành công nghệ. Hãy liên hệ hotline để chúng tôi hỗ trợ nếu
          bạn gặp vấn đề trong lúc cài đặt.
        </p>
      </header>

      {/* Compact grid of steps. The dialer tile is injected right after step
          03 (activation) so "bật mã → bấm gọi" reads in order. */}
      <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StepCard step={STEPS[0]} />
        <StepCard step={STEPS[1]} />
        <StepCard step={STEPS[2]} />
        <DialerCard />
        <StepCard step={STEPS[3]} />
        <StepCard step={STEPS[4]} />
      </div>

      {/* Troubleshooting subsection heading */}
      <div className="mt-20 sm:mt-24 max-w-3xl">
        <span className="text-[11px] uppercase tracking-[0.22em]" style={{ color: "#7A6F62" }}>
          Xử lý sự cố
        </span>
        <h3 className="mt-4 text-[23px] sm:text-[32px] leading-snug tracking-tight ff-serif"
          style={{ color: "#1F1B16", fontWeight: 400 }}>
          Vấn đề có thể gặp phải trong quá trình cài đặt
        </h3>
      </div>

      {/* Carrier-call — the delicate fallback, set apart on a white card */}
      <div
        className="mt-8 p-6 sm:p-10"
        style={{
          background: "#fff",
          border: "1px solid #D9D0BF",
          borderRadius: 20,
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
          <div className="md:col-span-4 flex justify-center">
            <IPhoneFrame
              src="/onboarding/support.png"
              alt="Gọi tổng đài nhà mạng"
              width={190}
            />
          </div>
          <div className="md:col-span-8">
            <span className="ff-mono text-[13px]" style={{ color: ACC }}>
              Một số SIM có thể gặp tình trạng nhà mạng tạm ẩn chức năng chuyển
              hướng
            </span>
            <h3
              className="mt-2 text-[26px] sm:text-[30px] leading-tight ff-serif"
              style={{ color: "#1F1B16", fontWeight: 500 }}
            >
              Gọi tổng đài — chỉ mất 1–2 phút.
            </h3>
            <p
              className="mt-3 text-[16px] leading-relaxed max-w-xl"
              style={{ color: "#4A4239" }}
            >
              Đừng lo — tổng đài viên sẽ hỗ trợ bật chức năng chuyển hướng giúp
              bạn ngay trong cuộc gọi.
            </p>
            <p
              className="mt-3 text-[16px] leading-relaxed max-w-xl"
              style={{ color: "#4A4239" }}
            >
              Cuộc gọi tổng đài thường chỉ mất khoảng 30s.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <p className="ff-mono text-[12px] mb-2" style={{ color: ACC }}>
                  01 · GỌI TỔNG ĐÀI
                </p>
                <div className="flex flex-wrap gap-2">
                  {HOTLINES.map((h) => (
                    <span
                      key={h.name}
                      className="text-[12px] px-2.5 py-1.5"
                      style={{
                        background: BG,
                        border: "1px solid #D9D0BF",
                        borderRadius: 8,
                        color: "#4A4239",
                      }}
                    >
                      {h.name}{" "}
                      <span className="ff-mono" style={{ color: ACC }}>
                        {h.num}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="ff-mono text-[12px] mb-2" style={{ color: ACC }}>
                  02 · ĐỌC CÂU NÀY
                </p>
                <blockquote
                  className="p-3.5 text-[14px] leading-relaxed italic ff-serif"
                  style={{
                    background: BG,
                    borderLeft: `3px solid ${ACC}`,
                    color: "#1F1B16",
                  }}
                >
                  “SIM của tôi không bật được chức năng chuyển hướng cuộc gọi,
                  vui lòng hỗ trợ bật giúp tôi.”
                </blockquote>
              </div>
            </div>
            <p className="mt-5 text-[14px]" style={{ color: "#7A6F62" }}>
              <span className="ff-mono text-[12px]" style={{ color: ACC }}>
                03 ·{" "}
              </span>
              Quay lại app, bấm “Thử lại”. Vẫn chưa được? Nhắn Zalo hoặc gọi hỗ
              trợ Bonia — chúng tôi bật giúp bạn.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
