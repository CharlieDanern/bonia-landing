import React from "react";
import { AppLayout, Page, PageHeader, SettingsLayout } from "../../components/shell/index.js";

// STUB — replaced by the settings-a screen agent.
// Owns: /cai-dat (list, 3.6 A, O–P) and /cai-dat/01…05 (3.6 B–G).
// Frames: src/frames/settings-a.js. Data: src/data/settings.js (§01–§05), staff.js.

export function SettingsA({ section }) {
  if (!section) {
    return (
      <AppLayout active="cai-dat">
        <Page gap={20}>
          <PageHeader eyebrow="Bonia đã biết 28/30 điều khách hay hỏi" title="Cài đặt" />
        </Page>
      </AppLayout>
    );
  }
  return (
    <SettingsLayout active={section}>
      <Page>
        <PageHeader eyebrow={`§ ${section} · Cài đặt`} title="" size={36} />
      </Page>
    </SettingsLayout>
  );
}
