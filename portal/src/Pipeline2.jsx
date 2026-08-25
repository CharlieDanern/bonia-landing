import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, vnd } from "./api.js";
import { PaymentModal } from "./components.jsx";
import { promisedRewardOf } from "./bid/position.js";
import { subscribeChat } from "./stream.js";

// Pipeline v2 (§3) — segmented lanes over a master-detail split.
// The thread is ONE chronology (calls + messages); the stepper is the
// close control; disposition after every call is the lane machine.

// Safety-net poll for the OPEN thread.
//
// This is the path that has to be correct. The SSE stream (src/stream.js)
// is an accelerator layered on top of it: a message that the stream drops,
// or never carried because the stream never connected, self-heals here
// within 10s. Nothing in this file may assume the stream works.
const THREAD_POLL_MS = 10_000;

/**
 * Merge messages into the feed, deduped by message_id.
 *
 * A single message can reach this component by THREE routes — the optimistic
 * append when the rep hits Gửi, the SSE stream (the server echoes the rep's
 * own sends so a second tab stays in step), and the poll above — and must
 * render exactly once. message_id is the only identity that survives all
 * three; timestamps do not (the optimistic row and the stream row carry the
 * same server `at`, but two messages in the same second would collide).
 *
 * MERGE, NEVER REBUILD. The feed also holds `kind: "call"` rows, one of
 * which is optimistic (DispositionSheet appends a call the server has not
 * reported yet). Rebuilding the feed from a message payload would blink it
 * away for the seconds until refresh() lands.
 *
 * Returns the SAME array when nothing is new, so a poll that finds no
 * change costs no re-render and cannot jostle the thread's scroll.
 */
function mergeMessages(feed, incoming) {
  if (!incoming || incoming.length === 0) return feed;
  const seen = new Set(
    feed.filter((x) => x.kind === "msg" && x.message_id).map((x) => x.message_id)
  );
  const add = incoming.filter((m) => m && m.message_id && !seen.has(m.message_id));
  if (add.length === 0) return feed;
  return [...feed, ...add].sort((a, b) => new Date(a.at) - new Date(b.at));
}

// SSE wire shape → feed item. The stream speaks `from_rm` (boolean); the
// feed and the REST endpoints speak `from: "rm" | "customer"`. One
// translation, here, so the renderer never learns there are two shapes.
function streamToFeedMsg(ev) {
  return {
    kind: "msg",
    message_id: ev.message_id,
    from: ev.from_rm ? "rm" : "customer",
    text: ev.text,
    at: ev.at,
    contains_contact_info: !!ev.contains_contact_info,
  };
}

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

/**
 * The lead's outcome AS THE REP SHOULD SEE IT.
 *
 * GET /rm/leads returns a non-null `outcome` for ANY claim row — including
 * one the CUSTOMER declared by tapping "Tôi đã nhận thẻ", which is inserted
 * in state `pending_rm` and is waiting on THIS rep. Treating that as closed
 * hid "Gọi qua Bonia" and both close controls, so the lead went permanently
 * read-only: no call, no final card, no invoice — and the 50% hold frozen
 * with no in-product route to release or capture it. A pending_rm claim is
 * an OPEN lead; the rep closes it through /rm/leads/:id/outcome, which
 * already converges with the existing claim.
 */
function outcomeOf(lead) {
  if (!lead.outcome) return null;
  // A LOST close is terminal on the LEAD itself (state that_bai/cancelled),
  // independent of any claim row, so it must keep reading as closed even
  // while an unanswered customer claim sits in pending_rm. Without this the
  // rep who closes "Không thành công" on a lead the customer had already
  // declared watches it snap back to open, with live call and close controls
  // on a lead the server will now 409.
  if (lead.outcome.kind === "lost") return lead.outcome;
  return lead.claim?.state !== "pending_rm" ? lead.outcome : null;
}

/**
 * A lost lead's hold is NOT refunded at close. rm-pipeline.ts deliberately
 * skips releaseHoldIfAny and returns hold_pending_user_confirm — the
 * customer gets a window to object ("tôi ĐÃ mở thẻ"), and only
 * releaseStaleLostHolds frees the money after 7 days of silence. hold_vnd
 * stays > 0 until then, so it is the truth for what the rep is told.
 */
