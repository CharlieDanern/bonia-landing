import React, { useState } from "react";
import { api, BANKS, fmtDate } from "../api.js";
import {
  ConfirmModal,
  Empty,
  ErrBox,
  Loading,
  PageHead,
  REG_STATUS,
  StatusChip,
  useLoad,
} from "../components.jsx";

export default function Registrations({ showToast }) {
  const pending = useLoad(() => api.registrations("pending"), []);
  const history = useLoad(() => api.registrations("all"), []);
  const reloadAll = () => {
    pending.reload();
    history.reload();
  };
  const rows = pending.data?.registrations || [];
  const all = history.data?.registrations || [];

  return (
    <div className="bn-up">
      <PageHead
        title="Đăng ký đối tác"
        sub="Nhân viên ngân hàng đăng ký làm đối tác Bonia Connect — xác minh email công ty rồi gán ngân hàng."
      />

      <datalist id="bank-dl">
        {BANKS.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>

      <div className="mono-eyebrow">Chờ duyệt ({rows.length})</div>
      {pending.loading ? <Loading /> : null}
      {pending.error ? <ErrBox error={pending.error} onRetry={pending.reload} /> : null}
      {!pending.loading && !pending.error && rows.length === 0 ? (
        <Empty>
          Không có đăng ký nào chờ duyệt. Các đăng ký với email không thuộc tên miền
          ngân hàng đã biết sẽ nằm ở đây chờ gán ngân hàng thủ công.
        </Empty>
      ) : null}
      <div className="stack">
        {rows.map((r) => (
          <RegRow key={r.id} reg={r} showToast={showToast} onDone={reloadAll} />
        ))}
      </div>

      <div className="bid-divider" style={{ margin: "22px 0 14px" }} />

      <div className="mono-eyebrow">Lịch sử</div>
      {history.loading ? <Loading /> : null}
      {history.error ? <ErrBox error={history.error} onRetry={history.reload} /> : null}
      {!history.loading && !history.error && all.length === 0 ? (
        <Empty>Chưa có đăng ký nào.</Empty>
      ) : null}
      {all.length > 0 ? (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Email</th>
                <th>Họ tên</th>
                <th>Điện thoại</th>
                <th>Tên miền</th>
                <th>Ngân hàng</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {all.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.email}</td>
                  <td>{r.display_name || "—"}</td>
                  <td className="mono">{r.phone || "—"}</td>
                  <td className="mono">{r.claimed_domain || "—"}</td>
                  <td>{r.bank || "—"}</td>
                  <td>
                    <StatusChip map={REG_STATUS} value={r.status} />
                  </td>
                  <td className="mono">{fmtDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function RegRow({ reg, showToast, onDone }) {
  const [bank, setBank] = useState(reg.bank || "");
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const approve = async () => {
    setBusy(true);
    try {
      await api.approveRegistration(reg.id, bank.trim());
      showToast(`Đã duyệt ${reg.email} — email thông báo sẽ được gửi.`);
      onDone();
    } catch (ex) {
      showToast(`Lỗi: ${ex.body?.error || ex.message}`);
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    setBusy(true);
    try {
      await api.rejectRegistration(reg.id);
      setRejectOpen(false);
      showToast(`Đã từ chối ${reg.email}.`);
      onDone();
    } catch (ex) {
      showToast(`Lỗi: ${ex.body?.error || ex.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card reg-row">
      <div className="reg-info">
        <div style={{ fontSize: 14.5, fontWeight: 600 }}>
          {reg.display_name || "(chưa có tên)"}
        </div>
        <div className="queue-sub mono">{reg.email}</div>
        <div className="queue-sub">
          <span className="mono">{reg.phone || "—"}</span> · tên miền{" "}
          <span className="mono">{reg.claimed_domain || "—"}</span> ·{" "}
          {fmtDate(reg.created_at)}
        </div>
      </div>
      <div className="reg-actions">
        <input
          className="input"
          style={{ marginBottom: 0, width: 190 }}
          list="bank-dl"
          placeholder="Ngân hàng…"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
        />
        <button
          className="btn btn-navy btn-navy-inline"
          disabled={busy || !bank.trim()}
          onClick={approve}
        >
          Duyệt
        </button>
        <button
          className="btn btn-ghost"
          disabled={busy}
          onClick={() => setRejectOpen(true)}
        >
          Từ chối
        </button>
      </div>

      <ConfirmModal
        open={rejectOpen}
        title="Từ chối đăng ký?"
        confirmLabel="Từ chối"
        danger
        onConfirm={reject}
        onCancel={() => setRejectOpen(false)}
        busy={busy}
      >
        Đăng ký của <b>{reg.email}</b> sẽ bị từ chối và người đăng ký nhận được
        email thông báo.
      </ConfirmModal>
    </div>
  );
}
