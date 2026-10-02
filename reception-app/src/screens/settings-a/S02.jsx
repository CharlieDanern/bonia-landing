import React, { useRef } from "react";
import { Link, useLocation } from "wouter";
import { BoniaSays, Toggle, SourceChip } from "../../components/ui/index.js";
import { useIsMobile } from "../../lib/hooks.js";
import { groupVnd } from "../../lib/format.js";
import { useDraft, SectionPage, SectionHead, TwoCol, Group, Card, NumBox, spokenVnd } from "./parts.jsx";

// §02 Phòng & giá: the 5 room types (/cai-dat/02) and one type's prices
// (/cai-dat/02?loai=superior, 3.6 C). Prices per selling mode, weekend
// nights, holidays, and how Bonia may say prices.

const DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const FIELDS = [
  ["hourly", "first2h", "giá theo giờ"],
  ["hourly", "perHour", "giá mỗi giờ sau"],
  [null, "overnight", "giá qua đêm"],
  ["daily", "weekday", "giá ngày thường"],
  ["daily", "weekend", "giá cuối tuần"],
];

const get = (room, [group, key]) => (group ? room[group]?.[key] : room[key]) ?? null;

const describe = (a, b) => {
  const out = [];
  const many = b.rooms.filter((r, i) => JSON.stringify(r) !== JSON.stringify(a.rooms[i])).length > 1;
  b.rooms.forEach((r, i) => {
    const o = a.rooms[i];
    if (!o) return;
    const who = many ? ` ${r.name}` : "";
    if (r.bed !== o.bed) out.push(`giường${who} ${o.bed} → ${r.bed}`);
    for (const [mode, label] of [
      ["hourly", "theo giờ"],
      ["overnight", "qua đêm"],
      ["daily", "theo ngày"],
    ]) {
      if (!!r[mode] !== !!o[mode]) out.push(`${label}${who}: ${r[mode] ? "bật" : "tắt"}`);
    }
    for (const f of FIELDS) {
      const x = get(o, f);
      const y = get(r, f);
      if (x != null && y != null && x !== y) out.push(`${f[2]}${who} ${groupVnd(x)} → ${groupVnd(y)}`);
      else if ((x == null) !== (y == null) && r[f[0] ?? f[1]] && o[f[0] ?? f[1]]) out.push(`${f[2]}${who}`);
    }
  });
  if (a.weekendNights.join() !== b.weekendNights.join()) out.push(`đêm cuối tuần ${b.weekendNights.join(", ") || "không có"}`);
  if (a.monthly !== b.monthly) out.push(`theo tháng: ${b.monthly ? "bật" : "tắt"}`);
  if (a.priceSpeech !== b.priceSpeech) {
    const l = (id) => b.priceSpeechOptions.find((o) => o.id === id)?.label;
    out.push(`Bonia được nói giá: ${l(b.priceSpeech)}`);
  }
  return out;
};

export function Section02({ screen, frame, query }) {
  const roomId = query.get("loai");
  const frameC = frame === "3.6_C";
  const failFirst = screen === "error";
  const init =
    frameC || failFirst
      ? (d) => {
          const r = d.rooms.find((x) => x.id === (roomId || "superior"));
          if (r?.hourly) r.hourly.first2h = 240000;
          return d;
        }
      : undefined;
  const d = useDraft("02", { describe, mark: "ok", init, failFirst });
  const room = d.draft.rooms.find((r) => r.id === roomId);
  if (!room) return <RoomList d={d} />;
  return <RoomDetail d={d} room={room} focusFirst={frameC} />;
}

/** Selling modes Bonia may quote for one room type. */
function modesOf(r) {
  return [r.hourly && "theo giờ", r.overnight && "qua đêm", r.daily && "theo ngày"].filter(Boolean).join(", ");
}

