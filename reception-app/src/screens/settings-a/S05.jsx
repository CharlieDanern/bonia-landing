import React, { useLayoutEffect, useRef, useState } from "react";
import { InviteCard, EmergencyRow, Toggle, Dialog, Button, TextInput } from "../../components/ui/index.js";
import { useStore } from "../../store/index.jsx";
import { useIsMobile } from "../../lib/hooks.js";
import { phoneDigits } from "../../lib/format.js";
import { STAFF_GROUPS, INVITE_LABELS } from "../../data/staff.js";
import { useDraft, SectionPage, SectionHead, Group, Card, InlineInput } from "./parts.jsx";
import { mark05 } from "./summaries.js";

// §05 Nhân viên & khẩn cấp. One page in two halves: people who receive
// pushes (3.6 F, invite card) and, below, deadlines, call transfer and
// emergencies (3.6 G, "· TIẾP"). Nobody here logs in to the app.

const describe = (a, b) => {
  const out = [];
  const n = (x, y, l, unit = " phút") => x !== y && out.push(`${l} ${x ?? "—"}${unit} → ${y ?? "—"}${unit}`);
  n(a.urgentMinutes, b.urgentMinutes, "việc gấp");
  n(a.normalMinutes, b.normalMinutes, "việc thường");
  n(a.escalateAfter, b.escalateAfter, "báo thêm sau");
  if (a.transfer.on !== b.transfer.on) out.push(`chuyển máy: ${b.transfer.on ? "bật" : "tắt"}`);
  if (a.transfer.number !== b.transfer.number) out.push(`số chuyển máy ${b.transfer.number}`);
  b.emergencies.forEach((e, i) => a.emergencies[i]?.say !== e.say && out.push(`câu nói khi “${e.label}”`));
  const before = Object.fromEntries((a.staff || []).map((p) => [p.id, p]));
  for (const p of b.staff || []) {
    const o = before[p.id];
    if (!o) out.push(`thêm ${p.name}`);
    else if (o.name !== p.name || o.phone !== p.phone || o.role !== p.role) out.push(`sửa ${p.name}`);
  }
  for (const o of a.staff || []) if (!(b.staff || []).some((p) => p.id === o.id)) out.push(`bỏ ${o.name}`);
  return out;
};

const PILL = {
  on: { color: "var(--bn-ok)", border: "1px solid var(--bn-ok)", act: "Sửa" },
  invited: { color: "var(--bn-ink-2)", border: "1px dashed var(--bn-dashed)", act: "Mời lại" },
  none: { color: "var(--bn-urgent)", border: "1px solid var(--bn-urgent)", act: "Mời" },
};

const groupLabel = (id) => STAFF_GROUPS.find((g) => g.id === id)?.label ?? "";

