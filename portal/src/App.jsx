import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, getToken, setToken, clearToken, vnd, ZALO } from "./api.js";
import { Softphone, classifyCallError } from "./softphone.js";
import { Toast, useToast, CallOverlay } from "./components.jsx";
import logo from "./logo-mark.png";
import { BidTab } from "./bid/BidTab.jsx";
import { DEFAULT_REWARD_PCT } from "./bid/position.js";
import Register from "./Register.jsx";
import Pipeline2 from "./Pipeline2.jsx";
import Account2 from "./Account2.jsx";
import { captureDeepLink, clearStashedTarget, peekStashedTarget } from "./deeplink.js";

const POLL_MS = 15_000; // marketplace/pipeline refresh — the ladder must feel live
// A deep-linked lead that never shows up in /rm/leads (reassigned, closed,
// or simply not this rep's) must not sit armed and then hijack the view an
// hour later when some unrelated poll happens to return it.
const FOCUS_TTL_MS = 30_000;

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  const [publicView, setPublicView] = useState(
    window.location.pathname.includes("dang-ky") ? "register" : "login"
  );
  // Where the email wanted us. deeplink.js already captured and cleaned the
  // query string at import time; this is the surviving copy, which outlives
  // the login screen because an emailed CTA is usually opened logged-out.
  const [target, setTarget] = useState(peekStashedTarget);
  const consumeTarget = useCallback(() => { clearStashedTarget(); setTarget(null); }, []);

  useEffect(() => {
    const onOut = () => setAuthed(false);
    const onPop = () => {
      setPublicView(window.location.pathname.includes("dang-ky") ? "register" : "login");
      const t = captureDeepLink();
      if (t) setTarget(t);
    };
    window.addEventListener("bonia:signed-out", onOut);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("bonia:signed-out", onOut);
      window.removeEventListener("popstate", onPop);
    };
  }, []);
  if (authed) return <Portal onSignOut={() => setAuthed(false)} target={target} onTargetApplied={consumeTarget} />;
  if (publicView === "register") {
    return <Register onDone={() => { window.history.pushState({}, "", "/app/"); setPublicView("login"); }} />;
  }
  if (publicView === "pending") {
    return (
      <div className="login-page">
        <div className="login-box" style={{ maxWidth: 404 }}>
          <div className="login-card" style={{ textAlign: "center" }}>
            <div className="reg-result-tile amber">…</div>
            <h1 className="serif" style={{ fontSize: 22, fontWeight: 600, margin: "12px 0 6px" }}>Bonia đang duyệt tài khoản</h1>
            <p style={{ fontSize: 13, color: "var(--ink-55)", lineHeight: 1.55 }}>
              Email của bạn không thuộc ngân hàng trong danh sách nhận diện tự động — Bonia duyệt
              thủ công trong một ngày làm việc. Bạn sẽ nhận email khi tài khoản mở.
            </p>
            <button className="btn-navy" style={{ width: "100%", marginTop: 14 }} onClick={() => setPublicView("login")}>
              Tôi đã hiểu
            </button>
          </div>
        </div>
      </div>
    );
  }
  return <Login onIn={() => setAuthed(true)} onPending={() => setPublicView("pending")} onRegister={() => { window.history.pushState({}, "", "/app/dang-ky"); setPublicView("register"); }} />;
}

