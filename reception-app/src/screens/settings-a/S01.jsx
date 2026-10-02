import React, { useState } from "react";
import { BoniaSays, SourceChip } from "../../components/ui/index.js";
import { useIsMobile } from "../../lib/hooks.js";
import { useStore } from "../../store/index.jsx";
import { groupVnd } from "../../lib/format.js";
import { useDraft, SectionPage, SectionHead, TwoCol, Group, Card, LockedTag, InlineText, InlineInput, NumBox, spokenVnd } from "./parts.jsx";

// §01 Khách sạn (3.6 B): names, landmark, parking, hours, amenities (tap to
// turn on/off; Đưa đón sân bay opens its price box), payment rule (locked).

const AIRPORT = "Đưa đón sân bay";

const describe = (a, b) => {
  const out = [];
  const t = (label, x, y) => x !== y && out.push(`${label} ${x} → ${y}`);
  t("giờ nhận phòng", a.checkIn, b.checkIn);
  t("giờ trả phòng", a.checkOut, b.checkOut);
  t("lễ tân trực", a.frontDesk, b.frontDesk);
  if (a.landmark !== b.landmark) out.push("mốc dễ tìm");
  if (a.parking !== b.parking) out.push("gửi xe");
  if (a.otherNames.join() !== b.otherNames.join()) out.push("tên khác khách gọi");
  for (const l of b.amenities) {
    const x = a.amenitiesOn.includes(l);
    const y = b.amenitiesOn.includes(l);
    if (x !== y) out.push(`${l}: ${y ? "bật" : "tắt"}`);
  }
  const ap = (k, label) => a.airport[k] !== b.airport[k] && out.push(`${label} ${groupVnd(a.airport[k])} → ${groupVnd(b.airport[k])}`);
  ap("car4", "xe 4 chỗ");
  ap("car7", "xe 7 chỗ");
  ap("nightExtra", "phụ thu đêm");
  return out;
};

const ERROR_EDIT = (d) => {
  d.checkIn = "13:00";
  return d;
};

