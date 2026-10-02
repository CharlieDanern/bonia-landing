// Frame registry for visual QA (scripts/shoot.mjs): every handoff frame →
// the URL that reproduces it. Each screen group owns one file so agents
// never edit the same object.
import loginOnboarding from "./login-onboarding.js";
import todayBilling from "./today-billing.js";
import requests from "./requests.js";
import calendarCalls from "./calendar-calls.js";
import settingsA from "./settings-a.js";
import settingsB from "./settings-b.js";

export const FRAME_GROUPS = {
  "login-onboarding": loginOnboarding,
  "today-billing": todayBilling,
  requests,
  "calendar-calls": calendarCalls,
  "settings-a": settingsA,
  "settings-b": settingsB,
};

export const FRAMES = Object.assign({}, ...Object.values(FRAME_GROUPS));

export default FRAMES;
