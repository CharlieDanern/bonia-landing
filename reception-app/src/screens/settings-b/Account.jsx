import React, { useState } from "react";
import { sectorBy } from "../../data/sectors.js";
import { useStore, useActions } from "../../store/index.jsx";
import { useIsMobile } from "../../lib/hooks.js";
import { ACTIVITY } from "../../data/settings.js";
import { DEVICE_NAME_SUGGESTIONS } from "../../data/hotel.js";
import { Button, Dialog, TextInput } from "../../components/ui/index.js";
import { Body, GroupLabel, MobileBack, SectionHead } from "./parts.jsx";

// Tài khoản (3.6 M): one hotel login, many devices. Each device's name is
// used in every history line; Hoạt động filters by device (chips, or tap a
// device / a row's device name). 3.6 M is drawn late in the day, so ?f=3.6_M
// also shows the activity rows after the 14:20 demo clock.

const QUICK_FILTERS = ["iPhone quầy", "Máy tính quầy"];

export function AccountPage({ frame }) {
  const mobile = useIsMobile();
  const state = useStore();
  const { setDeviceName, signOutDevice } = useActions();
  const [filter, setFilter] = useState(null);
  const [rename, setRename] = useState(null); // draft name while the dialog is open
  const [signOut, setSignOut] = useState(null); // device to sign out
  const [changeNumber, setChangeNumber] = useState(false);

  const rows = frame === "3.6_M" ? ACTIVITY.map(({ later, ...a }) => a) : state.activity;
  const shown = filter ? rows.filter((r) => r.d === filter) : rows;
  const chips = [...QUICK_FILTERS];
  if (filter && !chips.includes(filter)) chips.push(filter);

  const chip = (label, value) => {
    const on = filter === value;
    return (
      <button
        key={label}
        type="button"
        aria-pressed={on}
        className="tt-chip"
        onClick={() => setFilter(value)}
        style={{
          height: 30,
          padding: "0 10px",
          borderRadius: 15,
          fontSize: 12.5,
          background: on ? "var(--bn-ink)" : "transparent",
          color: on ? "var(--bn-cream-2)" : "var(--bn-ink)",
          border: on ? "1px solid var(--bn-ink)" : "1px solid var(--bn-hairline)",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <Body
      style={{
        display: "grid",
        gridTemplateColumns: mobile ? "minmax(0,1fr)" : "minmax(0,0.9fr) minmax(0,1.1fr)",
        gap: 24,
        alignContent: "start",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
        <MobileBack />
        <SectionHead eyebrow="Tài khoản" title={state.hotel.name} />
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--bn-hairline)",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 12.5, color: "var(--bn-muted)" }}>Số đăng nhập · điện thoại quầy</span>
            <span style={{ fontFamily: "var(--bn-mono)", fontSize: 20 }}>{state.hotel.phone}</span>
          </div>
          <button type="button" className="sb-link" onClick={() => setChangeNumber(true)} style={{ fontSize: 13.5, color: "var(--bn-clay)", fontWeight: 500, minHeight: mobile ? 44 : undefined }}>
            Đổi số
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <GroupLabel>Máy đang đăng nhập · {state.devices.length}</GroupLabel>
          <div style={{ background: "#fff", border: "1px solid var(--bn-hairline)", borderRadius: 12 }}>
            {state.devices.map((dv, i) => (
              <div
                key={dv.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 56,
                  padding: "0 16px",
                  borderTop: i ? "1px solid var(--bn-hairline-2)" : 0,
                }}
              >
                <button
                  type="button"
                  title="Xem hoạt động của máy này"
                  onClick={() => setFilter(dv.name)}
                  style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "left", minWidth: 0 }}
                >
                  <span style={{ fontSize: 14.5, fontWeight: 600 }}>
                    {dv.name}
                    {dv.current && <span style={{ fontWeight: 400, color: "var(--bn-muted)", fontSize: 12.5 }}> · máy này</span>}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--bn-muted)" }}>{dv.lastSeen}</span>
                </button>
                {dv.current ? (
                  <button type="button" className="sb-link" onClick={() => setRename(dv.name)} style={{ fontSize: 13, color: "var(--bn-muted)", minHeight: mobile ? 44 : undefined }}>
                    Đổi tên
                  </button>
                ) : (
                  <button type="button" className="sb-link" onClick={() => setSignOut(dv)} style={{ fontSize: 13, color: "var(--bn-urgent)", minHeight: mobile ? 44 : undefined }}>
                    Đăng xuất
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--bn-muted)" }}>
          Lĩnh vực: {sectorBy(state.hotel.sector).label} (liên hệ hỗ trợ để đổi) · Không có tài khoản nhân viên. Người nhận báo không đăng nhập. · Đăng ký qua: {state.hotel.referral.via} · mã {state.hotel.referral.code}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: mobile ? "wrap" : "nowrap" }}>
          <span style={{ fontFamily: "var(--bn-serif)", fontSize: 26 }}>Hoạt động</span>
          <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {chip("Mọi máy", null)}
            {chips.map((c) => chip(c, c))}
          </span>
        </div>
        <div style={{ background: "#fff", border: "1px solid var(--bn-hairline)", borderRadius: 12, padding: "4px 16px" }}>
          {shown.length === 0 && (
            <div style={{ fontSize: 13.5, color: "var(--bn-muted)", padding: "14px 0" }}>Máy này chưa có hoạt động nào hôm nay.</div>
          )}
          {shown.map((r, i) => (
            <div
              key={`${r.t}-${r.a}-${i}`}
              style={{
                display: "grid",
                gridTemplateColumns: mobile ? "56px minmax(0,1fr)" : "76px 120px minmax(0,1fr)",
                gap: mobile ? "2px 10px" : 10,
                fontSize: 13.5,
                padding: "10px 0",
                borderTop: i ? "1px solid var(--bn-hairline-3)" : 0,
              }}
            >
              <span style={{ fontFamily: "var(--bn-mono)", color: "var(--bn-muted)" }}>{r.t}</span>
              <button
                type="button"
                onClick={() => setFilter(r.d)}
                title="Chỉ xem máy này"
                style={{ color: "var(--bn-ink-2)", textAlign: "left", gridColumn: mobile ? 2 : undefined, gridRow: mobile ? 2 : undefined, fontSize: mobile ? 12.5 : undefined }}
              >
                {r.d}
              </button>
              <span style={{ gridColumn: mobile ? 2 : undefined, gridRow: mobile ? 1 : undefined }}>{r.a}</span>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={rename !== null} onClose={() => setRename(null)} eyebrow="Tài khoản" title="Đổi tên máy này" width={560}>
        <div style={{ fontSize: 14, color: "var(--bn-ink-2)", lineHeight: 1.5 }}>Tên này hiện trong mọi lịch sử, để biết ai đã làm gì.</div>
        <TextInput value={rename ?? ""} onChange={setRename} autoFocus label="Tên máy" />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {DEVICE_NAME_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="tt-chip"
              onClick={() => setRename(s)}
              style={{ height: 34, padding: "0 12px", borderRadius: 17, fontSize: 13, border: "1px solid var(--bn-hairline)", background: "#fff" }}
            >
              {s}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="secondary" size="sm" onClick={() => setRename(null)}>
            Hủy
          </Button>
          <Button
            size="sm"
            disabled={!rename?.trim()}
            onClick={() => {
              setDeviceName(rename.trim());
              setRename(null);
            }}
          >
            Lưu tên
          </Button>
        </div>
      </Dialog>

      <Dialog open={!!signOut} onClose={() => setSignOut(null)} eyebrow="Tài khoản" title={`Đăng xuất ${signOut?.name || ""}?`} width={560}>
        <div style={{ fontSize: 14.5, color: "var(--bn-ink-2)", lineHeight: 1.55 }}>
          Máy này sẽ cần mã từ điện thoại quầy để đăng nhập lại. Lịch sử của máy vẫn giữ.
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="secondary" size="sm" onClick={() => setSignOut(null)}>
            Hủy
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              signOutDevice(signOut.id);
              setSignOut(null);
            }}
          >
            Đăng xuất
          </Button>
        </div>
      </Dialog>

      <Dialog open={changeNumber} onClose={() => setChangeNumber(false)} eyebrow="Tài khoản" title="Đổi số đăng nhập" width={560}>
        <div style={{ fontSize: 14.5, color: "var(--bn-ink-2)", lineHeight: 1.55 }}>
          Số đăng nhập là số điện thoại quầy có ứng dụng Bonia. Đổi số thì mọi máy phải đăng nhập lại bằng mã gửi tới số mới.
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="secondary" size="sm" onClick={() => setChangeNumber(false)}>
            Để sau
          </Button>
          <Button size="sm" to="/dang-nhap">
            Tiếp tục với số mới
          </Button>
        </div>
      </Dialog>
    </Body>
  );
}
