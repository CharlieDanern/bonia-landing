import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, getToken, setToken, clearToken, vnd, STAGE_LABEL, STAGE_FILTERS } from "./api.js";
import { Softphone } from "./softphone.js";
import {
  BID_STEP, Stepper, Toast, useToast, CallOverlay, PaymentModal,
} from "./components.jsx";
import logo from "./logo-mark.png";

const POLL_MS = 15_000; // marketplace/pipeline refresh — the ladder must feel live

export default function App() {
  const [authed, setAuthed] = useState(!!getToken());
  useEffect(() => {
    const onOut = () => setAuthed(false);
    window.addEventListener("bonia:signed-out", onOut);
    return () => window.removeEventListener("bonia:signed-out", onOut);
  }, []);
  return authed ? <Portal onSignOut={() => setAuthed(false)} /> : <Login onIn={() => setAuthed(true)} />;
}

/* ══ Login ═══════════════════════════════════════════════════ */
function Login({ onIn }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState(null);
  const [tries, setTries] = useState(0);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.login(u.trim(), p);
      setToken(res.token);
      onIn();
    } catch (ex) {
      const n = tries + 1;
      setTries(n);
      setErr(
        ex.body?.error === "locked_out"
          ? "Bạn đã thử quá nhiều lần. Đợi ít phút rồi thử lại, hoặc nhắn Zalo Bonia để được cấp lại mật khẩu."
          : n >= 3
            ? "Bạn đã thử 3 lần. Đợi 60 giây rồi thử lại, hoặc nhắn Zalo Bonia để được cấp lại mật khẩu."
            : `Sai tên đăng nhập hoặc mật khẩu. Còn ${3 - n} lần thử.`
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
          <input className="input" placeholder="Tên đăng nhập" value={u} onChange={(e) => setU(e.target.value)} autoCapitalize="none" autoComplete="username" />
          <input className="input" type="password" placeholder="Mật khẩu" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" />
          <button className="btn btn-primary btn-block" disabled={busy || !u || !p}>
            {busy ? "Đang vào…" : "Đăng nhập"}
          </button>
          <div style={{ fontSize: 11.5, color: "var(--ink-35)", textAlign: "center", marginTop: 12 }}>
            Tài khoản do Bonia cấp
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══ Portal shell ════════════════════════════════════════════ */
function Portal({ onSignOut }) {
  const [route, setRoute] = useState("offers");
  const [me, setMe] = useState(null);
  const [offers, setOffers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [toast, showToast] = useToast();

  // Softphone + call state
  const phoneRef = useRef(null);
  const [call, setCall] = useState(null); // { leadId, name, phase }
  const [callSec, setCallSec] = useState(0);
  const [muted, setMuted] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [m, of, ld] = await Promise.all([api.me(), api.offers(), api.leads()]);
      setMe(m);
      setOffers(of.products || []);
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
      onPhase: (phase) => {
        if (phase === "ended") {
          setCall((c) => (c ? { ...c, phase: "ended" } : null));
          setTimeout(() => setCall(null), 300);
          refresh();
        } else {
          setCall((c) => (c ? { ...c, phase } : c));
        }
      },
      onError: () => showToast("Không kết nối được cuộc gọi"),
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
    if (!phoneRef.current?.ready) return showToast("Tổng đài chưa sẵn sàng, thử lại sau vài giây");
    setMuted(false);
    setCall({ leadId: lead.lead_id, name: lead.first_name, phase: "connecting" });
    try {
      await phoneRef.current.call(lead.lead_id);
    } catch {
      setCall((c) => (c ? { ...c, phase: "failed" } : null));
    }
  };

  const leadCounts = useMemo(() => leads.filter((l) => !["duoc_duyet", "that_bai", "cancelled"].includes(l.state)).length, [leads]);
  const budgetPct = me ? Math.min(100, Math.round((me.budget.committedVnd / me.budget.capVnd) * 100)) : 0;

  const nav = [
    { key: "offers", label: "Ưu đãi của tôi", short: "Ưu đãi" },
    { key: "pipeline", label: "Pipeline", short: "Pipeline", count: leadCounts },
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
          {me && (
            <div className="budget-card">
              <div className="budget-label">Phí đã cam kết tháng này</div>
              <div className="budget-amount mono">{vnd(me.budget.committedVnd)}</div>
              <div className="budget-track">
                <div className={`budget-fill ${budgetPct > 85 ? "over" : ""}`} style={{ width: `${budgetPct}%` }} />
              </div>
              <div className="budget-foot">trên hạn mức {vnd(me.budget.capVnd)}</div>
            </div>
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
          {route === "offers" && <Offers products={offers} bank={me?.profile?.bank} onSet={refresh} showToast={showToast} />}
          {route === "pipeline" && (
            <Pipeline leads={leads} onCall={startCall} refresh={refresh} showToast={showToast} />
          )}
          {route === "account" && (
            <Account me={me} onSignOut={() => { clearToken(); onSignOut(); }} showToast={showToast} />
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

/* ══ Screen 1 — Standing offers ══════════════════════════════
   Bonia lists each card product's BEST live offer to users; the highest
   offer at a bank wins that introduction. Competition is with colleagues
   at the same bank (different branches) — amounts are visible, identities
   never are. Raising is the only lever, so the raise action is the
   loudest thing on each card. */
function Offers({ products, bank, onSet, showToast }) {
  const [drafts, setDrafts] = useState({});

  const draftFor = (p) =>
    drafts[p.product_id] ??
    (p.my_offer_vnd != null
      ? p.my_offer_vnd + BID_STEP
      : Math.max(p.floor_vnd, (p.best_offer_vnd || 0) + BID_STEP));

  const submit = async (p) => {
    const amount = draftFor(p);
    try {
      const res = await api.setOffer(p.product_id, amount);
      showToast(`Đã đặt ${vnd(amount)} · khách nhận ${vnd(res.user_reward_vnd)}`);
      setDrafts((d) => ({ ...d, [p.product_id]: amount + BID_STEP }));
      onSet();
    } catch (ex) {
      showToast(
        ex.body?.error === "invalid_amount"
          ? `Tối thiểu ${vnd(ex.body.floor)} · mỗi bước ${vnd(ex.body.step)}`
          : ex.body?.error === "not_your_bank"
            ? "Sản phẩm không thuộc ngân hàng của bạn"
            : "Không lưu được, thử lại"
      );
    }
  };

  return (
    <div className="wrap">
      <div className="eyebrow">{bank || "Ngân hàng"}</div>
      <h1 className="page">Ưu đãi của tôi</h1>
      <p className="page-sub">
        Mức bạn trả cho Bonia khi khách mở thẻ thành công. Khách nhận 50% — ưu đãi cao nhất tại {bank || "ngân hàng"} được
        hiển thị cho khách và nhận cuộc kết nối.
      </p>

      <div className="deal-grid" style={{ marginTop: 22 }}>
        {products.length === 0 && (
          <div className="empty">
            Chưa có sản phẩm thẻ nào của {bank || "ngân hàng bạn"} trên Bonia. Liên hệ Bonia để thêm.
          </div>
        )}
        {products.map((p) => {
          const leading = p.my_offer_vnd != null && p.mine_is_top;
          const gap = p.best_offer_vnd != null && p.my_offer_vnd != null
            ? p.best_offer_vnd - p.my_offer_vnd
            : null;
          return (
            <div className={`card ${p.my_offer_vnd == null ? "" : leading ? "winning" : "outbid"}`} key={p.product_id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-.01em" }}>{p.name}</span>
                {p.my_offer_vnd != null && (
                  <span className={`chip ${leading ? "green" : "amber"}`}>
                    {leading ? "Đang cao nhất" : "Đang thấp hơn"}
                  </span>
                )}
              </div>

              <div className="ladder" style={{ marginTop: 12 }}>
                <div className="ladder-head">
                  <span className="ladder-title">Ưu đãi tại {bank}</span>
                  <span className="ladder-rank">{p.offer_count} người đang chào</span>
                </div>
                <div className="ladder-row">
                  <span className="amt">Cao nhất</span>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {p.best_offer_vnd ? vnd(p.best_offer_vnd) : "Chưa có"}
                  </span>
                </div>
                <div className={`ladder-row ${p.my_offer_vnd != null ? "me" : ""}`}>
                  <span className="amt">Của bạn</span>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {p.my_offer_vnd != null ? vnd(p.my_offer_vnd) : "Chưa chào"}
                  </span>
                </div>
                <div className="ladder-row">
                  <span className="amt" style={{ color: "var(--ink-45)" }}>Khách nhận</span>
                  <span className="mono" style={{ color: "var(--green-text-alt)" }}>
                    {p.best_offer_vnd ? vnd(Math.floor(p.best_offer_vnd / 2)) : "—"}
                  </span>
                </div>
              </div>

              {!p.listed && (
                <div className="callout lose">
                  Chưa hiển thị với khách — cần tối thiểu {vnd(p.floor_vnd)}.
                </div>
              )}
              {p.listed && p.my_offer_vnd != null && !leading && gap != null && (
                <div className="callout lose">Cần thêm {vnd(gap + BID_STEP)} để nhận kết nối tại sản phẩm này.</div>
              )}
              {p.listed && leading && (
                <div className="callout win">Bạn đang nhận kết nối cho sản phẩm này.</div>
              )}

              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
                <Stepper
                  value={draftFor(p)}
                  min={p.floor_vnd}
                  onChange={(fn) => setDrafts((d) => ({ ...d, [p.product_id]: fn(d[p.product_id] ?? draftFor(p)) }))}
                />
                <button className={`btn ${leading ? "btn-ink" : "btn-primary"}`} onClick={() => submit(p)}>
                  {p.my_offer_vnd == null ? "Đặt ưu đãi" : "Nâng ưu đãi"}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-35)", marginTop: 8 }}>
                Chỉ trả khi khách mở thẻ thành công · mỗi bước {vnd(BID_STEP)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══ Screen 2 — Pipeline ═════════════════════════════════════ */
function Pipeline({ leads, onCall, refresh, showToast }) {
  const [filter, setFilter] = useState("all");
  const [selId, setSelId] = useState(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [notes, setNotes] = useState({});
  const [payFor, setPayFor] = useState(null);
  const noteTimers = useRef({});

  const shown = leads.filter((l) => STAGE_FILTERS.find((f) => f.key === filter).match(l.state));
  const sel = leads.find((l) => l.lead_id === selId) || shown[0] || null;

  const counts = Object.fromEntries(
    STAGE_FILTERS.map((f) => [f.key, leads.filter((l) => f.match(l.state)).length])
  );

  const setStage = async (lead, state) => {
    try {
      await api.disposition(lead.lead_id, state, notes[lead.lead_id]);
      showToast("Đã cập nhật trạng thái");
      refresh();
    } catch {
      showToast("Không cập nhật được");
    }
  };

  const saveNote = (lead, text) => {
    setNotes((n) => ({ ...n, [lead.lead_id]: text }));
    clearTimeout(noteTimers.current[lead.lead_id]);
    noteTimers.current[lead.lead_id] = setTimeout(() => {
      api.disposition(lead.lead_id, lead.state, text).catch(() => {});
    }, 600);
  };

  const openPayment = async (lead) => {
    try {
      const p = await api.claimPayment(lead.claim.id);
      setPayFor({ lead, payment: p });
    } catch {
      showToast("Không mở được thông tin thanh toán");
    }
  };

  return (
    <div className="wrap-pipeline">
      <h1 className="page">Pipeline</h1>
      <p className="page-sub">{leads.length} khách hàng · Bonia ghi nhận mọi cuộc gọi</p>

      <div className="filters" style={{ marginTop: 18 }}>
        {STAGE_FILTERS.map((f) => (
          <button key={f.key} className={`filter ${filter === f.key ? "active" : ""}`} onClick={() => setFilter(f.key)}>
            {f.label}<span className="n">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className="empty" style={{ marginTop: 14 }}>
          Chưa có khách hàng nào. Bid ở mục Nhu cầu mới để được kết nối.
        </div>
      ) : (
        <div className="pipe" style={{ marginTop: 6 }}>
          <div className="pipe-list" style={{ display: mobileDetail ? "none" : "flex" }}>
            {shown.map((l) => (
              <button
                key={l.lead_id}
                className={`lead-btn ${sel?.lead_id === l.lead_id ? "sel" : ""}`}
                onClick={() => { setSelId(l.lead_id); setMobileDetail(true); }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{l.first_name}</span>
                  <span className="mono" style={{ fontSize: 12.5, color: "var(--ink-55)" }}>{vnd(l.fee_vnd)}</span>
                </div>
                {l.note && <div style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ink-45)", margin: "6px 0" }}>{l.note}</div>}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <StageChip state={l.state} />
                  <span style={{ fontSize: 11.5, color: "var(--ink-35)" }}>
                    {l.call_attempts ? `${l.call_attempts} cuộc gọi` : "chưa gọi"}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {sel && (
            <div className="pipe-detail" style={{ display: mobileDetail || window.innerWidth >= 1080 ? "block" : "none" }}>
              <button
                className="btn-ghost"
                style={{ border: "none", padding: "0 0 12px", fontSize: 13, color: "var(--ink-55)", display: mobileDetail ? "block" : "none" }}
                onClick={() => setMobileDetail(false)}
              >
                ← Danh sách
              </button>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ maxWidth: 440 }}>
                  <h2 style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-.015em" }}>{sel.first_name}</h2>
                  {sel.note && <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-55)", marginTop: 6 }}>{sel.note}</p>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10.5, color: "var(--ink-45)" }}>Phí khi thành công</div>
                  <div className="mono" style={{ fontSize: 20, fontWeight: 600 }}>{vnd(sel.fee_vnd)}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "14px 0" }}>
                <StageChip state={sel.state} />
                {sel.preferred_window && <span className="chip">{sel.preferred_window}</span>}
                {sel.sla && <span className="chip amber">{sel.sla}</span>}
                <span className="chip green">Số điện thoại được bảo mật</span>
              </div>

              {sel.claim && (
                <div style={{ borderRadius: 14, padding: "15px 16px", border: "1px solid var(--green-border)", background: sel.claim.state === "settled" || sel.claim.state === "paid" ? "var(--green-tint-faint)" : "var(--green-tint-soft)", marginBottom: 16 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                    {sel.claim.state === "pending_rm" ? "Khách hàng báo đã được duyệt" : "Hồ sơ đã duyệt"}
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--ink-55)", margin: "6px 0 12px" }}>
                    {sel.claim.state === "pending_rm"
                      ? "Xác nhận nếu đúng. Bạn thanh toán mức phí đã đặt, khách hàng nhận lại 50%."
                      : `Phí ${vnd(sel.claim.feeVnd)} · khách hàng nhận ${vnd(sel.claim.userShareVnd)}`}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {sel.claim.state === "pending_rm" && (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={async () => {
                          try { await api.confirmApproval(sel.lead_id); showToast("Đã xác nhận"); refresh(); }
                          catch { showToast("Không xác nhận được"); }
                        }}>Xác nhận đã duyệt</button>
                        <button className="btn btn-ghost btn-sm" onClick={async () => {
                          const reason = prompt("Lý do từ chối (bắt buộc):");
                          if (!reason || reason.trim().length < 5) return;
                          try { await api.denyApproval(sel.lead_id, reason); showToast("Đã từ chối"); refresh(); }
                          catch { showToast("Không gửi được"); }
                        }}>Từ chối</button>
                      </>
                    )}
                    {["invoiced", "paid", "settled"].includes(sel.claim.state) && (
                      <button className="btn btn-primary btn-sm" onClick={() => openPayment(sel)}>
                        {sel.claim.state === "invoiced" ? `Thanh toán ${vnd(sel.claim.feeVnd)}` : "Xem hoá đơn"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                <button className="btn btn-primary btn-call" onClick={() => onCall(sel)} disabled={sel.call_in_progress}>
                  {sel.call_attempts ? "Gọi lại qua Bonia" : "Gọi qua Bonia"}
                </button>
                <button className="btn btn-ghost" onClick={() => setStage(sel, "da_nop_ho_so")}>Đã nộp hồ sơ</button>
                <button className="btn btn-ghost" onClick={() => setStage(sel, "that_bai")}>Thất bại</button>
              </div>

              <div className="two-col">
                <div>
                  <div className="mono-eyebrow">Cuộc gọi · Bonia ghi lại</div>
                  {(!sel.call_history || sel.call_history.length === 0) && (
                    <div className="empty">Chưa có cuộc gọi. Sau cuộc gọi đầu tiên, ghi nhận sẽ hiện ở đây.</div>
                  )}
                  <div className="stack">
                    {(sel.call_history || []).map((h, i) => (
                      <div className="call-card" key={i}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="dot" style={{ background: h.detail?.outcome === "answered" ? "var(--green)" : h.detail?.outcome === "forwarded_no_answer" ? "var(--amber-accent)" : "var(--ink-15)" }} />
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{outcomeLabel(h)}</span>
                          <span className="mono" style={{ fontSize: 11, color: "var(--ink-35)", marginLeft: "auto" }}>
                            {new Date(h.createdAt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                          </span>
                        </div>
                        {h.detail?.answered_sec > 0 && (
                          <div style={{ fontSize: 12.5, color: "var(--ink-70)", marginTop: 6 }}>
                            Nói chuyện {Math.floor(h.detail.answered_sec / 60)}ph{String(h.detail.answered_sec % 60).padStart(2, "0")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-25)", marginTop: 10 }}>
                    Bonia không lưu ghi âm cuộc gọi.
                  </div>
                </div>

                <div>
                  <div className="mono-eyebrow">Ghi chú của bạn</div>
                  <textarea
                    className="notes-area"
                    value={notes[sel.lead_id] ?? sel.rm_notes ?? ""}
                    onChange={(e) => saveNote(sel, e.target.value)}
                    placeholder="Ghi chú riêng về khách này…"
                  />
                  <div style={{ fontSize: 11, color: "var(--ink-25)", marginTop: 6 }}>Chỉ bạn nhìn thấy · tự lưu</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {payFor && <PaymentModal lead={payFor.lead} payment={payFor.payment} onClose={() => setPayFor(null)} />}
    </div>
  );
}

function StageChip({ state }) {
  const label = STAGE_LABEL[state] || state;
  const cls = label === "Cần gọi" ? "blue" : label === "Đang tư vấn" ? "green" : label === "Thành công" ? "solid" : "grey";
  return <span className={`chip ${cls}`}>{label}</span>;
}

function outcomeLabel(h) {
  const o = h.detail?.outcome;
  if (o === "answered") return "Đã tư vấn";
  if (o === "forwarded_no_answer") return "Khách không nghe máy";
  if (o === "no_answer") return "Không bắt máy";
  if (o === "rm_abandoned") return "Bạn đã huỷ";
  if (o === "denied") return "Không gọi được";
  return h.event === "call_attempt" ? "Đã gọi" : "Cuộc gọi";
}

/* ══ Screen 3 — Tài khoản ════════════════════════════════════ */
function Account({ me, onSignOut, showToast }) {
  if (!me) return null;
  const pct = Math.min(100, Math.round((me.budget.committedVnd / me.budget.capVnd) * 100));
  return (
    <div className="wrap-account">
      <h1 className="page">Tài khoản</h1>
      <div className="stack" style={{ marginTop: 18, gap: 14 }}>
        <div className="card" style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div className="avatar" style={{ width: 52, height: 52, fontSize: 17 }}>
            {me.profile.displayName.trim().slice(-1).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{me.profile.displayName}</div>
            <div style={{ fontSize: 13, color: "var(--ink-55)" }}>{me.profile.bank} · Thẻ tín dụng</div>
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Ngân sách phí mỗi tháng</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--ink-55)", marginBottom: 14 }}>
            Bonia nhắc khi tổng phí đã cam kết chạm hạn mức. Bạn vẫn bid được — đây là cảnh báo, không phải giới hạn cứng.
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-45)" }}>Đã cam kết tháng này</div>
          <div className="mono" style={{ fontSize: 17, fontWeight: 600, margin: "4px 0 8px" }}>
            {vnd(me.budget.committedVnd)} <span style={{ color: "var(--ink-35)", fontSize: 13 }}>/ {vnd(me.budget.capVnd)}</span>
          </div>
          <div className="budget-track" style={{ height: 10, borderRadius: 6 }}>
            <div className={`budget-fill ${pct > 85 ? "over" : ""}`} style={{ width: `${pct}%` }} />
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-45)", marginTop: 8 }}>
            {pct > 85 ? "Sắp chạm hạn mức — cân nhắc trước khi bid thêm." : `Còn ${vnd(me.budget.capVnd - me.budget.committedVnd)} trong hạn mức tháng này.`}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Nhận thêm khách hàng</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--ink-55)", marginBottom: 12 }}>
            Cho Bonia biết khi bạn muốn nhận thêm khách hàng trong khu vực của bạn.
          </div>
          <button className="btn btn-ghost" onClick={async () => {
            try { await api.requestLeads(); showToast("Đã gửi yêu cầu tới Bonia"); }
            catch { showToast("Không gửi được"); }
          }}>Yêu cầu thêm khách hàng</button>
        </div>

        <button className="btn btn-ghost btn-block" style={{ height: 46, borderRadius: 12 }} onClick={onSignOut}>
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
