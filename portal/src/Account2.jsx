import React, { useEffect, useState } from "react";
import { api, vnd, clearToken } from "./api.js";

// Tài khoản v2 (§5) — Số dư first, then Giới hạn chi tiêu, then Hồ sơ.

export default function Account2({ me, onSignOut, showToast, refresh }) {
  const [ledger, setLedger] = useState([]);
  const [depositOpen, setDepositOpen] = useState(false);
  const w = me?.wallet;
  const total = (w?.availableVnd || 0) + (w?.heldVnd || 0);

  useEffect(() => {
    api.ledger().then((r) => setLedger(r.entries || [])).catch(() => {});
  }, [me?.wallet?.availableVnd, me?.wallet?.heldVnd]);

  if (!me) return null;

  const KIND_CHIP = {
    nap: { label: "nạp", style: { background: "#E5F6EE", color: "#00734F", border: "1px solid #CBE9DC" } },
    giu: { label: "giữ", style: { background: "#ECEEF8", color: "#191970", border: "1px solid #D9DEF2" } },
    hoan_giu: { label: "hoàn giữ", style: { background: "#F7F9FC", color: "#5A6378", border: "1px solid #E4E8F0" } },
    tru_phi: { label: "trừ phí", style: { background: "#FDF3E2", color: "#8A5B08", border: "1px solid #F3E1BE" } },
  };

  return (
    <div className="wrap" style={{ maxWidth: 860 }}>
      <h1 className="page">Tài khoản</h1>

      {/* ── Số dư ── */}
      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="bid-card-h">Số dư</span>
          {w && w.availableVnd < 200_000 && <span className="bid-chip amber">Sắp hết số dư</span>}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="bid-micro">Khả dụng</div>
            <div className="mono" style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.1 }}>{vnd(w?.availableVnd || 0)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="bid-micro">Tổng số dư</div>
            <div className="mono" style={{ fontSize: 17, fontWeight: 600 }}>{vnd(total)}</div>
          </div>
        </div>

        {/* one pot, two slices — legend under the figures it describes */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginTop: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="acc-split-bar" style={{ margin: 0 }}>
              <div style={{ width: total > 0 ? `${(w.availableVnd / total) * 100}%` : "100%" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontSize: 11.5, color: "var(--ink-55)", marginTop: 8 }}>
              <span><span className="acc-swatch navy" /> Sẵn sàng cho lead mới · <b className="mono">{vnd(w?.availableVnd || 0)}</b></span>
              <span>Đang giữ cho {w?.heldLeadCount ?? ""} lead · <b className="mono">{vnd(w?.heldVnd || 0)}</b> · hoàn lại nếu không mở thẻ <span className="acc-swatch held" /></span>
            </div>
          </div>
          <button className="btn-navy" style={{ height: 48, flex: "none" }} onClick={() => setDepositOpen(true)}>Nạp tiền</button>
        </div>
        {w?.heldVnd > 0 && (
          <div className="bid-micro" style={{ marginTop: 6 }}>
            Tổng số dư {vnd(total)} — phần giữ vẫn là tiền của bạn cho tới khi khách mở thẻ.
          </div>
        )}
        {w?.freeLeadsLeft > 0 && (
          <div className="reg-free-card" style={{ marginTop: 12, textAlign: "center" }}>
            <div style={{ display: "flex", gap: 5, justifyContent: "center", marginBottom: 4 }}>
              {[...Array(3)].map((_, i) => <span key={i} className="reg-pip" style={i >= w.freeLeadsLeft ? { opacity: 0.25 } : {}} />)}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--navy)" }}>Còn {w.freeLeadsLeft} lead đầu miễn phí</div>
          </div>
        )}

        <div className="eyebrow mono" style={{ margin: "18px 0 8px" }}>LỊCH SỬ SỐ DƯ</div>
        {ledger.length === 0 && (
          <div className="bid-micro">
            Chưa có giao dịch. Phần giữ được hoàn lại khi lead không thành công. Khi khách mở thẻ,
            Bonia trừ phí và hoàn phần giữ còn lại. Nạp tiền để nhận lead sau 3 lead đầu miễn phí.
          </div>
        )}
        {ledger.map((e, i) => {
          const chip = KIND_CHIP[e.kind] || { label: e.kind, style: { background: "#F7F9FC", color: "#5A6378", border: "1px solid #E4E8F0" } };
          return (
            <div key={i} className="acc-ledger-row">
              <span className="mono" style={{ width: 48, color: "var(--ink-45)", fontSize: 11.5 }}>
                {new Date(e.at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
              </span>
              <span className="acc-kind-chip" style={chip.style}>{chip.label}</span>
              <span style={{ flex: 1, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.note}</span>
              {/* Money actually leaving the wallet reads red. A `giữ` is
                  reserved, not spent, so it stays neutral even though it is
                  also negative — the two mean different things to a rep. */}
              <span
                className="mono"
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  color:
                    e.kind === "tru_phi" ? "#B42318"
                    : e.amount_vnd > 0 ? "#00734F"
                    : "var(--ink)",
                }}
              >
                {e.amount_vnd > 0 ? "+" : "−"}{vnd(Math.abs(e.amount_vnd))}
              </span>
            </div>
          );
        })}
        {ledger.length > 0 && (
          <div className="bid-micro" style={{ marginTop: 8 }}>
            Phần giữ được hoàn lại khi lead không thành công. Khi khách mở thẻ, Bonia trừ phí và hoàn phần giữ còn lại.
          </div>
        )}
      </div>

      {/* ── Giới hạn chi tiêu ── */}
      <SpendCap me={me} showToast={showToast} refresh={refresh} />

      {/* ── Hồ sơ ── */}
      <div className="card" style={{ marginTop: 14 }}>
        <span className="bid-card-h">Hồ sơ</span>
        <ProfileRow label="Họ tên" value={me.profile.displayName} />
        <ProfileRow label="Email công việc" mono value={me.profile.email || "—"}
          badge={me.profile.email ? "Đã xác minh" : null} />
        <ProfileRow label="Số điện thoại" mono value={me.profile.phone || "—"}
          action={<button className="bid-link-btn" onClick={() => showToast("Đổi số điện thoại qua Zalo Bonia trong bản này — tự đổi kèm OTP sẽ có sau.")}>Sửa</button>} />
        <ProfileRow label="Ngân hàng" value={me.profile.bank} />
        <ProfileRow label="Tên đăng nhập" mono value={me.profile.email || me.profile.username} />
        <button className="btn btn-ghost" style={{ marginTop: 14 }}
          onClick={() => { clearToken(); onSignOut(); }}>
          Đăng xuất
        </button>
      </div>

      {/* ── Chi nhánh & khu vực phục vụ ── */}
      <ServiceArea me={me} showToast={showToast} refresh={refresh} />

      {depositOpen && <DepositModal me={me} onClose={() => setDepositOpen(false)} />}
    </div>
  );
}

