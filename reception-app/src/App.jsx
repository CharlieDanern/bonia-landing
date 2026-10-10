import React from "react";
import { Redirect, Route, Switch } from "wouter";
import { useApp } from "./state.jsx";
import { AppFrame } from "./layout.jsx";
import { StoreRedirect } from "./components/StoreQR.jsx";
import { Account } from "./screens/Account.jsx";
import { History } from "./screens/History.jsx";
import { Live } from "./screens/Live.jsx";
import { Settings } from "./screens/Settings.jsx";
import { QrLanding, Start, StartLink } from "./screens/Start.jsx";
import { TryBonia } from "./screens/TryBonia.jsx";
import { FinanceHistory } from "./finance/History.jsx";
import { FinanceAccount, FinanceInbound, FinanceOutbound, FinanceSettings } from "./finance/screens.jsx";

// Bonia Tiếp tân v3 (Claude Design handoff 13 + the founder's 2026-10-04
// changes). Tabs: Trực tiếp · Lịch sử · Cài đặt · Thử Bonia · Tài khoản, plus
// the Bắt đầu flow. Outside demo mode the tabs need a login (Bắt đầu).

/** The tabs: logged in (or demo), else Bắt đầu. */
function Gate({ children }) {
  const app = useApp();
  const s = app.account.status;
  if (s === "demo" || s === "in") return children;
  if (s === "out") return <Redirect to="/bat-dau" replace />;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 12, alignItems: "center", justifyContent: "center", background: "#F2EEE6", color: "#4A4239", fontSize: 14 }}>
      {s === "error" ? (
        <>
          <span>Không kết nối được tới Bonia.</span>
          <button type="button" className="b-primary" onClick={app.reloadAccount} style={{ height: 40, padding: "0 18px", borderRadius: 20 }}>Thử lại</button>
        </>
      ) : <span>Đang mở…</span>}
    </div>
  );
}

/**
 * A finance company (Bonia Tiếp tân · Tài chính, handoff 16, founder 2026-10-10): its own tabs, Gọi vào · Gọi ra ·
 * Lịch sử · Cài đặt · Tài khoản. Same login and frame as a hotel.
 */
function FinanceApp() {
  return (
    <AppFrame>
      <Switch>
        <Route path="/" component={FinanceInbound} />
        <Route path="/goi-ra" component={FinanceOutbound} />
        <Route path="/lich-su" component={FinanceHistory} />
        <Route path="/cai-dat" component={FinanceSettings} />
        <Route path="/tai-khoan" component={FinanceAccount} />
        <Route>
          <Redirect to="/" replace />
        </Route>
      </Switch>
    </AppFrame>
  );
}

export default function App() {
  const app = useApp();
  if (app.account.status === "in" && app.biz.sector === "finance") return <FinanceApp />;
  return (
    <Switch>
      <Route path="/tai" component={StoreRedirect} />
      <Route>
        <AppFrame>
          <Switch>
            <Route path="/"><Gate><Live /></Gate></Route>
            <Route path="/lich-su"><Gate><History /></Gate></Route>
            <Route path="/cai-dat"><Gate><Settings /></Gate></Route>
            <Route path="/thu-bonia"><Gate><TryBonia /></Gate></Route>
            <Route path="/tai-khoan"><Gate><Account /></Gate></Route>
            <Route path="/bat-dau/:step?">{(p) => <Start step={p.step || ""} />}</Route>
            <Route path="/start/:code">{(p) => <StartLink code={p.code} />}</Route>
            <Route path="/qr/:id" component={QrLanding} />
            <Route path="/dang-nhap">
              <Redirect to="/bat-dau/dang-nhap" replace />
            </Route>
            <Route>
              <Redirect to="/" replace />
            </Route>
          </Switch>
        </AppFrame>
      </Route>
    </Switch>
  );
}
