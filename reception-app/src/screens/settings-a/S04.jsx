import React, { useMemo } from "react";
import { PermissionChip } from "../../components/ui/index.js";
import { useStore } from "../../store/index.jsx";
import { useIsMobile } from "../../lib/hooks.js";
import { STAFF_GROUPS } from "../../data/staff.js";
import { useDraft, SectionPage, SectionHead, InlineText } from "./parts.jsx";
import { staffOf } from "./summaries.js";

// §04 Khách đang ở (3.6 E): one row per in-stay task × Trả lời / Ghi yêu cầu
// / Báo ngay (independent), plus who receives it. Phones: one card per task.

const PERMS = [
  ["answer", "Trả lời"],
  ["record", "Ghi yêu cầu"],
  ["notify", "Báo ngay"],
];
const COLS = "minmax(0,1fr) 96px 110px 96px 170px";

const describe = (a, b) => {
  const out = [];
  const before = Object.fromEntries(a.tasks.map((t) => [t.id, t]));
  for (const t of b.tasks) {
    const o = before[t.id];
    if (!o) {
      out.push(`thêm “${t.label || "việc mới"}”`);
      continue;
    }
    for (const [k, l] of PERMS) if (o[k] !== t[k]) out.push(`${t.label}: ${l} ${t[k] ? "bật" : "tắt"}`);
    if (o.who !== t.who) out.push(`${t.label}: báo ${t.who}`);
    if (o.label !== t.label) out.push(`đổi tên “${o.label}”`);
  }
  for (const o of a.tasks) if (!b.tasks.some((t) => t.id === o.id)) out.push(`bỏ “${o.label}”`);
  return out;
};

export function Section04({ screen }) {
  const failFirst = screen === "error";
  const d = useDraft("04", {
    describe,
    mark: "ok",
    failFirst,
    init: failFirst
      ? (x) => {
          x.tasks.find((t) => t.id === "tv").notify = true;
          return x;
        }
      : undefined,
  });
  const state = useStore();
  const mobile = useIsMobile();
  const tasks = d.draft.tasks;
  const savedIds = useMemo(() => new Set(d.saved.tasks.map((t) => t.id)), [d.saved.tasks]);

  // Recipients: the groups, the named people as "Group · name", and anything already used.
  const whoOptions = useMemo(() => {
    const groups = STAFF_GROUPS.map((g) => g.label);
    const people = staffOf(state).map((p) => `${STAFF_GROUPS.find((g) => g.id === p.group)?.label} · ${p.short}`);
    return [...new Set([...groups, ...people, ...tasks.map((t) => t.who)])];
  }, [state, tasks]);

  const set = (i, fn) => d.update((x) => fn(x.tasks[i]));
  const add = () =>
    d.update((x) =>
      x.tasks.push({ id: `moi-${Date.now()}`, label: "", note: "", answer: false, record: true, notify: false, who: "Lễ tân" })
    );

  const who = (t, i) => (
    <select
      className="sa-select"
      aria-label={`Người nhận: ${t.label}`}
      value={t.who}
      onChange={(e) => set(i, (x) => (x.who = e.target.value))}
      style={{ fontSize: 13, color: "var(--bn-ink-2)", minHeight: mobile ? 44 : undefined }}
    >
      {whoOptions.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );

  const label = (t, i) => (
    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      {savedIds.has(t.id) ? (
        <span style={{ fontSize: 13.5 }}>{t.label}</span>
      ) : (
        <span className="sa-has-x" style={{ display: "flex", alignItems: "center" }}>
          <InlineText
            label="Tên việc mới"
            placeholder="Tên việc, ví dụ: Mượn bàn ủi"
            value={t.label}
            onChange={(v) => set(i, (x) => (x.label = v))}
            style={{ fontSize: 13.5 }}
          />
          <button
            type="button"
            className="sa-x"
            aria-label="Bỏ việc này"
            onClick={() => d.update((x) => x.tasks.splice(i, 1))}
          >
            ✕
          </button>
        </span>
      )}
      {t.note && (
        <span style={{ fontSize: 11.5, color: "var(--bn-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {t.note}
        </span>
      )}
    </div>
  );

  const chips = (t, i, size) =>
    PERMS.map(([k, l]) => (
      <PermissionChip key={k} size={size} on={!!t[k]} label={l} onClick={() => set(i, (x) => (x[k] = !x[k]))} />
    ));

  const addBtn = (
    <button
      type="button"
      className="sa-card-link"
      onClick={add}
      style={{
        height: mobile ? 44 : 40,
        padding: "0 16px",
        borderRadius: 20,
        border: "1px solid var(--bn-hairline)",
        background: "#fff",
        fontSize: 14,
        display: "flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        flex: "none",
      }}
    >
      + Thêm loại việc
    </button>
  );

  const notifyCount = tasks.filter((t) => t.notify).length;

  return (
    <SectionPage d={d}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        <SectionHead eyebrow="§ 04 · CÀI ĐẶT" title="Khách đang ở" sub={`${tasks.length} loại việc · ${notifyCount} báo ngay`} right={addBtn} />
        {mobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tasks.map((t, i) => (
              <div
                key={t.id}
                style={{
                  background: "#fff",
                  border: "1px solid var(--bn-hairline)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {label(t, i)}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{chips(t, i, "form")}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--bn-muted)" }}>
                  Người nhận {who(t, i)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid var(--bn-hairline)", borderRadius: 12, overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: COLS,
                gap: 8,
                alignItems: "center",
                height: 38,
                padding: "0 16px",
                background: "var(--bn-cream-2)",
                borderBottom: "1px solid var(--bn-hairline)",
                fontFamily: "var(--bn-mono)",
                fontSize: 9.5,
                letterSpacing: "0.16em",
                color: "var(--bn-muted)",
              }}
            >
              <span>VIỆC</span>
              <span>TRẢ LỜI</span>
              <span>GHI YÊU CẦU</span>
              <span>BÁO NGAY</span>
              <span>NGƯỜI NHẬN</span>
            </div>
            {tasks.map((t, i) => (
              <div
                key={t.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: COLS,
                  gap: 8,
                  alignItems: "center",
                  minHeight: 39,
                  padding: "0 16px",
                  borderBottom: "1px solid var(--bn-hairline-3)",
                }}
              >
                {label(t, i)}
                {chips(t, i, "matrix")}
                {who(t, i)}
              </div>
            ))}
          </div>
        )}
      </div>
    </SectionPage>
  );
}
