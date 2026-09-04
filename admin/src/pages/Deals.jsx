import React, { useState } from "react";
import { api, fmtDate, shortId, vnd } from "../api.js";
import { Empty, ErrBox, Loading, PageHead, StatusChip, useLoad } from "../components.jsx";

/**
 * Deals — what is in flight, before it becomes money.
 *
 * Every other admin view reaches a lead THROUGH a claim, so a deal only
 * became visible once someone declared a card was opened. This is the part
 * before that: who tapped which card, which partner got it, whether they
 * ever called. During the pilot that is the half worth watching.
 *
 * IDENTITY IS THIN ON PURPOSE — first name and city, never the phone
 * number. Admin has no operational need for it and the product's promise
 * is that the number does not travel; a support view is not a reason to
 * break that.
 */

const SCOPES = [
  { key: "active", label: "Đang chạy" },
  { key: "done", label: "Đã kết thúc" },
  { key: "all", label: "Tất cả" },
];

const STAGE_TONE = {
  moi: ["Cần gọi", "red"],
  da_goi: ["Cần gọi", "amber"],
  dang_tu_van: ["Đang tư vấn", "blue"],
  hen_goi_lai: ["Hẹn gọi lại", "blue"],
  da_nop_ho_so: ["Đã nộp hồ sơ", "blue"],
  duoc_duyet: ["Thành công", "green"],
  that_bai: ["Thất bại", "grey"],
  cancelled: ["Đã huỷ", "grey"],
};

/** The 48h first-contact promise, rendered as urgency rather than a number. */
function SlaCell({ hours, attempts }) {
  if (attempts > 0) {
    return <span style={{ color: "var(--ink-55)" }}>đã gọi {attempts}×</span>;
  }
  if (hours == null) return <span style={{ color: "var(--ink-55)" }}>—</span>;
  if (hours < 0) {
    return <b style={{ color: "#b3261e" }}>quá hạn {Math.abs(hours)}h</b>;
  }
  return (
    <span style={{ color: hours <= 12 ? "#a8620a" : "var(--ink-55)" }}>
      còn {hours}h để gọi
    </span>
  );
}

export default function Deals() {
  const [scope, setScope] = useState("active");
  const [selId, setSelId] = useState(null);
  const { data, loading, error, at } = useLoad(() => api.deals(scope), [scope]);
  const deals = data?.deals || [];

  return (
    <div className="bn-up">
      <PageHead
        title="Giao dịch đang chạy"
        sub="Khách đã chọn thẻ nào, ai đang phụ trách, và đã gọi chưa. Tự cập nhật mỗi 30 giây."
        at={at}
      />

      <div className="pl-lanes" style={{ marginBottom: 14 }}>
        {SCOPES.map((s) => (
          <button
            key={s.key}
            className={`pl-lane ${scope === s.key ? "active" : ""}`}
            onClick={() => {
              setScope(s.key);
              setSelId(null);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading && !data && <Loading />}
      {error && <ErrBox error={error} />}
      {data && deals.length === 0 && (
        <Empty>
          {scope === "active"
            ? "Chưa có giao dịch nào đang chạy. Khi khách bấm quan tâm một thẻ, giao dịch sẽ hiện ở đây ngay."
            : "Chưa có giao dịch nào kết thúc."}
        </Empty>
      )}

      {deals.length > 0 && (
        <table className="tbl">
          <thead>
            <tr>
              <th>Khách</th>
              <th>Thẻ</th>
              <th>Tư vấn viên</th>
              <th>Trạng thái</th>
              <th>Liên hệ</th>
              <th style={{ textAlign: "right" }}>Phí</th>
              <th style={{ textAlign: "right" }}>Tuổi</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr key={d.lead_id}>
                <td>
                  <b>{d.customer}</b>
                  {d.city && (
                    <div style={{ fontSize: 12, color: "var(--ink-55)" }}>{d.city}</div>
                  )}
                </td>
                <td>
                  {d.card || <span style={{ color: "var(--ink-55)" }}>—</span>}
                  <div style={{ fontSize: 12, color: "var(--ink-55)" }}>{d.bank}</div>
                </td>
                <td>{d.partner}</td>
                <td>
                  <StatusChip map={STAGE_TONE} value={d.state} />
                  {d.on_call_now && (
                    <div style={{ fontSize: 12, color: "#1d7a4f", fontWeight: 600 }}>
                      ● đang gọi
                    </div>
                  )}
                </td>
                <td>
                  <SlaCell hours={d.contact_sla_hours_left} attempts={d.call_attempts} />
                </td>
                <td style={{ textAlign: "right" }} className="mono">
                  {vnd(d.fee_vnd)}
                </td>
                <td style={{ textAlign: "right" }} className="mono">
                  {d.age_hours < 24 ? `${d.age_hours}h` : `${Math.floor(d.age_hours / 24)}d`}
                </td>
                <td style={{ textAlign: "right" }}>
                  <button
                    className="btn-ghost"
                    onClick={() => setSelId(selId === d.lead_id ? null : d.lead_id)}
                  >
                    {selId === d.lead_id ? "Đóng" : "Chi tiết"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selId && <DealTimeline id={selId} />}
    </div>
  );
}

/**
 * One deal's timeline, straight off the append-only lead_events. Loaded
 * only when opened — the list is the hot path and most rows are never
 * expanded.
 */
function DealTimeline({ id }) {
  const { data, loading, error } = useLoad(() => api.deal(id), [id]);
  if (loading && !data) return <Loading />;
  if (error) return <ErrBox error={error} />;
  if (!data) return null;

  return (
    <section className="card" style={{ marginTop: 16 }}>
      <div className="eyebrow">Dòng thời gian · {shortId(data.lead_id)}</div>
      <h3 style={{ margin: "4px 0 12px", fontSize: 17 }}>
        {data.customer} · {data.card || "—"}
      </h3>

      {data.intent_note && (
        <p style={{ fontSize: 13.5, color: "var(--ink-55)", marginTop: 0 }}>
          Ghi chú của khách: “{data.intent_note}”
        </p>
      )}
      {data.notes && (
        <p style={{ fontSize: 13.5, color: "var(--ink-55)", marginTop: 0 }}>
          Ghi chú của tư vấn viên: “{data.notes}”
        </p>
      )}

      {data.claim && (
        <div style={{ fontSize: 13.5, marginBottom: 10 }}>
          Đối soát: <b>{data.claim.state}</b> · phí {vnd(data.claim.fee_vnd)} · khách nhận{" "}
          {vnd(data.claim.user_share_vnd)}
          {data.claim.deny_reason && (
            <div style={{ color: "#b3261e" }}>Lý do từ chối: {data.claim.deny_reason}</div>
          )}
        </div>
      )}

      {data.timeline.length > 0 ? (
        <div className="timeline">
          {data.timeline.map((e, i) => {
            const detail = Object.entries(e.detail || {})
              .filter(([, v]) => v !== null && typeof v !== "object")
              .map(([k, v]) => `${k}=${v}`)
              .join(" · ");
            return (
              <div key={i} className="tl-event">
                <span className="mono">{fmtDate(e.at)}</span> — {e.event}
                {detail && <> · {detail}</>}
              </div>
            );
          })}
        </div>
      ) : (
        <Empty>Chưa có sự kiện nào.</Empty>
      )}
    </section>
  );
}