export function Section05({ screen, frame }) {
  const state = useStore();
  const failFirst = screen === "error";
  // People live in the store's staff list; §05 keeps its own saved copy.
  const d = useDraft("05", {
    describe,
    mark: (v) => mark05(v.staff),
    failFirst,
    normalize: (x) => ({ ...x, staff: x.staff ?? JSON.parse(JSON.stringify(state.staff)) }),
    init: failFirst
      ? (x) => {
          x.urgentMinutes = 10;
          return x;
        }
      : undefined,
  });
  const v = d.draft;
  const mobile = useIsMobile();
  const [invite, setInvite] = useState(frame === "3.6_F" ? "anh-tu" : null);
  const [edit, setEdit] = useState(null); // person being edited, or {} for a new one
  const part2 = useRef(null);

  useLayoutEffect(() => {
    if (frame === "3.6_G") part2.current?.scrollIntoView({ block: "start" });
  }, [frame]);

  const staff = v.staff;
  const hotelDigits = phoneDigits(state.hotel.phone);
  const loops = v.transfer.on && phoneDigits(v.transfer.number) === hotelDigits;
  const missing = staff.filter((p) => p.invite === "none");

  // Inviting is an action, not a form edit: it is stored straight away.
  const markInvited = (id) => {
    const next = staff.map((p) => (p.id === id && p.invite !== "on" ? { ...p, invite: "invited" } : p));
    d.commit({ staff: next }, mark05(next));
  };

  const invitee = staff.find((p) => p.id === invite);
  const half = mobile ? undefined : "100vh";

  // ── first half: people ────────────────────────────────────────────────
  const rows = staff.map((p, i) => {
    const firstOfGroup = i === 0 || staff[i - 1].group !== p.group;
    const pill = PILL[p.invite] || PILL.none;
    const act = () => (p.invite === "on" ? setEdit(p) : setInvite(p.id));
    const status = (
      <span
        style={{
          justifySelf: "start",
          fontFamily: "var(--bn-mono)",
          fontSize: 9.5,
          letterSpacing: "0.1em",
          padding: "4px 8px",
          borderRadius: 10,
          whiteSpace: "nowrap",
          background: "#fff",
          color: pill.color,
          border: pill.border,
        }}
      >
        {INVITE_LABELS[p.invite]}
      </span>
    );
    const action = (
      <button
        type="button"
        className="sa-link"
        onClick={act}
        style={{ fontSize: 13.5, textAlign: "left", minHeight: mobile ? 44 : undefined }}
      >
        {pill.act}
      </button>
    );
    const name = (
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span style={{ fontSize: 14.5, fontWeight: 500 }}>{p.name}</span>
        <span style={{ fontFamily: "var(--bn-mono)", fontSize: 11.5, color: "var(--bn-muted)" }}>{p.phone}</span>
      </div>
    );
    const groupTag = (
      <span style={{ fontFamily: "var(--bn-mono)", fontSize: 9.5, letterSpacing: "0.16em", color: "var(--bn-muted)" }}>
        {firstOfGroup ? groupLabel(p.group).toUpperCase() : ""}
      </span>
    );
    if (mobile) {
      return (
        <div key={p.id} style={{ padding: "10px 16px", borderTop: i ? "1px solid var(--bn-hairline-2)" : 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {firstOfGroup && groupTag}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            {name}
            {action}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, fontSize: 13, color: "var(--bn-ink-2)" }}>
            {p.role}
            {status}
          </div>
        </div>
      );
    }
    return (
      <div
        key={p.id}
        style={{
          display: "grid",
          gridTemplateColumns: "100px minmax(0,1fr) 150px 140px 70px",
          gap: 12,
          alignItems: "center",
          minHeight: 54,
          padding: "0 16px",
          borderTop: i ? "1px solid var(--bn-hairline-2)" : 0,
        }}
      >
        {groupTag}
        {name}
        <span style={{ fontSize: 13, color: "var(--bn-ink-2)" }}>{p.role}</span>
        {status}
        {action}
      </div>
    );
  });

  const minutes = (k, label) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
      <span>{label}</span>
      <span style={{ fontFamily: "var(--bn-mono)" }}>
        <InlineInput
          label={label}
          inputMode="numeric"
          value={v[k] ?? ""}
          onChange={(t) => d.update((x) => (x[k] = t.replace(/\D/g, "") ? Number(t.replace(/\D/g, "")) : null))}
          style={{ textAlign: "right" }}
        />{" "}
        phút
      </span>
    </div>
  );

  const owner = staff.find((p) => p.group === "chu");

  return (
    <SectionPage d={d} padding="0">
      {/* Part 1: người nhận báo */}
      <div style={{ minHeight: half, padding: mobile ? 0 : "32px 40px", display: "flex", flexDirection: "column", gap: 18 }}>
        <SectionHead
          eyebrow="§ 05 · CÀI ĐẶT"
          title="Nhân viên & khẩn cấp"
          sub={`${staff.length} người nhận báo · không ai cần đăng nhập ứng dụng`}
        />
        <Card>{rows}</Card>
        {missing.length > 0 && (
          <div style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--bn-ink-2)", lineHeight: 1.5 }}>
            <span style={{ fontFamily: "var(--bn-mono)", fontSize: 9.5, letterSpacing: "0.16em", color: "var(--bn-muted)", paddingTop: 2, whiteSpace: "nowrap" }}>
              CẦN BẠN ĐIỀN
            </span>
            Ai trực đêm và ai sửa chữa: Bonia chưa tìm thấy. Đã điền sẵn theo gợi ý, bấm Mời để bật.
          </div>
        )}
        <div>
          <button type="button" className="sa-link" onClick={() => setEdit({})} style={{ fontSize: 13.5, minHeight: 32 }}>
            + Thêm người nhận báo
          </button>
        </div>
      </div>

      {/* Part 2: thời hạn, chuyển máy, khẩn cấp */}
      <div
        ref={part2}
        style={{
          minHeight: half,
          padding: mobile ? "28px 0 0" : "32px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <SectionHead eyebrow="§ 05 · CÀI ĐẶT · TIẾP" title="Nhân viên & khẩn cấp" />
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 10 }}>
          <Card style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontFamily: "var(--bn-mono)", fontSize: 10, letterSpacing: "0.2em", color: "var(--bn-muted)" }}>THỜI HẠN XỬ LÝ</div>
            {minutes("urgentMinutes", "Việc gấp")}
            {minutes("normalMinutes", "Việc thường")}
            <div style={{ fontSize: 12.5, color: "var(--bn-ink-2)", lineHeight: 1.5 }}>
              Việc gấp chưa ai mở sau{" "}
              <InlineInput
                label="Báo thêm sau bao nhiêu phút"
                inputMode="numeric"
                value={v.escalateAfter ?? ""}
                onChange={(t) => d.update((x) => (x.escalateAfter = t.replace(/\D/g, "") ? Number(t.replace(/\D/g, "")) : null))}
              />{" "}
              phút: báo người trực tiếp theo, rồi {owner?.short ?? "chủ"}.
            </div>
          </Card>
          <Card style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--bn-mono)", fontSize: 10, letterSpacing: "0.2em", color: "var(--bn-muted)" }}>CHUYỂN MÁY</span>
              <Toggle on={v.transfer.on} label="Chuyển máy" onChange={(on) => d.update((x) => (x.transfer.on = on))} />
            </div>
            {v.transfer.on ? (
              <>
                <input
                  className="sa-num"
                  aria-label="Số chuyển máy"
                  aria-invalid={loops || undefined}
                  inputMode="tel"
                  value={v.transfer.number}
                  onChange={(e) => d.update((x) => (x.transfer.number = e.target.value))}
                  style={{
                    height: 42,
                    border: `1px solid ${loops ? "var(--bn-urgent)" : "var(--bn-hairline)"}`,
                    borderRadius: 8,
                    padding: "0 12px",
                    fontFamily: "var(--bn-mono)",
                    fontSize: 14,
                    background: "#fff",
                    width: "100%",
                  }}
                />
                <div style={{ fontSize: 12.5, color: loops ? "var(--bn-urgent)" : "var(--bn-ink-2)", lineHeight: 1.5 }}>
                  {loops
                    ? "Số này đang chuyển cuộc gọi tới Bonia, chuyển máy về đây sẽ quay vòng."
                    : "Khách cần gặp người thì Bonia chuyển máy về số này."}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12.5, color: "var(--bn-muted)", lineHeight: 1.5 }}>Tắt · Bonia ghi lại và báo người nhận, không chuyển máy.</div>
            )}
          </Card>
        </div>
        <Group label="KHẨN CẤP · SỐ DO HỆ THỐNG GIỮ">
          <Card>
            {v.emergencies.map((e, i) =>
              mobile ? (
                <MobileEmergency key={e.id} e={e} first={!i} />
              ) : (
                <EmergencyRow
                  key={e.id}
                  first={!i}
                  label={e.label}
                  number={e.number}
                  say={e.say}
                  who={e.who}
                  onSayChange={(say) => d.update((x) => (x.emergencies[i].say = say))}
                />
              )
            )}
          </Card>
        </Group>
      </div>

      <InviteCard
        open={!!invitee}
        onClose={() => setInvite(null)}
        name={invitee?.short ?? ""}
        group={groupLabel(invitee?.group)}
        link={invitee?.inviteLink ?? `bonia.vn/r/7F3K-${invitee?.id ?? ""}`}
        phone={invitee?.phone}
        onDone={() => {
          markInvited(invitee.id);
          setInvite(null);
        }}
      />
      <PersonDialog
        key={edit ? edit.id || "moi" : "dong"}
        person={edit}
        onClose={() => setEdit(null)}
        onSave={(p) => {
          d.update((x) => {
            const i = x.staff.findIndex((s) => s.id === p.id);
            if (i >= 0) x.staff[i] = p;
            else {
              // Keep groups together in the table.
              const last = x.staff.map((s) => s.group).lastIndexOf(p.group);
              x.staff.splice(last >= 0 ? last + 1 : x.staff.length, 0, p);
            }
          });
          setEdit(null);
        }}
        onRemove={(p) => {
          d.update((x) => (x.staff = x.staff.filter((s) => s.id !== p.id)));
          setEdit(null);
        }}
      />
    </SectionPage>
  );
}

