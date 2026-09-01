import React, { useState, useEffect } from "react";
import { api, fmtDate } from "../api.js";
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
  // One canonical list from the backend, loaded once and passed down —
  // approving must not be able to invent a new spelling of a bank that
  // already exists (rm_cards.bank keys the intra-bank ranking pools by exact
  // string, so "VPBank" and "VPbank" would be two separate markets).
  const [bankList, setBankList] = useState([]);
  useEffect(() => {
    api.banks().then((r) => setBankList(r.banks || [])).catch(() => setBankList([]));
  }, []);

  return (
    <div className="bn-up">
      <PageHead
        title="Đăng ký đối tác"
        sub="Nhân viên ngân hàng đăng ký làm đối tác Bonia Connect — xác minh email công ty rồi gán ngân hàng."
        at={pending.at}
      />

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
          <RegRow key={r.id} reg={r} banks={bankList} showToast={showToast} onDone={reloadAll} />
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

/**
 * Defined at MODULE scope on purpose. These started life inside RegRow, which
 * meant React saw a brand-new component type on every render, unmounted the
 * subtree and remounted it — so the review-note input lost focus after every
 * single keystroke and looked like it only accepted one letter.
 */
function Section({ n, title, children }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div
        className="mono-eyebrow"
        style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}
      >
        <span
          style={{
            display: "inline-grid", placeItems: "center", width: 17, height: 17,
            borderRadius: "50%", background: "#EEF1F6", color: "#5A6378",
            fontSize: 10.5, fontWeight: 700,
          }}
        >
          {n}
        </span>
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children, warn }) {
  return (
    <div style={{ display: "flex", gap: 10, fontSize: 13, padding: "3px 0" }}>
      <span style={{ color: "var(--ink-45, #5A6378)", minWidth: 104 }}>{label}</span>
      <span style={{ color: warn ? "#8A5B08" : "inherit" }}>{children}</span>
    </div>
  );
}

