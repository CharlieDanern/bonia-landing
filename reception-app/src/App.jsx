import React, { Suspense, lazy } from "react";
import { Redirect, Route, Switch } from "wouter";
import { Login, Onboarding } from "./screens/login-onboarding/index.jsx";
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

export default function App() {
  return (
    <Switch>
      <Route path="/dang-nhap" component={Login} />
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
