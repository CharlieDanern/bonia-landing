import React, { useEffect, useRef, useState } from "react";
import { vnd, countdown } from "./api.js";

export const BID_STEP = 10_000;
export const BID_MIN = 100_000;

/** Live countdown chip (ticks 1s; amber under 2h per the design). */
export function Countdown({ iso }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const c = countdown(iso);
  return <span className={`chip ${c.urgent ? "urgent" : ""}`}>{c.text}</span>;
}

/**
 * Amount stepper. Uses FUNCTIONAL state updates — the handoff calls this
 * out explicitly: reading from the render closure collapses rapid clicks,
 * and 350k→450k is ten fast taps.
 */
export function Stepper({ value, onChange, min = BID_MIN }) {
  return (
    <div className="stepper">
      <button onClick={() => onChange((v) => Math.max(min, v - BID_STEP))} aria-label="Giảm">−</button>
      <span className="val">{vnd(value)}</span>
      <button onClick={() => onChange((v) => v + BID_STEP)} aria-label="Tăng">+</button>
    </div>
  );
}

/**
 * BẢNG XẾP HẠNG — the bid ladder. Shows the winning block, the dashed
 * cutoff after the last winning slot, and the RM's own row (with a ⋯ gap
 * when they rank below slots+1). This is the screen's whole value.
 */
export function Ladder({ ladder, slots, myBid }) {
  if (!ladder?.length) return null;
  const myIdx = myBid == null ? -1 : ladder.indexOf(myBid);
  const shown = [];
  const top = ladder.slice(0, slots);
  top.forEach((amt, i) => shown.push({ amt, i }));
  if (myIdx >= slots) {
    if (myIdx > slots) shown.push({ gap: true });
    shown.push({ amt: myBid, i: myIdx });
  }
  return (
    <div className="ladder">
      <div className="ladder-head">
        <span className="ladder-title">Mức phí hiện tại</span>
        <span className="ladder-rank">
          {myIdx >= 0 ? `Vị trí #${myIdx + 1} / ${ladder.length}` : `${ladder.length} đơn vị tham gia`}
        </span>
      </div>
      {shown.map((row, k) =>
        row.gap ? (
          <div className="ladder-gap" key={`gap${k}`}>⋯</div>
        ) : (
          <div
            key={`${row.i}-${row.amt}`}
            className={`ladder-row ${row.i === myIdx ? "me" : ""} ${
              row.i === slots - 1 && myIdx !== row.i ? "cutoff" : ""
            }`}
          >
            <span className="pos">#{row.i + 1}</span>
            <span className="amt">{vnd(row.amt)}</span>
            <span className="tag">
              {row.i === myIdx ? "BẠN" : row.i === slots - 1 ? "suất cuối" : ""}
            </span>
          </div>
        )
      )}
    </div>
  );
}

/** Winning/outbid guidance under the ladder. */
export function GapCallout({ ladder, slots, myBid }) {
  if (myBid == null) return null;
  const rank = ladder.indexOf(myBid) + 1;
  const cutoff = ladder.length >= slots ? ladder[slots - 1] : null;
  const winning = rank > 0 && rank <= slots;
  let text;
  if (rank === 1) text = "Mức phí của bạn đang cao nhất.";
  else if (winning && rank < slots) text = `Trong nhóm kết nối — cao hơn suất cuối ${vnd(myBid - (cutoff ?? myBid))}.`;
  else if (winning) text = "Bạn đang giữ suất cuối.";
  else text = `Cần thêm ${vnd((cutoff ?? myBid) - myBid + BID_STEP)} để vào nhóm kết nối.`;
  return <div className={`callout ${winning ? "win" : "lose"}`}>{text}</div>;
}

export function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="toast">
      <span className="tdot" />
      {msg}
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState(null);
  const timer = useRef();
  const show = (m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 3200);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return [msg, show];
}

/**
 * Call overlay. Phases mirror the softphone: connecting → ringing →
 * connected | failed. The masking promise and the wake-lock warning are
 * mandatory on every call per the design + the real WebRTC constraint.
 */
