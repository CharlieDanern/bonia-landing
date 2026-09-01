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

/**
 * What a customer sees, said from the customer's side.
 *
 * The server now computes visibility with the same predicate the catalog
 * uses (card.visibility) — the portal used to re-derive it from the wallet
 * alone, so a card hidden by arrears, the monthly cap, or having no service
 * area still showed a green "Đang nhận lead". The screen said the opposite
 * of the truth in exactly the cases that cost the partner leads.
 *
 * Every blocked state answers three things: that customers cannot see it,
 * why, and what fixes it. "Hết số dư" answered none of them — it described
 * our ledger, not their loss.
 */
const BLOCKED = {
  draft: { short: "Bản nháp", why: "Chưa gửi Bonia duyệt.", fix: "Hoàn tất và gửi duyệt." },
  in_review: { short: "Chờ Bonia duyệt", why: "Bonia đang xem nội dung thẻ.", fix: "Thường trong ngày làm việc." },
  rejected: { short: "Cần sửa nội dung", why: "Bonia đã trả lại thẻ này.", fix: "Sửa theo ghi chú rồi gửi lại." },
  below_floor: { short: "Bid dưới mức sàn", why: "Mức bid thấp hơn sàn của loại thẻ này.", fix: "Tăng bid lên ít nhất bằng mức sàn." },
  paused: { short: "Bạn đã tạm dừng", why: "Thẻ đang tạm dừng theo yêu cầu của bạn.", fix: "Bật lại bất cứ lúc nào — bid giữ nguyên." },
  pipeline_full: { short: "Pipeline đầy", why: "Đã đạt số lead đang xử lý tối đa.", fix: "Tất toán bớt lead, hoặc tăng giới hạn." },
  arrears: { short: "Số dư âm", why: "Ví đang âm nên mọi thẻ đều tạm ngưng.", fix: "Nạp đủ để số dư về 0 trở lên." },
  no_funds: { short: "Chưa đủ số dư", why: "Không đủ tiền để tạm giữ cho lead tiếp theo.", fix: "Nạp thêm tiền vào ví." },
  monthly_cap: { short: "Chạm giới hạn tháng", why: "Đã đạt giới hạn chi tiêu bạn tự đặt.", fix: "Tăng hoặc tắt giới hạn trong Tài khoản." },
  no_coverage: { short: "Chưa chọn khu vực", why: "Chưa có tỉnh/thành nào nên thẻ không hiện với ai.", fix: "Chọn khu vực phục vụ trong Tài khoản." },
  account_inactive: { short: "Tài khoản tạm ngưng", why: "Tài khoản đang không hoạt động.", fix: "Liên hệ Bonia." },
  account_closing: { short: "Đang đóng tài khoản", why: "Tài khoản đang trong quá trình đóng.", fix: "Huỷ yêu cầu đóng nếu muốn nhận lead lại." },
  proof_expired: { short: "Văn bản hết hiệu lực", why: "Văn bản uỷ quyền đã hết hạn.", fix: "Gửi Bonia văn bản mới." },
};

/** The blocked-state record for a card, or null when it is live. */
export function blockOf(card) {
  const v = card.visibility;
  if (!v || v.live) return null;
  return { code: v.blocked_by, ...(BLOCKED[v.blocked_by] || { short: "Chưa hiển thị", why: "", fix: "" }), v };
}