/**
 * Chi nhánh + khu vực phục vụ.
 *
 * Editable rather than signup-only: reps move branches and take on new
 * provinces, and a stale coverage list costs them leads silently — their
 * cards simply stop appearing for customers they could have served, with
 * nothing on screen explaining why.
 */
function ServiceArea({ me, showToast, refresh }) {
  const [editing, setEditing] = useState(false);
  const [branch, setBranch] = useState(me.profile.branchName || "");
  const [cities, setCities] = useState(me.profile.cities || []);
  const [cityList, setCityList] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (editing && cityList.length === 0) {
      api.cities().then((r) => setCityList(r.cities || [])).catch(() => {});
    }
  }, [editing, cityList.length]);

  const save = async () => {
    setBusy(true);
    try {
      await api.updateAccount({ branch_name: branch.trim(), cities });
      showToast("Đã cập nhật chi nhánh và khu vực");
      setEditing(false);
      refresh();
    } catch (ex) {
      showToast(
        ex.body?.error === "invalid_branch" ? "Nhập tên chi nhánh."
        : ex.body?.error === "cities_required" ? "Chọn ít nhất một tỉnh/thành."
        : "Không lưu được, thử lại."
      );
    } finally {
      setBusy(false);
    }
  };

  const saved = me.profile.cities || [];

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="bid-card-h">Chi nhánh & khu vực phục vụ</span>
        {!editing && (
          <button className="bid-link-btn" style={{ marginLeft: "auto" }} onClick={() => setEditing(true)}>
            Sửa
          </button>
        )}
      </div>

      {!editing ? (
        <>
          <ProfileRow label="Chi nhánh" value={me.profile.branchName || "—"} />
          <ProfileRow
            label="Khu vực phục vụ"
            value={
              saved.length > 0
                ? saved.join(", ")
                : <span style={{ color: "#8A5B08" }}>Chưa chọn — thẻ của bạn không hiển thị cho ai</span>
            }
          />
          <div className="bid-micro" style={{ marginTop: 10 }}>
            Bonia chỉ hiển thị thẻ của bạn cho khách ở những khu vực này.
          </div>
        </>
      ) : (
        <>
          <label className="bid-label" style={{ marginTop: 12 }}>Chi nhánh đang làm việc</label>
          <input
            className="input"
            style={{ height: 44 }}
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="VD: Chi nhánh Quận 7"
          />
          <label className="bid-label" style={{ marginTop: 14 }}>
            Bạn có thể phục vụ khách ở tỉnh/thành nào?
          </label>
          <div className="reg-city-grid" style={{ marginTop: 8 }}>
            {cityList.map((c) => {
              const on = cities.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  className={`reg-city-chip ${on ? "on" : ""}`}
                  onClick={() =>
                    setCities((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))
                  }
                >
                  {c}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <button
              className="btn-navy"
              disabled={busy || branch.trim().length < 3 || cities.length === 0}
              onClick={save}
            >
              {busy ? "Đang lưu…" : "Lưu"}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setEditing(false);
                setBranch(me.profile.branchName || "");
                setCities(me.profile.cities || []);
              }}
            >
              Huỷ
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ProfileRow({ label, value, mono = false, badge = null, action = null }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid #F1F4F9" }}>
      <span style={{ width: 130, fontSize: 12.5, color: "var(--ink-45)", flex: "none" }}>{label}</span>
      <span className={mono ? "mono" : ""} style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{value}</span>
      {badge && <span className="bid-chip green">{badge}</span>}
      {action}
    </div>
  );
}

function SpendCap({ me, showToast, refresh }) {
  const capNow = me.wallet?.monthlySpendCapVnd ?? null;
  const [draft, setDraft] = useState(capNow ?? 5_000_000);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (capNow != null) setDraft(capNow); }, [capNow]);
  const spent = me.wallet?.monthSpentVnd || 0;
  const on = capNow != null && capNow > 0;

  const save = async (value) => {
    setBusy(true);
    try {
      await api.updateAccount({ monthly_spend_cap_vnd: value });
      showToast(value === null ? "Đã tắt giới hạn" : `Giới hạn tháng: ${vnd(value)}`);
      refresh();
    } catch {
      showToast("Không lưu được giới hạn");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <span className="bid-card-h">Giới hạn chi tiêu</span>
      <div className="bid-helper" style={{ marginTop: 4 }}>
        Khi chạm giới hạn, lead mới chuyển cho người bid cao tiếp theo. Bid của bạn giữ nguyên.
      </div>
      <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap", marginTop: 12 }}>
        <div>
          <div className="bid-micro">Giới hạn mỗi tháng</div>
          <div className="bid-stepper large" style={{ marginTop: 5 }}>
            <button disabled={busy} onClick={() => setDraft((d) => Math.max(100_000, d - 500_000))}>−</button>
            <input className="mono" inputMode="numeric" value={draft.toLocaleString("de-DE")}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                setDraft(digits === "" ? 0 : parseInt(digits, 10));
              }}
              onBlur={() => setDraft((d) => Math.max(100_000, Math.round(d / 100_000) * 100_000))} />
            <span className="bid-suffix">đ</span>
            <button disabled={busy} onClick={() => setDraft((d) => d + 500_000)}>+</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {on && draft !== capNow && (
              <button className="bid-link-btn" disabled={busy} onClick={() => save(draft)}>Lưu giới hạn</button>
            )}
            <button className="bid-draft-btn" disabled={busy} onClick={() => save(on ? null : draft)}>
              {on ? "Tắt giới hạn" : "Bật lại giới hạn"}
            </button>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--ink-55)" }}>
            <span>Đã dùng tháng {new Date().getMonth() + 1}</span>
            <span className="mono">{vnd(spent)}</span>
          </div>
          <div className="bid-progress" style={{ height: 9, marginTop: 6 }}>
            <div style={{
              width: on ? `${Math.min(100, (spent / Math.max(1, capNow)) * 100)}%` : "0%",
              background: on && spent / Math.max(1, capNow) >= 0.9 ? "#D97706" : "var(--navy)",
            }} />
          </div>
          <div className="bid-micro" style={{ marginTop: 6 }}>
            {!on
              ? "Không giới hạn — bạn nhận lead miễn còn số dư."
              : on && spent / capNow >= 0.9
                ? "Sắp chạm giới hạn tháng này — lead mới sẽ sớm chuyển cho người khác."
                : `Còn ${vnd(Math.max(0, capNow - spent))} trong giới hạn tháng này.`}
          </div>
        </div>
      </div>
    </div>
  );
}

