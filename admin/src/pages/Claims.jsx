import React, { useState } from "react";
import { api, fmtDate, shortId, STAGE_LABEL, vnd } from "../api.js";
import {
  CLAIM_STATE,
  ConfirmModal,
  Empty,
  ErrBox,
  Loading,
  PageHead,
  StatusChip,
  useLoad,
} from "../components.jsx";

const FILTERS = [
  { key: "disputed", label: "Tranh chấp" },
  { key: "all", label: "Tất cả" },
];

export default function Claims({ showToast }) {
  const [state, setState] = useState("disputed");
  const [selId, setSelId] = useState(null);
  const { data, loading, error, reload } = useLoad(() => api.claims(state), [state]);
  const claims = data?.claims || [];
  const sel = claims.find((c) => c.id === selId) || claims[0] || null;

  return (
    <div className="bn-up">
      <PageHead
        title="Đối soát khiếu nại"
        sub="Đối tác khai đã mở thẻ, người dùng khai khác — xem cả hai phía và dòng thời gian rồi phân xử."
      />
      <div className="pl-lanes" style={{ marginBottom: 14 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`pl-lane ${state === f.key ? "on" : ""}`}
            onClick={() => {
              setState(f.key);
              setSelId(null);
            }}
          >
            {f.label}
            {state === f.key && data ? (
              <span className="pl-lane-count">{claims.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : null}
      {error ? <ErrBox error={error} onRetry={reload} /> : null}
      {!loading && !error && claims.length === 0 ? (
        <Empty>
          Không có khiếu nại nào{state === "disputed" ? " đang tranh chấp" : ""}. Khi
          đối tác xác nhận mở thẻ mà người dùng không công nhận, hồ sơ sẽ xuất hiện
          ở đây.
        </Empty>
      ) : null}

      {claims.length > 0 ? (
        <div className="split">
          <div className="queue">
            {claims.map((c) => (
              <button
                key={c.id}
                className={`queue-btn ${sel && sel.id === c.id ? "sel" : ""}`}
                onClick={() => setSelId(c.id)}
              >
                <div className="queue-top">
                  <span className="queue-name mono">#{shortId(c.id)}</span>
                  <StatusChip map={CLAIM_STATE} value={c.state} />
                </div>
                <div className="queue-sub">
                  {c.rm?.display_name || "?"} ({c.rm?.bank || "?"}) ·{" "}
                  {c.user_first_name || "?"}
                  {c.user_city ? ` · ${c.user_city}` : ""}
                </div>
                <div className="queue-sub mono">
                  Phí {vnd(c.fee_vnd)} · {fmtDate(c.created_at)}
                </div>
              </button>
            ))}
          </div>
          {sel ? (
            <ClaimDetail
              key={sel.id}
              claim={sel}
              showToast={showToast}
              onDone={reload}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ClaimDetail({ claim, showToast, onDone }) {
  const [outcome, setOutcome] = useState(null); // "won" | "lost"
  const [finalCard, setFinalCard] = useState(
    claim.proposed_card_name ? "proposed" : "customer"
  );
  const [finalFee, setFinalFee] = useState(
    String(claim.final_fee_vnd ?? claim.fee_vnd ?? "")
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const resolve = async () => {
    setBusy(true);
    try {
      await api.resolveClaim(claim.id, {
        outcome,
        ...(outcome === "won" && finalFee !== "" && !Number.isNaN(Number(finalFee))
          ? { final_fee_vnd: Number(finalFee) }
          : {}),
      });
      setConfirmOpen(false);
      showToast(
        outcome === "won"
          ? "Đã xử lý THẮNG — khiếu nại chuyển sang chờ thu phí."
          : "Đã xử lý THUA — hoàn phần giữ cho đối tác."
      );
      onDone();
    } catch (ex) {
      if (ex.status === 409 && ex.body?.error === "not_disputed") {
        showToast("Khiếu nại này không còn ở trạng thái tranh chấp.");
        onDone();
      } else {
        showToast(`Lỗi: ${ex.body?.error || ex.message}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const wonCardName =
    finalCard === "proposed" ? claim.proposed_card_name : claim.customer_card_name;

  return (
    <div className="detail card">
      <div className="claim-head">
        <div>
          <div className="mono-eyebrow" style={{ marginBottom: 4 }}>
            Khiếu nại #{shortId(claim.id)} · Lead #{shortId(claim.lead_id)}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <StatusChip map={CLAIM_STATE} value={claim.state} />
            {claim.lead_state ? (
              <span className="bid-chip navy">
                Lead: {STAGE_LABEL[claim.lead_state] || claim.lead_state}
              </span>
            ) : null}
          </div>
        </div>
        <div className="claim-nums mono">
          <div>Phí khai: {vnd(claim.fee_vnd)}</div>
          <div>Phí chốt: {vnd(claim.final_fee_vnd)}</div>
          <div>Phần người dùng: {vnd(claim.user_share_vnd)}</div>
        </div>
      </div>
      <div className="queue-sub" style={{ marginTop: 4 }}>
        Tạo {fmtDate(claim.created_at)} · RM xác nhận {fmtDate(claim.rm_confirmed_at)}
        {claim.paid_at ? <> · Thanh toán {fmtDate(claim.paid_at)}</> : null}
      </div>

      <div className="bid-divider" />

      {/* Both sides */}
      <div className="mono-eyebrow">Hai phía khai</div>
      <div className="sides">
        <div className="side">
          <div className="side-title">Phía đối tác (RM)</div>
          <div style={{ fontSize: 13.5 }}>
            <b>{claim.rm?.display_name || "—"}</b> ({claim.rm?.bank || "—"}) khai đã
            mở thẻ:
          </div>
          <div className="side-card">{claim.proposed_card_name || "—"}</div>
          <div className="queue-sub mono">Phí khai: {vnd(claim.fee_vnd)}</div>
          {claim.tapped_card_name ? (
            <div className="queue-sub">
              Thẻ khách bấm ban đầu: <b>{claim.tapped_card_name}</b>
            </div>
          ) : null}
        </div>
        <div className="side">
          <div className="side-title">Phía người dùng</div>
          <div style={{ fontSize: 13.5 }}>
            <b>{claim.user_first_name || "—"}</b>
            {claim.user_city ? ` · ${claim.user_city}` : ""}{" "}
            {claim.customer_card_name ? "khai thẻ đã mở:" : "không công nhận mở thẻ."}
          </div>
          {claim.customer_card_name ? (
            <div className="side-card">{claim.customer_card_name}</div>
          ) : null}
          {claim.deny_reason ? (
            <div className="deny-box">Lý do: {claim.deny_reason}</div>
          ) : null}
        </div>
      </div>

      <div className="bid-divider" />

      {/* Timeline */}
      <div className="mono-eyebrow">Dòng thời gian (30 mục gần nhất)</div>
      {Array.isArray(claim.timeline) && claim.timeline.length > 0 ? (
        <div className="timeline">
          {claim.timeline.map((t, i) =>
            t.kind === "event" ? (
              <div key={i} className="tl-event">
                <span className="mono">{fmtDate(t.at)}</span> — {t.label}
              </div>
            ) : (
              <div
                key={i}
                className={`pl-bubble ${t.kind === "rm_msg" ? "mine" : ""}`}
                title={fmtDate(t.at)}
              >
                <div className="tl-who">
                  {t.kind === "rm_msg" ? "RM" : "Người dùng"} ·{" "}
                  <span className="mono">{fmtDate(t.at)}</span>
                </div>
                {t.label}
              </div>
            )
          )}
        </div>
      ) : (
        <Empty>Không có sự kiện hay tin nhắn nào.</Empty>
      )}

      {/* Resolve panel */}
      {claim.state === "disputed" ? (
        <>
          <div className="bid-divider" />
          <div className="mono-eyebrow">Phân xử</div>
          <label
            className={`pl-radio ${outcome === "won" ? "on" : ""}`}
            style={{ cursor: "pointer" }}
          >
            <input
              type="radio"
              name="outcome"
              checked={outcome === "won"}
              onChange={() => setOutcome("won")}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                Thắng — thẻ đã mở, thu phí đối tác
              </div>
              <div className="queue-sub">
                Khiếu nại chuyển sang chờ thu phí, lead chuyển Thành công.
              </div>
            </div>
          </label>
          <label
            className={`pl-radio ${outcome === "lost" ? "on" : ""}`}
            style={{ cursor: "pointer" }}
          >
            <input
              type="radio"
              name="outcome"
              checked={outcome === "lost"}
              onChange={() => setOutcome("lost")}
            />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                Thua — không đủ căn cứ, không thu phí
              </div>
              <div className="queue-sub">
                Khiếu nại bị từ chối, lead chuyển Thất bại, hoàn phần giữ.
              </div>
            </div>
          </label>

          {outcome === "won" ? (
            <div className="won-panel">
              <div className="f-label">Thẻ chốt cuối cùng</div>
              {claim.proposed_card_name ? (
                <label className={`pl-radio ${finalCard === "proposed" ? "on" : ""}`}>
                  <input
                    type="radio"
                    name="final-card"
                    checked={finalCard === "proposed"}
                    onChange={() => setFinalCard("proposed")}
                  />
                  <div style={{ fontSize: 13 }}>
                    {claim.proposed_card_name}{" "}
                    <span className="queue-sub">(RM khai)</span>
                  </div>
                </label>
              ) : null}
              {claim.customer_card_name ? (
                <label className={`pl-radio ${finalCard === "customer" ? "on" : ""}`}>
                  <input
                    type="radio"
                    name="final-card"
                    checked={finalCard === "customer"}
                    onChange={() => setFinalCard("customer")}
                  />
                  <div style={{ fontSize: 13 }}>
                    {claim.customer_card_name}{" "}
                    <span className="queue-sub">(người dùng khai)</span>
                  </div>
                </label>
              ) : null}
              <label className="lbl" htmlFor="final-fee">
                Phí chốt (VND)
              </label>
              <input
                id="final-fee"
                className="input mono"
                type="number"
                min="0"
                step="10000"
                value={finalFee}
                onChange={(e) => setFinalFee(e.target.value)}
              />
              <div className="bid-helper">
                Phần người dùng = 50% phí chốt ={" "}
                {finalFee !== "" && !Number.isNaN(Number(finalFee))
                  ? vnd(Math.floor(Number(finalFee) / 2))
                  : "—"}
              </div>
            </div>
          ) : null}

          <div className="action-row">
            <button
              className="btn btn-navy btn-navy-inline"
              disabled={
                busy ||
                !outcome ||
                (outcome === "won" &&
                  (finalFee === "" || Number.isNaN(Number(finalFee))))
              }
              onClick={() => setConfirmOpen(true)}
            >
              Phân xử
            </button>
          </div>

          <ConfirmModal
            open={confirmOpen}
            title={outcome === "won" ? "Xác nhận xử THẮNG?" : "Xác nhận xử THUA?"}
            confirmLabel={outcome === "won" ? "Xử thắng" : "Xử thua"}
            danger={outcome === "lost"}
            onConfirm={resolve}
            onCancel={() => setConfirmOpen(false)}
            busy={busy}
          >
            {outcome === "won" ? (
              <>
                Thẻ chốt: <b>{wonCardName || "—"}</b> · phí chốt{" "}
                <b className="mono">{vnd(Number(finalFee))}</b>. Khiếu nại chuyển
                sang chờ thu phí — <b>phần giữ 50% sẽ được cấn trừ vào phí</b> khi
                thanh toán. Lead chuyển Thành công và các bên được thông báo.
              </>
            ) : (
              <>
                Khiếu nại bị từ chối, lead chuyển Thất bại và{" "}
                <b>hoàn phần giữ</b> cho đối tác. Các bên được thông báo.
              </>
            )}
          </ConfirmModal>
        </>
      ) : null}
    </div>
  );
}