function MobileEmergency({ e, first }) {
  return (
    <div style={{ padding: "12px 16px", borderTop: first ? 0 : "1px solid var(--bn-hairline-2)", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{e.label}</span>
        <span
          style={{
            height: 30,
            padding: "0 10px",
            borderRadius: 8,
            background: e.number ? "var(--bn-cream-2)" : "#fff",
            border: "1px solid var(--bn-hairline)",
            fontFamily: "var(--bn-mono)",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            whiteSpace: "nowrap",
          }}
        >
          {e.number ? `${e.number} · khóa` : "không số"}
        </span>
      </div>
      <span style={{ fontSize: 13, color: "var(--bn-ink-2)", lineHeight: 1.45 }}>“{e.say}”</span>
      <span style={{ fontSize: 12.5, color: "var(--bn-muted)" }}>Báo: {e.who}</span>
    </div>
  );
}

/** Add or edit one receiver: name, phone, group, hours. Saved with the page. */
function PersonDialog({ person, onClose, onSave, onRemove }) {
  const isNew = person && !person.id;
  const [f, setF] = useState(() => ({ group: "le-tan", invite: "none", ...person }));
  const set = (k, val) => setF((x) => ({ ...x, [k]: val }));
  const open = !!person;
  if (!open) return null;
  const ok = (f.name || "").trim() && phoneDigits(f.phone || "").length >= 10;
  return (
    <Dialog open onClose={onClose} eyebrow={isNew ? "Thêm người nhận báo" : "Người nhận báo"} title={isNew ? "Thêm người" : f.name} width={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <TextInput label="Tên" value={f.name || ""} onChange={(e) => set("name", e.target.value)} height={48} />
        <TextInput
          label="Số điện thoại"
          mono
          inputMode="tel"
          value={f.phone || ""}
          onChange={(e) => set("phone", e.target.value)}
          height={48}
          fontSize={16}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Nhóm</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STAFF_GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                className="sa-press"
                aria-pressed={f.group === g.id}
                onClick={() => set("group", g.id)}
                style={{
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 18,
                  fontSize: 14,
                  background: "#fff",
                  border: `1px solid ${f.group === g.id ? "var(--bn-clay)" : "var(--bn-hairline)"}`,
                  color: f.group === g.id ? "var(--bn-clay)" : "var(--bn-ink)",
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <TextInput
          label="Giờ trực hoặc việc"
          placeholder="Ví dụ: 07:00–15:00, Gọi khi cần"
          value={f.role || ""}
          onChange={(e) => set("role", e.target.value)}
          height={48}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {!isNew ? (
          <button type="button" onClick={() => onRemove(person)} style={{ fontSize: 14, color: "var(--bn-urgent)", fontWeight: 500, minHeight: 44 }}>
            Ngưng nhận báo
          </button>
        ) : (
          <span />
        )}
        <span style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button
            size="sm"
            disabled={!ok}
            onClick={() => {
              const p = f;
              const name = p.name.trim();
              onSave({
                ...p,
                name,
                short: p.short && !isNew ? p.short : name.charAt(0).toLowerCase() + name.slice(1),
                id: p.id || `nguoi-${Date.now()}`,
                shift: p.shift ?? p.role,
              });
            }}
          >
            Xong
          </Button>
        </span>
      </div>
    </Dialog>
  );
}
