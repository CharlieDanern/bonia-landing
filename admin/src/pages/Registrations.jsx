import React, { useState, useEffect } from "react";
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
  // While pending_review the backend's bank column holds the claimed
  // email DOMAIN placeholder — never pre-fill that as the bank, or a
  // default one-click approve would store the domain string.
  const [bank, setBank] = useState(BANKS.includes(reg.bank) ? reg.bank : "");
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  // Freelancer review. The document is the ONLY thing vouching for them —
  // an employee has a bank mailbox, a freelancer has this — so approving one
  // without opening it is approving on nothing.
  const isCtv = reg.partner_type === "freelancer";
  const [proof, setProof] = useState(null);
  const [note, setNote] = useState(reg.approval_note || "");
  const [expiry, setExpiry] = useState(
    reg.proof_expires_at ? String(reg.proof_expires_at).slice(0, 10) : ""
  );
  // What the SERVER currently has on file — the approve gate reads this,
  // so a successful "Lưu xét duyệt" unlocks Duyệt without a page reload.
  const [savedReview, setSavedReview] = useState({
    note: reg.approval_note || "",
    expiry: reg.proof_expires_at ? String(reg.proof_expires_at).slice(0, 10) : "",
  });

  const openProof = async () => {
    try {
      const p = await api.proofBlobUrl(reg.id);
      setProof(p);
      window.open(p.url, "_blank", "noopener");
    } catch (ex) {
      showToast(ex.message === "no_proof" ? "Hồ sơ này chưa có văn bản." : "Không mở được văn bản.");
    }
  };
  // Object URLs leak until revoked; this card can unmount while one is open.
  useEffect(() => () => { if (proof?.url) URL.revokeObjectURL(proof.url); }, [proof]);

  const saveReview = async () => {
    try {
      await api.reviewProof(reg.id, {
        approval_note: note.trim(),
        proof_expires_at: expiry || null,
      });
      setSavedReview({ note: note.trim(), expiry: expiry || "" });
      showToast("Đã lưu ghi chú duyệt.");
    } catch {
      showToast("Không lưu được, thử lại.");
    }
  };

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
        {/* Branch and service area. You are approving someone whose entire
            value is "can serve customers in X" — approving without seeing X
            is approving blind. No coverage means their cards reach nobody,
            so that reads as a warning rather than a blank. */}
        <div className="queue-sub">Chi nhánh: {reg.branch_name || "—"}</div>
        {isCtv && (
          <div
            style={{
              marginTop: 8, padding: "9px 11px", borderRadius: 6,
              background: "#FBF7EC", border: "1px solid #E8DCC2",
            }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>
              Cộng tác viên — cần kiểm tra văn bản uỷ quyền
            </div>
            {reg.has_proof ? (
              <button className="btn btn-ghost" style={{ marginBottom: 8 }} onClick={openProof}>
                Mở văn bản {reg.proof_filename ? `(${reg.proof_filename})` : ""}
              </button>
            ) : (
              <div className="queue-sub" style={{ color: "#B42318", marginBottom: 8 }}>
                Chưa có văn bản — không đủ căn cứ để duyệt.
              </div>
            )}
            <input
              className="input"
              style={{ marginBottom: 6 }}
              placeholder="Đã kiểm tra gì? (lưu lại để rút ra quy tắc sau)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="input"
                type="date"
                style={{ marginBottom: 0, width: 170 }}
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
              <button className="btn btn-ghost" onClick={saveReview}>Lưu</button>
            </div>
            <div className="queue-sub" style={{ marginTop: 6 }}>
              Ngày hết hiệu lực: hết hạn thì tài khoản ngừng nhận lead cho tới khi có văn bản mới.
            </div>
          </div>
        )}
        <div className="queue-sub">
          Phục vụ:{" "}
          {reg.cities && reg.cities.length > 0 ? (
            reg.cities.join(", ")
          ) : (
            <span style={{ color: "#8A5B08" }}>chưa chọn khu vực — thẻ sẽ không hiển thị cho ai</span>
          )}
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
        {/* Mirrors the server-side floor in approveRegistration(): a
            freelancer cannot be approved without an uploaded proof, a SAVED
            review note and a future expiry. The saved values (reg.*) are
            what the server will see — unsaved edits in the fields above
            don't count until "Lưu xét duyệt" persists them. */}
        <button
          className="btn btn-navy btn-navy-inline"
          disabled={
            busy ||
            !bank.trim() ||
            (isCtv &&
              (!reg.has_proof ||
                !savedReview.note.trim() ||
                !savedReview.expiry ||
                new Date(savedReview.expiry) <= new Date()))
          }
          title={
            isCtv && (!reg.has_proof || !savedReview.note.trim() || !savedReview.expiry)
              ? "CTV: cần văn bản + lưu ghi chú xét duyệt + ngày hết hiệu lực trước khi duyệt"
              : undefined
          }
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
