import React, { useEffect, useRef, useState } from "react";
import { api, vnd } from "../api.js";
import { AppMirror } from "./Mirror.jsx";
import { Ladder } from "./Wizard.jsx";
import { statusChip, RankChip } from "./Board.jsx";
import { computePosition, clampBid, rewardOf, BID_STEP } from "./position.js";

// Card detail (§7) — the consumer view leads the screen (the card is the
// thing the rep is buying); bid + ladder, lead cap + pause, content
// editor, own-only bid history stack below.

// Mirrors the server's POST /rm/cards/:id/media contract: jpg/png/webp,
// max 500 KB, the new image REPLACES the current one (no gallery).
const MAX_IMAGE_BYTES = 500 * 1024;
const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];

export function BidDetail({ card, wallet, onBack, refresh, showToast }) {
  const [draft, setDraft] = useState(card.my_bid_vnd);
  const [busy, setBusy] = useState(false);
  const [capBusy, setCapBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pendingImage, setPendingImage] = useState(null); // {b64, mime, fileName, dataUrl}
  const [imageBusy, setImageBusy] = useState(false);
  const imageRef = useRef(null);
  useEffect(() => setDraft(card.my_bid_vnd), [card.my_bid_vnd]);

  const ranked = card.others_vnd != null && card.status === "approved";
  // Nothing moves until "Đặt bid" — ladder/callout/mirror reflect the
  // LIVE bid; the draft exists only inside the field.
  const pos = ranked
    ? computePosition(card.others_vnd, card.my_bid_vnd, card.i_hold_tiebreak, true)
    : null;
  const chip = statusChip(card, wallet);
  const reward = rewardOf(card.my_bid_vnd);
  const dirty = draft !== card.my_bid_vnd;
  const atCap = card.active_leads >= card.max_active_leads;

  const applyBid = async (amount) => {
    const target = amount ?? draft;
    setBusy(true);
    try {
      const res = await api.updateCard(card.card_id, { bid_vnd: target });
      showToast(`Đã đặt ${vnd(res.bid_vnd)} · khách thấy Nhận ${vnd(res.user_reward_vnd)}`);
      refresh();
    } catch (ex) {
      showToast(
        ex.body?.error === "bid_below_floor" ? `Tối thiểu ${vnd(card.floor_vnd)}`
          : ex.body?.error === "bid_not_step" ? `Bid theo bước ${vnd(BID_STEP)}`
            : ex.body?.error === "bid_too_high" ? "Bid vượt mức tối đa 20.000.000đ"
              : "Không đặt được bid, thử lại"
      );
    } finally {
      setBusy(false);
    }
  };

  const setCap = async (next) => {
    const cap = Math.max(1, Math.min(200, next));
    if (cap === card.max_active_leads) return;
    setCapBusy(true);
    try {
      await api.updateCard(card.card_id, { max_active_leads: cap });
      await refresh();
    } catch {
      showToast("Không lưu được giới hạn, thử lại");
    } finally {
      setCapBusy(false);
    }
  };

  const pickImage = (file) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) return showToast("Ảnh tối đa 500 KB");
    if (!IMAGE_MIMES.includes(file.type)) return showToast("Chỉ nhận jpg, png hoặc webp");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setPendingImage({
        b64: String(dataUrl).split(",")[1],
        mime: file.type,
        fileName: file.name,
        dataUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  const saveImage = async () => {
    if (!pendingImage) return;
    setImageBusy(true);
    try {
      await api.uploadCardMedia(card.card_id, {
        image_base64: pendingImage.b64,
        image_mime: pendingImage.mime,
      });
      showToast("Đã cập nhật ảnh thẻ");
      setPendingImage(null);
      refresh();
    } catch (ex) {
      showToast(
        ex.body?.error === "image_too_large" ? "Ảnh tối đa 500 KB"
          : ex.body?.error === "unsupported_image_type" ? "Chỉ nhận jpg, png hoặc webp"
            : "Không tải được ảnh, thử lại"
      );
    } finally {
      setImageBusy(false);
    }
  };

  const togglePause = async () => {
    try {
      await api.updateCard(card.card_id, { paused: !card.paused });
      showToast(card.paused ? "Đã nhận lead trở lại" : "Đã tạm dừng nhận lead — bid giữ nguyên");
      refresh();
    } catch {
      showToast("Không thực hiện được, thử lại");
    }
  };

  return (
    <div className="wrap" style={{ maxWidth: 1080 }}>
      <button className="bid-backlink" onClick={onBack}>← Bid của tôi</button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h1 className="page bid-h1-detail" style={{ marginBottom: 2 }}>{card.name}</h1>
        <span className={`bid-chip ${card.listed ? "green" : chip.cls}`}>
          {card.listed ? "Đang hiển thị" : chip.text}
        </span>
      </div>
      <div className="bid-type-line" style={{ marginBottom: 16 }}>
        {card.type_label ? `Loại thẻ: ${card.type_label} · ${card.bank}` : "Bonia sẽ xác định loại thẻ khi duyệt"}
      </div>

      {card.status === "draft" && (
        <div className="bid-banner amber" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ flex: 1 }}>Bản nháp — khách hàng chưa thấy thẻ này.</span>
          <button className="bid-link-btn" onClick={async () => {
            try {
              await api.updateCard(card.card_id, { submit: true });
              showToast("Đã gửi Bonia duyệt. Bid có hiệu lực ngay khi thẻ được duyệt.");
              refresh();
            } catch {
              showToast("Không gửi được, thử lại");
            }
          }}>Gửi Bonia duyệt</button>
        </div>
      )}

      {/* Consumer view — mirror + the terms panel, side by side (§7) */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 286, maxWidth: 520 }}>
          <AppMirror
            bank={card.bank}
            name={card.name}
            perk={card.perk_line}
            rewardVnd={reward}
            imageUrl={pendingImage ? pendingImage.dataUrl : card.image_url}
            cta="Quan tâm"
          />
          <div style={{ display: "flex", gap: 9, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
            {pendingImage ? (
              <>
                <button className="btn-navy" disabled={imageBusy} onClick={saveImage}>
                  {imageBusy ? "Đang tải lên…" : "Lưu ảnh mới"}
                </button>
                <button className="btn btn-ghost" disabled={imageBusy} onClick={() => setPendingImage(null)}>
                  Huỷ
                </button>
                <span className="bid-micro">Xem trước {pendingImage.fileName} — chưa lưu.</span>
              </>
            ) : (
              <span className="bid-micro">
                <button className="bid-link-btn" onClick={() => imageRef.current?.click()}>Đổi ảnh</button>
                {" "}· jpg, png, webp · tối đa 500 KB
              </span>
            )}
            <input ref={imageRef} type="file" accept="image/jpeg,image/png,image/webp" hidden
              onChange={(e) => { pickImage(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
        </div>
        <div className="bid-terms" style={{ flex: 1, minWidth: 256 }}>
          <div className="eyebrow mono">ĐIỀU KIỆN XÉT DUYỆT</div>
          <ul>
            {(card.eligibility_bullets || []).map((b, i) => <li key={i}>{b}</li>)}
            {(card.eligibility_bullets || []).length === 0 && <li>Chưa có điều kiện.</li>}
          </ul>
          <div className="eyebrow mono" style={{ marginTop: 12 }}>ĐIỀU KIỆN NHẬN THƯỞNG</div>
          {card.reward_conditions ? (
            <div style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-line", margin: "6px 0 4px" }}>
              {card.reward_conditions}
            </div>
          ) : null}
          <ul>
            <li>Thẻ được {card.bank} phê duyệt và phát hành thành công.</li>
            <li>Thưởng thanh toán trong 7 ngày sau khi ngân hàng xác nhận.</li>
          </ul>
          <div className="bid-caution">
            Ngân hàng có quyền từ chối hồ sơ — khi đó bạn không mất phí nào.
          </div>
        </div>
      </div>

      {/* Bid */}
      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="bid-card-h">Bid</span>
          {pos && <RankChip card={card} pos={pos} />}
        </div>
        <div style={{ display: "flex", gap: 9, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
          <div className="bid-stepper detail">
            <button onClick={() => setDraft((d) => Math.max(card.floor_vnd, d - BID_STEP))}>−</button>
            <input className="mono" inputMode="numeric"
              value={draft === 0 ? "" : draft.toLocaleString("de-DE")}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                setDraft(digits === "" ? 0 : parseInt(digits, 10));
              }}
              onBlur={() => setDraft((d) => clampBid(d, card.floor_vnd))} />
            <button onClick={() => setDraft((d) => clampBid(d, card.floor_vnd) + BID_STEP)}>+</button>
          </div>
          <button className={`bid-apply inline ${dirty ? "" : "applied"}`}
            disabled={!dirty || busy || draft < card.floor_vnd} onClick={() => applyBid()}>
            {busy ? "Đang đặt…" : dirty ? "Đặt bid" : "Đã áp dụng"}
          </button>
        </div>
        <div className="bid-micro" style={{ marginTop: 7 }}>
          Bước {vnd(BID_STEP)} · sàn {vnd(card.floor_vnd)} · đang áp dụng {vnd(card.my_bid_vnd)}
        </div>

        {pos && (
          <>
            <div style={{ marginTop: 12 }}>
              <Ladder rows={pos.rows} mineIndex={pos.mineIndex} title="MỨC BID CÙNG LOẠI THẺ" />
            </div>
            {pos.rank > 1 && (
              <div className="bid-banner amber" style={{ marginTop: 10 }}>
                {pos.tiedCount > 1 && !pos.holdsTiebreak
                  ? "Đồng giá với người đặt trước — họ nhận lead trước."
                  : `Kém ${vnd(pos.gapToTop)} so với hạng 1. Khách hàng đang thấy thẻ của người dẫn đầu.`}
              </div>
            )}
            {pos.suggested != null && (
              <button className="bid-nudge" style={{ width: "100%", marginTop: 10 }}
                onClick={() => { setDraft(pos.suggested); applyBid(pos.suggested); }}>
                {pos.tiedCount > 1 && !pos.holdsTiebreak
                  ? `Nâng ${vnd(BID_STEP)} để vượt`
                  : `Đặt ${vnd(pos.suggested)} để dẫn đầu`}
              </button>
            )}
          </>
        )}
      </div>

      {/* Nhận lead */}
      <div className="card" style={{ marginTop: 14 }}>
        <span className="bid-card-h">Nhận lead</span>
        <div className="bid-helper" style={{ marginTop: 4 }}>
          Khi pipeline đầy hoặc bạn tạm dừng, lead mới chuyển cho người bid cao tiếp theo.
          Bid của bạn được giữ nguyên.
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
          <div className="bid-stepper">
            <button disabled={capBusy} onClick={() => setCap(card.max_active_leads - 1)}>−</button>
            <input className="mono" readOnly value={card.max_active_leads} />
            <button disabled={capBusy} onClick={() => setCap(card.max_active_leads + 1)}>+</button>
          </div>
          <span style={{ fontSize: 13, color: "var(--ink-55)" }}>
            Tối đa lead đang xử lý · hiện có {card.active_leads}
          </span>
        </div>
        <div className={`bid-progress ${atCap ? "amber" : ""}`}>
          <div style={{ width: `${Math.min(100, (card.active_leads / card.max_active_leads) * 100)}%` }} />
        </div>
        <div className="bid-micro">
          {card.paused
            ? "Đã tạm dừng — lead mới chuyển cho người bid cao tiếp theo."
            : atCap
              ? `Tạm dừng nhận lead — pipeline đầy (${card.active_leads}/${card.max_active_leads}). Xử lý bớt lead trong Pipeline để tiếp tục nhận.`
              : `Đang nhận lead · còn nhận được ${card.max_active_leads - card.active_leads} lead nữa.`}
        </div>
        <div className="bid-divider" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Tạm dừng nhận lead</div>
            <div className="bid-micro">Giữ bid, không nhận lead mới</div>
          </div>
          <button className={`bid-switch ${card.paused ? "on" : ""}`} onClick={togglePause} aria-label="Tạm dừng nhận lead">
            <span />
          </button>
        </div>
      </div>

      {/* Nội dung thẻ */}
      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="bid-card-h">Nội dung thẻ</span>
            <div className="bid-micro">Sửa nội dung sẽ gửi lại cho Bonia duyệt</div>
          </div>
          {!editing && (
            <button className="bid-link-btn" onClick={() => setEditing(true)}>Sửa nội dung</button>
          )}
        </div>
        {editing && (
          <ContentEditor card={card} showToast={showToast}
            onDone={() => { setEditing(false); refresh(); }}
            onCancel={() => setEditing(false)} />
        )}
      </div>

      {/* Lịch sử bid */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="eyebrow mono">LỊCH SỬ BID CỦA BẠN</div>
        <div style={{ marginTop: 8 }}>
          {(card.bid_history || []).map((h, i, arr) => (
            <div key={i} className="bid-history-row">
              <span className="mono" style={{ color: "var(--ink-45)" }}>
                {new Date(h.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
              </span>
              <span className="mono" style={{ fontWeight: 600 }}>{vnd(h.amount_vnd)}</span>
              <span style={{ flex: 1 }} />
              <span className="bid-micro">
                {i === 0 ? "đang áp dụng" : i === arr.length - 1 ? "mức đầu tiên" : ""}
              </span>
            </div>
          ))}
        </div>
        <div className="bid-micro" style={{ marginTop: 8 }}>Chỉ bạn nhìn thấy lịch sử này.</div>
      </div>
    </div>
  );
}

const REWARD_CONDITIONS_MAX = 600;

function ContentEditor({ card, onDone, onCancel, showToast }) {
  const [name, setName] = useState(card.name);
  const [perk, setPerk] = useState(card.perk_line || "");
  const [conds, setConds] = useState(
    (card.eligibility_bullets || []).length ? [...card.eligibility_bullets] : [""]
  );
  const [rewardConds, setRewardConds] = useState(card.reward_conditions || "");
  const [busy, setBusy] = useState(false);
  const condList = conds.map((c) => c.trim()).filter(Boolean);

  const save = async () => {
    setBusy(true);
    try {
      const res = await api.updateCard(card.card_id, {
        name: name.trim(),
        perk_line: perk.trim(),
        eligibility_bullets: condList,
        reward_conditions: rewardConds.trim(),
      });
      showToast(
        res.status === "pending"
          ? "Đã gửi nội dung cho Bonia duyệt lại. Bid vẫn giữ nguyên."
          : "Đã lưu nội dung."
      );
      onDone();
    } catch (ex) {
      showToast(
        ex.body?.error === "perk_too_long" ? "Ưu đãi tối đa 40 ký tự"
          : ex.body?.error === "reward_conditions_too_long" ? "Điều kiện nhận thưởng tối đa 600 ký tự"
            : "Không lưu được, thử lại"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <label className="bid-label">Tên thẻ</label>
      <input className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <label className="bid-label">Ưu đãi một dòng</label>
        <span className={`mono bid-counter ${perk.length > 40 ? "over" : ""}`}>{perk.length}/40</span>
      </div>
      <input className={`input ${perk.length > 40 ? "input-over" : ""}`} value={perk} maxLength={60}
        onChange={(e) => setPerk(e.target.value)} />
      <label className="bid-label">Điều kiện xét duyệt</label>
      {conds.map((c, i) => (
        <div key={i} className="bid-cond-row">
          <span className="mono bid-cond-index">{i + 1}</span>
          <input className="input" style={{ height: 42, marginBottom: 0 }} value={c}
            onChange={(e) => setConds((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))} />
          <button className="bid-cond-x" onClick={() => setConds((arr) => arr.length > 1 ? arr.filter((_, j) => j !== i) : [""])}>×</button>
        </div>
      ))}
      <button className="bid-cond-add" disabled={conds.length >= 6}
        onClick={() => setConds((arr) => (arr.length < 6 ? [...arr, ""] : arr))}>
        {conds.length >= 6 ? "Tối đa 6 điều kiện" : "+ Thêm điều kiện"}
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <label className="bid-label">Điều kiện nhận thưởng</label>
        <span className="mono bid-counter">{rewardConds.length}/{REWARD_CONDITIONS_MAX}</span>
      </div>
      <textarea
        className="input"
        style={{ minHeight: 92, height: "auto", padding: "11px 13px", resize: "vertical", lineHeight: 1.5 }}
        value={rewardConds}
        maxLength={REWARD_CONDITIONS_MAX}
        onChange={(e) => setRewardConds(e.target.value)}
      />
      <div className="bid-helper">
        Ngân hàng tự quyết định điều kiện khách được nhận thưởng — hiển thị cho khách trong mục Điều kiện.
      </div>
      <div style={{ display: "flex", gap: 9, marginTop: 12 }}>
        <button className="btn btn-ghost" onClick={onCancel}>Huỷ</button>
        <button className="btn-navy" style={{ flex: 1 }}
          disabled={busy || !name.trim() || perk.length > 40 || condList.length < 1}
          onClick={save}>
          {busy ? "Đang gửi…" : "Lưu và gửi duyệt lại"}
        </button>
      </div>
    </div>
  );
}
