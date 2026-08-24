import React, { useEffect, useState } from "react";
import {
  api,
  DEFAULT_REWARD_PCT,
  REWARD_PCT_MAX,
  REWARD_PCT_MIN,
  vnd,
} from "../api.js";
import {
  ConfirmModal,
  ErrBox,
  Loading,
  PageHead,
  useLoad,
} from "../components.jsx";

const TILES = [
  { key: "pending_cards", label: "Thẻ chờ duyệt", to: "cards", hot: true },
  { key: "pending_registrations", label: "Đăng ký chờ duyệt", to: "regs", hot: true },
  { key: "disputed_claims", label: "Khiếu nại tranh chấp", to: "claims", hot: true },
  { key: "unpaid_invoices", label: "Hoá đơn chưa thu", to: "claims", hot: false },
  { key: "active_rms", label: "Đối tác đang hoạt động", to: "rms", hot: false },
];

// A concrete bid to make the rate legible — the number a reviewer
// recognises from the card queue, not an abstract percentage.
const SAMPLE_BID_VND = 400_000;

export default function Overview({ nav, showToast }) {
  const { data, loading, error, reload } = useLoad(() => api.overview(), []);
  return (
    <div className="bn-up">
      <PageHead
        title="Tổng quan"
        sub="Hàng đợi cần xử lý trên toàn hệ thống Bonia Connect."
      />
      {loading ? <Loading /> : null}
      {error ? <ErrBox error={error} onRetry={reload} /> : null}
      {data ? (
        <div className="tile-grid">
          {TILES.map((t) => {
            const n = data[t.key] ?? 0;
            return (
              <button
                key={t.key}
                className={`tile ${t.hot && n > 0 ? "hot" : ""}`}
                onClick={() => nav(t.to)}
              >
                <div className="tile-num mono">{n}</div>
                <div className="tile-label">{t.label}</div>
                <div className="tile-go">Mở trang →</div>
              </button>
            );
          })}
        </div>
      ) : null}

      <CommissionCard showToast={showToast} />
    </div>
  );
}

/**
 * Consumer commission — the share of a rep's bid that goes back to the
 * customer as the cash reward on the card.
 *
 * Forward-only by construction: leads and claims store the share they
 * were promised (leads.reward_vnd, claims.user_share_vnd) and no read
 * path recomputes it, so moving this changes what the catalog QUOTES
 * from here on and nothing that has already been said to anybody. The
 * confirm dialog says exactly that, because it is the whole reason this
 * control is safe to hand to a human.
 *
 * It is NOT the wallet hold — that is collateral, fixed at 50%, and does
 * not move with this number.
 */
