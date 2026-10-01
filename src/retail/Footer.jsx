import { C, F, contentMax } from "./tokens.js";

/* Footer: the company block (logo, Duy Nhiên Investment, address, MST) and
 * the links: the consumer legal/support pages in public/, and cross-links to
 * the bonia.vn/ chooser and the other two products. */

const POLICY = [
  ["Chính sách bảo mật", "/privacy.html"],
  ["Điều khoản sử dụng", "/terms.html"],
  ["Hỗ trợ", "/support.html"],
];
const PRODUCTS = [
  ["Tất cả sản phẩm Bonia", "/"],
  ["Lễ tân doanh nghiệp", "/reception"],
  ["Bonia Ưu đãi", "/business"],
];

const col = { display: "flex", flexDirection: "column" };
const link = { color: C.body };

export default function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${C.line}`, padding: "clamp(36px,5vw,56px) clamp(16px,4vw,56px) 24px" }}>
      <div style={{ maxWidth: contentMax, margin: "0 auto", display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, lineHeight: 1.6, color: C.muted }}>
            <img
              src="/bonia-mark.png"
              alt="Bonia"
              width="24"
              height="24"
              style={{ height: 24, width: "auto", alignSelf: "flex-start", marginBottom: 6 }}
            />
            <span style={{ fontWeight: 500, color: C.ink }}>Công ty TNHH Duy Nhiên Investment</span>
            <span>120 N2 Mega Village, Đường Võ Chí Công, phường Long Trường, TP.HCM</span>
            <span style={{ fontFamily: F.mono, fontSize: 12 }}>MST: 0319376631</span>
          </div>
          <nav aria-label="Liên kết" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span
              style={{
                fontFamily: F.mono,
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.label,
              }}
            >
              Liên kết
            </span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                gap: "4px 32px",
                fontSize: 13,
                lineHeight: 1.75,
              }}
            >
              <div style={col}>
                {POLICY.map(([label, url]) => (
                  <a key={url} href={url} style={link}>
                    {label}
                  </a>
                ))}
                <a href="/so-chinh-thuc.html" style={{ ...link, paddingTop: 8 }}>
                  Số chính thức
                </a>
              </div>
              <div style={col}>
                {PRODUCTS.map(([label, url]) => (
                  <a key={url} href={url} style={link}>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </nav>
        </div>
        <div style={{ paddingTop: 18, borderTop: `1px solid ${C.line2}`, fontSize: 12, color: C.label }}>
          © 2026 Bonia. Mọi quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
}