export function CallOverlay({ name, phase, failReason, seconds, muted, onMute, onHangup, onRetry, onClose }) {
  const label =
    phase === "connecting" ? "Đang kết nối qua Bonia"
    : phase === "ringing" ? "Đang đổ chuông"
    : phase === "connected" ? "Đang trong cuộc gọi"
    : failReason === "mic_denied" || failReason === "mic_missing" ? "Chưa dùng được micro"
    : failReason === "unsupported" ? "Trình duyệt chưa hỗ trợ"
    : failReason === "not_registered" ? "Tổng đài chưa sẵn sàng"
    : "Không kết nối được";
  // Every softphone failure used to render as "Khách hàng không nghe máy",
  // including a denied microphone prompt — the likeliest first-call failure
  // for a new rep. Wrong diagnosis → they press "Gọi lại", fail the same
  // way, and blame the lead. Keep the no-answer copy for genuine SIP-level
  // no-answer only.
  const failPanel =
    failReason === "mic_denied" ? (
      <>
        <b>Bonia cần quyền dùng micro.</b> Bấm biểu tượng khoá trên thanh địa chỉ →
        cho phép <b>Micro</b>, rồi bấm Gọi lại. Khách hàng chưa hề bị gọi.
      </>
    ) : failReason === "mic_missing" ? (
      <>
        <b>Không tìm thấy micro.</b> Cắm tai nghe hoặc kiểm tra thiết bị ghi âm trong
        cài đặt máy, rồi bấm Gọi lại. Khách hàng chưa hề bị gọi.
      </>
    ) : failReason === "sip_missing" ? (
      <>
        <b>Chưa tải được thành phần gọi.</b> Tải lại trang (Ctrl/Cmd + Shift + R). Nếu vẫn
        lỗi, đây là lỗi từ Bonia — nhắn Duy 0909 291 268. Khách hàng chưa hề bị gọi.
      </>
    ) : failReason === "unsupported" ? (
      <>
        <b>Trình duyệt này chưa hỗ trợ gọi.</b> Dùng Chrome hoặc Safari bản mới nhất trên
        máy tính, và mở đúng địa chỉ https://bonia.vn/app/.
      </>
    ) : failReason === "not_registered" ? (
      <>
        <b>Tổng đài đang kết nối lại.</b> Đợi vài giây rồi bấm Gọi lại. Nếu vẫn lỗi, tải
        lại trang.
      </>
    ) : (
      <>
        <b>Khách hàng không nghe máy.</b> Máy khách đang bật chuyển hướng sang trợ lý Bonia nên không
        đổ chuông trực tiếp. Thử lại trong khung giờ khách hàng đã chọn.
      </>
    );
  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <div className="scrim">
      <div className="modal call bn-up">
        <div className="phase">{label}</div>
        <div className={`call-avatar ${phase === "ringing" ? "ringing" : ""} ${phase === "failed" ? "failed" : ""}`}>
          {(name || "K").trim().slice(-1).toUpperCase()}
        </div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>{name}</div>
        <div className="mask-line">Kết nối qua số Bonia · số hai bên được bảo mật</div>
        <div
          className="call-timer"
          style={{ fontSize: phase === "connected" ? 32 : 20, color: phase === "connected" ? "var(--ink)" : "var(--ink-18)" }}
        >
          {phase === "connected" ? mmss : phase === "failed" ? "—" : "···"}
        </div>
        {phase === "failed" && (
          <div className="err-panel" style={{ textAlign: "left" }}>{failPanel}</div>
        )}
        <div className="warn-box">
          <b>Giữ màn hình mở trong lúc gọi.</b> Khoá máy sẽ làm rớt cuộc gọi.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {phase === "failed" ? (
            <>
              <button className="btn-mute" onClick={onClose}>Đóng</button>
              <button className="btn-end" style={{ background: "var(--green)" }} onClick={onRetry}>Gọi lại</button>
            </>
          ) : (
            <>
              <button className={`btn-mute ${muted ? "on" : ""}`} onClick={onMute}>
                {muted ? "Bật tiếng" : "Tắt tiếng"}
              </button>
              <button className="btn-end" onClick={onHangup}>Kết thúc</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Payment modal: VietQR + line items + 3-dot settlement progress. */
/**
 * Readiness sheet before the first call of a session.
 *
 * "Gọi qua Bonia" used to dial straight into a live customer — a rep could
 * be on a phone speaker in a café, with no headset and no idea the call is
 * recorded, and the customer's first impression of Bonia is that call.
 * Shown once per session (or never again if they say so), so it prepares a
 * new rep without nagging an experienced one.
 *
 * `softphoneReady` is the one line here that is a FACT rather than advice:
 * without it, an unregistered softphone is only discovered after the rep
 * clicks and the call fails.
 */
export function CallReadyModal({ name, softphoneReady, onStart, onClose }) {
  const [dontShow, setDontShow] = React.useState(false);
  const start = () => {
    if (dontShow) {
      try {
        localStorage.setItem("bonia.callReady.ack", "1");
      } catch {
        /* private mode — proceed, the sheet just shows again next time */
      }
    }
    onStart();
  };
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal ready bn-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="ready-title">Chuẩn bị gọi{name ? ` cho ${name}` : ""}</h2>
        <p className="ready-sub">Khách nghe máy ngay sau khi bạn bấm gọi.</p>

        <ul className="ready-list">
          <li>
            <span className="tick">✓</span>
            <span>
              Dùng <b>tai nghe có micro</b> — loa ngoài dễ vọng âm.
            </span>
          </li>
          <li>
            <span className="tick">✓</span>
            <span>
              <b>Internet ổn định</b> — wifi tốt hơn 4G.
            </span>
          </li>
          <li>
            <span className="tick">✓</span>
            <span>
              Ngồi ở nơi <b>yên tĩnh</b>.
            </span>
          </li>
          <li>
            <span className="tick">✓</span>
            <span>
              Trình duyệt hỏi quyền micro — chọn <b>Cho phép</b>.
            </span>
          </li>
        </ul>

        <div className="ready-note">
          Khách chỉ thấy <b>số Bonia</b>, không thấy số của bạn. Cuộc gọi được ghi âm và
          bản ghi nội dung hiển thị cho cả hai bên.
        </div>

        {!softphoneReady && (
          <div className="ready-warn">Tổng đài chưa kết nối — tải lại trang trước khi gọi.</div>
        )}

        <div className="ready-foot">
          <button className="btn-navy" onClick={start} disabled={!softphoneReady}>
            Gọi ngay
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Để sau
          </button>
          {/* In the footer, not on its own row: it is a preference about the
              sheet, not a third step in the checklist. */}
          <label className="ready-again">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
            />
            Không hiện lại
          </label>
        </div>
      </div>
    </div>
  );
}

export function PaymentModal({ lead, payment, onClose }) {
  const step = payment?.state === "paid" || payment?.state === "settled" ? 2 : payment?.state === "invoiced" ? 1 : 1;
  const dots = ["Chờ thanh toán", "Đã nhận", "Hoàn tất"];
  const reached = payment?.state === "settled" ? 3 : payment?.state === "paid" ? 2 : 1;
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal pay bn-up" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "var(--green)", display: "grid", placeItems: "center", color: "#fff", fontSize: 19 }}>✓</div>
          <div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 600 }}>Giao dịch thành công</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-45)" }}>{lead?.first_name} · mức phí bạn đã đặt</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 150, height: 150, border: "1px solid var(--border)", borderRadius: 12, padding: 9, background: "#fff", flex: "none" }}>
            {payment?.payment?.qr_url ? (
              <img src={payment.payment.qr_url} alt="VietQR" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <div style={{ fontSize: 11, color: "var(--ink-35)", display: "grid", placeItems: "center", height: "100%", textAlign: "center", lineHeight: 1.5 }}>
                QR sẽ hiện khi Bonia cấu hình tài khoản nhận
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            {[
              ["Phí thành công", vnd(payment?.fee_vnd)],
              ["Nội dung CK", payment?.payment?.memo || "—"],
              // THIS claim's snapshot, straight off the server
              // (user_share_vnd) — the share frozen when this deal closed.
              // Never a client-side floor(fee/2): wrong at every rate but
              // 50, and it misstated settled deals. Never the live
              // consumer_reward_pct either — that is today's rate, not
              // this claim's. No "(50%)" label: the percentage belongs to
              // the lead, not to this page.
              ["Khách hàng nhận lại", vnd(payment?.user_share_vnd)],
            ].map(([k, v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border-faint)", fontSize: 13 }}>
                <span style={{ color: "var(--ink-45)" }}>{k}</span>
                <span className="mono" style={{ fontWeight: 500, color: i === 2 ? "var(--green-text-alt)" : "var(--ink)" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18 }}>
          {dots.map((d, i) => (
            <React.Fragment key={d}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: i < reached ? "var(--green)" : "#dde3ec" }} />
                <span style={{ fontSize: 11.5, fontWeight: i === reached - 1 ? 600 : 400, color: "var(--ink-45)" }}>{d}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, borderTop: "1px dashed var(--border)", marginBottom: 18 }} />}
            </React.Fragment>
          ))}
        </div>
        <button className="btn btn-ghost btn-block" style={{ marginTop: 18 }} onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}

