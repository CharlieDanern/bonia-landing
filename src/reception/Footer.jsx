import { C, F, contentMax } from "./tokens.js";

/* Footer (handoff v6): company + MST, links, divider, copyright. The links
 * are v6's row of sections (Nghe thử · Cài đặt · Giá · Dùng thử), then the
 * Bonia home and the legal pages (Điều khoản is Bonia Tiếp tân's own,
 * /terms-reception.html). v6 also links "Bonia Business" (/business); that
 * page is the bank product, and the founder took it off this footer on
 * 2026-09-29, so it stays off. */

const LINKS = [
  ["Nghe thử", "#nghe"],
  ["Cài đặt", "#cai-dat"],
  ["Giá", "#gia"],
  ["Dùng thử", "#demo"],
  ["Đăng nhập", "/reception/app"], // the receptionist app (founder 2026-10-07)
  ["Trang chủ Bonia", "/"], // the home chooser (2026-10-01)
  ["Chính sách bảo mật", "/privacy.html"],
  ["Điều khoản", "/terms-reception.html"],
];

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: `1px solid ${C.line}`,
        padding: "clamp(28px,4vw,44px) clamp(16px,5vw,72px)",
      }}
    >
      <div
        style={{
          maxWidth: contentMax,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: "16px 40px",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: C.ink3 }}>
          <span style={{ fontWeight: 600, color: C.ink }}>Công ty TNHH Duy Nhiên Investment</span>
          <span style={{ fontFamily: F.mono, fontSize: 12 }}>MST: 0319376631</span>
        </div>
        <nav aria-label="Liên kết cuối trang" style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", fontSize: 13 }}>
          {LINKS.map(([label, url]) => (
            <a key={label} href={url}>
              {label}
            </a>
          ))}
        </nav>
        <div
          style={{
            width: "100%",
            borderTop: `1px solid ${C.line2}`,
            paddingTop: 16,
            fontSize: 12,
            color: C.muted,
          }}
        >
          © 2026 Bonia. Mọi quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
}
