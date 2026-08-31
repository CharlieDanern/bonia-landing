import React, { useEffect, useState } from "react";
import { clearToken, getToken } from "./api.js";
import { Toast, useToast } from "./components.jsx";
import Login from "./pages/Login.jsx";
import Overview from "./pages/Overview.jsx";
import Cards from "./pages/Cards.jsx";
import Registrations from "./pages/Registrations.jsx";
import Claims from "./pages/Claims.jsx";
import Payouts from "./pages/Payouts.jsx";
import Closures from "./pages/Closures.jsx";
import Rms from "./pages/Rms.jsx";

const NAV = [
  { key: "overview", label: "Tổng quan" },
  { key: "cards", label: "Duyệt thẻ" },
  { key: "regs", label: "Đăng ký" },
  { key: "claims", label: "Đối soát" },
  { key: "payouts", label: "Chi thưởng" },
  { key: "closures", label: "Đóng TK" },
  { key: "rms", label: "Đối tác" },
];

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  useEffect(() => {
    const onOut = () => setAuthed(false); // fired by api.js on any 401
    window.addEventListener("bonia:signed-out", onOut);
    return () => window.removeEventListener("bonia:signed-out", onOut);
  }, []);
  if (!authed) return <Login onIn={() => setAuthed(true)} />;
  return (
    <Shell
      onSignOut={() => {
        clearToken();
        setAuthed(false);
      }}
    />
  );
}

function Shell({ onSignOut }) {
  const [route, setRoute] = useState("overview");
  const [toast, showToast] = useToast();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo-row">
          <div className="admin-mark">B</div>
          <div className="wordmark">
            Bonia <span>Admin</span>
          </div>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <button
              key={n.key}
              className={`nav-item ${route === n.key ? "active" : ""}`}
              onClick={() => setRoute(n.key)}
            >
              <span className="nav-dot" />
              {n.label}
            </button>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <div className="user-row">
          <div className="avatar">BA</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Bonia Admin</div>
            <button className="signout" onClick={onSignOut}>
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>
      <main className="content">
        <div className="wrap">
          {route === "overview" && <Overview nav={setRoute} showToast={showToast} />}
          {route === "cards" && <Cards showToast={showToast} />}
          {route === "regs" && <Registrations showToast={showToast} />}
          {route === "claims" && <Claims showToast={showToast} />}
          {route === "payouts" && <Payouts showToast={showToast} />}
          {route === "closures" && <Closures showToast={showToast} />}
          {route === "rms" && <Rms showToast={showToast} />}
        </div>
      </main>
      <Toast msg={toast} />
    </div>
  );
}