function lostHoldNote(lead) {
  const held = lead.hold_vnd || 0;
  return held > 0
    ? `phần giữ ${vnd(held)} được hoàn sau khi khách xác nhận, chậm nhất 7 ngày`
    : "phần giữ đã hoàn vào số dư khả dụng";
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
  const o = outcomeOf(lead);
  if (!o) return null;
  if (o.kind === "reconciling") return { text: "Đang đối soát", cls: "amber", meta: `Bạn chọn ${cardName(lead, o.final_card_id, myCards)} · khách chọn thẻ khác` };
  if (o.kind === "won") return { text: "Chờ khách xác nhận", cls: "navy", meta: `Đã mở ${cardName(lead, o.final_card_id, myCards)}` };
  return {
    text: "Không thành công",
    cls: "grey",
    meta: `${LOST_REASONS.find((r) => r.key === o.reason)?.label || "Đã đóng"} · ${lostHoldNote(lead)}`,
  };
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
  repName,
  onCall,
  refresh,
  showToast,
  dispositionFor,
  clearDisposition,
  focusLeadId,
  onFocusApplied,
}) {
  const [lane, setLane] = useState("contact");
  const [selectedId, setSelectedId] = useState(null);
  const [scrollToId, setScrollToId] = useState(null); // deep-link scroll target
  const [feed, setFeed] = useState([]); // merged chronology for selected
  const [drafts, setDrafts] = useState({}); // per-lead composer drafts
  const [sending, setSending] = useState(false);
  const [outcomeModal, setOutcomeModal] = useState(null); // 'won'|'lost'
  const [note, setNote] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  // Unread badges the STREAM knows about but /rm/leads has not reported yet.
  // Shape: { [leadId]: { base, ids } } — see unreadOf() for how the two
  // counts are reconciled without ever double-counting.
  const [streamUnread, setStreamUnread] = useState({});
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

  // Deep link (?lead=<uuid>): open the lead the email was about. The lead is
  // usually NOT in `leads` on the first pass — the portal is still fetching —
  // so this waits for it to arrive instead of giving up. Its own lane comes
  // from the lead's state, because a link mailed at "Cần liên hệ" is often
  // opened after the rep already called and moved it on.
  useEffect(() => {
    if (!focusLeadId) return;
    const lead = leads.find((l) => l.lead_id === focusLeadId);
    if (!lead) return; // still loading, or not this rep's lead — stay silent
    setLane(laneOf(lead));
    setSelectedId(focusLeadId);
    setMobileDetail(true); // narrow: land ON the lead, not on the list
    setScrollToId(focusLeadId);
    onFocusApplied?.();
  }, [focusLeadId, leads]); // eslint-disable-line react-hooks/exhaustive-deps

  // …and bring the row into view once the target lane has painted.
  useEffect(() => {
    if (!scrollToId) return;
    const row = contentRef.current?.querySelector(`[data-lead-id="${scrollToId}"]`);
    if (row) {
      row.scrollIntoView({ block: "center", behavior: "smooth" });
      setScrollToId(null);
    } else if (narrow) {
      // The list is unmounted behind the detail pane — put the pane itself
      // on screen instead (the page can be scrolled down from the header).
      contentRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      setScrollToId(null);
    }
  }, [scrollToId, laneMemberIds, narrow]);

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
            a_leg_uuid: (e.detail || {}).a_leg_uuid || null,
          }));
        // Rebuild from the server, then fold back anything the STREAM
        // delivered while this request was in flight: a message committed
        // after the SELECT ran but before the response landed is in neither
        // `msgs` nor the old feed, and a bare setFeed() would drop it until
        // the 10s poll noticed. mergeMessages dedupes it against `msgs`.
        setFeed((f) =>
          mergeMessages(
            [...msgs, ...calls].sort((a, b) => new Date(a.at) - new Date(b.at)),
            f.filter((x) => x.kind === "msg")
          )
        );
        refresh(); // unread just cleared server-side
      } catch { /* ignore */ }
    })();
    return () => { dead = true; };
  }, [selected?.lead_id, callHistoryLen]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ══ Live chat: stream in front, poll behind ═══════════════════════
   *
   * The stream (src/stream.js) is the accelerator; the poll below is the
   * contract. Every line in this block is written so that deleting the
   * stream entirely would leave a portal that is still CORRECT, only 10s
   * slower — which is exactly how it behaved before the stream existed.
   */

  // Read by the stream subscriber, which is registered ONCE (an empty dep
  // array) so that neither switching leads nor a 15s /rm/leads refresh
  // churns the listener set. Refs, not state, precisely because the
  // subscriber must see today's values without being re-created.
  const selectedIdRef = useRef(null);
  const leadsRef = useRef(leads);
  useEffect(() => { selectedIdRef.current = selected?.lead_id || null; }, [selected?.lead_id]);
  useEffect(() => { leadsRef.current = leads; }, [leads]);

  useEffect(() => {
    return subscribeChat((ev) => {
      if (!ev?.lead_id || !ev.message_id) return;

      // Message on the OPEN thread → straight into the feed. Deduped by
      // message_id against the optimistic send and the poll (mergeMessages).
      if (ev.lead_id === selectedIdRef.current) {
        setFeed((f) => mergeMessages(f, [streamToFeedMsg(ev)]));
        return;
      }

      // Message on some OTHER lead → bump that row's badge. No refetch: a
      // chatty customer must not cost a full /rm/leads round trip per
      // message, and the 15s refresh brings the real count along anyway.
      //
      // The rep's OWN message arriving from their other tab is not unread.
      if (ev.from_rm) return;
      // A lead missing from `leads` (routed since the last refresh) has
      // nowhere to show a badge; the next poll brings both row and count.
      const lead = leadsRef.current.find((l) => l.lead_id === ev.lead_id);
      if (!lead) return;
      setStreamUnread((u) => {
        const cur = u[ev.lead_id];
        if (cur) {
          if (cur.ids.includes(ev.message_id)) return u; // already counted
          return { ...u, [ev.lead_id]: { base: cur.base, ids: [...cur.ids, ev.message_id] } };
        }
        // `base` snapshots what the SERVER said at the moment the overlay
        // opened. Without it the two counts would add up (server count +
        // stream count) the instant a poll caught up, and a lead with one
        // unread message would show 2.
        return { ...u, [ev.lead_id]: { base: lead.unread_count || 0, ids: [ev.message_id] } };
      });
    });
  }, []);

  // Retire an overlay once the server's own count has caught up with it (or
  // the lead has left the payload). Without this, `base` would go stale and
  // pin the badge at an old number for the life of the session.
  useEffect(() => {
    setStreamUnread((u) => {
      const ids = Object.keys(u);
      if (ids.length === 0) return u;
      const next = {};
      let changed = false;
      for (const id of ids) {
        const entry = u[id];
        const lead = leads.find((l) => l.lead_id === id);
        if (!lead || (lead.unread_count || 0) >= entry.base + entry.ids.length) {
          changed = true;
          continue;
        }
        next[id] = entry;
      }
      return changed ? next : u;
    });
  }, [leads]);

  // Opening a thread reads it server-side (GET .../messages flips
  // read_by_rm), so drop the overlay immediately rather than showing a
  // badge on the row the rep is currently looking at.
  useEffect(() => {
    const id = selected?.lead_id;
    if (!id) return;
    setStreamUnread((u) => {
      if (!u[id]) return u;
      const { [id]: _gone, ...rest } = u;
      return rest;
    });
  }, [selected?.lead_id]);

  // What the row badge renders: server truth, raised by the stream overlay
  // when the stream is ahead of it. max(), not a sum — the two sources
  // describe the same messages, and only their timing differs.
  const unreadOf = useCallback(
    (lead) => {
      const server = lead.unread_count || 0;
      const entry = streamUnread[lead.lead_id];
      return entry ? Math.max(server, entry.base + entry.ids.length) : server;
    },
    [streamUnread]
  );

  // THE SAFETY NET. Re-reads the open thread every 10s, merge-only.
  //
  // This is what makes a dropped stream event a non-event: it self-heals on
  // the next tick. It also covers the cases the stream cannot reach at all —
  // a rep over the 3-tab cap (the server refuses the 4th stream with a 429),
  // a proxy that buffers text/event-stream, a backend restart, a token that
  // aged out. Kept deliberately even though the stream usually wins the race.
  useEffect(() => {
    const leadId = selected?.lead_id;
    if (!leadId) return;
    let dead = false;
    const t = setInterval(async () => {
      try {
        const res = await api.messages(leadId);
        // The rep may have moved on during the request.
        if (dead || selectedIdRef.current !== leadId) return;
        setFeed((f) => mergeMessages(f, (res.messages || []).map((m) => ({ kind: "msg", ...m }))));
      } catch {
        // A blip must leave the thread exactly as it is. Never clear.
      }
    }, THREAD_POLL_MS);
    return () => { dead = true; clearInterval(t); };
  }, [selected?.lead_id]);

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
      // Through mergeMessages, not a bare append: the server echoes this
      // rep's own send back over the stream (so their other tab keeps up),
      // so the same message_id can land here twice within milliseconds.
      setFeed((f) =>
        selectedId === leadId || selected?.lead_id === leadId
          ? mergeMessages(f, [{ kind: "msg", ...res.message }])
          : f
      );
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

  // Every lead whose hold is still standing — the server already reports
  // hold_vnd: 0 once a hold_release or fee_capture exists. Filtering on
  // !l.outcome understated the header by exactly the lost-but-not-yet-
  // released holds, i.e. it disagreed with "Đang giữ" on Tài khoản.
  const heldTotal = leads.reduce((n, l) => n + (l.hold_vnd || 0), 0);
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
              const unread = unreadOf(lead);
              return (
                <button key={lead.lead_id}
                  data-lead-id={lead.lead_id}
                  className={`pl-row ${sel ? "sel" : urgent ? "urgent" : ""}`}
                  style={{ background: artBackground(lead) }}
                  onClick={() => { setSelectedId(lead.lead_id); setMobileDetail(true); }}>
                  <span className="pl-row-scrim" style={{ background: rowScrim }} />
                  <span className="pl-row-body">
                    <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>
                        {lead.first_name}{lead.city ? ` · ${lead.city}` : ""}
                      </span>
                      {unread > 0 && <span className="pl-unread mono">{unread}</span>}
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
            repName={repName}
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
                a_leg_uuid: null, // refresh() swaps in the real event, which carries it
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
  onOpenOutcome, refresh, showToast, repName,
}) {
  const o = outcomeOf(lead);
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
            <>{LOST_REASONS.find((r) => r.key === o.reason)?.label || "Đã đóng"} · {lostHoldNote(lead)}.</>
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
            <CallRecord key={`c${i}`} item={item} leadId={lead.lead_id} repName={repName} />
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

// Contract #3 timestamps: mm:ss from start_ms.
const mmss = (ms) => {
  const s = Math.max(0, Math.floor((ms || 0) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

function CallRecord({ item, leadId, repName }) {
  const [open, setOpen] = useState(false);
  // Transcript cache, keyed by a_leg_uuid: fetched once on first expand,
  // served from state on every re-expand. Keys in the thread are index-
  // based, so a feed rebuild can hand this slot a different call — the
  // uuid check below refetches instead of showing stale turns.
  const [rec, setRec] = useState(null); // { uuid, status, turns }
  const busyRef = useRef(false);
  const uuid = item.a_leg_uuid || null;
  const dur = item.sec > 0 ? `${Math.floor(item.sec / 60)}:${String(item.sec % 60).padStart(2, "0")}` : null;

  const load = async () => {
    if (!uuid || !leadId || busyRef.current) return;
    busyRef.current = true;
    try {
      const res = await api.callTurns(leadId, uuid);
      setRec({ uuid, status: res?.status || "none", turns: res?.turns || [] });
    } catch {
      // A poll blip must not erase a cached state (e.g. pending) — only
      // surface the error row when we have nothing for this call yet.
      setRec((r) => (r && r.uuid === uuid ? r : { uuid, status: "error", turns: [] }));
    } finally {
      busyRef.current = false;
    }
  };

  // First expand fetches; the cache serves every expand after that.
  useEffect(() => {
    if (open && uuid && rec?.uuid !== uuid) load();
  }, [open, uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 10s ONLY while expanded AND the transcript is still pending.
  useEffect(() => {
    if (!(open && uuid && rec?.uuid === uuid && rec.status === "pending")) return;
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [open, uuid, rec?.uuid, rec?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // "none" without asking: pre-a_leg_uuid events and the optimistic
  // just-dispositioned row have nothing to fetch.
  const status = !uuid ? "none" : rec?.uuid === uuid ? rec.status : "loading";

  return (
    <div className="pl-call-record">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: item.connected ? "var(--navy)" : "#A2A9B8", flex: "none" }} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {item.connected ? `Cuộc gọi${dur ? ` ${dur}` : ""}` : "Gọi không kết nối"}
        </span>
        <span className="bid-micro" style={{ flex: 1 }}>
          {new Date(item.at).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} · qua số Bonia · có thể được ghi âm
        </span>
        {item.connected && (
          <button className="bid-link-btn" style={{ height: "auto", padding: 0 }} onClick={() => setOpen((x) => !x)}>
            {open ? "Ẩn" : "Nội dung"}
          </button>
        )}
      </div>
      {open && (
        <div style={{ marginTop: 6, paddingLeft: 16 }}>
          {status === "loading" && <div className="bid-micro">Đang tải…</div>}
          {status === "pending" && <div className="bid-micro">Đang xử lý bản ghi…</div>}
          {(status === "failed" || (status === "ready" && rec.turns.length === 0)) && (
            <div className="bid-micro">Không tạo được bản ghi cho cuộc gọi này.</div>
          )}
          {status === "too_short" && <div className="bid-micro">Cuộc gọi quá ngắn để ghi nội dung.</div>}
          {status === "none" && <div className="bid-micro">Cuộc gọi này không có bản ghi nội dung.</div>}
          {status === "error" && (
            <div className="bid-micro">
              Không tải được nội dung.{" "}
              <button className="bid-link-btn" style={{ height: "auto", padding: 0 }} onClick={load}>Thử lại</button>
            </div>
          )}
          {status === "ready" && rec.turns.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {rec.turns.map((t) => (
                <div key={t.seq} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <span className="mono" style={{ fontSize: 10.5, color: "var(--ink-35)", flex: "none" }}>{mmss(t.start_ms)}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, flex: "none", color: t.speaker === "rm" ? "var(--navy)" : "var(--ink-55)" }}>
                    {t.speaker === "rm" ? (repName || "Bạn") : "Khách"}
                  </span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.45 }}>{t.text}</span>
                </div>
              ))}
            </div>
          )}
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
  // MUST mirror rm-pipeline.ts: the fee is the bid that WON this lead
  // (lead.fee_vnd — the routing-time snapshot the hold and the customer's
  // promised reward were computed from), never the card's live bid. On a
  // different final card the server takes that card's bid but never below
  // the snapshot. Reading my_bid_vnd here made the modal quote a number the
  // server would not charge the moment the rep had raised their bid.
  const sameCard = !!cardId && cardId === lead.card?.card_id;
  const fee = sameCard
    ? lead.fee_vnd
    : Math.max(lead.fee_vnd ?? 0, chosen?.my_bid_vnd ?? lead.fee_vnd ?? 0);
  const raisedSinceRouting = !!chosen && (chosen.my_bid_vnd ?? 0) > (lead.fee_vnd ?? 0);
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
          {approved.map((c) => {
            // The tapped card is charged at the ROUTING-TIME bid, so quote
            // that here too — otherwise this row and the total below it
            // disagree whenever the rep has changed their bid since.
            const tapped = c.card_id === lead.card?.card_id;
            const rowFee = tapped ? (lead.fee_vnd ?? c.my_bid_vnd) : c.my_bid_vnd;
            // What the customer gets if THIS row is the final card. Not
            // floor(rowFee/2): the customer's rate is the one published
            // when the lead arrived (lead.reward_vnd), which is also the
            // rate the POST below writes onto the claim. The server floors
            // the fee at the routing-time bid on a different card, so the
            // reward is scaled from that same floored fee, never from the
            // card's live bid alone.
            const rowFinalFee = tapped
              ? (lead.fee_vnd ?? c.my_bid_vnd)
              : Math.max(lead.fee_vnd ?? 0, c.my_bid_vnd ?? 0);
            const rowReward = promisedRewardOf(lead.reward_vnd, lead.fee_vnd, rowFinalFee);
            return (
            <label key={c.card_id} className={`pl-radio ${cardId === c.card_id ? "on" : ""}`}>
              <input type="radio" name="finalcard" checked={cardId === c.card_id} onChange={() => setCardId(c.card_id)} />
              <span className="pl-card-thumb" style={{ background: c.image_url ? `url(${c.image_url}) center/cover` : "linear-gradient(135deg,#1B1B22,#08080C)" }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                  {c.name}
                  {tapped && <span className="pl-tapped-tag">KHÁCH ĐÃ BẤM</span>}
                </span>
                <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-45)" }}>
                  bid {vnd(rowFee)} · khách nhận {vnd(rowReward)}
                </span>
              </span>
            </label>
            );
          })}
        </div>

        <div className="pl-arith mono">
          <div><span>Phí thành công (bid khi nhận lead)</span><span>{vnd(fee)}</span></div>
          <div><span>Đã giữ khi nhận lead</span><span>− {vnd(Math.min(held, fee))}</span></div>
          <div className="pl-arith-total"><span>Còn phải trả</span><span>{vnd(due)}</span></div>
        </div>
        {sameCard && raisedSinceRouting && (
          <div style={{ fontSize: 12, color: "var(--ink-55)", marginTop: 6, lineHeight: 1.5 }}>
            Bid hiện tại của thẻ này là <b className="mono">{vnd(chosen.my_bid_vnd)}</b>, nhưng phí tính
            theo bid lúc bạn nhận lead — nâng bid không làm tăng phí của lead đang xử lý.
          </div>
        )}
        {/* Different final card priced BELOW the routing-time bid: the server
            floors the fee at the snapshot, so the row above says one number
            and the total says a higher one. Say why, or this reads as an
            overcharge on the rep's first close. */}
        {!sameCard && chosen && (chosen.my_bid_vnd ?? 0) < (lead.fee_vnd ?? 0) && (
          <div style={{ fontSize: 12, color: "var(--ink-55)", marginTop: 6, lineHeight: 1.5 }}>
            Thẻ này đang bid <b className="mono">{vnd(chosen.my_bid_vnd)}</b>, nhưng khách đã được hứa
            thưởng theo bid <b className="mono">{vnd(lead.fee_vnd)}</b> lúc nhận lead, nên phí giữ ở
            mức đó. Đổi thẻ không làm giảm phí của lead đang xử lý.
          </div>
        )}
        <div style={{ fontSize: 12.5, marginTop: 6 }}>
          Khách nhận <b className="mono">{vnd(promisedRewardOf(lead.reward_vnd, lead.fee_vnd, fee))}</b>.{" "}
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
      const res = await api.outcome(lead.lead_id, { kind: "lost", reason });
      // The endpoint returns hold_pending_user_confirm — the hold is NOT
      // refunded now; the customer gets a window to object first.
      showToast(
        res?.hold_pending_user_confirm === false || !(lead.hold_vnd || 0)
          ? "Đã lưu trữ lead"
          : "Đã lưu trữ lead · phần giữ được hoàn sau khi khách xác nhận, chậm nhất 7 ngày"
      );
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
          <div style={{ fontSize: 12.5, color: "var(--ink-55)", marginTop: 8, lineHeight: 1.5 }}>
            Phần giữ <b className="mono">{vnd(lead.hold_vnd)}</b> được hoàn sau khi khách xác nhận,
            chậm nhất 7 ngày. Nếu khách báo đã mở thẻ, lead chuyển sang đối soát và phần giữ vẫn được giữ.
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
