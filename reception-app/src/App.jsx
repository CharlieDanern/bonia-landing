import React, { Suspense, lazy } from "react";
import { Redirect, Route, Switch } from "wouter";
import { markNewAccount, sectorBy } from "./data/sectors.js";
import { ChooseSector, Login, Onboarding } from "./screens/login-onboarding/index.jsx";
import { Today, Billing, Paused } from "./screens/today-billing/index.jsx";
import { Requests } from "./screens/requests/index.jsx";
import { Calendar, Calls } from "./screens/calendar-calls/index.jsx";
import { SettingsA } from "./screens/settings-a/index.jsx";
import { SettingsB, Account, Help, TaskPage } from "./screens/settings-b/index.jsx";

// Dev-only component gallery; never part of the production bundle.
const Gallery = import.meta.env.DEV ? lazy(() => import("./gallery/Gallery.jsx")) : null;

/** §01–§05 belong to settings-a, §06–§11 to settings-b. */
function SettingsRoute({ section }) {
  const n = Number(section);
  if (section && n >= 6 && n <= 11) return <SettingsB section={section} />;
  return <SettingsA section={section} />;
}

/**
 * A salesperson's link (brief §3.1): /start/VNPT-HCM-0123?nganh=luu-tru starts a
 * new account credited to that code; a ready sector in the link skips the
 * sector choice. Then the normal login.
 */
function StartLink({ code }) {
  const nganh = new URLSearchParams(window.location.search).get("nganh");
  const sector = nganh && sectorBy(nganh).key === nganh && sectorBy(nganh).ready ? nganh : null;
  markNewAccount({ code, sector });
  return <Redirect to="/dang-nhap" replace />;
}

export default function App() {
  return (
    <Switch>
      <Route path="/dang-nhap" component={Login} />
      <Route path="/start/:code">{(p) => <StartLink code={p.code} />}</Route>
      <Route path="/chon-linh-vuc" component={ChooseSector} />
      <Route path="/bat-dau/:step?">{(p) => <Onboarding step={p.step} />}</Route>
      <Route path="/hom-nay" component={Today} />
      <Route path="/thanh-toan" component={Billing} />
      <Route path="/tam-dung" component={Paused} />
      <Route path="/yeu-cau/:id?">{(p) => <Requests id={p.id} />}</Route>
      <Route path="/lich" component={Calendar} />
      <Route path="/cuoc-goi/:id?">{(p) => <Calls id={p.id} />}</Route>
      <Route path="/cai-dat/:section?">{(p) => <SettingsRoute section={p.section} />}</Route>
      <Route path="/tai-khoan" component={Account} />
      <Route path="/tro-giup" component={Help} />
      <Route path="/viec" component={TaskPage} />
      {Gallery && (
        <Route path="/_gallery">
          <Suspense fallback={null}>
            <Gallery />
          </Suspense>
        </Route>
      )}
      <Route>
        <Redirect to="/hom-nay" replace />
      </Route>
    </Switch>
  );
}
