import React, { useState } from "react";
import { api, fmtDate, shortId, vnd } from "../api.js";
import { ConfirmModal, Empty, ErrBox, Loading, PageHead, useLoad } from "../components.jsx";

const FILTERS = [
  { key: "due", label: "Cần chuyển" },
  { key: "done", label: "Đã chuyển" },
];

/** Copyable field — an account number retyped by hand is how money goes astray. */
function CopyRow({ label, value, mono = false, showToast }) {
  if (!value) return null;
  return (
    <div className="po-row">
      <span className="po-row-label">{label}</span>
      <span className={`po-row-value ${mono ? "mono" : ""}`}>{value}</span>
      <button
        className="po-copy"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(String(value));
            showToast(`Đã copy ${label.toLowerCase()}`);
          } catch {
            showToast("Không copy được");
          }
        }}
      >
        Copy
      </button>
    </div>
  );
}

export default function Payouts({ showToast }) {
  const [state, setState] = useState("due");
  const [selId, setSelId] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [reference, setReference] = useState("");
  const { data, loading, error, reload } = useLoad(() => api.payouts(state), [state]);

  const payouts = data?.payouts || [];
  const sel = payouts.find((p) => p.claim_id === selId) || payouts[0] || null;
  const totalDue = payouts.reduce((n, p) => n + (p.reward_vnd || 0), 0);

  const markPaid = async () => {
    try {
      // Send the account THIS SCREEN showed. The server compares it with the
      // live row and refuses if the customer changed their account between
      // the transfer and this click, rather than snapshotting a destination
      // that never received the money.
      await api.markPayoutPaid(sel.claim_id, {
        reference: reference.trim(),
        // All three fields exactly as rendered above. The server compares the
        // locked row against THESE, not against its own fresh read — which
        // would already reflect a change made after the transfer.
        account_number: sel.payout?.account_number,
        bank: sel.payout?.bank,
        holder: sel.payout?.holder,
      });
      showToast("Đã ghi nhận chuyển thưởng");
      setConfirming(false);
      setReference("");
      setSelId(null);
      reload();
    } catch (e) {
      if (e?.body?.error === "destination_changed") {
        showToast(e.body.message || "Tài khoản nhận đã thay đổi — kiểm tra lại");
        reload();
      } else {
        showToast(e?.message || "Không ghi nhận được");
      }
    }
  };

  return (
    <div className="bn-up">
      <PageHead
        title="Chi thưởng khách hàng"
        sub="Bonia đã thu phí của đối tác — đây là phần thưởng còn nợ khách. Chuyển tiền rồi bấm xác nhận."
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
            {state === f.key && data ? <span className="pl-lane-count">{payouts.length}</span> : null}
          </button>
        ))}
      </div>

      {state === "due" && payouts.length > 0 ? (
        <div className="po-total">
          Tổng đang nợ khách: <strong className="mono">{vnd(totalDue)}</strong>
        </div>
      ) : null}

      {loading ? <Loading /> : null}
      {error ? <ErrBox error={error} onRetry={reload} /> : null}
      {!loading && !error && payouts.length === 0 ? (
        <Empty>
          {state === "due"
            ? "Không còn khoản thưởng nào phải chuyển. Khi khách và đối tác cùng xác nhận mở thẻ, phần thưởng của khách sẽ xuất hiện ở đây."
            : "Chưa có khoản thưởng nào đã chuyển."}
        </Empty>
      ) : null}

      {payouts.length > 0 ? (
        <div className="split">
          <div className="queue">
            {payouts.map((p) => (
              <button
                key={p.claim_id}
                className={`queue-btn ${sel && sel.claim_id === p.claim_id ? "sel" : ""}`}
                onClick={() => setSelId(p.claim_id)}
              >
                <div className="queue-top">
                  <span className="queue-name">{p.customer_name || "Khách"}</span>
                  <span className="mono" style={{ fontWeight: 700 }}>{vnd(p.reward_vnd)}</span>
                </div>
                <div className="queue-sub">
                  {p.card_name || "—"}
                  {p.city ? ` · ${p.city}` : ""}
                </div>
                <div className="queue-sub mono">
                  {p.payout ? p.payout.bank : "⚠ chưa có tài khoản"} ·{" "}
                  {fmtDate(state === "done" ? p.user_paid_at : p.paid_at)}
                </div>
              </button>
            ))}
          </div>

          {sel ? (
            <div className="card">
              <div className="po-head">
                <div>
                  <div className="po-name">{sel.customer_name || "Khách"}</div>
                  <div className="queue-sub">
                    {sel.card_name || "—"} · {sel.rm_name || "?"} ({sel.rm_bank || "?"})
                    {sel.city ? ` · ${sel.city}` : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="queue-sub">Thưởng cho khách</div>
                  <div className="mono po-amount">{vnd(sel.reward_vnd)}</div>
                </div>
              </div>

              <div className="po-note">
                Bonia đã thu {vnd(sel.fee_vnd)} phí từ {sel.rm_name || "đối tác"} lúc{" "}
                {fmtDate(sel.paid_at)}.
              </div>

              {sel.payout ? (
                <>
                  <div className="eyebrow mono po-eyebrow">TÀI KHOẢN NHẬN THƯỞNG</div>
                  <CopyRow label="Chủ tài khoản" value={sel.payout.holder} showToast={showToast} />
                  <CopyRow label="Ngân hàng" value={sel.payout.bank} showToast={showToast} />
                  <CopyRow label="Số tài khoản" value={sel.payout.account_number} mono showToast={showToast} />
                  <CopyRow label="Số tiền" value={vnd(sel.reward_vnd)} mono showToast={showToast} />
                  <CopyRow label="Nội dung" value={sel.payout.memo} mono showToast={showToast} />

                  {sel.payout.qr_url ? (
                    <div className="po-qr">
                      <img src={sel.payout.qr_url} alt="VietQR chuyển thưởng" />
                      <div className="queue-sub">
                        Quét bằng app ngân hàng — đã điền sẵn số tài khoản, số tiền và nội dung.
                        Kiểm tra tên người nhận trước khi xác nhận.
                      </div>
                    </div>
                  ) : (
                    <div className="po-warn">
                      Ngân hàng này chưa có mã QR — nhập số tài khoản thủ công và đối chiếu kỹ tên
                      chủ tài khoản.
                    </div>
                  )}
                </>
              ) : (
                <div className="po-warn">
                  Khách chưa nhập tài khoản nhận thưởng. Không thể chuyển tiền cho đến khi khách bổ
                  sung trong app (Ưu đãi → Phần thưởng → Tài khoản nhận tiền).
                </div>
              )}

              {state === "due" ? (
                <div className="po-actions">
                  <input
                    className="input"
                    placeholder="Mã giao dịch ngân hàng (bắt buộc)"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                  <button
                    className="btn btn-navy btn-navy-inline"
                    disabled={!sel.payout || !reference.trim()}
                    onClick={() => setConfirming(true)}
                  >
                    Đã chuyển tiền
                  </button>
                </div>
              ) : (
                <div className="po-note">
                  Đã chuyển lúc {fmtDate(sel.user_paid_at)} · #{shortId(sel.claim_id)}
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {confirming && sel ? (
        <ConfirmModal
          open
          title="Xác nhận đã chuyển thưởng"
          confirmLabel="Xác nhận"
          onConfirm={markPaid}
          onCancel={() => setConfirming(false)}
        >
          <>
              Xác nhận đã chuyển <strong>{vnd(sel.reward_vnd)}</strong> tới{" "}
              <strong>{sel.payout?.holder}</strong> ({sel.payout?.bank} ·{" "}
              {sel.payout?.account_number}). Khách sẽ nhận thông báo trong app.
              <br />
              <br />
              Chỉ bấm sau khi giao dịch đã thực sự thành công — thao tác này không thể hoàn tác.
          </>
        </ConfirmModal>
      ) : null}
    </div>
  );
}
