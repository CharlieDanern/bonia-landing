// Bonia Connect portal — WebRTC softphone (SIP.js over WSS to FreeSWITCH).
//
// Hard-won constraints, all verified live on 2026-08-24:
//   • keepAliveInterval MUST be set (2s). Without it, sofia can leave a
//     coalesced ACK+INVITE sitting unread in its TLS buffer and the call
//     silently stalls 10–20s. The keepalive bounds that to ~2s.
//   • The vendored SIP.js UMD bundle comes from the GitHub release asset —
//     the npm package ships ESM only, no browser build.
//   • Locking a phone kills the mic and drops the call → Screen Wake Lock
//     while a call is up, plus the on-screen warning the design mandates.
//
// Call phases mirror the design overlay: connecting → ringing → connected
// (or failed). Ringback is generated server-side (FS broadcasts a VN tone
// onto the RM leg), so there is nothing to play locally.

const SIP = window.SIP;

export class Softphone {
  constructor({ onPhase, onError }) {
    this.ua = null;
    this.session = null;
    this.registerer = null;
    this.wakeLock = null;
    this.onPhase = onPhase || (() => {});
    this.onError = onError || (() => {});
    this.audio = document.createElement("audio");
    this.audio.autoplay = true;
    document.body.appendChild(this.audio);
  }

  get ready() {
    return !!this.ua && this.registered;
  }

  async connect({ wss, domain, username, password, keepAliveInterval = 2 }) {
    if (this.ua) return;
    this.ua = new SIP.UserAgent({
      uri: SIP.UserAgent.makeURI(`sip:${username}@${domain}`),
      transportOptions: { server: wss, keepAliveInterval },
      authorizationUsername: username,
      authorizationPassword: password,
      logBuilder: () => () => {},
    });
    await this.ua.start();
    this.registerer = new SIP.Registerer(this.ua);
    await this.registerer.register();
    this.registered = true;
  }

  async call(leadId) {
    if (!this.ua) throw new Error("softphone_not_ready");
    if (this.session) throw new Error("call_in_progress");
    this.onPhase("connecting");

    const target = SIP.UserAgent.makeURI(`sip:lead-${leadId}@${this.ua.configuration.uri.host}`);
    const inviter = new SIP.Inviter(this.ua, target, {
      sessionDescriptionHandlerOptions: { constraints: { audio: true, video: false } },
    });
    this.session = inviter;

    inviter.stateChange.addListener((state) => {
      if (state === "Establishing") this.onPhase("ringing");
      if (state === "Established") {
        this._attachRemoteAudio(inviter);
        this._acquireWakeLock();
        this.onPhase("connected");
      }
      if (state === "Terminated") {
        this._releaseWakeLock();
        this.session = null;
        this.onPhase("ended");
      }
    });

    try {
      await inviter.invite();
    } catch (err) {
      this.session = null;
      this.onPhase("failed");
      this.onError(err);
    }
  }

  hangup() {
    if (!this.session) return;
    const s = this.session;
    try {
      if (s.state === "Established") s.bye();
      else if (s.state === "Establishing" || s.state === "Initial") s.cancel();
    } catch {
      /* already gone */
    }
    this.session = null;
  }

  setMuted(muted) {
    const pc = this.session?.sessionDescriptionHandler?.peerConnection;
    if (!pc) return;
    pc.getSenders().forEach((sender) => {
      if (sender.track && sender.track.kind === "audio") sender.track.enabled = !muted;
    });
  }

  _attachRemoteAudio(session) {
    const pc = session.sessionDescriptionHandler?.peerConnection;
    if (!pc) return;
    const stream = new MediaStream();
    pc.getReceivers().forEach((r) => r.track && stream.addTrack(r.track));
    this.audio.srcObject = stream;
    this.audio.play().catch(() => {});
  }

  async _acquireWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        this.wakeLock = await navigator.wakeLock.request("screen");
      }
    } catch {
      /* not fatal — the on-screen warning covers it */
    }
  }

  _releaseWakeLock() {
    try {
      this.wakeLock?.release();
    } catch {
      /* ignore */
    }
    this.wakeLock = null;
  }

  async disconnect() {
    this.hangup();
    try {
      await this.registerer?.unregister();
      await this.ua?.stop();
    } catch {
      /* ignore */
    }
    this.ua = null;
    this.registered = false;
  }
}
