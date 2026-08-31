import React, { useEffect, useState } from "react";
import { api, vnd } from "../api.js";
import { AppMirror } from "./Mirror.jsx";
import { computePosition, clampBid, rewardOf, BID_STEP, DEFAULT_REWARD_PCT } from "./position.js";

// Board — one row per card, five states (outbid+nudge · leading-at-capacity
// · tie · pending · rejected). Bids edit IN PLACE: stepper/typing move a
// draft only; money moves on "Đặt bid". Layout flips at 1150px (§4).

export function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

export function statusChip(card, wallet) {
  if (card.status === "pending") return { text: "Chờ Bonia duyệt", cls: "amber" };
  if (card.status === "rejected") return { text: "Cần sửa nội dung", cls: "red" };
  if (card.status === "draft") return { text: "Bản nháp", cls: "navy" };
  if (card.paused) return { text: "Đã tạm dừng", cls: "amber" };
  if (card.active_leads >= card.max_active_leads)
    return { text: `Pipeline đầy · ${card.active_leads}/${card.max_active_leads}`, cls: "amber" };
  // §9: no funds for the next hold → routing skips this rep.
  //
  // floor(bid/2) here is the WALLET HOLD, not the consumer reward. It is
  // collateral against the fee and stays at the full bid no matter where
  // the commission setting goes (server: connect-user.ts needHold). Do
  // NOT swap it for rewardOf() because the two look alike.
  if (wallet && wallet.freeLeadsLeft === 0 && wallet.availableVnd < card.my_bid_vnd)
    return { text: "Hết số dư", cls: "amber" };
  return { text: `Đang nhận lead · ${card.active_leads}/${card.max_active_leads}`, cls: "green" };
}

export function RankChip({ card, pos }) {
  if (!pos) return null;
  const receiving = !card.paused && card.active_leads < card.max_active_leads;
  const leading = pos.rank === 1;
  const pausedish = card.paused || card.active_leads >= card.max_active_leads;
  const cls = leading && receiving ? "green" : pausedish ? "amber" : "navy";
  return (
    <span className={`bid-chip ${cls} mono`}>
      Hạng {pos.rank}/{pos.rankOf}
      {pausedish ? " · tạm dừng" : ""}
    </span>
  );
}

function gapSentence(card, pos) {
  if (!pos) return null;
  if (pos.tiedCount > 1 && !pos.holdsTiebreak) {
    return `Đồng giá với ${pos.tiedCount - 1} người khác — họ đặt trước nên nhận lead trước.`;
  }
  if (pos.rank === 1) {
    const second = pos.rows.find((v) => v < pos.rows[0]);
    return second != null
      ? `Bạn đang dẫn đầu — hơn hạng 2 ${vnd(pos.rows[0] - second)}.`
      : "Bạn đang dẫn đầu — nhận leads cho loại thẻ này.";
  }
  return `Kém ${vnd(pos.gapToTop)} so với hạng 1.`;
}

export function PositionPanel({ card, pos, onSuggest, compact = false }) {
  if (!pos) return null;
  const nudgeLabel =
    pos.tiedCount > 1 && !pos.holdsTiebreak
      ? `Nâng ${vnd(BID_STEP)} để vượt`
      : pos.suggested != null
        ? `Đặt ${vnd(pos.suggested)} để dẫn đầu`
        : null;
  return (
    <div className="bid-pos-panel">
      <RankChip card={card} pos={pos} />
      <span className="bid-gap">{gapSentence(card, pos)}</span>
      {nudgeLabel && (
        <button className="bid-nudge" onClick={() => onSuggest(pos.suggested)} style={compact ? { width: "100%" } : undefined}>
          {nudgeLabel}
        </button>
      )}
    </div>
  );
}

