import { useEffect, useState } from "react";
import { api, vnd } from "../api.js";

/**
 * Đóng tài khoản — the queue where wallet money leaves the platform.
 *
 * Eligibility is recomputed server-side at read time rather than trusted from
 * the moment the partner asked, so a request that has since reopened (a late
 * claim, a dispute, a hold that outlived its lead) shows as blocked here
 * instead of being paid on a stale decision. The payout itself runs in one
 * locked transaction and refuses anything this screen shows as blocked.
 */
const BLOCKER_TEXT = {
  active_leads: (b) => `${b.count} lead chưa tất toán`,
  unsettled_claims: (b) => `${b.count} giao dịch đang đối soát`,
  negative_balance: (b) => `Số dư âm ${vnd(Math.abs(b.availableVnd))}`,
  funds_held: (b) => `Còn giữ ${vnd(b.heldVnd)}`,
  no_refund_account: () => "Chưa có tài khoản nhận tiền",
  refund_name_mismatch: (b) => `Tên tài khoản không khớp (${b.expected})`,
};

export default function Closures({ showToast }) {
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = () =>
    api.closures().then((r) => setRows(r.closures || [])).catch(() => setRows([]));
  useEffect(() => { load(); }, []);

  const pay = async (row) => {
    const ref = window.prompt(
      `Chuyển ${vnd(row.refundable_vnd)} tới:\n\n` +
        `${row.refund_bank} · ${row.refund_account_number}\n${row.refund_account_name}\n\n` +
        "Nhập mã giao dịch sau khi đã chuyển:"
    );
    if (!ref || ref.trim().length < 3) return;
    setBusy(row.id);
    try {
      const r = await api.markClosurePaid(row.id, {
        reference: ref.trim(),
        amount_vnd: row.refundable_vnd,
      });
      showToast(r.already_closed ? "Tài khoản đã được tất toán trước đó." : `Đã ghi nhận hoàn ${vnd(r.refunded_vnd)}.`);
      await load();
    } catch (ex) {
      const e = ex.body?.error;
      showToast(
        e === "window_not_elapsed"
          ? "Chưa hết 7 ngày làm việc."
          : e === "not_eligible"
            ? "Không còn đủ điều kiện — tải lại để xem lý do."
            : e === "amount_mismatch"
              ? `Số dư đã thay đổi (đúng: ${vnd(ex.body.expected)}). Tải lại.`
              : "Không ghi nhận được, thử lại."
      );
      await load();
    } finally {
      setBusy(null);
    }
  };

  if (rows === null) return <div className="card">Đang tải…</div>;
  if (rows.length === 0)
    return <div className="card">Không có yêu cầu đóng tài khoản nào.</div>;

  return (
    <>
      <h1 className="page-title">Đóng tài khoản</h1>
      {rows.map((r) => (
        <div className="card" key={r.id} style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 600 }}>
                {r.display_name}{" "}
                <span className="mono" style={{ opacity: 0.6, fontSize: 12 }}>
                  {r.partner_type === "freelancer" ? "CTV" : "NV"} · {r.bank}
                </span>
              </div>
              <div className="queue-sub">{r.email}</div>
              <div className="queue-sub">
                Yêu cầu {r.requested_at ? new Date(r.requested_at).toLocaleDateString("vi-VN") : "—"} ·{" "}
                {r.due ? "đã đến hạn" : `đến hạn ${r.payout_due_at ? new Date(r.payout_due_at).toLocaleDateString("vi-VN") : "—"}`}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="queue-sub">Hoàn lại</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>{vnd(r.refundable_vnd)}</div>
            </div>
          </div>

          <div className="queue-sub" style={{ marginTop: 10 }}>
            {r.refund_bank ? (
              <>
                {r.refund_bank} · <span className="mono">{r.refund_account_number}</span> ·{" "}
                {r.refund_account_name}
              </>
            ) : (
              "Chưa có tài khoản nhận tiền"
            )}
          </div>

          {r.blockers?.length > 0 && (
            <div style={{ marginTop: 10, color: "#B42318", fontSize: 13 }}>
              {r.blockers.map((b, i) => (
                <div key={i}>• {(BLOCKER_TEXT[b.code] || (() => b.code))(b)}</div>
              ))}
            </div>
          )}

          <button
            className="btn"
            style={{ marginTop: 12 }}
            disabled={busy === r.id || !r.still_eligible || !r.due}
            onClick={() => pay(r)}
          >
            {busy === r.id ? "Đang ghi nhận…" : "Đã chuyển tiền"}
          </button>
        </div>
      ))}
    </>
  );
}
