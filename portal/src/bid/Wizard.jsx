import React, { useMemo, useRef, useState } from "react";
import { api, vnd } from "../api.js";
import { AppMirror, PhonePreview } from "./Mirror.jsx";
import {
  clampBid,
  computePosition,
  rewardOf,
  BID_STEP,
  BID_FLOOR_DEFAULT,
  DEFAULT_REWARD_PCT,
} from "./position.js";

// "Thêm thẻ" — 3 discrete steps (content → art → bid) ending in the
// app-mirror preview. One decision per screen; every step resumable via
// "Lưu nháp". The bid step is the only one that costs money, so it gets
// its own screen and the provisional position panel (§5, §9.1).

const MAX_IMAGE_BYTES = 500 * 1024;
// Mirrors the server's cleanBullets contract (rm-cards.ts): max 6
// bullets, 120 chars each — same caps as Điều kiện xét duyệt.
const BULLET_MAX_COUNT = 6;
const BULLET_MAX_CHARS = 120;
// Mirrors the server's cleanDetails contract (rm-cards.ts): free text,
// 2000 chars, trimmed at the ends only — interior newlines survive
// because the consumer sheet renders this as prose with breaks.
const DETAILS_MAX_CHARS = 2000;

function StepHeader({ step, onBack }) {
  const steps = ["Thông tin thẻ", "Hình ảnh", "Bid"];
  return (
    <div>
      <button className="bid-backlink" onClick={onBack}>← Bid của tôi</button>
      <div className="bid-steps">
        {steps.map((label, i) => (
          <React.Fragment key={label}>
            {i > 0 && <span className="bid-step-rule" />}
            <span className={`bid-step-badge mono ${i === step ? "current" : i < step ? "done" : ""}`}>
              {i + 1}
            </span>
            <span className={`bid-step-label ${i === step ? "current" : ""}`}>{label}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function WizardFooter({ onCancel, cancelLabel, onDraft, next, nextLabel, nextDisabled, onDisabledNext }) {
  return (
    <div className="bid-wizard-footer">
      <button className="btn btn-ghost" onClick={onCancel}>{cancelLabel}</button>
      <div style={{ flex: 1 }} />
      <button className="bid-draft-btn" onClick={onDraft}>Lưu nháp</button>
      <button
        className="btn-navy"
        style={nextDisabled ? { opacity: 0.45 } : undefined}
        onClick={nextDisabled ? onDisabledNext : next}
      >
        {nextLabel}
      </button>
    </div>
  );
}

export function BidWizard({ bank, sampleOthers, rewardPct = DEFAULT_REWARD_PCT, onDone, onCancel, showToast }) {
  const [step, setStep] = useState(0); // 0..2, 3 = preview
  const [name, setName] = useState("");
  const [perk, setPerk] = useState("");
  const [details, setDetails] = useState("");
  const [conds, setConds] = useState([""]);
  const [rewardConds, setRewardConds] = useState([""]);
  const [image, setImage] = useState(null); // {b64, mime, fileName, dataUrl}
  const [bid, setBid] = useState(300_000);
  const [cap, setCap] = useState(10);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const condList = conds.map((c) => c.trim()).filter(Boolean);
  const rewardList = rewardConds.map((c) => c.trim()).filter(Boolean);
  const detailsText = details.trim();
  const step1Valid =
    name.trim().length > 0 &&
    perk.trim().length > 0 &&
    perk.length <= 40 &&
    condList.length >= 1 &&
    detailsText.length <= DETAILS_MAX_CHARS;
  const reward = rewardOf(bid, rewardPct);

  const pickFile = (file) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) return showToast("Ảnh tối đa 500 KB");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return showToast("Chỉ nhận jpg, png hoặc webp");
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setImage({
        b64: String(dataUrl).split(",")[1],
        mime: file.type,
        fileName: file.name,
        dataUrl,
      });
    };
    reader.readAsDataURL(file);
  };

  const payload = (submit) => ({
    name: name.trim(),
    perk_line: perk.trim(),
    // "" is the server's own signal for "no lede" (cleanDetails → NULL),
    // so an untouched field does not need to be omitted.
    details: detailsText,
    eligibility_bullets: condList,
    reward_bullets: rewardList,
    ...(image ? { image_base64: image.b64, image_mime: image.mime } : {}),
    bid_vnd: bid,
    max_active_leads: cap,
    submit,
  });

  /**
   * Every 400 the card endpoint can return, in the user's words.
   *
   * The fallback deliberately prints the server's own code: a message that
   * says only "thử lại" for a validation error the user could fix in five
   * seconds is worse than useless — it sent them to Zalo instead. If a new
   * code appears here, it shows up as text rather than vanishing.
   */
  const cardError = (ex) => {
    const e = ex?.body?.error;
    const floor = ex?.body?.floor ?? 100000;
    const step = ex?.body?.step ?? 10000;
    const n = (v) => Number(v).toLocaleString("vi-VN");
    return (
      {
        invalid_name: "Đặt tên thẻ trước đã.",
        perk_too_long: "Ưu đãi tối đa 40 ký tự.",
        details_too_long: `Chi tiết thẻ tối đa ${DETAILS_MAX_CHARS} ký tự.`,
        invalid_bullets: "Điểm nổi bật: tối đa 6 dòng, mỗi dòng 120 ký tự.",
        invalid_reward_bullets:
          "Điều kiện nhận thưởng: tối đa 6 điều kiện, mỗi điều kiện 120 ký tự.",
        invalid_max_leads: "Giới hạn lead đang xử lý phải từ 1 đến 200.",
        invalid_bid: "Mức bid phải là số nguyên (đồng).",
        bid_below_floor: `Mức bid tối thiểu là ${n(floor)}đ.`,
        bid_not_step: `Mức bid phải chia hết cho ${n(step)}đ.`,
        bid_too_high: "Mức bid vượt mức tối đa cho phép.",
        invalid_image: "Ảnh thẻ không hợp lệ.",
        unsupported_image_type: "Ảnh phải là JPG, PNG hoặc WEBP.",
        image_too_large: "Ảnh quá lớn.",
        suspended: "Tài khoản đang tạm ngưng — liên hệ Bonia.",
      }[e] || (e ? `Chưa gửi được: ${e}` : "Không gửi được, thử lại")
    );
  };

  const saveDraft = async () => {
    if (!name.trim()) return showToast("Đặt tên thẻ trước khi lưu nháp");
    setBusy(true);
    try {
      await api.createCard(payload(false));
      showToast("Đã lưu nháp");
      onDone();
    } catch (ex) {
      showToast(cardError(ex));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      await api.createCard(payload(true));
      showToast(`Đã gửi Bonia duyệt. Bid ${vnd(bid)} sẽ có hiệu lực ngay khi thẻ được duyệt.`);
      onDone();
    } catch (ex) {
      showToast(cardError(ex));
    } finally {
      setBusy(false);
    }
  };

  // ── Preview screen (§6) ─────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="wrap" style={{ maxWidth: 900 }}>
        <button className="bid-backlink" onClick={() => setStep(2)}>← Sửa bid</button>
        <h1 className="page">Khách hàng sẽ thấy thế này</h1>
        <p className="page-sub">
          Đây là thẻ của bạn trong app Bonia, đúng như khách hàng nhìn thấy khi bạn đang giữ hạng 1.
        </p>
        <div style={{ display: "flex", gap: 26, flexWrap: "wrap", marginTop: 18 }}>
          <PhonePreview bank={bank} name={name} perk={perk} reward={reward} imageUrl={image?.dataUrl} />
          <div className="card" style={{ flex: 1, minWidth: 300, alignSelf: "flex-start" }}>
            <div className="eyebrow mono">TRƯỚC KHI GỬI</div>
            <SummaryRow label="Tên thẻ" value={name} />
            <SummaryRow label="Ưu đãi" value={perk} />
            {/* The lede of the Chi tiết sheet — shown in full (with its
                line breaks) rather than as a character count, because it
                is the one field nobody re-reads before submitting. */}
            {detailsText ? (
              <div className="bid-summary-row" style={{ display: "block" }}>
                <span>Chi tiết thẻ</span>
                <div style={{ fontSize: 12.5, lineHeight: 1.55, fontWeight: 500, whiteSpace: "pre-wrap", marginTop: 6, maxHeight: 190, overflowY: "auto" }}>
                  {detailsText}
                </div>
              </div>
            ) : (
              <SummaryRow label="Chi tiết thẻ" value="Chưa có" />
            )}
            <SummaryRow label="Điều kiện xét duyệt" value={`${condList.length} điều kiện`} />
            {rewardList.length > 0 ? (
              <div className="bid-summary-row" style={{ display: "block" }}>
                <span>Điều kiện nhận thưởng</span>
                <ul style={{ listStyle: "disc", margin: "6px 0 0", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                  {rewardList.map((b, i) => (
                    <li key={i} style={{ fontSize: 12.5, lineHeight: 1.5, fontWeight: 600 }}>{b}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <SummaryRow label="Điều kiện nhận thưởng" value="Chưa có" />
            )}
            <SummaryRow label="Ảnh" value={image ? image.fileName : "Nền mặc định"} />
            <SummaryRow label="Bid" value={vnd(bid)} mono />
            <SummaryRow label="Tối đa lead đang xử lý" value={String(cap)} mono />
            <div className="bid-reward-note" style={{ marginTop: 12 }}>
              Khách sẽ thấy: <b className="mono">Nhận {vnd(reward)}</b> · bằng {rewardPct}% bid của bạn.
            </div>
            <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
              <button className="btn btn-ghost" onClick={() => setStep(0)}>Sửa lại</button>
              <button className="btn-navy" style={{ flex: 1 }} disabled={busy} onClick={submit}>
                {busy ? "Đang gửi…" : "Gửi Bonia duyệt"}
              </button>
            </div>
            <div className="bid-micro" style={{ marginTop: 10 }}>
              Bid và giới hạn lead lưu ngay. Nội dung chờ Bonia duyệt trước khi khách hàng thấy thẻ.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ maxWidth: 900 }}>
      <StepHeader step={step} onBack={onCancel} />
      <div className="bid-panel">
        {step === 0 && (
          <>
            <h2 className="bid-h2">Thông tin thẻ</h2>
            <p className="bid-sub">Đây là nội dung khách hàng đọc trước khi bấm quan tâm.</p>

            <label className="bid-label">Tên thẻ</label>
            <input className="input" style={{ height: 46 }} value={name} maxLength={80}
              onChange={(e) => setName(e.target.value)} placeholder="vd. Private Visa Infinite" />
            <div className="bid-helper">Không cần lặp lại tên ngân hàng — Bonia đã hiển thị {bank}.</div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <label className="bid-label">Ưu đãi một dòng</label>
              <span className={`mono bid-counter ${perk.length > 40 ? "over" : ""}`}>{perk.length}/40</span>
            </div>
            <input className={`input ${perk.length > 40 ? "input-over" : ""}`} style={{ height: 46 }}
              value={perk} maxLength={60} onChange={(e) => setPerk(e.target.value)}
              placeholder="vd. Hoàn 2% siêu thị, tối đa 300.000đ/tháng" />
            <div className="bid-helper">Một lợi ích cụ thể, dễ so sánh. Dòng này hiện ngay trên thẻ trong app.</div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <label className="bid-label">Chi tiết thẻ <span style={{ fontWeight: 400, color: "var(--ink-45)" }}>· không bắt buộc</span></label>
              <span className={`mono bid-counter ${detailsText.length > DETAILS_MAX_CHARS ? "over" : ""}`}>
                {detailsText.length}/{DETAILS_MAX_CHARS}
              </span>
            </div>
            <textarea
              className={`input ${detailsText.length > DETAILS_MAX_CHARS ? "input-over" : ""}`}
              style={{ height: "auto", minHeight: 132, padding: "11px 13px", resize: "vertical", lineHeight: 1.55 }}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={"vd. Hoàn tiền 2% cho mọi chi tiêu siêu thị, tối đa 300.000đ/tháng.\n\nMiễn phí thường niên năm đầu.\nPhòng chờ sân bay 2 lượt/năm."}
            />
            <div className="bid-helper">
              Mô tả đầy đủ quyền lợi của thẻ — khách hàng xem trong mục Chi tiết.
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <label className="bid-label">Điều kiện xét duyệt</label>
              <span className="mono bid-counter">{condList.length}/6</span>
            </div>
            {conds.map((c, i) => (
              <div key={i} className="bid-cond-row">
                <span className="mono bid-cond-index">{i + 1}</span>
                <input className="input" style={{ height: 42, marginBottom: 0 }} value={c}
                  onChange={(e) => setConds((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder={i === 0 ? "vd. Thu nhập từ 8 triệu/tháng" : ""} />
                <button className="bid-cond-x" onClick={() => setConds((arr) => arr.length > 1 ? arr.filter((_, j) => j !== i) : [""])}>×</button>
              </div>
            ))}
            <button
              className="bid-cond-add"
              disabled={conds.length >= 6 || conds[conds.length - 1].trim() === ""}
              onClick={() => setConds((arr) => (arr.length < 6 ? [...arr, ""] : arr))}
            >
              {conds.length >= 6 ? "Tối đa 6 điều kiện" : "+ Thêm điều kiện"}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <label className="bid-label">Điều kiện nhận thưởng</label>
              <span className="mono bid-counter">{rewardList.length}/{BULLET_MAX_COUNT}</span>
            </div>
            {rewardConds.map((c, i) => (
              <div key={i} className="bid-cond-row">
                <span className="mono bid-cond-index">{i + 1}</span>
                <input className="input" style={{ height: 42, marginBottom: 0 }} value={c} maxLength={BULLET_MAX_CHARS}
                  onChange={(e) => setRewardConds((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder={i === 0 ? "vd. Thẻ được phát hành và kích hoạt thành công" : ""} />
                <button className="bid-cond-x" onClick={() => setRewardConds((arr) => arr.length > 1 ? arr.filter((_, j) => j !== i) : [""])}>×</button>
              </div>
            ))}
            <button
              className="bid-cond-add"
              disabled={rewardConds.length >= BULLET_MAX_COUNT || rewardConds[rewardConds.length - 1].trim() === ""}
              onClick={() => setRewardConds((arr) => (arr.length < BULLET_MAX_COUNT ? [...arr, ""] : arr))}
            >
              {rewardConds.length >= BULLET_MAX_COUNT ? "Tối đa 6 điều kiện" : "+ Thêm điều kiện"}
            </button>
            <div className="bid-helper">
              Ngân hàng tự quyết định điều kiện khách được nhận thưởng — hiển thị cho khách trong mục Chi tiết.
            </div>

            <div className="bid-review-note">
              Tên thẻ, ưu đãi, chi tiết và điều kiện sẽ được Bonia duyệt trước khi khách hàng nhìn thấy —
              thường trong một ngày làm việc. Mức bid của bạn có hiệu lực ngay khi thẻ được duyệt.
            </div>

            <WizardFooter
              onCancel={onCancel} cancelLabel="Huỷ" onDraft={saveDraft}
              next={() => setStep(1)} nextLabel="Tiếp tục" nextDisabled={!step1Valid}
              onDisabledNext={() => {
                const missing = [];
                if (!name.trim()) missing.push("tên thẻ");
                if (!perk.trim() || perk.length > 40) missing.push("ưu đãi một dòng (≤40 ký tự)");
                if (detailsText.length > DETAILS_MAX_CHARS) missing.push(`chi tiết thẻ ≤${DETAILS_MAX_CHARS} ký tự`);
                if (condList.length < 1) missing.push("ít nhất 1 điều kiện");
                showToast(`Còn thiếu: ${missing.join(", ")}`);
              }}
            />
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="bid-h2">Hình ảnh</h2>
            <p className="bid-sub">Ảnh nền tràn viền trên thẻ. Bỏ qua được — thẻ sẽ dùng nền mặc định của {bank}.</p>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div
                  className={`bid-dropzone ${image ? "selected" : ""}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0]); }}
                >
                  <div className="bid-drop-plus">+</div>
                  <div className="bid-drop-title">
                    {image ? `Đã chọn ảnh · ${image.fileName}` : "Tải ảnh thẻ của bạn"}
                  </div>
                  <div className="bid-drop-sub">Ảnh ngang, tràn viền. Bấm để mở thư viện.</div>
                </div>
                {image && (
                  <button className="bid-draft-btn" onClick={() => setImage(null)}>
                    Xoá ảnh, dùng nền mặc định
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden
                  onChange={(e) => pickFile(e.target.files?.[0])} />
                <div className="bid-micro" style={{ marginTop: 10 }}>
                  jpg, png, webp · tối đa 500 KB · khuyến nghị 1200×630 (tỉ lệ 1,9:1).
                  Chừa phần bên phải cho hình thẻ — chữ và nút sẽ nằm bên trái.
                </div>
              </div>
              <div style={{ width: 300, flex: "none" }}>
                <AppMirror bank={bank} name={name || "Tên thẻ"} perk={perk} rewardVnd={reward} imageUrl={image?.dataUrl} />
                <div className="bid-micro" style={{ marginTop: 8, textAlign: "center" }}>
                  Xem trước đúng tỉ lệ thẻ trong app
                </div>
              </div>
            </div>
            <WizardFooter
              onCancel={() => setStep(0)} cancelLabel="Quay lại" onDraft={saveDraft}
              next={() => setStep(2)}
              nextLabel={image ? "Tiếp tục" : "Bỏ qua, dùng nền mặc định"}
              nextDisabled={false}
            />
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="bid-h2">Bid</h2>
            <p className="bid-sub">Phí thành công bạn trả Bonia khi khách mở thẻ. Bid, giới hạn lead lưu ngay khi gửi.</p>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div className="bid-stepper large">
                  <button onClick={() => setBid((b) => Math.max(BID_FLOOR_DEFAULT, b - BID_STEP))}>−</button>
                  <input className="mono" inputMode="numeric" value={bid.toLocaleString("de-DE")}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setBid(digits === "" ? 0 : parseInt(digits, 10));
                    }}
                    onBlur={() => setBid((b) => clampBid(b, BID_FLOOR_DEFAULT))} />
                  <span className="bid-suffix">đ</span>
                  <button onClick={() => setBid((b) => clampBid(b, BID_FLOOR_DEFAULT) + BID_STEP)}>+</button>
                </div>
                <div className="bid-micro">Bước {vnd(BID_STEP)} · sàn {vnd(BID_FLOOR_DEFAULT)}</div>
                <div className="bid-reward-note">
                  Khách sẽ thấy: <b className="mono">Nhận {vnd(reward)}</b> · bằng {rewardPct}% bid của bạn.
                </div>

                <label className="bid-label" style={{ marginTop: 18 }}>Tối đa lead đang xử lý</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <div className="bid-stepper">
                    <button onClick={() => setCap((c) => Math.max(1, c - 1))}>−</button>
                    <input className="mono" inputMode="numeric" value={cap}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        setCap(digits === "" ? 1 : Math.max(1, Math.min(200, parseInt(digits, 10))));
                      }} />
                    <button onClick={() => setCap((c) => Math.min(200, c + 1))}>+</button>
                  </div>
                  {[5, 10, 25, 50].map((v) => (
                    <button key={v} className={`bid-preset ${cap === v ? "on" : ""}`} onClick={() => setCap(v)}>{v}</button>
                  ))}
                </div>
                <div className="bid-helper">
                  Giới hạn số lead chưa chốt bạn giữ cùng lúc. Khi đầy, lead mới chuyển cho
                  người bid cao tiếp theo — bid của bạn vẫn giữ nguyên.
                </div>
              </div>

              <div style={{ width: 300, flex: "none" }}>
                <ProvisionalPanel bank={bank} bid={bid} sampleOthers={sampleOthers} onSuggest={setBid} />
              </div>
            </div>
            <WizardFooter
              onCancel={() => setStep(1)} cancelLabel="Quay lại" onDraft={saveDraft}
              next={() => setStep(3)} nextLabel="Xem trước" nextDisabled={false}
            />
          </>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, mono = false }) {
  return (
    <div className="bid-summary-row">
      <span>{label}</span>
      <span className={mono ? "mono" : ""} style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// Provisional position — the type is Bonia's call at review, so this
// ladder is labelled dự kiến and sourced from the rep's nearest type.
function ProvisionalPanel({ bank, bid, sampleOthers, onSuggest }) {
  const others = Array.isArray(sampleOthers) ? sampleOthers : null;
  const pos = others ? computePosition(others, bid, true, false) : null;
  return (
    <div className="bid-pos-panel" style={{ display: "block" }}>
      <div className="eyebrow mono" style={{ marginBottom: 8 }}>VỊ TRÍ DỰ KIẾN</div>
      {pos ? (
        <>
          <div style={{ marginBottom: 8 }}>
            <span className={`bid-chip ${pos.rank === 1 ? "green" : "navy"} mono`}>
              Hạng {pos.rank}/{pos.rankOf}
            </span>
          </div>
          <Ladder rows={pos.rows} mineIndex={pos.mineIndex} />
          <div className="bid-gap" style={{ display: "block", margin: "10px 0" }}>
            {pos.rank === 1
              ? "Mức này đang dẫn đầu bảng tham chiếu."
              : `Kém ${vnd(pos.gapToTop)} so với hạng 1 của bảng tham chiếu.`}
          </div>
          {pos.suggested != null && (
            <button className="bid-nudge" style={{ width: "100%", marginBottom: 10 }}
              onClick={() => onSuggest(pos.suggested)}>
              Đặt {vnd(pos.suggested)} để dẫn đầu
            </button>
          )}
        </>
      ) : (
        <div className="bid-gap" style={{ display: "block", marginBottom: 10 }}>
          Chưa có bảng tham chiếu tại {bank}.
        </div>
      )}
      <div className="bid-micro">
        Bonia xác định loại thẻ khi duyệt. Bảng trên là mức bid hiện tại của loại thẻ
        gần nhất tại {bank}.
      </div>
    </div>
  );
}

export function Ladder({ rows, mineIndex, title }) {
  return (
    <div className="bid-ladder">
      {title && (
        <div className="bid-ladder-head">
          <span className="eyebrow mono">{title}</span>
          <span className="bid-micro">{rows.length} đơn vị · chỉ hiển thị mức bid</span>
        </div>
      )}
      {rows.map((v, i) => {
        const mine = i === mineIndex;
        const tiedWithMine = !mine && rows[mineIndex] === v;
        return (
          <div key={i} className={`bid-ladder-row ${mine ? "mine" : ""}`}>
            <span className="mono bid-ladder-rank">#{i + 1}</span>
            <span className="mono" style={{ fontWeight: 600 }}>{vnd(v)}</span>
            <span style={{ flex: 1 }} />
            {mine && <span className="bid-ladder-you">BẠN</span>}
            {tiedWithMine && <span className="bid-micro">đồng giá</span>}
          </div>
        );
      })}
    </div>
  );
}
