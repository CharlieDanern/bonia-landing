import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useStore, useActions } from "../../store/index.jsx";
import { useIsMobile } from "../../lib/hooks.js";
import { SaveBar, unsavedLabel, Dialog, Button, Skeleton } from "../../components/ui/index.js";
import "./settings-a.css";

// Local building blocks for §01–§05 (styles copied from TT App 5 canvas).

const clone = (v) => JSON.parse(JSON.stringify(v));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export const SAVE_ERROR = "Chưa lưu được. Máy đang mất mạng; thay đổi vẫn còn trên máy này.";

/** 240000 → "240 nghìn", 1100000 → "1 triệu 100 nghìn" (how Bonia says prices). */
export function spokenVnd(n) {
  if (n == null) return "";
  const m = Math.floor(n / 1000000);
  const k = Math.round((n % 1000000) / 1000);
  if (m && k) return `${m} triệu ${k} nghìn`;
  if (m) return `${m} triệu`;
  return `${k} nghìn`;
}

/**
 * Editable copy of settings[section] for the sticky save bar.
 * describe(saved, draft) → ["giá theo giờ 220.000 → 240.000", …].
 * init(draft) lets a frame open with an unsaved change already made.
 * normalize(saved) completes the saved values before comparing.
 */
export function useDraft(section, { describe, mark, init, normalize, failFirst = false } = {}) {
  const state = useStore();
  const { saveSettings } = useActions();
  const raw = state.settings[section];
  // normalize fills values the store keeps elsewhere (§05 people).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saved = useMemo(() => (normalize ? normalize(clone(raw)) : raw), [raw]);
  const [draft, setDraft] = useState(() => (init ? init(clone(saved)) : clone(saved)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(failFirst ? SAVE_ERROR : null);
  const failNext = useRef(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const dirty = useMemo(() => !same(draft, saved), [draft, saved]);
  const changes = useMemo(() => (dirty && describe ? describe(saved, draft) : []), [dirty, describe, saved, draft]);

  /** update(d => { d.x = 1 }) on a fresh copy. */
  const update = useCallback((fn) => {
    setDraft((d) => {
      const n = clone(d);
      fn(n);
      return n;
    });
  }, []);

  const save = useCallback(
    (onDone) => {
      setSaving(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setSaving(false);
        const offline = typeof navigator !== "undefined" && navigator.onLine === false;
        if (failNext.current || offline) {
          failNext.current = false;
          setError(SAVE_ERROR);
          return;
        }
        setError(null);
        saveSettings(section, draft, typeof mark === "function" ? mark(draft) : mark);
        onDone?.();
      }, 450);
    },
    [draft, mark, saveSettings, section]
  );

  const discard = useCallback(() => {
    setDraft(clone(saved));
    setError(null);
  }, [saved]);

  /** Write some values straight to the store (actions such as "Mời"), keeping the draft's other edits. */
  const commit = useCallback(
    (values, m) => {
      saveSettings(section, values, m);
      setDraft((d) => ({ ...d, ...clone(values) }));
    },
    [saveSettings, section]
  );

  return { draft, saved, update, setDraft, dirty, changes, save, discard, saving, error, commit };
}

/** "1 thay đổi chưa lưu · giá theo giờ 220.000 → 240.000" */
export function saveMessage(changes) {
  const n = Math.max(1, changes.length);
  return unsavedLabel(n, changes.slice(0, 2).join(", "));
}

/**
 * Page body of a settings detail: padded content, the save bar while dirty
 * (or failed), and a prompt when leaving with unsaved changes.
 */
export function SectionPage({ d, children, padding, style }) {
  const mobile = useIsMobile();
  const show = d && (d.dirty || d.error);
  return (
    <div style={{ flex: "1 0 auto", display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: mobile ? "16px 16px 28px" : padding ?? "32px 40px",
          display: "flex",
          flexDirection: "column",
          ...style,
        }}
      >
        {children}
      </div>
      {show && (
        <SaveBar
          message={saveMessage(d.changes)}
          onDiscard={d.discard}
          onSave={() => d.save()}
          saving={d.saving}
          error={d.error}
          style={
            mobile
              ? {
                  padding: "12px 16px",
                  bottom: "calc(var(--bn-tab-h) + env(safe-area-inset-bottom))",
                  flexWrap: "wrap",
                }
              : undefined
          }
        />
      )}
      {d && <LeaveGuard d={d} />}
    </div>
  );
}

/** Ask before leaving a settings page with unsaved changes (README "Save bar"). */
function LeaveGuard({ d }) {
  const [, navigate] = useLocation();
  const [target, setTarget] = useState(null);
  const dirty = d.dirty;

  useEffect(() => {
    if (!dirty) return undefined;
    const onClick = (e) => {
      const a = e.target.closest?.("a[href]");
      if (!a || a.target === "_blank" || e.metaKey || e.ctrlKey) return;
      const href = a.getAttribute("href");
      if (!href || !href.startsWith(BASE + "/") || a.closest("[data-leave-ok]")) return;
      const path = href.slice(BASE.length);
      if (path === window.location.pathname.slice(BASE.length) + window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      setTarget(path);
    };
    const onUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    // Not under automation: a beforeunload prompt would stall the frame shooter.
    const prompt = !navigator.webdriver;
    document.addEventListener("click", onClick, true);
    if (prompt) window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [dirty]);

  const go = () => {
    const t = target;
    setTarget(null);
    navigate(t);
  };

  return (
    <Dialog open={!!target} onClose={() => setTarget(null)} eyebrow="Chưa lưu" title="Bạn có thay đổi chưa lưu" width={560}>
      <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--bn-ink-2)" }}>
        {saveMessage(d.changes)}. Rời trang bây giờ thì Bonia vẫn dùng cài đặt cũ.
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
        <Button variant="secondary" size="sm" onClick={() => setTarget(null)}>
          Ở lại
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            d.discard();
            go();
          }}
        >
          Bỏ thay đổi
        </Button>
        <Button size="sm" loading={d.saving} onClick={() => d.save(go)}>
          Lưu rồi đi
        </Button>
      </div>
    </Dialog>
  );
}

/** "§ 01 · CÀI ĐẶT" + serif 36 title + optional summary line (+ ‹ Cài đặt on phones). */
export function SectionHead({ eyebrow, title, sub, right, style }) {
  const mobile = useIsMobile();
  const head = (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      {mobile && (
        <Link href="/cai-dat" style={{ fontSize: 14, fontWeight: 500, minHeight: 32, display: "flex", alignItems: "center" }}>
          ‹ Cài đặt
        </Link>
      )}
      <div style={{ fontFamily: "var(--bn-mono)", fontSize: 11, letterSpacing: "0.2em", color: "var(--bn-muted)" }}>{eyebrow}</div>
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--bn-serif)",
          fontWeight: 400,
          fontSize: mobile ? 30 : 36,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>
      {sub && <div style={{ fontSize: 13.5, color: "var(--bn-ink-2)" }}>{sub}</div>}
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

/** Form column + 280px "Bonia sẽ nói…" column (stacked on phones). */
export function TwoCol({ left, right, leftGap = 22, rightPad = 0 }) {
  const mobile = useIsMobile();
  return (
    <div
      style={{
        display: mobile ? "flex" : "grid",
        flexDirection: "column",
        gridTemplateColumns: "minmax(0,1fr) 280px",
        gap: mobile ? 22 : 32,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: leftGap, minWidth: 0 }}>{left}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: rightPad, minWidth: 0 }}>{right}</div>
    </div>
  );
}

