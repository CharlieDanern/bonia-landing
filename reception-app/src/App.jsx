import React from "react";
import { Redirect, Route, Switch } from "wouter";
import { AppFrame } from "./layout.jsx";
import { StoreRedirect } from "./components/StoreQR.jsx";
import { Account } from "./screens/Account.jsx";
import { History } from "./screens/History.jsx";
import { Live } from "./screens/Live.jsx";
import { Settings } from "./screens/Settings.jsx";
import { Start, StartLink } from "./screens/Start.jsx";
import { TryBonia } from "./screens/TryBonia.jsx";

// Bonia Tiếp tân v3 (Claude Design handoff 13 + the founder's 2026-10-04
// changes). Tabs: Trực tiếp · Lịch sử · Cài đặt · Thử Bonia · Tài khoản, plus
// the Bắt đầu flow. Sample data only.
export default function App() {
  return (
    <Switch>
      <Route path="/tai" component={StoreRedirect} />
      <Route>
        <AppFrame>
          <Switch>
            <Route path="/" component={Live} />
            <Route path="/lich-su" component={History} />
            <Route path="/cai-dat" component={Settings} />
            <Route path="/thu-bonia" component={TryBonia} />
            <Route path="/tai-khoan" component={Account} />
            <Route path="/bat-dau/:step?">{(p) => <Start step={p.step || ""} />}</Route>
            <Route path="/start/:code">{(p) => <StartLink code={p.code} />}</Route>
            <Route path="/dang-nhap">
              <Redirect to="/bat-dau" replace />
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
