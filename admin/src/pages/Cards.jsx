import React, { useEffect, useMemo, useState } from "react";
import { api, fmtDate, vnd } from "../api.js";
import {
  CARD_STATUS,
  ConfirmModal,
  Empty,
  ErrBox,
  Loading,
  PageHead,
  StatusChip,
  useLoad,
} from "../components.jsx";
import { AppMirror } from "../Mirror.jsx";

const FILTERS = [
  { key: "pending", label: "Chờ duyệt" },
  { key: "approved", label: "Đã duyệt" },
  { key: "rejected", label: "Từ chối" },
  { key: "all", label: "Tất cả" },
];

const DEFAULT_FLOOR = 100000;

// Type auto-match: lowercase, strip diacritics (incl. đ→d), collapse spaces.
const normalize = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();

export default function Cards({ showToast }) {
  const [status, setStatus] = useState("pending");
  const [selId, setSelId] = useState(null);
  const { data, loading, error, reload } = useLoad(() => api.cards(status), [status]);
  const cards = data?.cards || [];
  const sel = cards.find((c) => c.id === selId) || cards[0] || null;

  return (
    <div className="bn-up">
      <PageHead
        title="Duyệt thẻ"
        sub="Xem đúng những gì người dùng sẽ thấy, toàn bộ nội dung gốc, rồi gán loại thẻ và quyết định."
      />
      <div className="pl-lanes" style={{ marginBottom: 14 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`pl-lane ${status === f.key ? "on" : ""}`}
            onClick={() => {
              setStatus(f.key);
              setSelId(null);
            }}
          >
            {f.label}
            {status === f.key && data ? (
              <span className="pl-lane-count">{cards.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : null}
      {error ? <ErrBox error={error} onRetry={reload} /> : null}
      {!loading && !error && cards.length === 0 ? (
        <Empty>
          Không có thẻ nào trong hàng đợi này. Thẻ mới do đối tác gửi sẽ xuất hiện ở
          đây để duyệt trước khi hiển thị cho người dùng.
        </Empty>
      ) : null}

      {cards.length > 0 ? (
        <div className="split">
          <div className="queue">
            {cards.map((c) => (
              <button
                key={c.id}
                className={`queue-btn ${sel && sel.id === c.id ? "sel" : ""}`}
                onClick={() => setSelId(c.id)}
              >
                <div className="queue-top">
                  <span className="queue-name">{c.name || "(chưa đặt tên)"}</span>
                  <StatusChip map={CARD_STATUS} value={c.status} />
                </div>
                <div className="queue-sub">
                  {c.bank} · {c.rm?.display_name || "?"}
                </div>
                <div className="queue-sub mono">
                  Bid {vnd(c.bid_vnd)} · {fmtDate(c.created_at)}
                </div>
              </button>
            ))}
          </div>
          {sel ? (
            <CardDetail
              key={sel.id}
              card={sel}
              showToast={showToast}
              onDone={reload}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CardDetail({ card, showToast, onDone }) {
  const typesLoad = useLoad(() => api.cardTypes(card.bank), [card.bank]);
  const types = typesLoad.data?.types || [];

  const [typeLabel, setTypeLabel] = useState(card.type?.label || "");
  const [floor, setFloor] = useState(
    card.type?.floor_vnd != null ? String(card.type.floor_vnd) : String(DEFAULT_FLOOR)
  );
  const [floorTouched, setFloorTouched] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const matched = useMemo(
    () =>
      types.find(
        (t) => t.label.trim().toLowerCase() === typeLabel.trim().toLowerCase()
      ) || null,
    [types, typeLabel]
  );

  // When the typed label matches an existing type, prefill its floor
  // (unless the reviewer already edited the floor by hand).
  useEffect(() => {
    if (matched && !floorTouched) setFloor(String(matched.floor_vnd));
  }, [matched, floorTouched]);

  // Type auto-match at review: once the bank's types load, prefill the type
  // input from normalize(card.name) — the matched existing label if one
  // exists, otherwise the card name (new type). Runs once per selected card
  // (component is keyed by card id); the input stays fully editable.
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => {
    if (prefilled || card.status !== "pending") return;
    if (typesLoad.loading || typesLoad.error) return;
    setPrefilled(true);
    if (typeLabel.trim()) return; // an already-assigned type wins
    const key = normalize(card.name);
    const hit = key ? types.find((t) => normalize(t.label) === key) : null;
    setTypeLabel(hit ? hit.label : card.name || "");
  }, [prefilled, card, typesLoad.loading, typesLoad.error, types, typeLabel]);

  const userReward = card.bid_vnd != null ? Math.floor(card.bid_vnd / 2) : null;
  const media = card.media_urls || [];

  const doApprove = async (force = false) => {
    setBusy(true);
    try {
      await api.reviewCard(card.id, {
        action: "approve",
        ...(typeLabel.trim() ? { type_label: typeLabel.trim() } : {}),
        ...(floor !== "" && !Number.isNaN(Number(floor))
          ? { floor_vnd: Number(floor) }
          : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(force ? { force: true } : {}),
      });
      setForceOpen(false);
      showToast("Đã duyệt thẻ — thẻ sẽ hiển thị cho người dùng.");
      onDone();
    } catch (ex) {
      if (ex.status === 409 && ex.body?.error === "bid_below_type_floor") {
        setForceOpen(true);
      } else {
        showToast(`Lỗi: ${ex.body?.error || ex.message}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const doReject = async () => {
    setBusy(true);
    try {
      await api.reviewCard(card.id, { action: "reject", note: note.trim() });
      setRejectOpen(false);
      showToast("Đã từ chối thẻ — đối tác sẽ thấy lý do.");
      onDone();
    } catch (ex) {
      showToast(`Lỗi: ${ex.body?.error || ex.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="detail card">
      {/* ── 1 · Consumer preview ─────────────────────────────── */}
      <div className="mono-eyebrow">1 · Người dùng sẽ thấy</div>
      <div className="preview-row">
        <div style={{ width: 340, maxWidth: "100%" }}>
          <AppMirror
            bank={card.bank}
            name={card.name}
            perk={card.perk}
            rewardVnd={userReward}
            imageUrl={media[0] || null}
            cta="Quan tâm"
          />
        </div>
        <div className="preview-note">
          Số tiền thưởng hiển thị = 50% giá bid ({vnd(card.bid_vnd)} →{" "}
          <b className="mono">{vnd(userReward)}</b>). Ảnh nền là ảnh đầu tiên đối
          tác tải lên; nếu không có ảnh, app dùng nền màu ngân hàng.
        </div>
      </div>

      <div className="bid-divider" />

      {/* ── 2 · Full raw content ─────────────────────────────── */}
      <div className="mono-eyebrow">2 · Nội dung gốc đầy đủ</div>
      <div className="field-grid">
        <Field label="Ngân hàng" value={card.bank} />
        <Field label="Tên thẻ" value={card.name} />
        <Field label="Ưu đãi (perk)" value={card.perk} />
        <Field label="Giá bid" value={vnd(card.bid_vnd)} mono />
        <Field
          label="Giới hạn khách đồng thời"
          value={card.max_active_leads != null ? String(card.max_active_leads) : "—"}
          mono
        />
        <Field label="Gửi lúc" value={fmtDate(card.created_at)} mono />
      </div>

      <div className="f-label" style={{ marginTop: 12 }}>
        Quyền lợi (bullets)
      </div>
      {Array.isArray(card.bullets) && card.bullets.length > 0 ? (
        <ul className="bullet-list">
          {card.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      ) : (
        <div className="f-val dim">Không có</div>
      )}

      <div className="f-label" style={{ marginTop: 12 }}>
        Điều kiện nhận thưởng
      </div>
      {Array.isArray(card.reward_bullets) && card.reward_bullets.length > 0 ? (
        <ul className="bullet-list">
          {card.reward_bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      ) : (
        <div className="f-val dim">—</div>
      )}

      <div className="f-label" style={{ marginTop: 12 }}>
        Điều kiện &amp; điều khoản (toàn văn)
      </div>
      {card.tnc ? (
        <div className="tnc-box">{card.tnc}</div>
      ) : (
        <div className="f-val dim">Không có</div>
      )}

      <div className="f-label" style={{ marginTop: 12 }}>
        Ảnh thẻ ({media.length})
      </div>
      {media.length > 0 ? (
        <div className="media-row">
          {media.map((u, i) => (
            <button
              key={i}
              className="media-thumb"
              title="Mở ảnh gốc"
              onClick={() => window.open(u, "_blank", "noopener")}
            >
              <img src={u} alt={`Ảnh ${i + 1}`} loading="lazy" />
            </button>
          ))}
        </div>
      ) : (
        <div className="f-val dim">Đối tác chưa tải ảnh nào.</div>
      )}

      <div className="rm-box">
        <div className="mono-eyebrow" style={{ marginBottom: 6 }}>
          Đối tác gửi thẻ
        </div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {card.rm?.display_name || "—"}{" "}
          <span className="dim" style={{ fontWeight: 400 }}>
            · {card.rm?.bank || "—"}
          </span>
        </div>
        <div className="queue-sub mono">
          {card.rm?.email || "—"} · @{card.rm?.username || "—"}
        </div>
      </div>

      {card.review_note ? (
        <div className="callout-note">
          <b>Ghi chú duyệt trước đó:</b> {card.review_note}
        </div>
      ) : null}

      <div className="bid-divider" />

      {/* ── 3 · Decision panel ───────────────────────────────── */}
      {card.status === "pending" ? (
        <>
          <div className="mono-eyebrow">3 · Quyết định</div>
          <label className="lbl" htmlFor="type-input">
            Loại thẻ (gán để xếp cùng nhóm cạnh tranh)
          </label>
          <input
            id="type-input"
            className="input"
            list="type-dl"
            placeholder="Ví dụ: Cashback, Du lịch, Sinh viên…"
            value={typeLabel}
            onChange={(e) => setTypeLabel(e.target.value)}
          />
          <datalist id="type-dl">
            {types.map((t) => (
              <option key={t.id} value={t.label}>
                {`Sàn ${vnd(t.floor_vnd)} · ${t.variant_count} thẻ đang hiển thị · bid cao nhất ${vnd(t.top_bid_vnd)}`}
              </option>
            ))}
          </datalist>
          {matched ? (
            <div className="bid-helper">
              Trùng loại thẻ hiện có — thẻ này sẽ cạnh tranh trong cùng khung
              giá. Sàn {vnd(matched.floor_vnd)} · {matched.variant_count} thẻ
              đang hiển thị · bid cao nhất {vnd(matched.top_bid_vnd)}
            </div>
          ) : typeLabel.trim() ? (
            <div className="bid-helper">
              Loại mới cho {card.bank} — sẽ được tạo với sàn nhập bên dưới.
            </div>
          ) : null}

          {typesLoad.loading ? (
            <div className="bid-helper">Đang tải loại thẻ của {card.bank}…</div>
          ) : null}
          {typesLoad.error ? (
            <ErrBox error={typesLoad.error} onRetry={typesLoad.reload} />
          ) : null}
          {types.length > 0 ? (
            <div className="tbl-wrap" style={{ marginTop: 8 }}>
              <table className="tbl compact">
                <thead>
                  <tr>
                    <th>Loại của {card.bank}</th>
                    <th>Sàn</th>
                    <th>Đang hiển thị</th>
                    <th>Bid cao nhất</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((t) => (
                    <tr
                      key={t.id}
                      className="clickable"
                      onClick={() => {
                        setTypeLabel(t.label);
                        setFloorTouched(false);
                      }}
                    >
                      <td>{t.label}</td>
                      <td className="mono">{vnd(t.floor_vnd)}</td>
                      <td className="mono">{t.variant_count}</td>
                      <td className="mono">{vnd(t.top_bid_vnd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !typesLoad.loading && !typesLoad.error ? (
            <div className="bid-helper">
              Chưa có loại thẻ nào cho {card.bank} — loại đầu tiên sẽ được tạo khi
              duyệt.
            </div>
          ) : null}

          <label className="lbl" htmlFor="floor-input">
            Sàn bid của loại (floor, VND)
          </label>
          <input
            id="floor-input"
            className="input mono"
            type="number"
            min="0"
            step="10000"
            value={floor}
            onChange={(e) => {
              setFloor(e.target.value);
              setFloorTouched(true);
            }}
          />

          <label className="lbl" htmlFor="note-input">
            Ghi chú (bắt buộc khi từ chối — đối tác sẽ đọc được)
          </label>
          <textarea
            id="note-input"
            className="input input-area"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: Ảnh mờ, vui lòng tải lại ảnh mặt trước thẻ…"
          />

          <div className="action-row">
            <button
              className="btn btn-navy btn-navy-inline"
              disabled={busy}
              onClick={() => doApprove(false)}
            >
              {busy ? "Đang xử lý…" : "Duyệt"}
            </button>
            <button
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => {
                if (!note.trim()) {
                  showToast("Cần nhập lý do vào ô ghi chú trước khi từ chối.");
                  return;
                }
                setRejectOpen(true);
              }}
            >
              Từ chối
            </button>
          </div>
        </>
      ) : (
        <div className="callout-note">
          Thẻ đã được xử lý:{" "}
          <StatusChip map={CARD_STATUS} value={card.status} />
          {card.review_note ? <> — {card.review_note}</> : null}
        </div>
      )}

      <ConfirmModal
        open={forceOpen}
        title="Bid thấp hơn sàn của loại thẻ"
        confirmLabel="Vẫn duyệt (force)"
        onConfirm={() => doApprove(true)}
        onCancel={() => setForceOpen(false)}
        busy={busy}
      >
        Giá bid của thẻ ({vnd(card.bid_vnd)}) đang thấp hơn sàn{" "}
        {matched ? vnd(matched.floor_vnd) : vnd(Number(floor))} của loại{" "}
        <b>{typeLabel.trim() || "đã chọn"}</b>. Nếu vẫn duyệt, thẻ được chấp nhận
        nhưng <b>sẽ không hiển thị cho người dùng</b> cho đến khi đối tác nâng bid
        lên đủ sàn.
      </ConfirmModal>

      <ConfirmModal
        open={rejectOpen}
        title="Từ chối thẻ này?"
        confirmLabel="Từ chối"
        danger
        onConfirm={doReject}
        onCancel={() => setRejectOpen(false)}
        busy={busy}
      >
        Thẻ <b>{card.name}</b> sẽ bị từ chối và đối tác nhận được lý do:
        <div className="tnc-box" style={{ marginTop: 8, maxHeight: 120 }}>
          {note.trim()}
        </div>
      </ConfirmModal>
    </div>
  );
}

function Field({ label, value, mono = false }) {
  return (
    <div>
      <div className="f-label">{label}</div>
      <div className={`f-val ${mono ? "mono" : ""} ${value ? "" : "dim"}`}>
        {value || "—"}
      </div>
    </div>
  );
}
