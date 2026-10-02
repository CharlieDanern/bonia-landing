import React, { useState } from "react";
import { Button, Chip, CloseButton, Dialog, Radio, SideSheet } from "../../components/ui/index.js";
import { ASSIGN_ORDER, STAFF_BY_ID, STAFF_GROUPS } from "../../data/staff.js";
import { useIsMobile } from "../../lib/hooks.js";
import { copyText, telHref } from "../../lib/sms.js";
import { useStore } from "../../store/index.jsx";
import { fullNight } from "./text.js";

// Dialogs and sheets of the Yêu cầu screens: confirm-again (3.3 E),
// call back, reject, and Giao cho … (3.3 G).

/** Panel laid out by hand inside a bare Dialog (no ✕ in 3.3 E). */
function Panel({ children, padding = "30px 32px" }) {
  const mobile = useIsMobile();
  return <div style={{ padding: mobile ? "24px 16px" : padding, display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>;
}

const eyebrow = (color) => ({ fontFamily: "var(--bn-mono)", fontSize: 11, letterSpacing: "0.2em", color });

/**
 * Another request took the last room: Confirm asks once more (3.3 E).
 * Offers call-back, reject (Hết phòng) or confirm anyway. Never auto-resolves.
 */
export function ConfirmAgainDialog({ r, open, onClose, onCallBack, onReject, onConfirm }) {
  const state = useStore();
  if (!open || !r) return null;
  const info = fullNight(state, r);
  return (
    <Dialog open onClose={onClose} bare width={560} label="Hỏi lại một lần">
      <Panel>
        <div style={eyebrow("var(--bn-urgent)")}>⚠ HỎI LẠI MỘT LẦN</div>
        <div style={{ fontFamily: "var(--bn-serif)", fontSize: 28, lineHeight: 1.2 }}>{info?.title || "Phòng này có thể đã hết."}</div>
        <div style={{ fontSize: 15, lineHeight: 1.6, color: "var(--bn-ink-2)" }}>{info?.body}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button block onClick={onCallBack}>
            Gọi lại để gợi ý phòng khác
          </Button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Button variant="secondary" size="md" onClick={onReject} style={{ padding: "0 12px", fontWeight: 400 }}>
              Từ chối · Hết phòng
            </Button>
            <Button variant="secondary" size="md" onClick={onConfirm} style={{ padding: "0 12px", fontWeight: 400 }}>
              Vẫn xác nhận
            </Button>
          </div>
        </div>
      </Panel>
    </Dialog>
  );
}

/**
 * Gọi lại: on a phone the tel: link dials at once; on a desktop this shows
 * the number large enough to dial from the counter phone.
 */
export function CallBackDialog({ open, onClose, who, phone, note }) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;
  return (
    <Dialog open onClose={onClose} eyebrow="Gọi lại · bấm trên điện thoại quầy" title={who} width={520}>
      {phone ? (
        <div style={{ fontFamily: "var(--bn-mono)", fontSize: 32, letterSpacing: "0.02em" }}>{phone}</div>
      ) : (
        <div style={{ fontSize: 15, color: "var(--bn-ink-2)", lineHeight: 1.5 }}>{note || "Cuộc gọi này không để lại số."}</div>
      )}
      {phone && note && <div style={{ fontSize: 13.5, color: "var(--bn-ink-2)", lineHeight: 1.5 }}>{note}</div>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {phone && (
          <Button
            size="sm"
            onClick={async () => {
              if (await copyText(phone.replace(/\s/g, ""))) setCopied(true);
            }}
          >
            {copied ? "Đã chép số" : "Sao chép số"}
          </Button>
        )}
        {phone && (
          <Button variant="secondary" size="sm" href={telHref(phone)}>
            Gọi từ máy này
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Dialog>
  );
}

const REJECT_REASONS = ["Hết phòng", "Khách đổi ý", "Không nhận yêu cầu này", "Khác"];

/** Từ chối: records the hotel's decision. Bonia does not message the guest. */
export function RejectDialog({ r, open, onClose, onReject }) {
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  if (!open || !r) return null;
  const who = r.guestShort || (r.room ? `phòng ${r.room}` : "khách");
  return (
    <Dialog open onClose={onClose} eyebrow="Từ chối" title={`Từ chối yêu cầu của ${who}?`} width={560}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }} role="radiogroup" aria-label="Lý do">
        {REJECT_REASONS.map((x) => (
          <Chip key={x} variant="answer" selected={reason === x} onClick={() => setReason(x)}>
            {x}
          </Chip>
        ))}
      </div>
      <div style={{ fontSize: 14, color: "var(--bn-ink-2)", lineHeight: 1.55 }}>
        Bonia không tự nhắn khách. Nếu cần, bạn gọi hoặc nhắn khách từ điện thoại quầy.
        {r.status === "cho-coc" ? " Phòng đã trừ trên Lịch phòng không tự mở lại; bạn sửa trên Lịch phòng." : ""}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button variant="danger" size="sm" onClick={() => onReject(reason)}>
          Từ chối · {reason}
        </Button>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Quay lại
        </Button>
      </div>
    </Dialog>
  );
}

// Team name on a request → staff group id.
const TEAM_GROUP = { "Dọn phòng": "don-phong", "Lễ tân": "le-tan", "Kỹ thuật": "ky-thuat", Chủ: "chu" };

/** First on-shift person of the request's team, else the first of that team. */
export function defaultAssignee(state, r) {
  const group = TEAM_GROUP[r.team] || "le-tan";
  const staff = ASSIGN_ORDER.map((id) => state.staff.find((s) => s.id === id)).filter(Boolean);
  const team = staff.filter((s) => s.group === group);
  return (team.find((s) => s.onShift) || team[0] || staff[0])?.id;
}

/** What the person receives: room + task only, never the guest's name or number. */
export function pushText(r) {
  if (r.type === "quen-do") return `Quên đồ phòng ${r.room} · ${r.item}`;
  return `Phòng ${r.room} · ${r.task}`;
}

/** Giao cho … (3.3 G): people grouped Dọn phòng / Lễ tân / Kỹ thuật / Chủ with shift status. */
export function AssignSheet({ r, open, onClose, onAssign }) {
  const state = useStore();
  const mobile = useIsMobile();
  const [picked, setPicked] = useState(null);
  if (!open || !r) return null;
  const sel = picked || defaultAssignee(state, r);
  const person = STAFF_BY_ID[sel] || state.staff.find((s) => s.id === sel);
  const staff = ASSIGN_ORDER.map((id) => state.staff.find((s) => s.id === id)).filter(Boolean);
  const close = () => {
    setPicked(null);
    onClose();
  };

  let lastGroup = null;
  return (
    <SideSheet
      open
      onClose={close}
      title="Giao cho …"
      header={
        <div style={{ padding: mobile ? "20px 16px 10px" : "26px 28px 14px", display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
          <span style={{ fontFamily: "var(--bn-serif)", fontSize: 26 }}>Giao cho …</span>
          <CloseButton onClick={close} style={{ width: "auto", height: 19, lineHeight: "19px" }} />
        </div>
      }
      left={680}
      width={440}
      label="Giao cho"
      bodyStyle={{ padding: mobile ? "0 16px" : "0 28px", display: "flex", flexDirection: "column", gap: 4 }}
      footer={
        <>
          <div style={{ fontSize: 13, color: "var(--bn-ink-2)", lineHeight: 1.5 }}>
            {person?.name} nhận thông báo: <span style={{ fontFamily: "var(--bn-mono)", fontSize: 12 }}>{pushText(r)}</span>. Không có tên hay số của khách.
          </div>
          <Button
            block
            onClick={() => {
              onAssign(sel);
              setPicked(null);
            }}
          >
            Giao cho {person?.short}
          </Button>
        </>
      }
    >
      <div role="radiogroup" aria-label="Người nhận" style={{ display: "contents" }}>
        {staff.map((s) => {
          const head = s.group !== lastGroup ? STAFF_GROUPS.find((g) => g.id === s.group)?.label : null;
          lastGroup = s.group;
          const on = s.id === sel;
          const live = /đang trực/i.test(s.shift);
          return (
            <div key={s.id} style={{ display: "flex", flexDirection: "column" }}>
              {head && (
                <div style={{ fontFamily: "var(--bn-mono)", fontSize: 10, letterSpacing: "0.2em", color: "var(--bn-muted)", padding: "12px 0 4px", textTransform: "uppercase" }}>
                  {head}
                </div>
              )}
              <button
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setPicked(s.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 50,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: on ? "2px solid var(--bn-clay)" : "1px solid var(--bn-hairline-2)",
                  background: "#fff",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <Radio on={on} />
                <span style={{ flex: 1, fontSize: 15 }}>{s.name}</span>
                <span style={{ fontSize: 12.5, color: live ? "var(--bn-ok)" : "var(--bn-muted)" }}>{s.shift}</span>
              </button>
            </div>
          );
        })}
      </div>
    </SideSheet>
  );
}
