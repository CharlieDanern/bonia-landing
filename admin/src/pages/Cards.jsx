import React, { useEffect, useMemo, useState } from "react";
import { api, consumerRewardVnd, DEFAULT_REWARD_PCT, fmtDate, vnd } from "../api.js";
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
  // Live consumer commission — the preview must print the reward the
  // consumer app would actually show, not a baked-in 50%.
  const settings = useLoad(() => api.settings(), []);
  const rewardPct = settings.data?.consumer_reward_pct ?? DEFAULT_REWARD_PCT;
  const cards = data?.cards || [];
  const sel = cards.find((c) => c.id === selId) || cards[0] || null;

  return (
    <div className="bn-up">
      <PageHead
        title="Duyệt thẻ"
        sub="Xem đúng những gì người dùng sẽ thấy, toàn bộ nội dung gốc, rồi gán loại thẻ và quyết định."
        at={settings.at}
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
              rewardPct={rewardPct}
              showToast={showToast}
              onDone={reload}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CardDetail({ card, rewardPct = DEFAULT_REWARD_PCT, showToast, onDone }) {
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
  // Reviewer's rewrite. `null` = not editing that field; the request only
  // carries fields actually touched, so an untouched field is never sent
  // and can never be blanked by an empty control.
  const [editing, setEditing] = useState(false);
  const [ed, setEd] = useState({});
  const [newImg, setNewImg] = useState(null); // { base64, mime, preview }
  const set = (k, v) => setEd((p) => ({ ...p, [k]: v }));
  const cur = (k, fallback) => (ed[k] !== undefined ? ed[k] : fallback);
  // What the rep changed since the last approval — highlight, not noise.
  const changed = card.changed?.fields || [];
  const wasChanged = (f) => changed.includes(f);

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

  const userReward = consumerRewardVnd(card.bid_vnd, rewardPct);
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
        ...(Object.keys(ed).length || newImg
          ? {
              edits: {
                ...(ed.name !== undefined ? { name: ed.name } : {}),
                ...(ed.perk !== undefined ? { perk_line: ed.perk } : {}),
                ...(ed.details !== undefined ? { details: ed.details } : {}),
                ...(ed.bullets !== undefined
                  ? { eligibility_bullets: splitLines(ed.bullets) }
                  : {}),
                ...(ed.rewardBullets !== undefined
                  ? { reward_bullets: splitLines(ed.rewardBullets) }
                  : {}),
                ...(newImg
                  ? { image_base64: newImg.base64, image_mime: newImg.mime }
                  : {}),
              },
            }
          : {}),
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
          Số tiền thưởng hiển thị = {rewardPct}% giá bid ({vnd(card.bid_vnd)} →{" "}
          <b className="mono">{vnd(userReward)}</b>). Ảnh nền là ảnh đầu tiên đối
          tác tải lên; nếu không có ảnh, app dùng nền màu ngân hàng. Nút{" "}
          <b>Chi tiết</b> mở phần nội dung bên dưới.
        </div>
      </div>

      <div className="bid-divider" />

      {/* ── 2 · Full raw content ─────────────────────────────── */}
      <div className="rv-head">
        <div className="mono-eyebrow">2 · Nội dung hiển thị cho khách</div>
        <button className="btn-ghost btn-sm" onClick={() => setEditing((v) => !v)}>
          {editing ? "Xong" : "Sửa nội dung"}
        </button>
      </div>

      {/* What the rep changed since you last approved. Only shown when a
          baseline exists — "no baseline" is said out loud rather than
          rendered as "nothing changed", which would be a highlight you
          could not trust. */}
      {card.changed && changed.length > 0 && (
        <div className="rv-changed">
          <b>Đối tác đã sửa:</b>{" "}
          {changed.map((f) => CHANGED_LABEL[f] || f).join(" · ")}
          <div className="rv-changed-sub">
            So với bản duyệt {card.changed.approved_at ? fmtDate(card.changed.approved_at) : ""}
            {card.changed.approved_by ? ` bởi ${card.changed.approved_by}` : ""}
          </div>
        </div>
      )}
      {card.changed && changed.length === 0 && (
        <div className="rv-changed neutral">Nội dung không đổi so với bản đã duyệt.</div>
      )}
      {!card.changed && card.status === "pending" && (
        <div className="rv-changed neutral">
          Chưa có bản duyệt trước để so sánh — đọc toàn bộ nội dung.
        </div>
      )}

      <div className="field-grid">
        <Field label="Ngân hàng" value={card.bank} />
        <EditField
          label="Tên thẻ"
          value={cur("name", card.name)}
          onChange={(v) => set("name", v)}
          editing={editing}
          changed={wasChanged("name")}
        />
        <EditField
          label="Ưu đãi (perk)"
          value={cur("perk", card.perk || "")}
          onChange={(v) => set("perk", v)}
          editing={editing}
          changed={wasChanged("perk")}
        />
        {/* Bid is READ-ONLY here on purpose — it is the partner's own money
            commitment and Bonia does not set it. Same rule as arbitration:
            we decide what is presented, never what they pay. */}
        <Field label="Giá bid (không sửa được)" value={vnd(card.bid_vnd)} mono />
        <Field
          label="Giới hạn khách đồng thời"
          value={card.max_active_leads != null ? String(card.max_active_leads) : "—"}
          mono
        />
        <Field label="Gửi lúc" value={fmtDate(card.created_at)} mono />
      </div>

      {/* Rep-authored free text, first section of the consumer "Chi tiết"
          sheet — so it is reviewed like perk/bullets. Newlines are the
          rep's formatting and survive to the app, so they survive here
          too (.tnc-box = pre-wrap + its own scroll). */}
      <div className="f-label" style={{ marginTop: 12 }}>
        Chi tiết thẻ (khách đọc đầu tiên)
      </div>
      {editing ? (
        <textarea
          className="inp"
          rows={6}
          value={cur("details", card.details || "")}
          onChange={(e) => set("details", e.target.value)}
          placeholder="Mô tả thẻ — khách đọc phần này đầu tiên."
        />
      ) : card.details ? (
        <div className={`tnc-box ${wasChanged("details") ? "is-changed" : ""}`}>
          {card.details}
        </div>
      ) : (
        <div className="f-val dim">—</div>
      )}

      <div className="f-label" style={{ marginTop: 12 }}>
        Quyền lợi (bullets)
      </div>
      {editing ? (
        <textarea
          className="inp"
          rows={4}
          value={cur("bullets", (card.bullets || []).join("\n"))}
          onChange={(e) => set("bullets", e.target.value)}
          placeholder="Mỗi dòng một ý"
        />
      ) : Array.isArray(card.bullets) && card.bullets.length > 0 ? (
        <ul className={`bullet-list ${wasChanged("bullets") ? "is-changed" : ""}`}>
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
      {editing ? (
        <textarea
          className="inp"
          rows={3}
          value={cur("rewardBullets", (card.reward_bullets || []).join("\n"))}
          onChange={(e) => set("rewardBullets", e.target.value)}
          placeholder="Mỗi dòng một điều kiện"
        />
      ) : Array.isArray(card.reward_bullets) && card.reward_bullets.length > 0 ? (
        <ul className={`bullet-list ${wasChanged("reward_bullets") ? "is-changed" : ""}`}>
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
        Ảnh thẻ ({media.length}){" "}
        {wasChanged("image") && <span className="rv-tag">đối tác đã đổi ảnh</span>}
      </div>
      {editing && (
        <div style={{ margin: "6px 0 8px" }}>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              // 500KB is the server's limit (decodeImage) — fail here with a
              // clear message rather than sending a request that must 400.
              if (f.size > 500 * 1024) {
                showToast("Ảnh quá 500KB — chọn ảnh nhỏ hơn.");
                e.target.value = "";
                return;
              }
              const b64 = await new Promise((res) => {
                const r = new FileReader();
                r.onload = () => res(String(r.result).split(",")[1]);
                r.readAsDataURL(f);
              });
              setNewImg({ base64: b64, mime: f.type, preview: URL.createObjectURL(f) });
            }}
          />
          {newImg && (
            <div style={{ marginTop: 8 }}>
              <img src={newImg.preview} alt="" className="media-thumb" />
              <button className="btn-ghost btn-sm" onClick={() => setNewImg(null)}>
                Bỏ ảnh mới
              </button>
            </div>
          )}
        </div>
      )}
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

const CHANGED_LABEL = {
  name: "tên thẻ",
  perk: "ưu đãi",
  bullets: "điều kiện xét duyệt",
  reward_bullets: "điều kiện nhận thưởng",
  details: "chi tiết",
  image: "ảnh",
};

/** Textarea lines → bullet array; blank lines dropped, empty ⇒ null. */
function splitLines(text) {
  const out = String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return out.length ? out : null;
}

/**
 * A field that reads as text until the reviewer turns editing on, and
 * carries a marker when the rep changed it since the last approval.
 */
function EditField({ label, value, onChange, editing, changed }) {
  return (
    <div className="f">
      <div className="f-label">
        {label} {changed && <span className="rv-tag">đã sửa</span>}
      </div>
      {editing ? (
        <input className="inp" value={value || ""} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div className={`f-val ${changed ? "is-changed" : ""}`}>{value || "—"}</div>
      )}
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
