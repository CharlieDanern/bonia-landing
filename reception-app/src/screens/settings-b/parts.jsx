import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useStore, useActions } from "../../store/index.jsx";
import { useIsMobile } from "../../lib/hooks.js";
import { Button, Dialog, SaveBar, unsavedLabel } from "../../components/ui/index.js";
import "./settings-b.css";

// Local building blocks for §06–§11, Tài khoản and Trợ giúp. They mirror
// the inline styles of "TT App 6 - Cai dat B.dc.html" (1440 × 900 frames).

export const clone = (v) => JSON.parse(JSON.stringify(v));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** "§ 06 · CÀI ĐẶT" eyebrow + serif title (gap 6, as the settings frames). */
export function SectionHead({ eyebrow, title, size = 36, right, style }) {
  const mobile = useIsMobile();
  const head = (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <div className="tt-eyebrow">{eyebrow}</div>
      <h2 className="tt-page-title" style={{ fontSize: mobile ? Math.min(size, 30) : size }}>
        {title}
      </h2>
    </div>
  );
  if (!right) return <div style={style}>{head}</div>;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: mobile ? "flex-start" : "flex-end",
        flexDirection: mobile ? "column" : "row",
        gap: 12,
        ...style,
      }}
    >
      {head}
      {right}
    </div>
  );
}

/** Mono 10 / 0.2em uppercase label above a group. */
export function GroupLabel({ children, style }) {
  return (
    <div className="tt-label" style={style}>
      {children}
    </div>
  );
}

/** White card, 1px hairline, radius 12 (14 for the bigger ones). */
export function Card({ children, radius = 12, padding, style, ...rest }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--bn-hairline)", borderRadius: radius, padding, ...style }} {...rest}>
      {children}
    </div>
  );
}

/** One row inside a Card: label left, control right, #EFE9DD separator. */
export function Row({ first = false, minHeight = 52, children, style, as: As = "div", ...rest }) {
  return (
    <As
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        minHeight,
        padding: "0 16px",
        borderTop: first ? 0 : "1px solid var(--bn-hairline-2)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </As>
  );
}

/**
 * Bordered segmented control as drawn in §07 / §11 / §09: selected = clay
 * fill; a divider sits left of every unselected option except the first.
 */
export function SegmentBox({ options, value, onChange, height = 36, fontSize = 13, padding = "0 14px", radius = 8, columns, perRow, bold = true, style, itemStyle }) {
  return (
    <div
      role="radiogroup"
      style={{
        display: "grid",
        gridTemplateColumns: columns || `repeat(${options.length},1fr)`,
        border: "1px solid var(--bn-hairline)",
        borderRadius: radius,
        overflow: "hidden",
        background: "#fff",
        ...style,
      }}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange?.(o.value)}
            style={{
              height,
              padding,
              display: "flex",
              alignItems: "center",
              fontSize,
              background: on ? "var(--bn-clay)" : "transparent",
              color: on ? "#fff" : "var(--bn-ink)",
              fontWeight: on && bold ? 500 : 400,
              borderLeft: i % (perRow || options.length) > 0 && !on ? "1px solid var(--bn-hairline)" : 0,
              borderTop: perRow && i >= perRow ? "1px solid var(--bn-hairline)" : 0,
              ...itemStyle,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Small outline pill button (Bấm để cài, Sao chép mã, + Tạo công tắc…). */
export function PillButton({ children, height = 38, padding = "0 14px", fontSize = 13, color, onClick, href, style, ...rest }) {
  const css = {
    height,
    padding,
    fontSize,
    color: color || "var(--bn-ink)",
    ...style,
  };
  if (href) {
    return (
      <Button variant="secondary" href={href} onClick={onClick} style={css} {...rest}>
        {children}
      </Button>
    );
  }
  return (
    <Button variant="secondary" onClick={onClick} style={css} {...rest}>
      {children}
    </Button>
  );
}

/** Phone: "‹ Cài đặt" back link (the settings nav is hidden below 768px). */
export function MobileBack({ to = "/cai-dat", label = "Cài đặt" }) {
  const mobile = useIsMobile();
  if (!mobile) return null;
  return (
    <Link
      href={to}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 14, fontWeight: 500, color: "var(--bn-clay)", marginBottom: -8 }}
    >
      ‹ {label}
    </Link>
  );
}

/** Loading skeleton for every settings-b page (3.6 P). */
export function DetailSkeleton() {
  const mobile = useIsMobile();
  const bar = (w, h, r, bg) => (
    <span style={{ display: "block", width: w, maxWidth: "100%", height: h, borderRadius: r, background: bg, flex: "none" }} />
  );
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải"
      style={{ flex: 1, padding: mobile ? "20px 16px" : "32px 40px", display: "flex", flexDirection: "column", gap: 16 }}
    >
      {bar(120, 12, 3, "var(--bn-skeleton-2)")}
      {bar(280, 34, 4, "var(--bn-skeleton-2)")}
      {bar(560, 52, 10, "var(--bn-skeleton)")}
      {bar(560, 210, 12, "var(--bn-skeleton)")}
      {bar(560, 150, 12, "var(--bn-skeleton)")}
    </div>
  );
}

