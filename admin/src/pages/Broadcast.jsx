import React, { useState } from "react";
import { api, fmtDate } from "../api.js";
import { ConfirmModal, Empty, ErrBox, Loading, PageHead, useLoad } from "../components.jsx";

/**
 * Announcement composer.
 *
 * The screen is built around one fact: a push to the whole user base cannot be
 * recalled. So the order is deliberately compose → preview → dry run → typed
 * confirmation, and the send button stays disabled until a dry run for the
 * CURRENT text and audience has been seen.
 *
 * The preview matters more than it looks. Notification bodies truncate hard on
 * a real lock screen, and the only way to catch a call-to-action that falls off
 * the second line is to see it in a phone-shaped box before sending.
 */

const AUDIENCE_LABELS = {
  all: "Tất cả người dùng",
  v105: "Chắc chắn đã có tab Ưu đãi (đăng ký sau 27/08)",
  ios: "Chỉ iPhone",
  android: "Chỉ Android",
  phones: "Danh sách số cụ thể (gửi thử)",
};

const AUDIENCE_NOTE = {
  all: "Mọi thiết bị còn token hợp lệ. Người dùng bản cũ vẫn thấy thông báo nhưng chạm vào sẽ không mở được tab — nội dung phải tự nói rõ việc cập nhật app.",
  v105: "Nhóm an toàn nhất để thử: chạm vào là mở thẳng tab Ưu đãi.",
  ios: "Toàn bộ iPhone, không phân biệt phiên bản.",
  android: "Toàn bộ máy Android, không phân biệt phiên bản.",
  phones: "Nhập số điện thoại dạng +84…, mỗi số một dòng. Dùng để tự gửi cho mình trước.",
};

/**
 * Post-send results.
 *
 * Every number here is paired with the same measurement taken over an equally
 * long window BEFORE the send. A campaign is only legible against its own
 * baseline: forty people opening a tab is a triumph or a slow afternoon
 * depending entirely on what forty usually is.
 */