function PriceSpeech({ d }) {
  const v = d.draft;
  return (
    <Group label="BONIA ĐƯỢC NÓI GIÁ">
      <div
        role="radiogroup"
        aria-label="Bonia được nói giá"
        style={{
          display: "flex",
          flexDirection: "column",
          border: "1px solid var(--bn-hairline)",
          borderRadius: 10,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        {v.priceSpeechOptions.map((o, i) => {
          const on = v.priceSpeech === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => d.update((x) => (x.priceSpeech = o.id))}
              style={{
                minHeight: 42,
                display: "flex",
                alignItems: "center",
                padding: "0 14px",
                fontSize: 13.5,
                textAlign: "left",
                background: on ? "var(--bn-clay)" : "#fff",
                color: on ? "#fff" : "var(--bn-ink)",
                fontWeight: on ? 500 : 400,
                borderTop: i && !on ? "1px solid var(--bn-hairline-2)" : 0,
              }}
            >
              {on ? `✓ ${o.label}` : o.label}
            </button>
          );
        })}
      </div>
    </Group>
  );
}

function hourlyQuote(v, r) {
  const h = r.hourly;
  if (v.priceSpeech === "none") return `“Dạ em ghi lại để khách sạn báo giá phòng ${r.name} cho anh chị ạ.”`;
  if (!h || h.first2h == null) return `“Dạ phòng ${r.name} bên em không nhận theo giờ ạ.”`;
  if (v.priceSpeech === "perNight" || h.perHour == null)
    return `“Dạ phòng ${r.name} theo giờ, 2 giờ đầu ${spokenVnd(h.first2h)}, mỗi giờ sau ${spokenVnd(h.perHour)} ạ.”`;
  return `“Dạ phòng ${r.name} theo giờ, 2 giờ đầu ${spokenVnd(h.first2h)}, giờ thứ ba thêm ${spokenVnd(h.perHour)}, tổng ${spokenVnd(
    h.first2h + h.perHour
  )} ạ.”`;
}

