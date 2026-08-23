import React, { useState } from "react";
import { api, fmtDate, vnd } from "../api.js";
import {
  ConfirmModal,
  Empty,
  ErrBox,
  Loading,
  PageHead,
  useLoad,
} from "../components.jsx";

export default function Rms({ showToast }) {
  const rmsLoad = useLoad(() => api.rms(), []);
  const transfersLoad = useLoad(() => api.transfers(30), []);
  const rms = rmsLoad.data?.rms || [];
  const transfers = transfersLoad.data?.transfers || [];
  const [pendingAction, setPendingAction] = useState(null); // {rm, suspend:bool}
  const [busy, setBusy] = useState(false);

  const doSuspendToggle = async () => {
    if (!pendingAction) return;
    const { rm, suspend } = pendingAction;
    setBusy(true);
    try {
      if (suspend) await api.suspendRm(rm.id);
      else await api.unsuspendRm(rm.id);
      setPendingAction(null);
      showToast(
        suspend
          ? `Đã tạm khoá ${rm.display_name} — softphone bị gỡ khỏi tổng đài.`
          : `Đã mở khoá ${rm.display_name}.`
      );
      rmsLoad.reload();
    } catch (ex) {
      showToast(`Lỗi: ${ex.body?.error || ex.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bn-up">
      <PageHead
        title="Đối tác (RM)"
        sub="Danh sách đối tác, số dư ví, tạm khoá tài khoản và nạp tiền thủ công."
      />

      {rmsLoad.loading ? <Loading /> : null}
      {rmsLoad.error ? <ErrBox error={rmsLoad.error} onRetry={rmsLoad.reload} /> : null}
      {!rmsLoad.loading && !rmsLoad.error && rms.length === 0 ? (
        <Empty>Chưa có đối tác nào.</Empty>
      ) : null}

      {rms.length > 0 ? (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Đối tác</th>
                <th>Ngân hàng</th>
                <th>Liên hệ</th>
                <th>Trạng thái</th>
                <th>Số dư / Đang giữ</th>
                <th>Leads</th>
                <th>Mã nạp</th>
                <th>Hạn mức tháng</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rms.map((r) => {
                const suspended = !!r.suspended_at;
                return (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.display_name}</div>
                      <div className="queue-sub mono">@{r.username}</div>
                    </td>
                    <td>{r.bank || "—"}</td>
                    <td>
                      <div className="mono" style={{ fontSize: 12 }}>
                        {r.email || "—"}
                      </div>
                      <div className="mono" style={{ fontSize: 12 }}>
                        {r.phone || "—"}
                      </div>
                    </td>
                    <td>
                      {suspended ? (
                        <span className="bid-chip red" title={fmtDate(r.suspended_at)}>
                          Tạm khoá
                        </span>
                      ) : r.active ? (
                        <span className="bid-chip green">Hoạt động</span>
                      ) : (
                        <span className="bid-chip grey">{r.status || "—"}</span>
                      )}
                    </td>
                    <td className="mono">
                      {vnd(r.balance_available_vnd)}
                      <span className="dim"> / {vnd(r.balance_held_vnd)}</span>
                    </td>
                    <td className="mono">{r.routed_leads_total ?? "—"}</td>
                    <td className="mono">{r.deposit_code || "—"}</td>
                    <td className="mono">{vnd(r.monthly_spend_cap_vnd)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => setPendingAction({ rm: r, suspend: !suspended })}
                      >
                        {suspended ? "Mở khoá" : "Tạm khoá"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="two-col" style={{ marginTop: 22 }}>
        <ManualDeposit
          showToast={showToast}
          onDone={() => {
            transfersLoad.reload();
            rmsLoad.reload();
          }}
        />
        <div className="card">
          <div className="mono-eyebrow">Chuyển khoản gần đây</div>
          {transfersLoad.loading ? <Loading /> : null}
          {transfersLoad.error ? (
            <ErrBox error={transfersLoad.error} onRetry={transfersLoad.reload} />
          ) : null}
          {!transfersLoad.loading && !transfersLoad.error && transfers.length === 0 ? (
            <Empty>Chưa ghi nhận chuyển khoản nào.</Empty>
          ) : null}
          {transfers.length > 0 ? (
            <div className="tbl-wrap">
              <table className="tbl compact">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Số tiền</th>
                    <th>Nội dung</th>
                    <th>Ref</th>
                    <th>Đối tác</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((t) => (
                    <tr key={t.id}>
                      <td className="mono">{fmtDate(t.at)}</td>
                      <td className="mono">{vnd(t.amount_vnd)}</td>
                      <td className="mono" style={{ fontSize: 12 }}>
                        {t.memo || "—"}
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>
                        {t.ref || "—"}
                      </td>
                      <td>{t.rm_display_name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>

      <ConfirmModal
        open={!!pendingAction}
        title={
          pendingAction?.suspend
            ? `Tạm khoá ${pendingAction?.rm?.display_name}?`
            : `Mở khoá ${pendingAction?.rm?.display_name}?`
        }
        confirmLabel={pendingAction?.suspend ? "Tạm khoá" : "Mở khoá"}
        danger={!!pendingAction?.suspend}
        onConfirm={doSuspendToggle}
        onCancel={() => setPendingAction(null)}
        busy={busy}
      >
        {pendingAction?.suspend ? (
          <>
            Đối tác sẽ không nhận lead mới và bị gỡ khỏi tổng đài cho đến khi mở
            khoá. Số dư ví không thay đổi.
          </>
        ) : (
          <>Đối tác sẽ hoạt động bình thường trở lại và nhận lead mới.</>
        )}
      </ConfirmModal>
    </div>
  );
}

function ManualDeposit({ showToast, onDone }) {
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("BONIA NAP ");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    try {
      const res = await api.bankTxn({
        amount_vnd: Number(amount),
        memo: memo.trim(),
        ref: ref.trim(),
      });
      setResult(res);
      showToast("Đã ghi nhận giao dịch nạp tiền.");
      setAmount("");
      setRef("");
      setMemo("BONIA NAP ");
      onDone();
    } catch (ex) {
      // Unmatched transfers come back 404 {matched:false, reason:"…"} —
      // surface the reason (deposit_code_unknown, claim_not_invoiced…).
      showToast(`Lỗi: ${ex.body?.error || ex.body?.reason || ex.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <div className="mono-eyebrow">Nạp tiền thủ công</div>
      <div className="queue-sub" style={{ marginBottom: 10 }}>
        Nhập giao dịch chuyển khoản ngân hàng — hệ thống khớp mã nạp trong nội dung
        và cộng vào ví đối tác tương ứng.
      </div>
      <label className="lbl" htmlFor="txn-amount">
        Số tiền (VND)
      </label>
      <input
        id="txn-amount"
        className="input mono"
        type="number"
        min="0"
        step="10000"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="500000"
      />
      <label className="lbl" htmlFor="txn-memo">
        Nội dung chuyển khoản
      </label>
      <input
        id="txn-memo"
        className="input mono"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
      />
      <label className="lbl" htmlFor="txn-ref">
        Mã tham chiếu (ref)
      </label>
      <input
        id="txn-ref"
        className="input mono"
        value={ref}
        onChange={(e) => setRef(e.target.value)}
        placeholder="FT26082…"
      />
      <button
        className="btn btn-navy btn-navy-inline"
        type="submit"
        disabled={busy || !amount || Number.isNaN(Number(amount)) || !memo.trim()}
      >
        {busy ? "Đang ghi nhận…" : "Ghi nhận giao dịch"}
      </button>
      {result ? (
        <pre className="txn-result mono">{JSON.stringify(result, null, 2)}</pre>
      ) : null}
    </form>
  );
}
