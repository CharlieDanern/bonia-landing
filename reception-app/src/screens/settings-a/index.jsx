import React from "react";
import { SettingsLayout } from "../../components/shell/index.js";
import { useScreenState } from "../../lib/hooks.js";
import { SettingsList } from "./List.jsx";
import { SectionSkeleton } from "./parts.jsx";
import { Section01 } from "./S01.jsx";
import { Section02 } from "./S02.jsx";
import { Section03 } from "./S03.jsx";
import { Section04 } from "./S04.jsx";
import { Section05 } from "./S05.jsx";

// /cai-dat (3.6 A, O) and /cai-dat/01…05 (3.6 B–G).
// ?state=loading → skeleton · empty → manual-setup list (3.6 O) ·
// error → list: load error; detail: an unsaved edit whose save failed.
// ?f=<frameId> opens the exact state drawn in that frame.

const SECTIONS = { "01": Section01, "02": Section02, "03": Section03, "04": Section04, "05": Section05 };

export function SettingsA({ section }) {
  const { state, frame, query } = useScreenState();
  const Section = SECTIONS[section];
  if (!Section) return <SettingsList state={state} />;
  return (
    <SettingsLayout active={section}>
      {state === "loading" ? (
        <SectionSkeleton />
      ) : (
        // Remount per section/frame so drafts start from the saved values.
        <Section key={`${section}-${frame}-${state}`} screen={state} frame={frame} query={query} />
      )}
    </SettingsLayout>
  );
}