function RoomDetail({ d, room, focusFirst }) {
  const v = d.draft;
  const mobile = useIsMobile();
  const idx = v.rooms.findIndex((r) => r.id === room.id);
  // Values a mode had before it was switched off, so switching back restores them.
  const stash = useRef({});
  const set = (fn) => d.update((x) => fn(x.rooms[idx], x));

  const toggleMode = (mode, blank) =>
    set((r) => {
      const key = `${room.id}.${mode}`;
      if (r[mode]) {
        stash.current[key] = r[mode];
        r[mode] = null;
      } else {
        r[mode] = stash.current[key] ?? d.saved.rooms[idx][mode] ?? blank;
      }
    });

  const sub = [
    `${room.count} phòng`,
    room.window ? "cửa sổ" : "không cửa sổ",
    room.bed,
    `${room.area} m²`,
    room.max,
  ].join(" · ");

  const rowGrid = (pad = "12px 16px", first = false) => ({
    display: "grid",
    gridTemplateColumns: mobile ? "minmax(0,1fr) 40px" : "110px 1fr 40px",
    gap: mobile ? "10px 14px" : 14,
    alignItems: "center",
    padding: pad,
    borderTop: first ? 0 : "1px solid var(--bn-hairline-2)",
  });
  const modeLabel = { fontSize: 14.5, fontWeight: 600 };
  const mid = (wrap = true) => ({
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontSize: 13,
    color: "var(--bn-ink-2)",
    flexWrap: wrap ? "wrap" : "nowrap",
    gridColumn: mobile ? "1 / -1" : undefined,
    gridRow: mobile ? 2 : undefined,
  });
  const num = (group, key, label, focus) => (
    <NumBox
      label={label}
      focus={focus}
      value={group ? room[group]?.[key] : room[key]}
      onChange={(n) => set((r) => (group ? (r[group][key] = n) : (r[key] = n)))}
    />
  );

  const left = (
    <>
      <SectionHead
        eyebrow={
          <>
            § 02 · PHÒNG &amp; GIÁ ·{" "}
            <Link href="/cai-dat/02" style={{ color: "inherit" }} data-leave-ok>
              ‹ {v.rooms.length} LOẠI
            </Link>
          </>
        }
        title={room.name}
        sub={sub}
      />
      <Group label="GIƯỜNG">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {v.bedOptions.map((b) => {
            const on = room.bed.startsWith(b);
            return (
              <button
                key={b}
                type="button"
                className="sa-press"
                aria-pressed={on}
                onClick={() => set((r) => (r.bed = b))}
                style={{
                  height: 36,
                  padding: "0 12px",
                  borderRadius: 18,
                  fontSize: 13.5,
                  display: "flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                  background: on ? "var(--bn-clay)" : "#fff",
                  color: on ? "#fff" : "var(--bn-ink)",
                  border: on ? "1px solid var(--bn-clay)" : "1px solid var(--bn-hairline)",
                }}
              >
                {on ? `✓ ${b}` : b}
              </button>
            );
          })}
        </div>
      </Group>
      <Group label="GIÁ THEO CÁCH BÁN">
        <Card>
          <div style={{ ...rowGrid("12px 16px", true), color: room.hourly ? undefined : "var(--bn-muted)" }}>
            <span style={modeLabel}>Theo giờ</span>
            {room.hourly ? (
              <div style={mid()}>
                {num("hourly", "first2h", "Giá 2 giờ đầu", focusFirst)}2 giờ đầu ·{num("hourly", "perHour", "Giá mỗi giờ sau")}mỗi giờ sau ·{" "}
                {v.hourlyWindow}
              </div>
            ) : (
              <span style={{ ...mid(), color: "var(--bn-muted)" }}>Tắt · loại phòng này không nhận theo giờ</span>
            )}
            <Toggle on={!!room.hourly} label="Theo giờ" onChange={() => toggleMode("hourly", { first2h: null, perHour: null })} />
          </div>
          <div style={{ ...rowGrid(), color: room.overnight ? undefined : "var(--bn-muted)" }}>
            <span style={modeLabel}>Qua đêm</span>
            {room.overnight != null ? (
              <div style={mid(mobile)}>
                {num(null, "overnight", "Giá qua đêm")}
                {v.overnightWindow}
              </div>
            ) : (
              <span style={{ ...mid(), color: "var(--bn-muted)" }}>Tắt</span>
            )}
            <Toggle on={room.overnight != null} label="Qua đêm" onChange={() => toggleMode("overnight", 0)} />
          </div>
          <div style={{ ...rowGrid(), color: room.daily ? undefined : "var(--bn-muted)" }}>
            <span style={modeLabel}>Theo ngày</span>
            {room.daily ? (
              <div style={mid()}>
                {num("daily", "weekday", "Giá ngày thường")}ngày thường ·{num("daily", "weekend", "Giá cuối tuần")}cuối tuần
              </div>
            ) : (
              <span style={{ ...mid(), color: "var(--bn-muted)" }}>Tắt</span>
            )}
            <Toggle on={!!room.daily} label="Theo ngày" onChange={() => toggleMode("daily", { weekday: null, weekend: null })} />
          </div>
          <div style={rowGrid("10px 16px")}>
            <span style={{ fontSize: 13, color: "var(--bn-muted)" }}>Đêm cuối tuần</span>
            <div style={{ ...mid(), gap: 5 }}>
              {DAYS.map((day) => {
                const on = v.weekendNights.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    className="sa-press"
                    aria-pressed={on}
                    onClick={() =>
                      d.update((x) => {
                        x.weekendNights = on ? x.weekendNights.filter((w) => w !== day) : DAYS.filter((w) => w === day || x.weekendNights.includes(w));
                      })
                    }
                    style={{
                      width: 38,
                      height: 32,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--bn-mono)",
                      fontSize: 12,
                      background: on ? "var(--bn-clay)" : "#fff",
                      color: on ? "#fff" : "var(--bn-ink-2)",
                      border: `1px solid ${on ? "var(--bn-clay)" : "var(--bn-hairline)"}`,
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <span />
          </div>
          <div style={{ ...rowGrid(), color: v.monthly ? "var(--bn-ink)" : "var(--bn-muted)" }}>
            <span style={modeLabel}>Theo tháng</span>
            <span style={{ ...mid(), color: "inherit" }}>{v.monthly ? "Bật" : "Tắt"} · dùng cho căn hộ dịch vụ</span>
            <Toggle on={v.monthly} label="Theo tháng" onChange={(on) => d.update((x) => (x.monthly = on))} />
          </div>
        </Card>
      </Group>
      <Group label="NGÀY LỄ">
        <Card>
          {v.holidays.map((h, i) => (
            <div
              key={h.label}
              style={{
                display: "grid",
                gridTemplateColumns: mobile ? "minmax(0,1fr) auto" : "150px 1fr auto",
                gap: mobile ? "2px 12px" : 12,
                alignItems: "center",
                minHeight: 46,
                padding: mobile ? "10px 16px" : "0 16px",
                fontSize: 14,
                borderTop: i ? "1px solid var(--bn-hairline-2)" : 0,
              }}
            >
              <span>{h.label}</span>
              <span style={{ color: "var(--bn-ink-2)" }}>{h.rule}</span>
              <span style={{ fontSize: 12.5, color: h.strict ? "var(--bn-urgent)" : "var(--bn-muted)" }}>{h.refund}</span>
            </div>
          ))}
        </Card>
      </Group>
    </>
  );

  const right = (
    <>
      <PriceSpeech d={d} />
      <BoniaSays context="Khách hỏi thuê 3 giờ chiều nay" quote={hourlyQuote(v, room)} />
    </>
  );

  return (
    <SectionPage d={d} padding="32px 40px 0">
      <TwoCol left={left} right={right} leftGap={18} />
    </SectionPage>
  );
}

function RoomList({ d }) {
  const v = d.draft;
  const mobile = useIsMobile();
  const [, navigate] = useLocation();
  const total = v.rooms.reduce((a, r) => a + r.count, 0);
  const modes = [
    v.rooms.some((r) => r.hourly) && "theo giờ",
    v.rooms.some((r) => r.overnight) && "qua đêm",
    v.rooms.some((r) => r.daily) && "theo ngày",
    v.monthly && "theo tháng",
  ]
    .filter(Boolean)
    .join(", ");
  const sup = v.rooms.find((r) => r.id === "superior") || v.rooms[0];

  const left = (
    <>
      <SectionHead eyebrow="§ 02 · CÀI ĐẶT" title="Phòng & giá" sub={`${total} phòng · ${v.rooms.length} loại · ${modes}`} />
      <div
        style={{
          display: "flex",
          gap: 10,
          fontSize: 13,
          color: "var(--bn-ink-2)",
          lineHeight: 1.5,
          padding: "12px 14px",
          border: "1px solid var(--bn-clay)",
          borderRadius: 12,
          background: "#fff",
        }}
      >
        <span style={{ fontFamily: "var(--bn-mono)", fontSize: 9.5, letterSpacing: "0.16em", color: "var(--bn-clay)", paddingTop: 2, whiteSpace: "nowrap" }}>
          CẦN XEM LẠI
        </span>
        Giá trên Booking.com khác giá khách gọi thẳng. Bonia chỉ nói giá bạn nhập ở đây; mở từng loại phòng để xem lại.
      </div>
      <Group label={`${v.rooms.length} LOẠI PHÒNG`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {v.rooms.map((r) => (
            <button
              key={r.id}
              type="button"
              className="sa-card-link"
              onClick={() => navigate(`/cai-dat/02?loai=${r.id}`)}
              style={{
                display: "grid",
                gridTemplateColumns: mobile ? "minmax(0,1fr) auto" : "minmax(0,1fr) auto auto",
                gap: 14,
                alignItems: "center",
                padding: "14px 16px",
                background: "#fff",
                border: "1px solid var(--bn-hairline)",
                borderRadius: 12,
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{r.name}</span>
                <span style={{ fontSize: 12.5, color: "var(--bn-ink-2)" }}>
                  {r.count} phòng · {r.bed} · {r.area} m² · {modesOf(r)}
                </span>
                <span style={{ fontFamily: "var(--bn-mono)", fontSize: 12, color: "var(--bn-ink-2)", marginTop: 2 }}>
                  {[
                    r.hourly && `giờ ${groupVnd(r.hourly.first2h)}`,
                    r.overnight && `đêm ${groupVnd(r.overnight)}`,
                    r.daily && `ngày ${groupVnd(r.daily.weekday)}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              {!mobile && <SourceChip>BOOKING.COM {groupVnd(r.otaPrice)}đ</SourceChip>}
              <span style={{ color: "var(--bn-muted)" }}>›</span>
            </button>
          ))}
        </div>
      </Group>
    </>
  );
  const right = (
    <>
      <PriceSpeech d={d} />
      <BoniaSays context="Khách hỏi thuê 3 giờ chiều nay" quote={hourlyQuote(v, sup)} />
    </>
  );
  return (
    <SectionPage d={d}>
      <TwoCol left={left} right={right} leftGap={18} />
    </SectionPage>
  );
}