/** Mono 10 label + its block, 8px apart. */
export function Group({ label, right, children, gap = 8, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, minWidth: 0, ...style }}>
      {label != null && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            fontFamily: "var(--bn-mono)",
            fontSize: 10,
            letterSpacing: "0.2em",
            color: "var(--bn-muted)",
          }}
        >
          <span>{label}</span>
          {right && <span>{right}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Card({ children, style }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--bn-hairline)", borderRadius: 12, minWidth: 0, ...style }}>
      {children}
    </div>
  );
}

/** "KHÓA" exactly as the canvas draws it (ink-2 text on a muted outline). */
export function LockedTag({ color = "var(--bn-ink-2)" }) {
  return (
    <span
      style={{
        fontFamily: "var(--bn-mono)",
        fontSize: 9.5,
        letterSpacing: "0.14em",
        border: "1px solid var(--bn-muted)",
        borderRadius: 4,
        padding: "2px 6px",
        color,
        whiteSpace: "nowrap",
        flex: "none",
      }}
    >
      KHÓA
    </span>
  );
}

/** Text that reads like plain text but edits in place (wraps, grows). */
export function InlineText({ value, onChange, style, label, placeholder }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  });
  return (
    <textarea
      ref={ref}
      className="sa-inline"
      aria-label={label}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, " "))}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      style={{ fontSize: 14.5, ...style }}
    />
  );
}

