import React from "react";
import ReactDOM from "react-dom/client";
import "../index.css";
import { LangProvider } from "../lang.jsx";
import HuongDan from "../HuongDan.jsx";

/* bonia.vn/huong-dan: the app install & onboarding guide on its own page
 * (founder 2026-10-01). It was a section of the old consumer landing; the new
 * /retail page does not show it, and nothing on the site links here: support
 * and the app share the link. Same component, same copy (lang.jsx). */
function Page() {
  return (
    <div style={{ background: "#F2EEE6", minHeight: "100vh", color: "#1F1B16" }}>
      <nav
        style={{
          position: "sticky", top: 0, zIndex: 10, height: 64, display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 clamp(16px,4vw,48px)",
          background: "rgba(242,238,230,0.86)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          borderBottom: "1px solid #E4DCCB",
        }}
      >
        <a href="/retail" aria-label="Bonia — Trợ lý lọc cuộc gọi" style={{ display: "flex", alignItems: "center" }}>
          <img src="/bonia-mark.png" alt="Bonia" width="28" height="28" style={{ display: "block" }} />
        </a>
        <a href="/retail" className="ff-mono" style={{ fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#7B4A2D" }}>
          Về trang Bonia
        </a>
      </nav>
      <HuongDan num={null} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LangProvider>
      <Page />
    </LangProvider>
  </React.StrictMode>,
);