export function statusChip(card) {
  const b = blockOf(card);
  if (!b) return { text: `Đang nhận lead · ${card.active_leads}/${card.max_active_leads}`, cls: "green" };
  // One visual weight for every blocked state: the difference that matters
  // to a partner is binary — customers can see this card, or they cannot.
  return { text: b.short, cls: b.code === "in_review" || b.code === "draft" ? "amber" : "red" };
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

function BidRow({ card, wide, wallet, rewardPct, onOpen, onApplied, showToast, onDeposit }) {
  const [draft, setDraft] = useState(card.my_bid_vnd);
  const [busy, setBusy] = useState(false);
  useEffect(() => setDraft(card.my_bid_vnd), [card.my_bid_vnd]);

  const ranked = card.others_vnd != null && card.status === "approved";
  // §4.2: nothing moves until "Đặt bid" — mirror + panel reflect the LIVE
  // bid; the draft exists only inside the field.
  const pos = ranked
    ? computePosition(card.others_vnd, card.my_bid_vnd, card.i_hold_tiebreak, true)
    : null;
  const chip = statusChip(card);
  const block = blockOf(card);

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
        dimmed={!!block}
        onClick={onOpen}
      />
      {block && <div className="bid-unlisted">Khách hàng không nhìn thấy thẻ này</div>}
    </div>
  );

  // Consequence first, then why, then the fix. A partner does not care that
  // a ledger column is below a threshold; they care that nobody can see their
  // card and that a deposit fixes it.
  const blockBanner = block ? (
    <div
      style={{
        display: "flex", gap: 10, alignItems: "flex-start",
        padding: "10px 12px", borderRadius: 8, marginBottom: 10,
        background: block.code === "in_review" || block.code === "draft" ? "#FBF7EC" : "#FDF1F0",
        border: `1px solid ${block.code === "in_review" || block.code === "draft" ? "#E8DCC2" : "#F3D3D0"}`,
      }}
    >
      <span style={{ fontSize: 15, lineHeight: 1.2 }}>
        {block.code === "in_review" || block.code === "draft" ? "⏳" : "👁"}
      </span>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>
        <b>
          {block.code === "in_review" || block.code === "draft"
            ? "Chưa hiển thị với khách hàng"
            : "Khách hàng KHÔNG nhìn thấy thẻ này"}
        </b>
        <div style={{ color: "var(--ink-55)" }}>
          {block.why}{" "}
          {block.code === "no_funds" && block.v.shortfall_vnd > 0
            ? `Cần thêm ${vnd(block.v.shortfall_vnd)} (giữ ${vnd(block.v.need_hold_vnd)} cho mỗi lead).`
            : block.fix}
        </div>
        {(block.code === "no_funds" || block.code === "arrears") && onDeposit && (
          <button
            className="btn btn-navy btn-navy-inline"
            style={{ marginTop: 8 }}
            onClick={onDeposit}
          >
            Nạp tiền
          </button>
        )}
      </div>
    </div>
  ) : null;

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
      {/* Above everything: whether this card is working at all outranks any
          detail inside it. */}
      {blockBanner}
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

export function BidBoard({ cards, bank, wallet, rewardPct, onAdd, onOpen, refresh, showToast, onDeposit }) {
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

      {/* When NOTHING is live, that is the most important fact on the page —
          more important than any single card's detail. Reps were losing days
          to a small amber chip that read like a note rather than an outage. */}
      {cards.length > 0 && cards.every((c) => blockOf(c)) && (
        <div
          style={{
            display: "flex", gap: 12, alignItems: "flex-start", marginTop: 16,
            padding: "13px 15px", borderRadius: 9,
            background: "#FDF1F0", border: "1px solid #F3D3D0",
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1.1 }}>👁</span>
          <div style={{ fontSize: 13.5, lineHeight: 1.55 }}>
            <b>
              Hiện không có thẻ nào hiển thị với khách hàng
              {cards.length > 1 ? ` (0/${cards.length})` : ""}
            </b>
            <div style={{ color: "var(--ink-55)" }}>
              Bạn sẽ không nhận được lead nào cho tới khi xử lý xong lý do bên dưới.
            </div>
            {(() => {
              // Money is the one cause the rep can clear in a minute, so it
              // gets the button; everything else is explained per card.
              const money = cards
                .map(blockOf)
                .find((b) => b && (b.code === "no_funds" || b.code === "arrears"));
              return money && onDeposit ? (
                <button className="btn btn-navy btn-navy-inline" style={{ marginTop: 9 }} onClick={onDeposit}>
                  Nạp tiền để bật lại
                </button>
              ) : null;
            })()}
          </div>
        </div>
      )}

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
            onDeposit={onDeposit}
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
