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
        <span className="ladder-title">Bảng xếp hạng</span>
        <span className="ladder-rank">
          {myIdx >= 0 ? `Hạng #${myIdx + 1} / ${ladder.length} RM` : `${ladder.length} RM đang bid`}
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
  if (rank === 1) text = "Bạn đang cao nhất. Giữ nguyên là được gọi khách.";
  else if (winning && rank < slots) text = `An toàn — cao hơn suất cuối ${vnd(myBid - (cutoff ?? myBid))}.`;
  else if (winning) text = "Bạn đang giữ suất cuối, dễ bị vượt.";
  else text = `Cần thêm ${vnd((cutoff ?? myBid) - myBid + BID_STEP)} để vào ${slots} suất.`;
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
export function CallOverlay({ name, phase, seconds, muted, onMute, onHangup, onRetry, onClose }) {
  const label =
    phase === "connecting" ? "Đang kết nối qua Bonia"
    : phase === "ringing" ? "Đang đổ chuông"
    : phase === "connected" ? "Đang trong cuộc gọi"
    : "Không kết nối được";
  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <div className="scrim">
      <div className="modal call bn-up">
        <div className="phase">{label}</div>
        <div className={`call-avatar ${phase === "ringing" ? "ringing" : ""} ${phase === "failed" ? "failed" : ""}`}>
          {(name || "K").trim().slice(-1).toUpperCase()}
        </div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>{name}</div>
        <div className="mask-line">Kết nối qua số Bonia · số hai bên đều được che</div>
        <div
          className="call-timer"
          style={{ fontSize: phase === "connected" ? 32 : 20, color: phase === "connected" ? "var(--ink)" : "var(--ink-18)" }}
        >
          {phase === "connected" ? mmss : phase === "failed" ? "—" : "···"}
        </div>
        {phase === "failed" && (
          <div className="err-panel" style={{ textAlign: "left" }}>
            <b>Khách không nghe máy.</b> Máy khách đang bật chuyển hướng sang trợ lý Bonia nên không đổ
            chuông trực tiếp. Thử lại trong khung giờ khách chọn — nếu lặp lại, báo Bonia.
          </div>
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
            <div style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 600 }}>Chốt được một thẻ</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-45)" }}>{lead?.first_name} · bạn thắng ở mức bạn tự bid</div>
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
              ["Khách nhận lại (50%)", vnd(Math.floor((payment?.fee_vnd || 0) / 2))],
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