function DepositModal({ me, onClose }) {
  const d = me.wallet?.deposit;
  // WALLET HOLD, not the consumer reward. Collateral against the fee,
  // fixed at 50% (server: connect-user.ts needHold) and deliberately NOT
  // tracking platform_settings.consumer_reward_pct — the copy below keeps
  // saying 50% for the same reason.
  const holdExample = (bid) => Math.floor(bid / 2);
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal pay bn-up" style={{ maxWidth: 490 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Nạp tiền vào số dư</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 158, height: 158, border: "1px solid var(--border, #E4E8F0)", borderRadius: 12, padding: 8, background: "#fff", flex: "none" }}>
            {d?.qr_url
              ? <img src={d.qr_url} alt="VietQR" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              : <div className="bid-micro" style={{ display: "grid", placeItems: "center", height: "100%", textAlign: "center" }}>QR sẽ hiện khi cấu hình tài khoản nhận</div>}
          </div>
          <div style={{ flex: 1, minWidth: 200, fontSize: 13 }}>
            <div className="bid-micro">Ngân hàng</div>
            <div style={{ fontWeight: 600, marginBottom: 7 }}>{d?.bank_code || "—"}</div>
            <div className="bid-micro">Số tài khoản</div>
            <div className="mono" style={{ fontWeight: 600, marginBottom: 7 }}>{d?.account_number || "—"}</div>
            <div className="bid-micro">Chủ tài khoản</div>
            <div style={{ fontWeight: 600, marginBottom: 7 }}>{d?.account_holder || "—"}</div>
            <div className="bid-micro">Nội dung chuyển khoản</div>
            <div className="mono" style={{ fontWeight: 700, color: "var(--navy)" }}>{d?.memo || "—"}</div>
          </div>
        </div>
        <div className="bid-review-note" style={{ marginTop: 12 }}>
          Nhập <b>đúng nội dung chuyển khoản</b> — Bonia dùng nó để cộng đúng tài khoản của bạn.
        </div>
        <div style={{ borderTop: "1px solid #EEF1F6", marginTop: 14, paddingTop: 12 }}>
          <div className="eyebrow mono" style={{ marginBottom: 8 }}>SỐ DƯ NÀY MUA ĐƯỢC GÌ</div>
          {[500_000, 1_000_000, 2_000_000].map((amt) => (
            <div key={amt} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "4px 0" }}>
              <span className="mono" style={{ fontWeight: 600 }}>{vnd(amt)}</span>
              <span style={{ color: "var(--ink-55)" }}>≈ {Math.floor(amt / holdExample(450_000))} lead với bid 450.000đ</span>
            </div>
          ))}
          <div className="bid-micro" style={{ marginTop: 6 }}>
            Tính theo mức giữ 50% của bid hiện tại. Bạn chọn số tiền trong app ngân hàng.
          </div>
        </div>
      </div>
    </div>
  );
}
