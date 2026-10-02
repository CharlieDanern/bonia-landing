import React from "react";
import { Page, PageHeader, SettingsLayout } from "../../components/shell/index.js";

// STUB — replaced by the settings-b screen agent.
// Owns: /cai-dat/06…11 (3.6 H–L, Q), /tai-khoan (3.6 M), /tro-giup (3.6 N),
// and the staff task page /viec (Trang việc, TV A–B).
// Frames: src/frames/settings-b.js. Data: src/data/settings.js (§06–§11), staff.js.

export function SettingsB({ section }) {
  return (
    <SettingsLayout active={section}>
      <Page>
        <PageHeader eyebrow={`§ ${section} · Cài đặt`} title="" size={36} />
      </Page>
    </SettingsLayout>
  );
}

export function Account() {
  return (
    <SettingsLayout active="tk">
      <Page>
        <PageHeader eyebrow="Tài khoản" title="Khách sạn Sân Nhài" size={36} />
      </Page>
    </SettingsLayout>
  );
}

export function Help() {
  return (
    <SettingsLayout active="tg">
      <Page>
        <PageHeader eyebrow="Trợ giúp" title="" size={36} />
      </Page>
    </SettingsLayout>
  );
}

export function TaskPage() {
  return <div style={{ minHeight: "100%", background: "var(--bn-cream)" }} />;
}
