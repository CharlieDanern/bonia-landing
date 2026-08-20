# Bonia Connect — RM portal

Standalone Vite+React SPA for bank RMs. Deployed at **bonia.vn/app/**.

## How it deploys
This is a SEPARATE app from the landing page. It builds into `../public/app/`,
and the landing repo's own Vite build copies `public/` verbatim into `dist/`.
So `bonia.vn/app/` serves this SPA with **zero changes to the landing build**.

```bash
cd portal && npm install && npm run build   # → ../public/app/
# then commit BOTH portal/ and public/app/ and push (Vercel deploys the repo)
```

Local dev against the live API: `npm run dev` (Vite serves /app/).
Point at a different API with `VITE_API_BASE=http://localhost:4000 npm run dev`.

## Notes that matter
- **SIP.js is vendored** (`src/sip.min.js`) from the GitHub release asset — the
  npm package ships ESM only, with no browser bundle.
- **`keepAliveInterval: 2` is mandatory** on the softphone transport. Without
  it, FreeSWITCH's sofia can leave a coalesced ACK+INVITE unread in its TLS
  buffer and the call silently stalls 10–20s (verified live 2026-08-24).
- Screen Wake Lock is requested during a call; locking a phone still kills the
  mic, hence the on-screen warning the design mandates.
- Auth is a bearer token in localStorage — NOT cookies (bonia.vn and
  api.bonia.net are different registrable domains; Safari blocks third-party
  cookies).
- No customer phone number is ever fetched or rendered. First name + district
  only. Keep every "SĐT được Bonia bảo vệ" affordance.
