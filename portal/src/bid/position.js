// Bid-tab position math — recomputed CLIENT-SIDE on every draft change,
// per the handoff §10: a pre-baked ladder containing the rep's old bid
// goes stale on the first raise. `others` are the OTHER cards' amounts
// (never ours); server rank fields are first-paint only.

export const BID_STEP = 10_000;
export const BID_FLOOR_DEFAULT = 100_000;

/**
 * @param {number[]|null} others  other variants' amounts, same type+bank
 * @param {number} myBid          the (draft) bid to place in the ladder
 * @param {boolean} iHoldTiebreak server truth for my CURRENT amount; a
 *                                draft ≠ live amount never ties (raising
 *                                one step clears a tie without a fetch)
 * @param {boolean} isLiveAmount  draft === live bid
 */
export function computePosition(others, myBid, iHoldTiebreak, isLiveAmount) {
  if (!Array.isArray(others)) return null;
  const equals = others.filter((v) => v === myBid).length;
  const tied = equals > 0 && isLiveAmount;
  const holdsTiebreak = tied ? iHoldTiebreak : true;

  // My row goes AFTER equal amounts when I don't hold the tiebreak —
  // that placement is what makes "họ đặt trước nên nhận lead trước"
  // visibly true on screen.
  const above = others.filter(
    (v) => v > myBid || (v === myBid && tied && !holdsTiebreak)
  ).length;
  const rank = above + 1;
  const top = Math.max(myBid, ...others);

  const rows = [...others, myBid].sort((a, b) => b - a);
  // Own-row index consistent with the tiebreak placement rule.
  const mineIndex =
    tied && !holdsTiebreak ? rows.lastIndexOf(myBid) : rows.indexOf(myBid);

  return {
    rank,
    rankOf: others.length + 1,
    top,
    gapToTop: Math.max(0, top - myBid),
    tiedCount: tied ? equals + 1 : 1,
    holdsTiebreak,
    // Tie-break = ONE step over my own bid ("Nâng 10.000đ để vượt" must
    // move exactly 10.000đ); plain outbid = one step over the top. Never
    // larger than one step past the target (§9).
    suggested:
      tied && !holdsTiebreak
        ? myBid + BID_STEP
        : rank > 1
          ? top + BID_STEP
          : null,
    rows,
    mineIndex,
  };
}

export const BID_MAX = 20_000_000;

/** Clamp a typed amount on blur: nearest 10.000đ step within floor..max. */
export function clampBid(raw, floor) {
  const n = parseInt(String(raw).replace(/\D/g, ""), 10);
  if (!Number.isFinite(n) || n <= 0) return floor;
  const stepped = Math.round(n / BID_STEP) * BID_STEP;
  return Math.min(BID_MAX, Math.max(floor, stepped));
}

// Fallback rate, used ONLY when a response predates the field. The live
// value is an admin setting (platform_settings.consumer_reward_pct) and
// rides on every GET /rm/cards as `consumer_reward_pct`.
export const DEFAULT_REWARD_PCT = 50;

/**
 * Customer reward at a given commission rate (§9).
 *
 * Deliberately the SERVER's arithmetic byte for byte
 * (services/platform-settings.ts → consumerRewardVnd): this figure is
 * printed inside the app mirror, which claims to be exactly what the
 * customer sees — and what the customer sees is the number the API
 * sends. The old extra "round down to 1.000đ" step was a no-op at 50% on
 * 10.000đ bid steps (bid/2 is always a multiple of 5.000đ) and at any
 * other rate would print a figure the app never shows, so it is gone
 * rather than kept as decoration.
 *
 * NOT the wallet hold. The hold is collateral against the fee and stays
 * at a fixed 50% — see statusChip() in Board.jsx.
 */
export function rewardOf(bid, pct = DEFAULT_REWARD_PCT) {
  return Math.floor((bid * pct) / 100);
}

/**
 * The reward on an EXISTING lead — its promise, not today's rate.
 *
 * rewardOf() above quotes an offer that has not been taken yet. The
 * moment a lead exists, the customer has been shown a number
 * (leads.reward_vnd, on the GET /rm/leads row as `reward_vnd`) and that
 * number is what settlement pays, however long the lead sits and wherever
 * the rate moves meanwhile. Never re-derive it from consumer_reward_pct.
 *
 * Mirrors services/platform-settings.ts → promisedShareVnd: same fee ⇒
 * the promise verbatim; a different final card ⇒ scaled by the fee, which
 * preserves the lead's own rate.
 *
 * @param {number} promisedVnd lead.reward_vnd
 * @param {number} leadFeeVnd  lead.fee_vnd (the routing-time bid)
 * @param {number} finalFeeVnd the fee actually being invoiced
 */
export function promisedRewardOf(promisedVnd, leadFeeVnd, finalFeeVnd) {
  const promised = promisedVnd || 0;
  if (!leadFeeVnd || finalFeeVnd === leadFeeVnd) return promised;
  return Math.floor((promised * finalFeeVnd) / leadFeeVnd);
}
