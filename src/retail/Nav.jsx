import { C, F } from "./tokens.js";

/* Sticky nav: 64 px, blurred cream band with a hairline. Logo + "CÁ NHÂN"
 * (back to the bonia.vn/ chooser) on the left; Tính năng · Cách dùng ·
 * Câu hỏi (hidden at 640 px and below, retail.css) and the dark "Tải app"
 * pill on the right. */

const NAV_GAP = "clamp(14px,2.4vw,28px)";
const link = { color: C.body };

export default function Nav() {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "0 clamp(16px,4vw,48px)",
        background: "rgba(242,238,230,0.86)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(217,208,191,0.6)",
      }}
    >
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src="/bonia-mark.png" alt="Bonia" width="26" height="26" style={{ height: 26, width: "auto", display: "block" }} />
        <span
          style={{
            fontFamily: F.mono,
            fontSize: 10.5,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: C.label,
          }}
        >
          Cá nhân
        </span>
      </a>
      <nav aria-label="Chính" style={{ display: "flex", alignItems: "center", gap: NAV_GAP }}>
        <span className="rt-navlinks" style={{ display: "flex", gap: NAV_GAP, fontSize: 14 }}>
          <a href="#tinhnang" style={link}>
            Tính năng
          </a>
          <a href="#cachdung" style={link}>
            Cách dùng
          </a>
          <a href="#cauhoi" style={link}>
            Câu hỏi
          </a>
        </span>
        <a href="#taiapp" className="rt-pill">
          Tải app
        </a>
      </nav>
    </header>
  );
}