/**
 * Partner terms acceptance gate.
 *
 * Non-dismissible on purpose: this is the one screen in the portal with no
 * escape hatch. Everything the marketplace enforces against a partner —
 * the success fee they owe, suspension when an authorisation lapses, the
 * dispute clause — rests on this document, and enforcing it against
 * someone with no acceptance on record is the weak link. So there is no
 * scrim click-to-close and no X.
 *
 * The summary is orientation, NOT a substitute for the document. It names
 * the four clauses a partner is most likely to be surprised by later, and
 * links out to the full text. Anything that reads like "you don't need to
 * open the terms" would defeat the purpose of collecting the acceptance.
 */
export function TermsGate({ version, onAccept }) {
  const [agreed, setAgreed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const accept = async () => {
    setBusy(true);
    setErr(null);
    try {
      await onAccept();
    } catch {
      setErr("Không ghi nhận được. Kiểm tra kết nối rồi thử lại.");
      setBusy(false);
    }
  };

  return (
    <div className="scrim terms-scrim">
      <div className="modal terms bn-up">
        <h2 className="terms-title">Điều khoản đối tác</h2>
        <p className="terms-sub">
          Trước khi bắt đầu nhận khách, mời anh/chị đọc và xác nhận điều khoản hợp tác.
          Phiên bản <b>{version}</b>.
        </p>

        <ul className="terms-list">
          <li>
            <b>Mức phí là cam kết trả.</b> Khi khách do Bonia kết nối mở thẻ thành công,
            anh/chị trả mức phí đã đặt cho lượt kết nối đó.
          </li>
          <li>
            <b>Khách nhận một phần mức phí.</b> Tỷ lệ được công bố trên ứng dụng tại thời
            điểm phát sinh lead và không đổi sau đó, kể cả khi Bonia điều chỉnh tỷ lệ chung.
          </li>
          <li>
            <b>Tạm giữ và hoàn lại.</b> Với lead có tạm giữ, hệ thống giữ toàn bộ mức phí khi
            giao lead; không thành công thì hoàn lại ví. Số dư âm sẽ ngừng nhận lead mới.
          </li>
          <li>
            <b>Tư cách phải còn hiệu lực.</b> Email công việc hoặc văn bản uỷ quyền hết hiệu
            lực sẽ tạm ngưng tài khoản cho đến khi cập nhật.
          </li>
        </ul>

        <a
          className="terms-link"
          href="https://bonia.vn/terms-business.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Đọc toàn văn Điều khoản đối tác →
        </a>

        <label className="terms-check">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>
            Tôi đã đọc và đồng ý với Điều khoản đối tác phiên bản {version}.
          </span>
        </label>

        {err && <p className="terms-err">{err}</p>}

        <button className="terms-btn" disabled={!agreed || busy} onClick={accept}>
          {busy ? "Đang ghi nhận…" : "Đồng ý và tiếp tục"}
        </button>
      </div>
    </div>
  );
}