// Inline bid control: −/+ around an editable mono field, đ outside, confirm
// below. Functional state updates (rapid taps must not collapse — §9).
export function InlineBidControl({ card, draft, setDraft, onApply, busy }) {
  const floor = card.floor_vnd;
  const dirty = draft !== card.my_bid_vnd;
  return (
    <div className="bid-inline">
      <div className="bid-inline-label">Bid của bạn</div>
      <div className="bid-stepper">
        <button onClick={() => setDraft((d) => Math.max(floor, d - BID_STEP))} aria-label="giảm">−</button>
        <input
          className="mono"
          inputMode="numeric"
          value={draft === 0 ? "" : draft.toLocaleString("de-DE")}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            setDraft(digits === "" ? 0 : parseInt(digits, 10));
          }}
          onBlur={() => setDraft((d) => clampBid(d, floor))}
        />
        <span className="bid-suffix">đ</span>
        <button onClick={() => setDraft((d) => clampBid(d, floor) + BID_STEP)} aria-label="tăng">+</button>
      </div>
      <button
        className={`bid-apply ${dirty ? "" : "applied"}`}
        disabled={!dirty || busy || draft < floor}
        onClick={onApply}
      >
        {busy ? "Đang đặt…" : dirty ? "Đặt bid" : "Đã áp dụng"}
      </button>
    </div>
  );
}

function ReviewBanner({ card, onSubmitDraft }) {
  if (card.status === "draft") {
    return (
      <div className="bid-banner amber" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ flex: 1 }}>Bản nháp — khách hàng chưa thấy thẻ này.</span>
        <button className="bid-link-btn" onClick={onSubmitDraft}>Gửi Bonia duyệt</button>
      </div>
    );
  }
  if (card.status === "pending") {
    return (
      <div className="bid-banner amber">
        Nội dung đang chờ Bonia duyệt. Bid đã lưu và có hiệu lực ngay khi thẻ được duyệt.
      </div>
    );
  }
  if (card.status === "rejected") {
    // §10: review_note is shown VERBATIM.
    return (
      <div className="bid-banner red">
        {card.review_note || "Nội dung cần chỉnh sửa — sửa trong chi tiết thẻ rồi gửi duyệt lại."}
      </div>
    );
  }
  return null;
}

function BidRow({ card, wide, wallet, rewardPct, onOpen, onApplied, showToast }) {
  const [draft, setDraft] = useState(card.my_bid_vnd);
  const [busy, setBusy] = useState(false);
  useEffect(() => setDraft(card.my_bid_vnd), [card.my_bid_vnd]);

  const ranked = card.others_vnd != null && card.status === "approved";
  // §4.2: nothing moves until "Đặt bid" — mirror + panel reflect the LIVE
  // bid; the draft exists only inside the field.
  const pos = ranked
    ? computePosition(card.others_vnd, card.my_bid_vnd, card.i_hold_tiebreak, true)
    : null;
  const chip = statusChip(card, wallet);

  const apply = async (amount) => {
    const target = amount ?? draft;
    setBusy(true);
    try {
      const res = await api.updateCard(card.card_id, { bid_vnd: target });
      // A fresh apply never holds the tiebreak (the server resets
      // bid_set_at) — rank the toast accordingly.
      const after = ranked
        ? computePosition(card.others_vnd, target, false, true)
        : null;
      showToast(
        `Đã đặt ${vnd(res.bid_vnd)}${after ? ` · hạng ${after.rank}/${after.rankOf}` : ""} · khách thấy Nhận ${vnd(res.user_reward_vnd)}`
      );
      onApplied();
    } catch (ex) {
      showToast(
        ex.body?.error === "bid_below_floor" ? `Tối thiểu ${vnd(card.floor_vnd)}`
          : ex.body?.error === "bid_not_step" ? `Bid theo bước ${vnd(BID_STEP)}`
            : "Không đặt được bid, thử lại"
      );
    } finally {
      setBusy(false);
    }
  };

  // 361px = the app's real card width (phone − 16pt padding each side), so
  // line 1 truncates here only when it would truncate on a phone too.
  const mirror = (
    <div style={wide ? { width: "min(361px, 38%)", flex: "none", alignSelf: "center" } : { maxWidth: 361 }}>
      <AppMirror
        bank={card.bank}
        name={card.name}
        perk={card.perk_line}
        rewardVnd={rewardOf(card.my_bid_vnd, rewardPct)}
        imageUrl={card.image_url}
        cta="Chi tiết"
        dimmed={!card.listed}
        onClick={onOpen}
      />
      {!card.listed && <div className="bid-unlisted">Chưa hiển thị với khách hàng</div>}
    </div>
  );

  const info = (
    <div className="bid-info" style={wide ? { justifyContent: "space-between" } : undefined}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="bid-name">{card.name}</span>
            <span className={`bid-chip ${chip.cls}`}>{chip.text}</span>
          </div>
          <div className="bid-type-line">
            {card.type_label
              ? `Loại thẻ: ${card.type_label} · ${card.bank}`
              : "Bonia sẽ xác định loại thẻ khi duyệt"}
          </div>
        </div>
        <InlineBidControl card={card} draft={draft} setDraft={setDraft} onApply={() => apply()} busy={busy} />
      </div>
      <ReviewBanner
        card={card}
        onSubmitDraft={async () => {
          try {
            await api.updateCard(card.card_id, { submit: true });
            showToast("Đã gửi Bonia duyệt. Bid có hiệu lực ngay khi thẻ được duyệt.");
            onApplied();
          } catch {
            showToast("Không gửi được, thử lại");
          }
        }}
      />
      {pos && <PositionPanel card={card} pos={pos} onSuggest={(v) => { setDraft(v); apply(v); }} />}
    </div>
  );

  return (
    <div className={`bid-row ${card.status === "rejected" ? "rejected" : ""}`}>
      {wide ? (
        <div style={{ display: "flex", gap: 18, alignItems: "stretch" }}>
          {mirror}
          {info}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mirror}
          {info}
        </div>
      )}
    </div>
  );
}

