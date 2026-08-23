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
export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const seq = useRef(0);
  const reload = useCallback(() => {
    const mine = ++seq.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn().then(
      (data) => {
        if (seq.current === mine) setState({ loading: false, error: null, data });
      },
      (error) => {
        if (seq.current === mine) setState((s) => ({ ...s, loading: false, error }));
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    reload();
  }, [reload]);
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

export const REG_STATUS = {
  pending: ["Chờ duyệt", "amber"],
  approved: ["Đã duyệt", "green"],
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

export function PageHead({ title, sub }) {
  return (
    <header style={{ marginBottom: 18 }}>
      <div className="eyebrow">Bonia Admin</div>
      <h1 className="page">{title}</h1>
      {sub ? <div className="page-sub">{sub}</div> : null}
    </header>
  );
}
