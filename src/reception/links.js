// Where the page sends things. Handoff v5 has one call to action, the §04
// contact form (founder 2026-09-28: sales calls back; no app, store or login
// links on this page), so the only target left is the form's endpoint.

// Contact-form target (founder 2026-09-29): the backend pings the sales team
// on Telegram (bonia-backend routes/reception-public.ts). It answers 200 only
// when the ping went out, so the form never shows "sent" for a lost lead.
export const DEMO_ENDPOINT = "https://api.bonia.net/reception/lead";

// Call recordings (handoff v5 open item 1): public/reception/demo/bonia-call-0N.mp3.
export const callAudio = (n) => `/reception/demo/bonia-call-0${n}.mp3`;
