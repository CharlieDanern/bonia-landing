import React from "react";
import { SettingsLayout } from "../../components/shell/index.js";
import { useScreenState } from "../../lib/hooks.js";
import { DetailSkeleton } from "./parts.jsx";
import { S06 } from "./S06.jsx";
import { S07 } from "./S07.jsx";
import { S08 } from "./S08.jsx";
import { S09 } from "./S09.jsx";
import { S10S11 } from "./S10S11.jsx";
import { AccountPage } from "./Account.jsx";
import { HelpPage } from "./Help.jsx";
import { TaskPage } from "./TaskPage.jsx";

// settings-b: /cai-dat/06…11 (3.6 H–L, P, Q), /tai-khoan (3.6 M),
// /tro-giup (3.6 N) and the staff task page /viec (TV A–B). The empty
// settings list (3.6 O) is settings-a's /cai-dat?state=empty. ?state=loading shows 3.6 P on any of these pages;
// ?state=error on §06 shows the failed save (3.6 Q).

const PAGES = { "06": S06, "07": S07, "08": S08, "09": S09, 10: S10S11, 11: S10S11 };

export function SettingsB({ section }) {
  const { state, frame } = useScreenState();
  const Page = PAGES[section] || S06;
  return (
    <SettingsLayout active={section}>
      {state === "loading" ? <DetailSkeleton /> : <Page key={`${section}-${state}-${frame}`} section={section} state={state} frame={frame} />}
    </SettingsLayout>
  );
}

export function Account() {
  const { state, frame } = useScreenState();
  return (
    <SettingsLayout active="tk">
      {state === "loading" ? <DetailSkeleton /> : <AccountPage key={frame} frame={frame} />}
    </SettingsLayout>
  );
}

export function Help() {
  const { state, frame } = useScreenState();
  return (
    <SettingsLayout active="tg">
      {state === "loading" ? <DetailSkeleton /> : <HelpPage key={`${state}-${frame}`} state={state} frame={frame} />}
    </SettingsLayout>
  );
}

export { TaskPage };