export function Section01({ screen }) {
  const d = useDraft("01", { describe, mark: "ok", init: screen === "error" ? ERROR_EDIT : undefined, failFirst: screen === "error" });
  const v = d.draft;
  const mobile = useIsMobile();
  const hotel = useStore().hotel;
  const [selected, setSelected] = useState(AIRPORT);
  const [adding, setAdding] = useState(null);

  const onCount = v.amenitiesOn.length;
  const isOn = (l) => v.amenitiesOn.includes(l);
  const unconfirmed = (l) => (v.amenitiesUnconfirmed || []).includes(l);

  const tapAmenity = (l) => {
    // An on chip with details opens them first; otherwise a tap turns it on/off.
    if (l === AIRPORT && isOn(l) && selected !== l) return setSelected(l);
    setSelected(l);
    d.update((x) => {
      x.amenitiesUnconfirmed = (x.amenitiesUnconfirmed || []).filter((u) => u !== l);
      x.amenitiesOn = x.amenitiesOn.includes(l) ? x.amenitiesOn.filter((o) => o !== l) : [...x.amenitiesOn, l];
    });
  };

  const ap = v.airport;
  const airportOn = isOn(AIRPORT);
  const hourWords = (hhmm) => {
    const h = Number(hhmm.slice(0, 2));
    if (h === 0) return "12 giờ đêm";
    if (h < 11) return `${h} giờ sáng`;
    if (h < 13) return `${h} giờ trưa`;
    if (h < 18) return `${h - 12} giờ chiều`;
    return `${h - 12} giờ tối`;
  };
  const [nf, nt] = ap.nightHours.split("–");

  let context = `Khi khách hỏi ${selected.toLowerCase()}`;
  let quote;
  if (selected === AIRPORT) {
    context = "Khi khách hỏi đưa đón sân bay";
    quote = airportOn
      ? `“Dạ khách sạn có xe đón ở Tân Sơn Nhất, xe 4 chỗ ${spokenVnd(ap.car4)}, xe 7 chỗ ${spokenVnd(ap.car7)}. Từ ${hourWords(nf)} tới ${hourWords(nt)} thêm ${spokenVnd(ap.nightExtra)} ạ. Em ghi lại để khách sạn xác nhận giờ đón cho anh chị.”`
      : "“Dạ bên em không có xe đưa đón sân bay ạ.”";
  } else {
    quote = isOn(selected)
      ? `“Dạ khách sạn có ${selected.toLowerCase()} ạ.”`
      : `“Dạ bên em không có ${selected.toLowerCase()} ạ.”`;
  }

  const chip = (l) => {
    const on = isOn(l);
    const sel = on && selected === l;
    const dashed = !on && unconfirmed(l);
    return (
      <button
        key={l}
        type="button"
        className="sa-press"
        aria-pressed={on}
        onClick={() => tapAmenity(l)}
        title={dashed ? "Bonia tìm thấy trên mạng, chưa xác nhận" : undefined}
        style={{
          height: 34,
          padding: "0 12px",
          borderRadius: 17,
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          background: sel ? "var(--bn-clay)" : on ? "var(--bn-hairline-2)" : "#fff",
          color: sel ? "#fff" : on ? "var(--bn-ink)" : "var(--bn-ink-2)",
          border: `1px ${dashed ? "dashed" : "solid"} ${sel ? "var(--bn-clay)" : on ? "var(--bn-hairline-2)" : "var(--bn-hairline)"}`,
        }}
      >
        {on ? `✓ ${l}` : l}
      </button>
    );
  };

  const rowStyle = (first) => ({
    display: mobile ? "flex" : "grid",
    flexDirection: "column",
    alignItems: mobile ? "stretch" : "center",
    gridTemplateColumns: "150px 1fr",
    gap: mobile ? 6 : 12,
    minHeight: 50,
    padding: mobile ? "10px 16px" : "0 16px",
    justifyContent: "center",
    borderTop: first ? 0 : "1px solid var(--bn-hairline-2)",
  });
  const rowLabel = { fontSize: 13, color: "var(--bn-muted)" };

  const left = (
    <>
      <SectionHead
        eyebrow="§ 01 · CÀI ĐẶT"
        title="Khách sạn"
        sub={`${hotel.shortName} · khu Quận 3 cũ · nhận ${v.checkIn}, trả ${v.checkOut} · lễ tân ${v.frontDesk}`}
      />
      <Group label="TÊN & ĐƯỜNG VÀO">
        <Card>
          <div style={rowStyle(true)}>
            <span style={rowLabel}>Tên khác khách gọi</span>
            <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {v.otherNames.map((n) => (
                <span
                  key={n}
                  className="sa-has-x"
                  style={{
                    height: 28,
                    padding: "0 10px",
                    borderRadius: 14,
                    background: "var(--bn-hairline-2)",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                    flex: "none",
                  }}
                >
                  {n}
                  <button
                    type="button"
                    className="sa-x"
                    aria-label={`Bỏ tên ${n}`}
                    onClick={() => d.update((x) => (x.otherNames = x.otherNames.filter((o) => o !== n)))}
                  >
                    ✕
                  </button>
                </span>
              ))}
              {adding != null ? (
                <input
                  autoFocus
                  className="sa-num"
                  aria-label="Tên khác"
                  value={adding}
                  placeholder="Tên khác…"
                  onChange={(e) => setAdding(e.target.value)}
                  onBlur={() => {
                    const n = adding.trim();
                    if (n && !v.otherNames.includes(n)) d.update((x) => x.otherNames.push(n));
                    setAdding(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                    if (e.key === "Escape") setAdding(null);
                  }}
                  style={{
                    height: 28,
                    width: 140,
                    padding: "0 10px",
                    borderRadius: 14,
                    border: "2px solid var(--bn-clay)",
                    fontSize: 13,
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="sa-press"
                  onClick={() => setAdding("")}
                  style={{
                    height: 28,
                    padding: "0 10px",
                    borderRadius: 14,
                    border: "1px dashed var(--bn-dashed)",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    color: "var(--bn-muted)",
                    whiteSpace: "nowrap",
                    flex: "none",
                  }}
                >
                  + Thêm
                </button>
              )}
            </span>
          </div>
          <div style={rowStyle(false)}>
            <span style={rowLabel}>Mốc dễ tìm</span>
            <InlineText label="Mốc dễ tìm" value={v.landmark} onChange={(t) => d.update((x) => (x.landmark = t))} />
          </div>
          <div style={rowStyle(false)}>
            <span style={rowLabel}>Gửi xe</span>
            <InlineText label="Gửi xe" value={v.parking} onChange={(t) => d.update((x) => (x.parking = t))} />
          </div>
        </Card>
      </Group>

      <Group label="GIỜ">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {[
            ["Nhận phòng", "checkIn"],
            ["Trả phòng", "checkOut"],
            ["Lễ tân trực", "frontDesk"],
          ].map(([label, k]) => (
            <label
              key={k}
              style={{
                background: "#fff",
                border: "1px solid var(--bn-hairline)",
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: 12.5, color: "var(--bn-muted)" }}>{label}</span>
              <InlineInput
                label={label}
                value={v[k]}
                inputMode={k === "frontDesk" ? undefined : "numeric"}
                onChange={(t) => d.update((x) => (x[k] = t))}
                style={{ fontSize: 20, width: "100%" }}
              />
            </label>
          ))}
        </div>
      </Group>

      <Group label={`TIỆN ÍCH · ${onCount} BẬT`} right="CHẠM ĐỂ BẬT / TẮT">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{v.amenities.map(chip)}</div>
        {selected === AIRPORT && airportOn && (
          <div
            style={{
              background: "#fff",
              border: "2px solid var(--bn-clay)",
              borderRadius: 12,
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14.5, fontWeight: 600 }}>Đưa đón sân bay Tân Sơn Nhất</span>
              <SourceChip>{ap.source}</SourceChip>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3,1fr)", gap: 8 }}>
              {[
                ["Xe 4 chỗ", "car4"],
                ["Xe 7 chỗ", "car7"],
                [`${ap.nightHours} thêm`, "nightExtra"],
              ].map(([label, k]) => (
                <div key={k} style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                  <span style={{ fontSize: 12, color: "var(--bn-muted)" }}>{label}</span>
                  <NumBox
                    label={label}
                    height={42}
                    suffix="đ"
                    value={ap[k]}
                    onChange={(n) => d.update((x) => (x.airport[k] = n))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </Group>

      <Group label="THANH TOÁN">
        <div
          aria-disabled="true"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            minHeight: 50,
            padding: "0 16px",
            background: "var(--bn-cream-2)",
            border: "1px solid var(--bn-hairline)",
            borderRadius: 12,
          }}
        >
          <span style={{ fontSize: 14 }}>Bonia không đọc số tài khoản, không nói đã nhận tiền</span>
          <LockedTag />
        </div>
      </Group>
    </>
  );

  const right = (
    <>
      <BoniaSays context={context} quote={quote} />
      <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--bn-muted)", padding: "0 4px" }}>
        {selected === AIRPORT ? "Bonia chỉ ghi yêu cầu đưa đón; khách sạn xác nhận." : "Bonia chỉ nói tiện ích đang bật."}
      </div>
    </>
  );

  return (
    <SectionPage d={d}>
      <TwoCol left={left} right={right} leftGap={22} rightPad={4} />
    </SectionPage>
  );
}
