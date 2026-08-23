import React, { useEffect, useMemo, useRef, useState } from "react";
import { api, vnd } from "./api.js";
import { PaymentModal } from "./components.jsx";

// Pipeline v2 (§3) — segmented lanes over a master-detail split.
// The thread is ONE chronology (calls + messages); the stepper is the
// close control; disposition after every call is the lane machine.

const LANES = [
  { key: "contact", label: "Cần liên hệ", states: ["moi", "da_goi"] },
  { key: "active", label: "Đang tư vấn", states: ["dang_tu_van", "hen_goi_lai", "da_nop_ho_so"] },
  { key: "done", label: "Kết quả", states: ["duoc_duyet", "that_bai", "cancelled"] },
];

const LOST_REASONS = [
  { key: "khong_lien_lac", label: "Không liên lạc được" },
  { key: "tu_choi", label: "Khách từ chối" },
  { key: "khong_du_dieu_kien", label: "Không đủ điều kiện" },
];

function laneOf(lead) {
  return LANES.find((l) => l.states.includes(lead.state))?.key || "contact";
}

function hoursLeft(iso) {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - Date.now()) / 3600000);
}

function ago(iso) {
  if (!iso) return "";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 2) return "vừa xong";
  if (m < 60) return `${m} phút trước`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.round(h / 24)} ngày trước`;
}

// Trap §10a: a lost lead has no final card — always resolve to a name.
function cardName(lead, cardId, myCards) {
  if (!cardId) return lead.card?.name || "thẻ đã tư vấn";
  return myCards.find((c) => c.card_id === cardId)?.name || lead.card?.name || "thẻ đã tư vấn";
}

function rowMeta(lead) {
  if (laneOf(lead) === "contact") {
    const left = hoursLeft(lead.contact_due_at);
    const base = `nhận ${ago(lead.assigned_at)}`;
    if (lead.state === "da_goi" && lead.last_activity?.kind === "call") {
      return `Gọi không kết nối · ${ago(lead.last_activity.at)}${left != null ? ` · thử lại trong ${Math.max(0, left)} giờ` : ""}`;
    }
    return left != null ? `${base} · phải liên hệ trong ${Math.max(0, left)} giờ` : base;
  }
  if (laneOf(lead) === "active") {
    return lead.last_activity ? `${lead.last_activity.label} · ${ago(lead.last_activity.at)}` : `nhận ${ago(lead.assigned_at)}`;
  }
  return null;
}

function outcomeChip(lead, myCards) {
  const o = lead.outcome;
  if (!o) return null;
  if (o.kind === "reconciling") return { text: "Đang đối soát", cls: "amber", meta: `Bạn chọn ${cardName(lead, o.final_card_id, myCards)} · khách chọn thẻ khác` };
  if (o.kind === "won") return { text: "Chờ khách xác nhận", cls: "navy", meta: `Đã mở ${cardName(lead, o.final_card_id, myCards)}` };
  return { text: "Không thành công", cls: "grey", meta: `${LOST_REASONS.find((r) => r.key === o.reason)?.label || "Đã đóng"} · đã hoàn phần giữ` };
}

const rowScrim =
  "linear-gradient(90deg, rgba(8,10,26,.97) 0%, rgba(8,10,26,.9) 34%, rgba(8,10,26,.52) 74%, rgba(8,10,26,.3) 100%)";
const bannerScrim =
  "linear-gradient(90deg, rgba(8,10,26,.98) 0%, rgba(8,10,26,.95) 46%, rgba(8,10,26,.55) 78%, rgba(8,10,26,.32) 100%)";

function artBackground(lead) {
  const url = lead.card?.image_url;
  return url
    ? `url(${url}) center/cover`
    : "linear-gradient(135deg, #1B1B22 0%, #08080C 100%)";
}

export default function Pipeline2({
  leads,
  myCards,
  onCall,
  refresh,
  showToast,
  dispositionFor,
  clearDisposition,
}) {
  const [lane, setLane] = useState("contact");
  const [selectedId, setSelectedId] = useState(null);
  const [feed, setFeed] = useState([]); // merged chronology for selected
  const [drafts, setDrafts] = useState({}); // per-lead composer drafts
  const [sending, setSending] = useState(false);
  const [outcomeModal, setOutcomeModal] = useState(null); // 'won'|'lost'
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const threadRef = useRef(null);
  const contentRef = useRef(null);
  const [narrow, setNarrow] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);

  // §3: branch on the CONTENT container, never window.innerWidth.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < 900));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const laneLeads = useMemo(() => {
    const list = leads.filter((l) => laneOf(l) === lane);
    if (lane === "contact") {
      return [...list].sort((a, b) => (new Date(a.contact_due_at || 0)) - (new Date(b.contact_due_at || 0)));
    }
    if (lane === "active") {
      return [...list].sort((a, b) => new Date(b.last_activity?.at || b.assigned_at) - new Date(a.last_activity?.at || a.assigned_at));
    }
    return [...list].sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at));
  }, [leads, lane]);

  // A lane always has a selection (§3).
  const selected = laneLeads.find((l) => l.lead_id === selectedId) || laneLeads[0] || null;
  const laneMemberIds = laneLeads.map((l) => l.lead_id).join(",");
  useEffect(() => {
    if (selected && selected.lead_id !== selectedId) setSelectedId(selected.lead_id);
  }, [lane, laneMemberIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Merge messages + call records into one chronology.
  const callHistoryLen = (selected?.call_history || []).length;
  useEffect(() => {
    let dead = false;
    setFeed([]);
    if (!selected) return;
    (async () => {
      try {
        const res = await api.messages(selected.lead_id);
        if (dead) return;
        const msgs = (res.messages || []).map((m) => ({ kind: "msg", ...m }));
        const calls = (selected.call_history || [])
          .filter((e) => e.event === "call_result")
          .map((e) => ({
            kind: "call",
            at: e.createdAt || e.created_at,
            connected: (e.detail || {}).outcome === "answered",
            sec: (e.detail || {}).answered_sec || 0,
          }));
        setFeed([...msgs, ...calls].sort((a, b) => new Date(a.at) - new Date(b.at)));
        refresh(); // unread just cleared server-side
      } catch { /* ignore */ }
    })();
    return () => { dead = true; };
  }, [selected?.lead_id, callHistoryLen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setNote(selected?.rm_notes || ""); setNoteOpen(false); }, [selected?.lead_id]);

  // §6: pin the thread to its newest entry.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [selected?.lead_id, feed.length]);

  const send = async () => {
    const leadId = selected?.lead_id;
    const text = (drafts[leadId] || "").trim();
    if (!text || !leadId || sending) return;
    setSending(true);
    try {
      const res = await api.sendMessage(leadId, text);
      // Guard: only append if the same lead is still open.
      setFeed((f) => (selectedId === leadId || selected?.lead_id === leadId ? [...f, { kind: "msg", ...res.message }] : f));
      setDrafts((d) => ({ ...d, [leadId]: "" }));
      if (res.message.contains_contact_info) {
        showToast("Tin đã gửi — lưu ý: trao đổi ngoài Bonia không được bảo vệ");
      }
    } catch {
      showToast("Không gửi được tin nhắn, thử lại");
    } finally {
      setSending(false);
    }
  };

  const heldTotal = leads.filter((l) => !l.outcome).reduce((n, l) => n + (l.hold_vnd || 0), 0);
  const openCount = leads.filter((l) => laneOf(l) !== "done").length;

  const showDetail = !narrow || mobileDetail;
  const showList = !narrow || !mobileDetail;

  return (
    <div className="wrap" style={{ maxWidth: 1000 }} ref={contentRef}>
      <h1 className="page">Pipeline</h1>
      <p className="page-sub">
        {openCount} lead đang xử lý{heldTotal > 0 ? <> · giữ <b className="mono">{vnd(heldTotal)}</b> trong số dư</> : null}
      </p>

      <div className="pl-lanes">
        {LANES.map((l) => {
          const n = leads.filter((x) => laneOf(x) === l.key).length;
          return (
            <button key={l.key} className={`pl-lane ${lane === l.key ? "on" : ""}`}
              onClick={() => { setLane(l.key); setMobileDetail(false); }}>
              {l.label} <span className="pl-lane-count mono">{n}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginTop: 14 }}>
        {showList && (
          <div style={{ width: narrow ? "100%" : 320, flex: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {laneLeads.length === 0 && (
              <div className="pl-empty-lane">
                {lane === "contact" ? "Chưa có lead mới. Lead đến khi bạn giữ hạng 1 của một loại thẻ."
                  : lane === "active" ? "Chưa có khách đang tư vấn — gọi một lead ở Cần liên hệ."
                    : "Chưa có kết quả nào."}
              </div>
            )}
            {laneLeads.map((lead) => {
              const sel = selected?.lead_id === lead.lead_id;
              const urgent = lane === "contact" && hoursLeft(lead.contact_due_at) != null && hoursLeft(lead.contact_due_at) <= 6;
              const chip = outcomeChip(lead, myCards);
              return (
                <button key={lead.lead_id}
                  className={`pl-row ${sel ? "sel" : urgent ? "urgent" : ""}`}
                  style={{ background: artBackground(lead) }}
                  onClick={() => { setSelectedId(lead.lead_id); setMobileDetail(true); }}>
                  <span className="pl-row-scrim" style={{ background: rowScrim }} />
                  <span className="pl-row-body">
                    <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
                        {lead.first_name}{lead.city ? ` · ${lead.city}` : ""}
                      </span>
                      {lead.unread_count > 0 && <span className="pl-unread mono">{lead.unread_count}</span>}
                    </span>
                    <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.82)" }}>{lead.card?.name || "Thẻ tín dụng"}</span>
                    {rowMeta(lead) && <span style={{ fontSize: 11, color: "rgba(255,255,255,.66)" }}>{rowMeta(lead)}</span>}
                    {chip?.meta && <span style={{ fontSize: 11, color: "rgba(255,255,255,.66)" }}>{chip.meta}</span>}
                    {urgent && !chip && <span className="bid-chip amber" style={{ alignSelf: "flex-start" }}>Sắp hết hạn liên hệ</span>}
                    {chip && <span className={`bid-chip ${chip.cls === "grey" ? "" : chip.cls}`} style={{ alignSelf: "flex-start", ...(chip.cls === "grey" ? { background: "#F7F9FC", color: "#5A6378" } : {}) }}>{chip.text}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {showDetail && selected && (
          <DetailPane
            lead={selected}
            myCards={myCards}
            feed={feed}
            threadRef={threadRef}
            draft={drafts[selected.lead_id] || ""}
            setDraft={(v) => setDrafts((d) => ({ ...d, [selected.lead_id]: typeof v === "function" ? v(d[selected.lead_id] || "") : v }))}
            send={send}
            sending={sending}
            note={note}
            setNote={setNote}
            noteOpen={noteOpen}
            setNoteOpen={setNoteOpen}
            narrow={narrow}
            onBack={() => setMobileDetail(false)}
            onCall={() => onCall(selected)}
            onOpenOutcome={(kind) => setOutcomeModal(kind)}
            refresh={refresh}
            showToast={showToast}
          />
        )}
        {showDetail && !selected && (
          <div className="card" style={{ flex: 1, textAlign: "center", color: "var(--ink-45)", padding: 40 }}>
            Chưa có lead trong nhóm này.
          </div>
        )}
      </div>

      {outcomeModal === "won" && selected && (
        <WonModal lead={selected} myCards={myCards}
          onClose={() => setOutcomeModal(null)}
          onDone={() => { setOutcomeModal(null); refresh(); }}
          showToast={showToast} />
      )}
      {outcomeModal === "lost" && selected && (
        <LostModal lead={selected}
          onClose={() => setOutcomeModal(null)}
          onDone={() => { setOutcomeModal(null); refresh(); }}
          showToast={showToast} />
      )}

      {dispositionFor && (
        <DispositionSheet
          lead={leads.find((l) => l.lead_id === dispositionFor.leadId) || null}
          seconds={dispositionFor.seconds}
          onMissingLead={clearDisposition}
          onSaved={(state, label) => {
            // §3.0: the saved call appears in the thread immediately.
            if (selected?.lead_id === dispositionFor.leadId) {
              setFeed((f) => [...f, {
                kind: "call",
                at: new Date().toISOString(),
                connected: state !== "da_goi",
                sec: dispositionFor.seconds || 0,
              }]);
            }
            clearDisposition();
            refresh();
            showToast(`Đã lưu · ${label} · ${state === "da_goi" ? "lead vẫn ở Cần liên hệ" : "lead chuyển sang Đang tư vấn"}`);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ── Detail pane (§3.2) ──────────────────────────────────────────────
function DetailPane({
  lead, myCards, feed, threadRef, draft, setDraft, send, sending,
  note, setNote, noteOpen, setNoteOpen, narrow, onBack, onCall,
  onOpenOutcome, refresh, showToast,
}) {
  const o = lead.outcome;
  const [invoice, setInvoice] = useState(null); // PaymentModal payload
  const called = lead.call_attempts > 0 || ["dang_tu_van", "hen_goi_lai", "da_nop_ho_so"].includes(lead.state);
  // Exclusive bound (§3.2): count of COMPLETED phases.
  const completed = o ? (called ? 2 : 1) : called ? 1 : 0;
  const current = o ? 2 : completed; // node index that is "current"
  const chip = outcomeChip(lead, myCards);

  const saveNote = async () => {
    try {
      await api.disposition(lead.lead_id, lead.state, note);
      showToast("Đã lưu ghi chú");
      setNoteOpen(false);
      refresh();
    } catch {
      showToast("Không lưu được ghi chú");
    }
  };

  const nodeLabel = (i) => ["Chờ tư vấn", "Đã tư vấn", "Đã nhận thẻ"][i];

  return (
    <div className="card" style={{ flex: 1, minWidth: 0, padding: "18px 20px" }}>
      {narrow && <button className="bid-backlink" onClick={onBack}>← Danh sách</button>}

      {/* banner */}
      <div className="pl-banner" style={{ background: artBackground(lead) }}>
        <span className="pl-row-scrim" style={{ background: bannerScrim, borderRadius: 15 }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 19, fontWeight: 600, color: "#fff" }}>
              {lead.first_name}{lead.city ? ` · ${lead.city}` : ""}
            </span>
            <span className="pl-banner-chip">
              {chip ? chip.text : laneOf(lead) === "contact" ? "Cần liên hệ" : "Đang tư vấn"}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.8)", marginTop: 4 }}>
            Đã bấm <b>{lead.card?.name || "Thẻ tín dụng"}</b> · bid {vnd(lead.fee_vnd)}
          </div>
        </div>
      </div>

      {/* stepper — also the close control */}
      <div className="pl-stepper">
        {[0, 1, 2].map((i) => {
          const isLostNode = i === 2 && o?.kind === "lost";
          const done = i < completed && !isLostNode;
          const isCurrent = i === current && !o;
          const closedNode = i === 2 && o;
          return (
            <React.Fragment key={i}>
              {i > 0 && <span className={`pl-step-track ${i <= completed ? "done" : ""}`} />}
              <div className="pl-step">
                {i === 2 && !o ? (
                  <button className="pl-node close" onClick={() => onOpenOutcome("won")} aria-label="Đã nhận thẻ" />
                ) : (
                  <span className={`pl-node ${isLostNode ? "lost" : done || (closedNode && o.kind !== "lost") ? "done" : isCurrent ? "current" : ""}`}>
                    {(done || (closedNode && o.kind !== "lost")) ? "✓" : ""}
                  </span>
                )}
                {i === 2 && !o ? (
                  <span className="pl-step-label">
                    <button className="pl-close-won" onClick={() => onOpenOutcome("won")}>Đã nhận thẻ</button>
                    <span style={{ color: "var(--ink-25, #A2A9B8)" }}> / </span>
                    <button className="pl-close-lost" onClick={() => onOpenOutcome("lost")}>Không thành công</button>
                  </span>
                ) : (
                  <span className={`pl-step-label ${isLostNode ? "lost" : done || isCurrent || closedNode ? "" : "future"}`}>
                    {isLostNode ? "Deal thất bại" : nodeLabel(i)}
                  </span>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div className="bid-micro" style={{ marginBottom: 12 }}>
        {o?.kind === "lost"
          ? "Khách hàng thấy giao dịch này đã dừng."
          : `Khách hàng đang thấy bước “${nodeLabel(current)}” trong app.`}
      </div>

      {/* action row */}
      {!o && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <button className="pl-call" onClick={onCall}>
            {called ? "Gọi lại qua Bonia" : "Gọi qua Bonia"}
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ textAlign: "right" }}>
            <div className="bid-micro">Phí nếu duyệt · đang giữ</div>
            <div className="mono" style={{ fontSize: 13.5, fontWeight: 600 }}>
              {vnd(lead.fee_vnd)} · {vnd(lead.hold_vnd || 0)}
            </div>
          </div>
        </div>
      )}

      {/* closed-state panel */}
      {o && (
        <div className={`bid-banner ${o.kind === "won" ? "" : o.kind === "reconciling" ? "amber" : ""}`}
          style={o.kind === "won" ? { background: "#ECEEF8", border: "1px solid #D9DEF2", color: "#2A2F6B", marginBottom: 12 }
            : o.kind === "lost" ? { background: "#F7F9FC", border: "1px solid #E4E8F0", color: "#5A6378", marginBottom: 12 }
              : { marginBottom: 12 }}>
          {o.kind === "won" && (
            <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ flex: 1 }}>
                {lead.claim && ["invoiced", "paid", "settled"].includes(lead.claim.state)
                  ? <>Hoá đơn {vnd(o.invoice?.due_vnd ?? 0)} (đã trừ phần giữ {vnd(o.invoice?.held_vnd ?? 0)}).</>
                  : <>Khách xác nhận cùng thẻ này trong app → Bonia gửi hoá đơn {vnd(o.invoice?.due_vnd ?? 0)} (đã trừ phần giữ {vnd(o.invoice?.held_vnd ?? 0)}).</>}
              </span>
              {lead.claim && ["invoiced", "paid", "settled"].includes(lead.claim.state) && (
                <button className="bid-link-btn" onClick={async () => {
                  try {
                    const pay = await api.claimPayment(lead.claim.id);
                    setInvoice(pay);
                  } catch {
                    showToast("Không tải được hoá đơn");
                  }
                }}>
                  Xem hoá đơn
                </button>
              )}
            </span>
          )}
          {o.kind === "reconciling" && (
            <>Hai bên chọn thẻ khác nhau — Bonia liên hệ cả hai để đối soát. Phần giữ vẫn được giữ trong lúc đối soát.</>
          )}
          {o.kind === "lost" && (
            <>{LOST_REASONS.find((r) => r.key === o.reason)?.label || "Đã đóng"} · phần giữ đã hoàn vào số dư khả dụng.</>
          )}
        </div>
      )}

      {invoice && (
        <PaymentModal lead={lead} payment={invoice} onClose={() => setInvoice(null)} />
      )}

      {/* notes — collapsed dashed row (closed leads: read-only) */}
      {o ? (
        note ? <div className="pl-note-row" style={{ cursor: "default" }}><span>{note.split("\n")[0]}</span></div> : null
      ) : !noteOpen ? (
        <button className="pl-note-row" onClick={() => setNoteOpen(true)}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {note ? note.split("\n")[0] : "Ghi chú riêng của bạn về khách này"}
          </span>
          <span style={{ color: "var(--navy)", fontWeight: 600, flex: "none" }}>Ghi chú</span>
        </button>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <textarea className="input" style={{ height: 74, padding: 10 }} value={note} onChange={(e) => setNote(e.target.value)} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="bid-draft-btn" onClick={() => setNoteOpen(false)}>Đóng</button>
            <button className="bid-link-btn" onClick={saveNote}>Lưu</button>
          </div>
        </div>
      )}

      {/* thread */}
      <div className="eyebrow mono" style={{ marginBottom: 6 }}>
        TRAO ĐỔI VỚI KHÁCH {feed.length === 0 && <span style={{ color: "var(--ink-35)", letterSpacing: 0, textTransform: "none" }}> chưa có gì</span>}
      </div>
      <div className="pl-thread" ref={threadRef}>
        {feed.length === 0 && (
          <div className="pl-thread-empty">
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Chưa trao đổi gì với khách này</div>
            <div style={{ fontSize: 12, color: "var(--ink-45)", marginTop: 4, lineHeight: 1.5 }}>
              Gọi qua Bonia để bắt đầu. Cuộc gọi và tin nhắn sau đó nằm cùng một chỗ, ngay ở đây.
            </div>
          </div>
        )}
        {feed.map((item, i) =>
          item.kind === "call" ? (
            <CallRecord key={`c${i}`} item={item} />
          ) : (
            <div key={item.message_id || i} style={{ display: "flex", flexDirection: "column", alignItems: item.from === "rm" ? "flex-end" : "flex-start" }}>
              <div className={`pl-bubble ${item.from === "rm" ? "mine" : ""}`}>{item.text}</div>
              <span className="mono" style={{ fontSize: 10, color: "var(--ink-35)", margin: "2px 4px" }}>
                {new Date(item.at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </span>
              {item.contains_contact_info && (
                <div className="pl-leak">Trao đổi ngoài Bonia không được bảo mật số điện thoại và không được Bonia bảo vệ.</div>
              )}
            </div>
          )
        )}
      </div>

      {/* composer */}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <textarea
          className="input"
          style={{ flex: 1, minHeight: 44, maxHeight: 110, padding: "11px 13px", resize: "none", marginBottom: 0 }}
          placeholder="Nhắn tiếp cho khách hàng…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button className="btn-navy" style={{ height: 44, alignSelf: "flex-end", opacity: draft.trim() ? 1 : 0.45 }}
          disabled={!draft.trim() || sending} onClick={send}>
          Gửi
        </button>
      </div>
    </div>
  );
}

function CallRecord({ item }) {
  const [open, setOpen] = useState(false);
  const dur = item.sec > 0 ? `${Math.floor(item.sec / 60)}:${String(item.sec % 60).padStart(2, "0")}` : null;
  return (
    <div className="pl-call-record">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: item.connected ? "var(--navy)" : "#A2A9B8", flex: "none" }} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {item.connected ? `Cuộc gọi${dur ? ` ${dur}` : ""}` : "Gọi không kết nối"}
        </span>
        <span className="bid-micro" style={{ flex: 1 }}>
          {new Date(item.at).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · qua số Bonia
        </span>
        {item.connected && (
          <button className="bid-link-btn" style={{ height: "auto", padding: 0 }} onClick={() => setOpen((x) => !x)}>
            {open ? "Ẩn" : "Nội dung"}
          </button>
        )}
      </div>
      {open && (
        <div className="bid-micro" style={{ marginTop: 6, paddingLeft: 16 }}>
          Bản ghi từng câu sẽ mở ra ở đúng chỗ này khi tính năng ghi nội dung cuộc gọi ra mắt.
        </div>
      )}
    </div>
  );
}

// ── Disposition sheet (§3.0) — no dismiss ───────────────────────────
function DispositionSheet({ lead, seconds, onSaved, onMissingLead, showToast }) {
  const [choice, setChoice] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!lead) onMissingLead?.(); }, [lead]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!lead) return null;
  const dur = seconds > 0 ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` : null;

  const OPTIONS = [
    { key: "dang_tu_van", label: "Đã tư vấn", sub: "chuyển sang Đang tư vấn", rec: true },
    { key: "hen_goi_lai", label: "Hẹn gọi lại", sub: "chuyển sang Đang tư vấn" },
    { key: "da_goi", label: "Không nghe máy", sub: "lead vẫn ở Cần liên hệ" },
  ];

  const save = async () => {
    if (!choice) return;
    setBusy(true);
    try {
      await api.disposition(lead.lead_id, choice, undefined);
      onSaved(choice, OPTIONS.find((o) => o.key === choice).label);
    } catch {
      showToast("Không lưu được, thử lại");
      setBusy(false);
    }
  };

  return (
    <div className="scrim">
      <div className="modal pay bn-up" style={{ maxWidth: 460 }}>
        <div className="eyebrow mono">CUỘC GỌI VỪA XONG{dur ? ` · ${dur}` : ""}</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "6px 0" }}>Kết quả cuộc gọi với {lead.first_name}?</h2>
        <p style={{ fontSize: 12.5, color: "var(--ink-55)", marginBottom: 12 }}>
          Đây là cách lead chuyển giữa các nhóm và là cách bạn không gọi trùng.
        </p>
        <div className="pl-summary-panel">
          <span className="pl-summary-tile">B</span>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>Cuộc gọi qua số Bonia{dur ? ` · ${dur}` : ""}</div>
            <div className="bid-micro">Chọn kết quả theo nội dung bạn vừa trao đổi.</div>
          </div>
        </div>
        {OPTIONS.map((o) => (
          <label key={o.key} className={`pl-radio ${choice === o.key ? "on" : ""}`}>
            <input type="radio" name="dispo" checked={choice === o.key} onChange={() => setChoice(o.key)} />
            <span style={{ flex: 1 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{o.label}{o.rec ? " · thường gặp nhất" : ""}</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-45)" }}>{o.sub}</span>
            </span>
          </label>
        ))}
        <button className="btn-navy" style={{ width: "100%", marginTop: 12 }} disabled={!choice || busy} onClick={save}>
          {busy ? "Đang lưu…" : "Lưu kết quả"}
        </button>
      </div>
    </div>
  );
}