/** One-line inline input sized to its text (mono numbers, times). */
export function InlineInput({ value, onChange, style, label, mono = true, minCh = 1, inputMode, onBlur }) {
  const len = Math.max(minCh, String(value ?? "").length);
  return (
    <input
      className="sa-inline"
      aria-label={label}
      value={value ?? ""}
      inputMode={inputMode}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      style={{
        fontFamily: mono ? "var(--bn-mono)" : "inherit",
        width: mono ? `${len}ch` : "100%",
        ...style,
      }}
    />
  );
}

/**
 * Boxed money / number field: h40 (or h42), radius 8, mono 14, sized to the
 * text; 2px clay while focused (3.6 C). `suffix` = "đ" inside the box.
 */
export function NumBox({
  value,
  onChange,
  label,
  height = 40,
  width,
  suffix,
  center = false,
  focus = false,
  disabled = false,
  money = true,
  style,
}) {
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (focus) ref.current?.focus({ preventScroll: true });
  }, [focus]);
  const text = value == null ? "" : money ? groupDots(value) : String(value);
  const on = focused && !disabled;
  const len = Math.max(text.length, money ? 3 : 1);
  const box = {
    height,
    borderRadius: 8,
    border: on ? "2px solid var(--bn-clay)" : "1px solid var(--bn-hairline)",
    background: disabled ? "var(--bn-cream-2)" : "#fff",
    fontFamily: "var(--bn-mono)",
    fontSize: 14,
    color: disabled ? "var(--bn-muted)" : "var(--bn-ink)",
    flex: "none",
  };
  const input = (
    <input
      ref={ref}
      className="sa-num"
      aria-label={label}
      inputMode="numeric"
      disabled={disabled}
      value={text}
      placeholder="—"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        onChange(digits ? Number(digits) : null);
      }}
      style={
        suffix
          ? { flex: 1, minWidth: 0, textAlign: center ? "center" : "left" }
          : {
              ...box,
              boxSizing: width ? "border-box" : "content-box",
              width: width ?? `${len}ch`,
              padding: width ? 0 : "0 10px",
              textAlign: center ? "center" : "left",
              ...style,
            }
      }
    />
  );
  if (!suffix) return input;
  return (
    <label
      style={{
        ...box,
        boxSizing: "border-box",
        padding: on ? "0 9px" : "0 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 6,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {input}
      <span style={{ color: "var(--bn-muted)" }}>{suffix}</span>
    </label>
  );
}

function groupDots(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Settings detail placeholder while loading (3.6 P). */
export function SectionSkeleton() {
  const mobile = useIsMobile();
  const bar = (w, h, r, bg = "var(--bn-skeleton-2)") => (
    <span style={{ width: w, maxWidth: "100%", height: h, borderRadius: r, background: bg, display: "block", flex: "none" }} />
  );
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải"
      style={{ padding: mobile ? "20px 16px" : "32px 40px", display: "flex", flexDirection: "column", gap: 16 }}
    >
      {bar(120, 12, 3)}
      {bar(280, 34, 4)}
      <Skeleton width="100%" height={52} radius={10} style={{ maxWidth: 560 }} />
      <Skeleton width="100%" height={210} radius={12} style={{ maxWidth: 560 }} />
      <Skeleton width="100%" height={150} radius={12} style={{ maxWidth: 560 }} />
    </div>
  );
}