/**
 * Draft of one or more settings sections. The page edits the draft; the
 * save bar shows while it differs from the store. Saving takes a moment
 * (no backend) and fails when the browser is offline, as in 3.6 Q:
 * nothing changes in the store until a save succeeds.
 */
export function useDraft(sections, { initial, error: initialError = null } = {}) {
  const state = useStore();
  const { saveSettings } = useActions();
  const keys = Array.isArray(sections) ? sections : [sections];
  const saved = Object.fromEntries(keys.map((k) => [k, state.settings[k]]));
  const [draft, setDraft] = useState(() => {
    const d = clone(saved);
    if (initial) for (const k of keys) if (initial[k]) d[k] = { ...d[k], ...initial[k] };
    return d;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(initialError);
  const changes = countChanges(saved, draft);
  const dirty = changes > 0;

  const set = useCallback((section, patch) => {
    setError(null);
    setDraft((d) => ({ ...d, [section]: { ...d[section], ...(typeof patch === "function" ? patch(d[section]) : patch) } }));
  }, []);

  const discard = () => {
    setError(null);
    setDraft(clone(saved));
  };

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setError("Chưa lưu được. Máy đang mất mạng; thay đổi vẫn còn trên máy này.");
        return;
      }
      setError(null);
      for (const k of keys) if (!same(saved[k], draft[k])) saveSettings(k, draft[k]);
    }, 450);
  };

  return { draft, set, dirty, changes, saving, error, save, discard, saved };
}

function countChanges(a, b) {
  if (same(a, b)) return 0;
  if (Array.isArray(a) && Array.isArray(b)) {
    let n = Math.abs(a.length - b.length);
    for (let i = 0; i < Math.min(a.length, b.length); i++) n += same(a[i], b[i]) ? 0 : 1;
    return n;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    let n = 0;
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) n += countChanges(a[k], b[k]);
    return n;
  }
  return 1;
}

/**
 * Save bar + "leave without saving?" guard. While dirty, in-app link
 * clicks are held and the user chooses to stay or drop the changes.
 */
export function DraftBar({ d, detail }) {
  const mobile = useIsMobile();
  const [, navigate] = useLocation();
  const [pending, setPending] = useState(null);
  const dirtyRef = useRef(d.dirty);
  dirtyRef.current = d.dirty;

  useEffect(() => {
    const onClick = (e) => {
      if (!dirtyRef.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const a = e.target.closest?.("a[href]");
      if (!a || a.target === "_blank") return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      setPending(url.pathname.replace(base, "") + url.search);
    };
    // Not in ?f= frame mode: the QA harness reuses one tab and a
    // beforeunload prompt would block its next navigation.
    const frameMode = new URLSearchParams(window.location.search).has("f");
    const onUnload = (e) => {
      if (!dirtyRef.current || frameMode) return;
      e.preventDefault();
      e.returnValue = "";
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  return (
    <>
      {(d.dirty || d.error) && (
        <SaveBar
          message={unsavedLabel(d.changes, detail)}
          onDiscard={d.discard}
          onSave={d.save}
          saving={d.saving}
          error={d.error}
          style={mobile ? { padding: "12px 16px", bottom: "calc(var(--bn-tab-h) + env(safe-area-inset-bottom))", flexWrap: "wrap" } : undefined}
        />
      )}
      <Dialog open={!!pending} onClose={() => setPending(null)} eyebrow="Chưa lưu" title="Rời trang này?" width={520}>
        <div style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--bn-ink-2)" }}>
          Bạn có {d.changes} thay đổi chưa lưu. Rời trang thì các thay đổi này bị bỏ.
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Button variant="secondary" size="sm" onClick={() => setPending(null)}>
            Ở lại
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const to = pending;
              d.discard();
              dirtyRef.current = false;
              setPending(null);
              navigate(to);
            }}
          >
            Bỏ thay đổi và rời đi
          </Button>
        </div>
      </Dialog>
    </>
  );
}

/** Settings detail body: padded scroll area that grows so the save bar sits at the bottom. */
export function Body({ children, style }) {
  const mobile = useIsMobile();
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: mobile ? "12px 16px 24px" : "32px 40px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Desktop: content + 280px "Bonia sẽ nói…" column (gap 32). Phone: stacked. */
export function WithPreview({ children, preview, previewStyle }) {
  const mobile = useIsMobile();
  if (mobile) {
    return (
      <>
        {children}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, ...previewStyle }}>{preview}</div>
      </>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 280px", gap: 32, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>{children}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, ...previewStyle }}>{preview}</div>
    </div>
  );
}

/** Text that looks like plain row text but is editable (borderless input). */
export function InlineInput({ value, onChange, placeholder, style, label, ...rest }) {
  return (
    <input
      className="sb-inline-input"
      value={value}
      placeholder={placeholder}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      style={{ border: 0, outline: 0, background: "transparent", padding: 0, width: "100%", minWidth: 0, fontSize: 14, ...style }}
      {...rest}
    />
  );
}

/** Short-lived "Đã chép" feedback for copy buttons. */
export function useFlash(ms = 1600) {
  const [on, setOn] = useState(null);
  const t = useRef();
  const flash = (key = true) => {
    setOn(key);
    clearTimeout(t.current);
    t.current = setTimeout(() => setOn(null), ms);
  };
  useEffect(() => () => clearTimeout(t.current), []);
  return [on, flash];
}