function RegRow({ reg, banks = [], showToast, onDone }) {
  // While pending_review the backend's bank column holds the claimed
  // email DOMAIN placeholder — never pre-fill that as the bank, or a
  // default one-click approve would store the domain string.
  const [bank, setBank] = useState(reg.bank || "");
  const [bankOther, setBankOther] = useState(false);
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

  // Every condition the Duyệt button depends on, as data — so the screen can
  // SAY why it is disabled instead of hiding the reason in a hover tooltip.
  // Mirrors approveRegistration() on the server exactly; if that changes,
  // change this with it.
  const expiryDate = savedReview.expiry ? new Date(savedReview.expiry) : null;
  const checks = [
    { ok: !!bank.trim(), label: "Đã chọn ngân hàng" },
    ...(isCtv
      ? [
          { ok: !!reg.has_proof, label: "Có văn bản uỷ quyền" },
          { ok: !!savedReview.note.trim(), label: "Đã lưu ghi chú xét duyệt" },
          {
            ok: !!expiryDate && expiryDate > new Date(),
            label: savedReview.expiry
              ? "Ngày hết hiệu lực còn hạn"
              : "Đã lưu ngày hết hiệu lực",
          },
        ]
      : []),
  ];
  const blocked = checks.filter((c) => !c.ok);

  return (
    <div className="card reg-row">
      <div className="reg-info">
        {/* Which kind of partner this is decides everything below, so it is
            the first thing on the row rather than something to infer. */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: ".04em",
              padding: "3px 8px", borderRadius: 4,
              background: isCtv ? "#FBF7EC" : "#E9F4EE",
              color: isCtv ? "#8A5B08" : "#00734F",
              border: `1px solid ${isCtv ? "#E8DCC2" : "#CBE9DC"}`,
            }}
          >
            {isCtv ? "CỘNG TÁC VIÊN" : "NHÂN VIÊN NGÂN HÀNG"}
          </span>
          <span style={{ fontSize: 15, fontWeight: 600 }}>
            {reg.display_name || "(chưa có tên)"}
          </span>
          <span className="queue-sub">{fmtDate(reg.created_at)}</span>
        </div>
        <div className="queue-sub" style={{ marginTop: 3 }}>
          {isCtv
            ? "Email cá nhân — danh tính dựa hoàn toàn vào văn bản uỷ quyền bên dưới."
            : "Tên miền email công việc chưa nằm trong danh sách tự xác minh."}
        </div>

        <Section n="1" title="Họ khai gì">
          <Field label="Email">
            <span className="mono">{reg.email}</span>
          </Field>
          <Field label="Điện thoại">
            <span className="mono">{reg.phone || "—"}</span>
          </Field>
          {/* The API's `claimed_domain` is actually rm_users.bank — the
              pre-approval placeholder — so the old label was wrong and it
              duplicated the row below. The email's own domain is the useful
              thing here: for an employee it is the evidence being weighed. */}
          <Field label="Tên miền email">
            <span className="mono">{(reg.email || "").split("@")[1] || "—"}</span>
          </Field>
          <Field label="Ngân hàng khai">{reg.bank || "— (chưa gán)"}</Field>
          <Field label="Chi nhánh">{reg.branch_name || "—"}</Field>
          {/* You are approving someone whose entire value is "can serve
              customers in X" — no coverage means their cards reach nobody. */}
          <Field
            label="Phục vụ"
            warn={!reg.cities || reg.cities.length === 0}
          >
            {reg.cities && reg.cities.length > 0
              ? reg.cities.join(", ")
              : "chưa chọn khu vực — thẻ sẽ không hiển thị cho ai"}
          </Field>
        </Section>

        {isCtv && (
          <>
            <Section n="2" title="Văn bản uỷ quyền">
              {reg.has_proof ? (
                <button className="btn btn-ghost" onClick={openProof}>
                  Mở văn bản {reg.proof_filename ? `(${reg.proof_filename})` : ""}
                </button>
              ) : (
                <div className="queue-sub" style={{ color: "#B42318" }}>
                  Chưa có văn bản — không đủ căn cứ để duyệt.
                </div>
              )}
            </Section>

            <Section n="3" title="Xét duyệt của bạn">
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
                <button className="btn btn-ghost" onClick={saveReview}>
                  Lưu xét duyệt
                </button>
                {savedReview.note.trim() && savedReview.expiry ? (
                  <span className="queue-sub" style={{ color: "#00734F" }}>
                    đã lưu
                  </span>
                ) : (
                  <span className="queue-sub">chưa lưu</span>
                )}
              </div>
              <div className="queue-sub" style={{ marginTop: 6 }}>
                Ngày hết hiệu lực: hết hạn thì tài khoản ngừng nhận lead cho tới khi có
                văn bản mới. Phải bấm <b>Lưu xét duyệt</b> thì mới duyệt được — máy chủ
                đọc giá trị đã lưu, không đọc ô đang gõ.
              </div>
            </Section>
          </>
        )}
      </div>
      <div className="reg-actions">
        <div className="mono-eyebrow" style={{ marginBottom: 6 }}>
          {isCtv ? "4 · Quyết định" : "2 · Quyết định"}
        </div>

        {/* A picker, not a text box: approving used to be able to invent a
            new spelling of an existing bank. "Khác…" keeps a bank that is not
            on the list from blocking an approval. */}
        {bankOther || banks.length === 0 ? (
          <input
            className="input"
            style={{ marginBottom: 8, width: 210 }}
            placeholder="Tên ngân hàng"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            autoFocus={bankOther}
          />
        ) : (
          <select
            className="input"
            style={{ marginBottom: 8, width: 210 }}
            value={bank}
            onChange={(e) => {
              if (e.target.value === "__other__") {
                setBankOther(true);
                setBank("");
              } else {
                setBank(e.target.value);
              }
            }}
          >
            <option value="">— Chọn ngân hàng —</option>
            {banks.map((b) => (
              <option key={b.brand} value={b.brand}>
                {b.brand}
                {b.auto_verify ? "" : " (không tự xác minh)"}
              </option>
            ))}
            <option value="__other__">Khác…</option>
          </select>
        )}

        {/* The gate, spelled out. This used to be a hover tooltip on a
            greyed-out button, which meant the answer to "why can't I click
            this" was invisible. */}
        <div style={{ marginBottom: 10 }}>
          {checks.map((c) => (
            <div
              key={c.label}
              style={{
                fontSize: 12.5, display: "flex", gap: 7, alignItems: "baseline",
                color: c.ok ? "#00734F" : "#8A5B08", padding: "1px 0",
              }}
            >
              <span style={{ fontWeight: 700 }}>{c.ok ? "✓" : "○"}</span>
              {c.label}
            </div>
          ))}
        </div>

        <button
          className="btn btn-navy btn-navy-inline"
          disabled={busy || blocked.length > 0}
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