/* ══ Login ═══════════════════════════════════════════════════ */
function Login({ onIn, onPending, onRegister }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.login(u.trim(), p);
      setToken(res.token);
      onIn();
    } catch (ex) {
      if (ex.body?.error === "pending_review") { onPending?.(); return; }
      // Copy is driven by the SERVER response only. The old client-side
      // counter promised "đợi 60 giây" and "còn N lần thử" while the server
      // locks for 15 minutes after 5 failures — and it reset on remount, so
      // the rep burned the real attempts believing they had fresh ones.
      setErr(
        ex.body?.error === "locked_out"
          ? `Đã khoá 15 phút do nhập sai nhiều lần. Thử lại sau 15 phút, hoặc nhắn Zalo ${ZALO} để được hỗ trợ.`
          : ex.body?.error === "invalid_credentials"
            ? "Sai email hoặc mật khẩu."
            : ex.body?.error === "missing_credentials"
              ? "Nhập đầy đủ email và mật khẩu."
              : `Không đăng nhập được. Thử lại, hoặc nhắn Zalo ${ZALO}.`
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div style={{ display: "flex", gap: 9, alignItems: "center", justifyContent: "center" }}>
          <img src={logo} alt="" style={{ width: 34, height: 34, objectFit: "contain" }} />
          <span className="wordmark" style={{ fontSize: 16 }}>Bonia <span>Business</span></span>
        </div>
        <h1 className="login-h1">Dành cho doanh nghiệp</h1>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-55)" }}>
          Kết nối với khách hàng tiềm năng với mức phí linh hoạt.<br />Chỉ thanh toán khi giao dịch thành công.
        </p>
        <form className="login-card" onSubmit={submit}>
          {err && <div className="err-panel">{err}</div>}
          <input className="input" placeholder="Email công việc" value={u} onChange={(e) => setU(e.target.value)} autoCapitalize="none" autoComplete="username" />
          <input className="input" type="password" placeholder="Mật khẩu" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" />
          {/* Shown BEFORE any failure: there is no self-serve reset yet, so
              the rep must know the way out before they are locked out. */}
          <div style={{ fontSize: 12, color: "var(--ink-45)", marginTop: -2, marginBottom: 10 }}>
            Quên mật khẩu? Nhắn Zalo <b style={{ color: "var(--navy, #191970)" }}>{ZALO}</b> để được cấp lại.
          </div>
          <button className="btn btn-primary btn-block" disabled={busy || !u || !p}>
            {busy ? "Đang vào…" : "Đăng nhập"}
          </button>
          <div style={{ fontSize: 12, color: "var(--ink-45)", textAlign: "center", marginTop: 12 }}>
            Chưa có tài khoản?{" "}
            <button type="button" onClick={onRegister} style={{ color: "var(--navy, #191970)", fontWeight: 600 }}>
              Đăng ký bằng email công việc
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══ Portal shell ════════════════════════════════════════════ */
function Portal({ onSignOut, target, onTargetApplied }) {
  // Seeded, not set in an effect: the tab must be right on the first paint,
  // otherwise an emailed lead link flashes the Bid tab on the way past.
  const [route, setRoute] = useState(() => target?.tab || "offers");
  // Lead the email pointed at, handed to Pipeline2 to select + scroll to.
  const [focusLeadId, setFocusLeadId] = useState(() => target?.lead || null);
  const [me, setMe] = useState(null);
  const [cards, setCards] = useState([]);
  // Live consumer commission (platform_settings.consumer_reward_pct),
  // delivered on the /rm/cards root. The portal quotes it instead of
  // printing a literal 50% — an admin can move the rate without a deploy.
  const [rewardPct, setRewardPct] = useState(DEFAULT_REWARD_PCT);
  const [leads, setLeads] = useState([]);
  const [toast, showToast] = useToast();

  // Apply the emailed target — on mount (the seed above already did the
  // first paint) and again if one arrives later via popstate. Consuming it
  // drops the sessionStorage stash, so a refresh does not re-trigger.
  useEffect(() => {
    if (!target) return;
    setRoute(target.tab);
    setFocusLeadId(target.lead || null);
    onTargetApplied?.();
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  // Disarm a lead focus that /rm/leads never delivers (see FOCUS_TTL_MS).
  useEffect(() => {
    if (!focusLeadId) return;
    const t = setTimeout(() => setFocusLeadId(null), FOCUS_TTL_MS);
    return () => clearTimeout(t);
  }, [focusLeadId]);

  // Softphone + call state
  const phoneRef = useRef(null);
  const [call, setCall] = useState(null); // { leadId, name, phase }
  const [callSec, setCallSec] = useState(0);
  const [muted, setMuted] = useState(false);
  // §3.0: hanging up ALWAYS opens the disposition sheet.
  const [dispositionFor, setDispositionFor] = useState(null); // {leadId, seconds}
  const callRef = useRef(null);
  // Set SYNCHRONOUSLY inside onPhase — SIP.js fires Terminated right after
  // a failed invite (a denied mic terminates the session immediately), and
  // the "ended" branch would otherwise dismiss the failure panel after
  // 300ms, before the rep could read why the call did not happen.
  const failedRef = useRef(false);
  useEffect(() => { callRef.current = { leadId: call?.leadId, seconds: callSec, phase: call?.phase }; }, [call, callSec]);

  const refresh = useCallback(async () => {
    try {
      const [m, cs, ld] = await Promise.all([api.me(), api.cards(), api.leads()]);
      setMe(m);
      setCards(cs.cards || []);
      // ?? — not ||: a rate of 0 is impossible (server validates 1..90),
      // but an older API build that omits the key must fall back, not
      // render "0%".
      setRewardPct(cs.consumer_reward_pct ?? DEFAULT_REWARD_PCT);
      setLeads(ld.leads || []);
    } catch {
      /* 401 handled globally */
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  // Connect the softphone once we know the SIP credentials.
  useEffect(() => {
    if (!me?.softphone || phoneRef.current) return;
    const phone = new Softphone({
      onPhase: (phase, reason) => {
        if (phase === "failed") {
          failedRef.current = true;
          setCall((c) => (c ? { ...c, phase, failReason: reason || "no_answer" } : c));
          return;
        }
        if (phase === "ended") {
          // The call never happened — keep the failure panel up (it carries
          // the fix: allow the mic, change browser, wait for the trunk).
          if (failedRef.current) { refresh(); return; }
          const snap = callRef.current;
          // §3.0: hanging up ALWAYS opens the sheet — including calls that
          // rang and were never answered ("Không nghe máy" is an option).
          if (snap?.leadId && snap.phase !== "failed") {
            setDispositionFor({ leadId: snap.leadId, seconds: snap.phase === "connected" ? snap.seconds : 0 });
          }
          setCall((c) => (c ? { ...c, phase: "ended" } : null));
          setTimeout(() => setCall(null), 300);
          refresh();
        } else {
          failedRef.current = false;
          setCall((c) => (c ? { ...c, phase } : c));
        }
      },
      // The overlay now carries the real reason — the toast would just
      // repeat (or contradict) it, so only log for support.
      onError: (err) => console.warn("[softphone]", err?.name || "", err?.message || err),
    });
    phoneRef.current = phone;
    phone.connect(me.softphone).catch(() => showToast("Không kết nối được tổng đài"));
    return () => { phone.disconnect(); phoneRef.current = null; };
  }, [me?.softphone?.username]); // eslint-disable-line react-hooks/exhaustive-deps

  // Call timer
  useEffect(() => {
    if (call?.phase !== "connected") { setCallSec(0); return; }
    const t = setInterval(() => setCallSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [call?.phase]);

  const startCall = async (lead) => {
    failedRef.current = false;
    // Browser gate BEFORE the overlay: no WebRTC/SIP means no call is even
    // attempted, and "khách không nghe máy" would be a lie.
    if (!window.SIP || !navigator.mediaDevices?.getUserMedia) {
      setMuted(false);
      setCall({
        leadId: lead.lead_id,
        name: lead.first_name,
        phase: "failed",
        // A missing SIP.js is our deploy, not their browser.
        failReason: !window.SIP ? "sip_missing" : "unsupported",
      });
      return;
    }
    if (!phoneRef.current?.ready) {
      setMuted(false);
      setCall({ leadId: lead.lead_id, name: lead.first_name, phase: "failed", failReason: "not_registered" });
      return;
    }
    setMuted(false);
    setCall({ leadId: lead.lead_id, name: lead.first_name, phase: "connecting" });
    try {
      await phoneRef.current.call(lead.lead_id);
    } catch (err) {
      setCall((c) => (c ? { ...c, phase: "failed", failReason: classifyCallError(err) } : null));
    }
  };

  const leadCounts = useMemo(() => leads.filter((l) => !["duoc_duyet", "that_bai", "cancelled"].includes(l.state)).length, [leads]);

  const nav = [
    { key: "offers", label: "Bid của tôi", short: "Bid", count: cards.length || null },
    { key: "pipeline", label: "Pipeline", short: "Pipeline", count: cards.length ? leadCounts : null },
    { key: "account", label: "Tài khoản", short: "Tôi" },
  ];


  return (
    <>
      <div className="mobile-header">
        <img src={logo} alt="" />
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          {nav.find((n) => n.key === route)?.label}
        </span>
      </div>
      <div className="shell">
        <aside className="sidebar">
          <div className="logo-row">
            <img src={logo} alt="" />
            <span className="wordmark">Bonia <span>Business</span></span>
          </div>
          <nav className="nav">
            {nav.map((n) => (
              <button key={n.key} className={`nav-item ${route === n.key ? "active" : ""}`} onClick={() => setRoute(n.key)}>
                <span className="nav-dot" />
                {n.label}
                {n.count ? <span className="nav-count">{n.count}</span> : null}
              </button>
            ))}
          </nav>
          <div style={{ flex: 1 }} />
          {me?.wallet && (
            <button className="pl-wallet-card" onClick={() => setRoute("account")}>
              <div className="bid-load-label">Số dư khả dụng</div>
              <div className="mono" style={{ fontSize: 15, fontWeight: 600 }}>{vnd(me.wallet.availableVnd)}</div>
              <div className="pl-wallet-bar">
                <div style={{ width: `${(me.wallet.availableVnd + me.wallet.heldVnd) > 0 ? Math.min(100, (me.wallet.availableVnd / (me.wallet.availableVnd + me.wallet.heldVnd)) * 100) : 100}%` }} />
              </div>
              <div className="bid-load-label">
                đang giữ {vnd(me.wallet.heldVnd)} · tổng {vnd(me.wallet.availableVnd + me.wallet.heldVnd)}
              </div>
              {me.wallet.freeLeadsLeft > 0 && (
                <div className="bid-load-label" style={{ color: "var(--navy, #191970)", fontWeight: 600, marginTop: 3 }}>
                  Còn {me.wallet.freeLeadsLeft} lead đầu miễn phí
                </div>
              )}
              {me.wallet.freeLeadsLeft === 0 && me.wallet.availableVnd < 200000 && (
                <div className="bid-load-label" style={{ color: "#8A5B08", fontWeight: 600, marginTop: 3 }}>
                  Sắp hết số dư — lead mới sẽ chuyển cho người khác.
                </div>
              )}
            </button>
          )}
          {me && (
            <div className="user-row">
              <div className="avatar">{me.profile.displayName.trim().slice(-1).toUpperCase()}</div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{me.profile.displayName}</div>
                <div style={{ fontSize: 11, color: "var(--ink-45)" }}>{me.profile.bank}</div>
              </div>
            </div>
          )}
        </aside>

        <main className="content">
          {route === "offers" && <BidTab cards={cards} bank={me?.profile?.bank} wallet={me?.wallet} rewardPct={rewardPct} refresh={refresh} showToast={showToast} />}
          {route === "pipeline" && (
            <Pipeline2
              leads={leads}
              myCards={cards}
              repName={me?.profile?.displayName || ""}
              onCall={startCall}
              refresh={refresh}
              showToast={showToast}
              dispositionFor={dispositionFor}
              clearDisposition={() => setDispositionFor(null)}
              focusLeadId={focusLeadId}
              onFocusApplied={() => setFocusLeadId(null)}
            />
          )}
          {route === "account" && (
            <Account2 me={me} onSignOut={onSignOut} showToast={showToast} refresh={refresh} />
          )}
        </main>
      </div>

      <nav className="tabbar">
        {nav.map((n) => (
          <button key={n.key} className={`tab ${route === n.key ? "active" : ""}`} onClick={() => setRoute(n.key)}>
            <span className="tab-block" />
            {n.short}
          </button>
        ))}
      </nav>

      {call && call.phase !== "ended" && (
        <CallOverlay
          name={call.name}
          phase={call.phase}
          failReason={call.failReason}
          seconds={callSec}
          muted={muted}
          onMute={() => { const m = !muted; setMuted(m); phoneRef.current?.setMuted(m); }}
          onHangup={() => phoneRef.current?.hangup()}
          onRetry={() => { const l = leads.find((x) => x.lead_id === call.leadId); if (l) startCall(l); }}
          onClose={() => setCall(null)}
        />
      )}
      <Toast msg={toast} />
    </>
  );
}

