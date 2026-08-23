import React from "react";
import { api } from "../api.js";
import { ErrBox, Loading, PageHead, useLoad } from "../components.jsx";

const TILES = [
  { key: "pending_cards", label: "Thẻ chờ duyệt", to: "cards", hot: true },
  { key: "pending_registrations", label: "Đăng ký chờ duyệt", to: "regs", hot: true },
  { key: "disputed_claims", label: "Khiếu nại tranh chấp", to: "claims", hot: true },
  { key: "unpaid_invoices", label: "Hoá đơn chưa thu", to: "claims", hot: false },
  { key: "active_rms", label: "Đối tác đang hoạt động", to: "rms", hot: false },
];

export default function Overview({ nav }) {
  const { data, loading, error, reload } = useLoad(() => api.overview(), []);
  return (
    <div className="bn-up">
      <PageHead
        title="Tổng quan"
        sub="Hàng đợi cần xử lý trên toàn hệ thống Bonia Connect."
      />
      {loading ? <Loading /> : null}
      {error ? <ErrBox error={error} onRetry={reload} /> : null}
      {data ? (
        <div className="tile-grid">
          {TILES.map((t) => {
            const n = data[t.key] ?? 0;
            return (
              <button
                key={t.key}
                className={`tile ${t.hot && n > 0 ? "hot" : ""}`}
                onClick={() => nav(t.to)}
              >
                <div className="tile-num mono">{n}</div>
                <div className="tile-label">{t.label}</div>
                <div className="tile-go">Mở trang →</div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