export function BidBoard({ cards, bank, wallet, rewardPct, onAdd, onOpen, refresh, showToast }) {
  const width = useWindowWidth();
  const wide = width >= 1150;

  return (
    <div className="wrap" style={{ maxWidth: 1080 }}>
      <div className="eyebrow mono">{(bank || "").toUpperCase()}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="page">Bid của tôi</h1>
          <p className="page-sub" style={{ maxWidth: 560 }}>
            Khách hàng chỉ thấy thẻ của người bid cao nhất trong mỗi loại thẻ. Bid là phí
            thành công bạn trả khi khách mở thẻ.
          </p>
        </div>
        <button className="btn-navy" onClick={onAdd}>Thêm thẻ</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
        {cards.map((c) => (
          <BidRow
            key={c.card_id}
            card={c}
            wide={wide}
            wallet={wallet}
            rewardPct={rewardPct}
            onOpen={() => onOpen(c.card_id)}
            onApplied={refresh}
            showToast={showToast}
          />
        ))}
      </div>

      <div className="bid-footnote">
        Xếp hạng tính theo từng loại thẻ trong {bank}. Bonia chỉ hiển thị mức bid — không
        bao giờ hiển thị danh tính người bid. Lead đã chuyển cho bạn sẽ không bị chuyển đi
        khi có người bid cao hơn.
      </div>
    </div>
  );
}

export function EmptyBoard({ bank, rewardPct = DEFAULT_REWARD_PCT, onAdd }) {
  return (
    <div className="wrap" style={{ maxWidth: 1080 }}>
      <div className="eyebrow mono">{(bank || "").toUpperCase()}</div>
      <h1 className="page">Bid của tôi</h1>
      <div className="bid-empty">
        <h2>Thêm thẻ đầu tiên của bạn</h2>
        <p>
          Bạn giới thiệu thẻ của mình, đặt mức phí thành công, và nhận lead từ khách
          hàng đang cần mở thẻ. Chỉ trả phí khi khách mở thẻ thành công.
        </p>
        <ol>
          <li>
            <b>Thêm thẻ của bạn</b>
            <span>Tên thẻ, một dòng ưu đãi, điều kiện xét duyệt và ảnh. Bonia duyệt trước khi khách hàng thấy.</span>
          </li>
          <li>
            <b>Đặt mức bid</b>
            <span>Phí thành công bạn trả khi khách mở thẻ. Khách hàng nhận lại {rewardPct}% — con số này hiện trên thẻ trong app.</span>
          </li>
          <li>
            <b>Nhận lead và gọi</b>
            <span>Người bid cao nhất của mỗi loại thẻ nhận lead. Bạn gọi khách qua số Bonia, số hai bên đều được bảo mật.</span>
          </li>
        </ol>
        <button className="btn-navy" onClick={onAdd}>Thêm thẻ đầu tiên</button>
        <div className="bid-empty-note">Mất khoảng 3 phút. Bạn có thể lưu nháp và quay lại sau.</div>
      </div>
    </div>
  );
}