// ── Final-card modal (§4) ───────────────────────────────────────────
function WonModal({ lead, myCards, onClose, onDone, showToast }) {
  const approved = myCards.filter((c) => c.status === "approved");
  const [cardId, setCardId] = useState(
    approved.some((c) => c.card_id === lead.card?.card_id)
      ? lead.card.card_id
      : approved[0]?.card_id || null
  );
  const [busy, setBusy] = useState(false);
  const chosen = approved.find((c) => c.card_id === cardId) || null;
  const fee = chosen?.my_bid_vnd ?? lead.fee_vnd;
  const held = lead.hold_vnd || 0;
  const due = Math.max(0, fee - held);
  const excess = Math.max(0, held - fee);

  const confirm = async () => {
    if (!cardId) return;
    setBusy(true);
    try {
      const res = await api.outcome(lead.lead_id, { kind: "won", final_card_id: cardId });
      showToast(res.kind === "reconciling"
        ? "Đã ghi nhận — chờ đối soát với khách"
        : "Đã ghi nhận — chờ khách xác nhận trong app");
      onDone();
    } catch (ex) {
      showToast(ex.body?.error === "final_card_required" ? "Chọn thẻ đã mở" : "Không lưu được, thử lại");
      setBusy(false);
    }
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal pay bn-up" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Khách đã mở thẻ nào?</h2>
        <p style={{ fontSize: 12.5, color: "var(--ink-55)", marginBottom: 12, lineHeight: 1.5 }}>
          Khách bấm một thẻ lúc đầu, nhưng sau khi tư vấn có thể mở thẻ khác. Chọn thẻ thực tế
          đã mở — phí thành công tính theo thẻ này.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
          {approved.length === 0 && (
            <div className="bid-micro">Bạn chưa có thẻ nào được duyệt — duyệt thẻ trong Bid của tôi trước.</div>
          )}
          {approved.map((c) => (
            <label key={c.card_id} className={`pl-radio ${cardId === c.card_id ? "on" : ""}`}>
              <input type="radio" name="finalcard" checked={cardId === c.card_id} onChange={() => setCardId(c.card_id)} />
              <span className="pl-card-thumb" style={{ background: c.image_url ? `url(${c.image_url}) center/cover` : "linear-gradient(135deg,#1B1B22,#08080C)" }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                  {c.name}
                  {c.card_id === lead.card?.card_id && <span className="pl-tapped-tag">KHÁCH ĐÃ BẤM</span>}
                </span>
                <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-45)" }}>
                  bid {vnd(c.my_bid_vnd)} · khách nhận {vnd(Math.floor(c.my_bid_vnd / 2 / 1000) * 1000)}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div className="pl-arith mono">
          <div><span>Phí thành công (thẻ đã chọn)</span><span>{vnd(fee)}</span></div>
          <div><span>Đã giữ khi nhận lead</span><span>− {vnd(Math.min(held, fee))}</span></div>
          <div className="pl-arith-total"><span>Còn phải trả</span><span>{vnd(due)}</span></div>
        </div>
        <div style={{ fontSize: 12.5, marginTop: 6 }}>
          Khách nhận <b className="mono">{vnd(Math.floor(fee / 2 / 1000) * 1000)}</b>.{" "}
          <span style={{ color: "var(--ink-55)" }}>
            {excess > 0 ? `Phần giữ dư ${vnd(excess)} được hoàn lại vào số dư.` : "Phần giữ được tính hết vào phí này."}
          </span>
        </div>
        <div className="bid-banner amber" style={{ marginTop: 10 }}>
          Khách hàng sẽ xác nhận lại cùng thẻ này trong app. Nếu hai bên chọn thẻ khác nhau,
          lead chuyển sang “Đang đối soát” và Bonia liên hệ cả hai.
        </div>
        <div style={{ display: "flex", gap: 9, marginTop: 12, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" style={{ width: "auto", padding: "0 16px" }} onClick={onClose}>Huỷ</button>
          <button className="btn-navy" disabled={!cardId || busy} onClick={confirm}>
            {busy ? "Đang lưu…" : "Xác nhận đã mở thẻ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LostModal({ lead, onClose, onDone, showToast }) {
  const [reason, setReason] = useState(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!reason) return;
    setBusy(true);
    try {
      await api.outcome(lead.lead_id, { kind: "lost", reason });
      showToast("Đã lưu trữ lead · phần giữ đã hoàn vào số dư");
      onDone();
    } catch {
      showToast("Không lưu được, thử lại");
      setBusy(false);
    }
  };
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal pay bn-up" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>Không thành công — vì sao?</h2>
        {LOST_REASONS.map((r) => (
          <label key={r.key} className={`pl-radio ${reason === r.key ? "on" : ""}`}>
            <input type="radio" name="lost" checked={reason === r.key} onChange={() => setReason(r.key)} />
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r.label}</span>
          </label>
        ))}
        {(lead.hold_vnd || 0) > 0 && (
          <div style={{ fontSize: 12.5, color: "var(--ink-55)", marginTop: 8 }}>
            Hoàn lại <b className="mono">{vnd(lead.hold_vnd)}</b> vào số dư khả dụng.
          </div>
        )}
        <div style={{ display: "flex", gap: 9, marginTop: 12, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" style={{ width: "auto", padding: "0 16px" }} onClick={onClose}>Huỷ</button>
          <button className="btn-navy" disabled={!reason || busy} onClick={save}>
            {busy ? "Đang lưu…" : "Lưu trữ lead"}
          </button>
        </div>
      </div>
    </div>
  );
}