function CommissionCard({ showToast }) {
  const { data, loading, error, reload } = useLoad(() => api.settings(), []);
  const live = data?.consumer_reward_pct ?? null;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Reseed the field whenever the server value lands or changes, so
  // "Sửa" always opens on the truth rather than a stale keystroke.
  useEffect(() => {
    if (live != null) setDraft(String(live));
  }, [live]);

  const parsed = Number(draft);
  const valid =
    draft.trim() !== "" &&
    Number.isInteger(parsed) &&
    parsed >= REWARD_PCT_MIN &&
    parsed <= REWARD_PCT_MAX;
  const changed = valid && parsed !== live;

  const save = async () => {
    setBusy(true);
    try {
      const res = await api.setConsumerRewardPct(parsed);
      setConfirmOpen(false);
      setEditing(false);
      showToast?.(
        `Đã đổi mức thưởng khách hàng thành ${res.consumer_reward_pct}%. Áp dụng cho lead mới.`
      );
      reload();
    } catch (ex) {
      const code = ex.body?.error;
      showToast?.(
        code === "invalid_reward_pct"
          ? `Mức thưởng phải là số nguyên từ ${ex.body?.min ?? REWARD_PCT_MIN} đến ${ex.body?.max ?? REWARD_PCT_MAX}.`
          : code === "consumer_reward_pct_required"
            ? "Thiếu mức thưởng."
            : `Lỗi: ${code || ex.message}`
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: 16, maxWidth: 560 }}>
      <div className="mono-eyebrow">Cấu hình hoa hồng</div>
      {loading && !data ? <Loading /> : null}
      {error ? <ErrBox error={error} onRetry={reload} /> : null}

      {data ? (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 10,
            }}
          >
            <div className="tile-num mono" style={{ fontSize: 32, fontWeight: 600 }}>
              {live}%
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div className="tile-label" style={{ marginTop: 0 }}>
                Khách hàng nhận lại · phần trăm giá bid
              </div>
              <div className="queue-sub mono">
                Bid {vnd(SAMPLE_BID_VND)} → khách nhận{" "}
                {vnd(Math.floor((SAMPLE_BID_VND * (live ?? DEFAULT_REWARD_PCT)) / 100))}
              </div>
            </div>
            {!editing ? (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setDraft(String(live));
                  setEditing(true);
                }}
              >
                Sửa
              </button>
            ) : null}
          </div>

          {editing ? (
            <div style={{ marginTop: 12 }}>
              <label className="lbl" htmlFor="reward-pct">
                Mức thưởng mới (%, số nguyên {REWARD_PCT_MIN}–{REWARD_PCT_MAX})
              </label>
              <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  id="reward-pct"
                  className="input mono"
                  style={{ width: 120, marginBottom: 0 }}
                  type="number"
                  min={REWARD_PCT_MIN}
                  max={REWARD_PCT_MAX}
                  step="1"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button
                  className="btn btn-navy btn-navy-inline"
                  disabled={!changed || busy}
                  onClick={() => setConfirmOpen(true)}
                >
                  Lưu mức mới
                </button>
                <button
                  className="btn btn-ghost"
                  disabled={busy}
                  onClick={() => {
                    setDraft(String(live));
                    setEditing(false);
                  }}
                >
                  Huỷ
                </button>
              </div>
              <div className="bid-helper" style={{ marginTop: 8 }}>
                {draft.trim() === "" || valid
                  ? `Bid ${vnd(SAMPLE_BID_VND)} → khách nhận ${
                      valid
                        ? vnd(Math.floor((SAMPLE_BID_VND * parsed) / 100))
                        : "—"
                    }`
                  : `Phải là số nguyên từ ${REWARD_PCT_MIN} đến ${REWARD_PCT_MAX}.`}
              </div>
            </div>
          ) : (
            <div className="bid-helper" style={{ marginTop: 10 }}>
              Đây là phần khách hàng nhận lại, <b>không phải</b> mức giữ trong ví
              đối tác — mức giữ luôn là 50% giá bid và không đổi theo cấu hình này.
            </div>
          )}
        </>
      ) : null}

      <ConfirmModal
        open={confirmOpen}
        title={`Đổi mức thưởng khách hàng thành ${valid ? parsed : "—"}%?`}
        confirmLabel="Đổi mức thưởng"
        onConfirm={save}
        onCancel={() => setConfirmOpen(false)}
        busy={busy}
      >
        <b>Áp dụng cho lead MỚI. Lead và giao dịch đã tạo giữ nguyên mức cũ.</b>
        <div style={{ marginTop: 8 }}>
          Mức hiện tại <b className="mono">{live}%</b> → mới{" "}
          <b className="mono">{valid ? parsed : "—"}</b>%. Với bid{" "}
          {vnd(SAMPLE_BID_VND)}, khách sẽ thấy{" "}
          <b className="mono">
            {valid ? vnd(Math.floor((SAMPLE_BID_VND * parsed) / 100)) : "—"}
          </b>{" "}
          thay cho{" "}
          <b className="mono">
            {vnd(Math.floor((SAMPLE_BID_VND * (live ?? DEFAULT_REWARD_PCT)) / 100))}
          </b>
          .
        </div>
        <div className="callout-note">
          <b>Điều khoản và nội dung trong app đang dẫn mức hiện tại.</b> Sau khi
          đổi, kiểm tra lại trang Điều khoản, email gửi đối tác và phần giới
          thiệu trong app để không còn chỗ nào ghi {live}%.
        </div>
      </ConfirmModal>
    </div>
  );
}
