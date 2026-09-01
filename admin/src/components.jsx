import React, { useCallback, useEffect, useRef, useState } from "react";

// Toast — copied from portal/src/components.jsx.
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

// Tiny load hook: loading / error / data / reload.
/**
 * Load once, then keep it fresh on its own.
 *
 * Every screen in here is a QUEUE — registrations, cards, claims, payouts —
 * and a queue that only updates on F5 is a queue you have to remember to
 * check. Two refresh paths, both SILENT (no loading flash, no scroll jump):
 *
 *   • a poll while the tab is actually visible, so a background tab costs
 *     nothing and a laptop lid does not spend the night hitting the API;
 *   • an immediate refetch when the tab regains focus, which is the moment
 *     the answer is most likely stale and most likely being looked at.
 *
 * Silent means `loading` stays false and the old data stays on screen until
 * the new data lands: rows keyed by id keep their local state, so a
 * half-typed review note survives a refresh underneath it.
 */
export function useLoad(fn, deps = [], { pollMs = 30_000 } = {}) {
  const [state, setState] = useState({ loading: true, error: null, data: null, at: null });
  const seq = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback((silent) => {
    const mine = ++seq.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    fnRef.current().then(
      (data) => {
        if (seq.current === mine) setState({ loading: false, error: null, data, at: Date.now() });
      },
      (error) => {
        // A failed BACKGROUND refresh must not replace good data with an
        // error panel — the admin is probably mid-task and the next poll
        // will very likely succeed.
        if (seq.current === mine && !silent) setState((s) => ({ ...s, loading: false, error }));
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const reload = useCallback(() => run(false), [run]);

  useEffect(() => {
    run(false);
  }, [run]);

  useEffect(() => {
    if (!pollMs) return undefined;
    const tick = () => {
      if (document.visibilityState === "visible") run(true);
    };
    const id = setInterval(tick, pollMs);
    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [run, pollMs]);

  return { ...state, reload };
}

export function Loading() {
  return <div className="empty">Đang tải dữ liệu…</div>;
}

export function ErrBox({ error, onRetry }) {
  return (
    <div className="err-panel">
      Không tải được dữ liệu ({error?.body?.error || error?.message || "lỗi không rõ"}).{" "}
      {onRetry ? (
        <button className="linkish" onClick={onRetry}>
          Thử lại
        </button>
      ) : null}
    </div>
  );
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

// Status chip with tone map: { value: [label, tone] }.
export function StatusChip({ map, value }) {
  const [label, tone] = map?.[value] || [value || "—", "grey"];
  return <span className={`bid-chip ${tone}`}>{label}</span>;
}

export const CARD_STATUS = {
  pending: ["Chờ duyệt", "amber"],
  approved: ["Đã duyệt", "green"],
  rejected: ["Từ chối", "red"],
};

// Keys are the actual rm_users.status values the backend emits
// (pending_review | active | rejected).
export const REG_STATUS = {
  pending_review: ["Chờ duyệt", "amber"],
  active: ["Đã duyệt", "green"],
  rejected: ["Từ chối", "red"],
};

export const CLAIM_STATE = {
  disputed: ["Tranh chấp", "red"],
  invoiced: ["Chờ thu phí", "navy"],
  denied: ["Không thu", "grey"],
  paid: ["Đã thanh toán", "green"],
  pending: ["Đang chờ", "amber"],
  confirmed: ["Đã xác nhận", "green"],
};

// Confirm modal — scrim + modal pattern from the RM portal.
export function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = "Xác nhận",
  cancelLabel = "Huỷ",
  onConfirm,
  onCancel,
  busy = false,
  danger = false,
}) {
  if (!open) return null;
  return (
    <div className="scrim" onClick={busy ? undefined : onCancel}>
      <div className="modal confirm" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-title">{title}</h3>
        <div className="confirm-body">{children}</div>
        <div className="confirm-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            className={danger ? "btn btn-ink" : "btn btn-navy btn-navy-inline"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Đang xử lý…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PageHead({ title, sub, at }) {
  // `at` makes the silent refresh visible. Without it the screen changes
  // under the admin with no explanation, which is worse than stale data —
  // they cannot tell "nothing new" from "not updating".
  return (
    <header style={{ marginBottom: 18 }}>
      <div className="eyebrow">Bonia Admin</div>
      <h1 className="page">{title}</h1>
      {sub ? <div className="page-sub">{sub}</div> : null}
      {at ? (
        <div className="queue-sub" style={{ marginTop: 4 }}>
          Tự động cập nhật · lần cuối{" "}
          {new Date(at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
        </div>
      ) : null}
    </header>
  );
}