function Results({ latest }) {
  if (!latest || !latest.outcome) return null;
  const o = latest.outcome;
  const lift = o.opened_people_before > 0
    ? Math.round((o.opened_people / o.opened_people_before) * 10) / 10
    : null;
  const peak = Math.max(1, ...latest.curve.map((c) => c.opens));

  return (
    <section className="bc-results">
      <div className="bc-results-head">
        <div>
          <div className="eyebrow">Kết quả</div>
          <h2 className="bc-h2" style={{ margin: "2px 0 0" }}>{latest.title}</h2>
        </div>
        <div className="bc-results-window">{o.window_hours} giờ kể từ khi gửi</div>
      </div>

      <div className="bc-funnel">
        <div className="bc-step">
          <span className="bc-step-n">{latest.sent_ok}</span>
          <span className="bc-step-l">Nhận được</span>
          <span className="bc-step-s">{latest.sent_failed} lỗi (đã gỡ app)</span>
        </div>
        <div className="bc-step">
          <span className="bc-step-n">{o.opened_people}</span>
          <span className="bc-step-l">Mở tab Ưu đãi</span>
          <span className="bc-step-s">
            {o.opened_people_before} cùng khoảng thời gian trước đó
            {lift ? ` · gấp ${lift}×` : ""}
          </span>
        </div>
        <div className="bc-step">
          <span className="bc-step-n">{o.picked_city}</span>
          <span className="bc-step-l">Chọn tỉnh/thành</span>
          <span className="bc-step-s">{o.stuck_at_city} còn kẹt ở bước này</span>
        </div>
        <div className="bc-step bc-step-end">
          <span className="bc-step-n">{o.intents}</span>
          <span className="bc-step-l">Yêu cầu mở thẻ</span>
          <span className="bc-step-s">chuyển thành lead</span>
        </div>
      </div>

      {latest.curve.length > 0 && (
        <div className="bc-curve">
          {latest.curve.map((c) => (
            <div key={c.hour} className="bc-bar-wrap" title={`${c.opens} lượt · ${c.people} người`}>
              <div className="bc-bar" style={{ height: `${Math.round((c.opens / peak) * 100)}%` }} />
              <div className="bc-bar-x">
                {new Date(c.hour).toLocaleTimeString("vi-VN", { hour: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="bc-hint">
        Đếm bắt đầu từ lúc bật theo dõi (16/09). Lượt mở trước đó không có dữ liệu người dùng.
      </div>
    </section>
  );
}

export default function Broadcast({ showToast }) {
  const load = useLoad(() => api.broadcasts(), []);
  const audiences = load.data?.audiences || {};
  const latest = load.data?.latest || null;
  const history = load.data?.history || [];

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("phones");
  const [phones, setPhones] = useState("");
  const [dry, setDry] = useState(null); // {targeted, devices, key}
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  const phoneList = phones
    .split(/[\n,]/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Identity of what is currently composed. A dry run is only valid for the
  // exact text + audience it ran against; editing anything invalidates it, so
  // nobody can preview one message and send another.
  const key = JSON.stringify([title.trim(), body.trim(), audience, phoneList]);
  const dryValid = dry && dry.key === key;

  const reach =
    audience === "phones"
      ? { people: phoneList.length, devices: phoneList.length }
      : audiences[audience] || { people: 0, devices: 0 };

  const canCompose = title.trim() && body.trim() && (audience !== "phones" || phoneList.length);

  const runDry = async () => {
    setBusy(true);
    try {
      const r = await api.sendBroadcast({
        title: title.trim(),
        body: body.trim(),
        audience,
        phones: phoneList,
        dryRun: true,
      });
      setDry({ targeted: r.targeted, devices: r.devices, key });
      showToast(`Thử xong — sẽ gửi tới ${r.targeted} người (${r.devices} thiết bị). Chưa gửi gì cả.`);
      load.reload();
    } catch (ex) {
      showToast(`Lỗi: ${ex.body?.error || ex.message}`);
    } finally {
      setBusy(false);
    }
  };

  const doSend = async () => {
    setBusy(true);
    try {
      const r = await api.sendBroadcast({
        title: title.trim(),
        body: body.trim(),
        audience,
        phones: phoneList,
        dryRun: false,
      });
      setConfirmOpen(false);
      setTyped("");
      setDry(null);
      showToast(`Đã gửi tới ${r.sent_ok ?? r.sentOk} thiết bị (${r.sent_failed ?? r.sentFailed} lỗi).`);
      load.reload();
    } catch (ex) {
      const e = ex.body?.error;
      if (e === "already_sent") {
        showToast("Tiêu đề này đã được gửi cho nhóm này rồi — đổi tiêu đề nếu thực sự muốn gửi lại.");
      } else {
        showToast(`Lỗi: ${e || ex.message}`);
      }
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  };

  if (load.loading) return <Loading />;
  if (load.error) return <ErrBox error={load.error} onRetry={load.reload} />;

  return (
    <>
      <PageHead
        title="Thông báo"
        sub="Gửi một thông báo đẩy tới người dùng app. Không thể thu hồi sau khi gửi."
        at={load.at}
      />

      <Results latest={latest} />

      <div className="bc-grid">
        <section className="bc-compose">
          <label className="bc-label">Gửi cho ai</label>
          <select
            className="bc-input"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          >
            {Object.entries(AUDIENCE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
                {audiences[k] ? ` — ${audiences[k].people} người` : ""}
              </option>
            ))}
          </select>
          <div className="bc-hint">{AUDIENCE_NOTE[audience]}</div>

          {audience === "phones" && (
            <textarea
              className="bc-input bc-phones"
              placeholder={"+84909291268\n+84909680220"}
              value={phones}
              onChange={(e) => setPhones(e.target.value)}
              rows={3}
            />
          )}

          <label className="bc-label">Tiêu đề</label>
          <input
            className="bc-input"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ưu đãi mở thẻ đã có trên Bonia"
          />
          <div className="bc-count">{title.length}/120</div>

          <label className="bc-label">Nội dung</label>
          <textarea
            className="bc-input"
            value={body}
            maxLength={400}
            rows={4}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Mở thẻ tín dụng qua Bonia và nhận thưởng tiền mặt…"
          />
          <div className="bc-count">{body.length}/400</div>

          <div className="bc-reach">
            <span>Sẽ gửi tới</span>
            <strong>{reach.people} người</strong>
            <span className="bc-devices">{reach.devices} thiết bị</span>
          </div>

          <div className="bc-actions">
            <button className="btn btn-ghost" disabled={!canCompose || busy} onClick={runDry}>
              Chạy thử (không gửi)
            </button>
            <button
              className="btn btn-navy btn-navy-inline"
              disabled={!dryValid || busy}
              onClick={() => setConfirmOpen(true)}
            >
              Gửi thật
            </button>
          </div>
          {!dryValid && canCompose && (
            <div className="bc-hint bc-gate">
              Chạy thử trước đã. Sửa nội dung hoặc đổi nhóm thì phải chạy thử lại.
            </div>
          )}
        </section>

        <section className="bc-preview-wrap">
          <label className="bc-label">Xem trước trên máy</label>
          <div className="bc-phone">
            <div className="bc-notif">
              <div className="bc-notif-app">
                <span className="bc-notif-icon" />
                BONIA
              </div>
              <div className="bc-notif-title">{title.trim() || "Tiêu đề thông báo"}</div>
              <div className="bc-notif-body">
                {body.trim() || "Nội dung sẽ hiển thị ở đây."}
              </div>
            </div>
          </div>
          <div className="bc-hint">
            Máy thật cắt bớt phần đuôi khi màn hình khoá. Câu quan trọng nhất nên nằm ở đầu.
          </div>
        </section>
      </div>

      <h2 className="bc-h2">Đã gửi</h2>
      {history.length === 0 ? (
        <Empty>Chưa gửi thông báo nào.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Tiêu đề</th>
                <th>Nhóm</th>
                <th className="num">Người</th>
                <th className="num">Thành công</th>
                <th className="num">Lỗi</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className={h.dry_run ? "bc-dry" : ""}>
                  <td>{fmtDate(h.started_at)}</td>
                  <td>
                    {h.title}
                    {h.dry_run && <span className="bc-tag">chạy thử</span>}
                  </td>
                  <td>{AUDIENCE_LABELS[h.audience] || h.audience}</td>
                  <td className="num">{h.targeted}</td>
                  <td className="num">{h.dry_run ? "—" : h.sent_ok}</td>
                  <td className="num">{h.dry_run ? "—" : h.sent_failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        danger
        title={`Gửi tới ${reach.people} người?`}
        confirmLabel="Gửi ngay"
        busy={busy}
        onCancel={() => {
          setConfirmOpen(false);
          setTyped("");
        }}
        onConfirm={typed.trim().toUpperCase() === "GUI" ? doSend : undefined}
      >
        <p style={{ margin: "0 0 10px" }}>
          Thông báo sẽ hiện trên máy của <strong>{reach.people} người</strong> và không thể thu hồi.
        </p>
        <div className="bc-confirm-preview">
          <div className="bc-notif-title">{title.trim()}</div>
          <div className="bc-notif-body">{body.trim()}</div>
        </div>
        <p style={{ margin: "12px 0 6px" }}>
          Gõ <strong>GUI</strong> để xác nhận.
        </p>
        <input
          className="bc-input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="GUI"
          autoFocus
        />
      </ConfirmModal>
    </>
  );
}
