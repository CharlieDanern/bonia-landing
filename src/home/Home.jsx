import Orb from "../reception/Orb.jsx";

/* bonia.vn/ — the product chooser (design handoff "Bonia Home", 2026-10-01).
 *
 * One screen in the hero language of /reception and /business: the orb
 * turning slowly behind the headline, the two cream glows over it, and three
 * product cards in the credit-card shades, light → dark:
 *   01 Cá nhân       Trợ lý lọc cuộc gọi      → /retail
 *   02 Doanh nghiệp  Lễ tân trực điện thoại   → /reception
 *   03 Mua sắm       Bonia Ưu đãi             → /business
 * Each whole card is the link. Copy, shades and values are the prototype's
 * (Bonia Home.dc.html, founder's edits included); layout and motion live in
 * home.css.
 *
 * The orb is the shared port of bonia-orb.js variant "signal", drawn at its
 * native 960 px (scaling the canvas would thicken its lines) with the
 * resolution capped at 1.5× as in the /reception hero; under reduced motion
 * it draws one still frame. */

const SHADES = [
  "linear-gradient(138deg,#FCFAF5 0%,#E9E4DA 48%,#F6F3EC 76%,#DFD9CD 100%)",
  "linear-gradient(138deg,#F1EBDF 0%,#DCD2C1 48%,#EAE2D4 76%,#CFC3AF 100%)",
  "linear-gradient(138deg,#E2DED7 0%,#C4BDB1 48%,#D8D2C8 76%,#B2AA9C 100%)",
];

const PRODUCTS = [
  {
    who: "Cá nhân",
    title: "Trợ lý lọc cuộc gọi",
    line: "Bonia nghe máy khi bạn bận, lọc cuộc gọi làm phiền và báo lại cuộc gọi quan trọng. Không bao giờ còn bị làm phiền bởi số lạ.",
    href: "/retail",
    url: "bonia.vn/retail",
  },
  {
    who: "Doanh nghiệp",
    title: "Lễ tân trực điện thoại",
    line: "Lễ tân lo khách tại quầy, Bonia lo điện thoại. Lễ tân tư vấn và ghi nhận thông tin, đặt lịch cho cơ sở của bạn.",
    href: "/reception",
    url: "bonia.vn/reception",
  },
  {
    who: "Mua sắm",
    title: "Bonia Ưu đãi",
    line: "Ưu đãi mua sắm hàng hóa dịch vụ. Người bán cạnh tranh bằng cashback tiền mặt để được phục vụ bạn.",
    href: "/business",
    url: "bonia.vn/business",
  },
];

function ProductCard({ p, i }) {
  const id = `hm-card-${i + 1}`;
  return (
    <a
      href={p.href}
      className="hm-card"
      aria-labelledby={`${id}-title ${id}-who`}
      aria-describedby={`${id}-line`}
      style={{ background: SHADES[i], animationDelay: `${0.1 + i * 0.09}s` }}
    >
      <span className="hm-card-tex" aria-hidden="true" />
      <span className="hm-card-sheen" aria-hidden="true" style={{ animationDelay: `${-(i * 2.6)}s` }} />
      <span className="hm-card-top">
        <span className="hm-card-who" id={`${id}-who`}>
          {p.who}
        </span>
        <span className="hm-card-num" aria-hidden="true">
          {`0${i + 1}`}
        </span>
      </span>
      <span className="hm-card-body">
        <span className="hm-card-title" id={`${id}-title`}>
          {p.title}
        </span>
        <span className="hm-card-line" id={`${id}-line`}>
          {p.line}
        </span>
      </span>
      <span className="hm-card-foot">
        <span className="hm-card-url">{p.url}</span>
        <span className="hm-card-go" aria-hidden="true">
          →
        </span>
      </span>
    </a>
  );
}

export default function Home() {
  return (
    <div className="hm">
      <div className="hm-orb" aria-hidden="true">
        <Orb size={960} maxDpr={1.5} />
      </div>
      <div className="hm-glow hm-glow-floor" aria-hidden="true" />
      <div className="hm-glow hm-glow-centre" aria-hidden="true" />

      <header className="hm-head">
        <a href="/" aria-label="Bonia" className="hm-logo">
          <img src="/bonia-mark.png" alt="Bonia" width="26" height="26" />
        </a>
        <span className="hm-pick">Chọn sản phẩm</span>
      </header>

      <main className="hm-main">
        <div className="hm-intro">
          <div className="hm-eyebrow">Bonia</div>
          <h1 className="hm-h1">
            <span className="hm-h1-ink">Bonia</span>
            <span className="hm-h1-clay">Trợ lý nghe điện thoại</span>
          </h1>
          <p className="hm-sub">Bạn đang tìm Bonia cho việc gì?</p>
        </div>

        <nav aria-label="Sản phẩm Bonia" className="hm-cards">
          {PRODUCTS.map((p, i) => (
            <ProductCard key={p.href} p={p} i={i} />
          ))}
        </nav>
      </main>

      <footer className="hm-foot">
        <span>© 2026 Bonia · Công ty TNHH Duy Nhiên Investment</span>
        <nav aria-label="Liên kết cuối trang" className="hm-foot-links">
          <a href="/privacy.html">Quyền riêng tư</a>
          <a href="/terms.html">Điều khoản</a>
          <a href="/support.html">Hỗ trợ</a>
        </nav>
      </footer>
    </div>
  );
}
