import React from "react";
import { BoniaSays, Toggle, RadioCard, LockedOption, Chip } from "../../components/ui/index.js";
import { useIsMobile } from "../../lib/hooks.js";
import { groupVnd } from "../../lib/format.js";
import { useDraft, SectionPage, SectionHead, TwoCol, Group, Card, LockedTag, NumBox, InlineInput } from "./parts.jsx";

// §03 Đặt phòng (3.6 D): how bookings are taken (Tự đặt phòng is locked:
// Bonia never books), availability check, alternatives, what to ask,
// early check-in / late check-out.

const describe = (a, b) => {
  const out = [];
  if (a.mode !== b.mode) out.push(`cách nhận đặt: ${b.modes.find((m) => m.id === b.mode)?.title}`);
  if (a.checkCalendar !== b.checkCalendar) out.push(`kiểm tra Lịch phòng: ${b.checkCalendar ? "bật" : "tắt"}`);
  if (a.suggestMax !== b.suggestMax) out.push(`gợi ý tối đa ${a.suggestMax ?? "—"} → ${b.suggestMax ?? "—"} phòng`);
  if (a.groupOver !== b.groupOver) out.push(`đoàn trên ${a.groupOver ?? "—"} → ${b.groupOver ?? "—"} người`);
  b.askFields.forEach((f, i) => {
    if (a.askFields[i] && a.askFields[i].on !== f.on) out.push(`hỏi ${f.label.toLowerCase()}: ${f.on ? "bật" : "tắt"}`);
  });
  if (a.earlyLate !== b.earlyLate) out.push(`nhận sớm, trả trễ: ${b.earlyLate ? "bật" : "tắt"}`);
  if (a.earlyLateFee !== b.earlyLateFee) out.push(`phí ${groupVnd(a.earlyLateFee)} → ${groupVnd(b.earlyLateFee)}`);
  return out;
};

// The alternatives Bonia offers for a sold-out Deluxe on Friday.
const ALTERNATIVES = ["Superior 2 giường", "Superior có cửa sổ"];

function quoteFor(v) {
  if (!v.checkCalendar) {
    return {
      context: "Khách muốn Deluxe T6 · Bonia không xem Lịch phòng",
      quote:
        v.mode === "answer"
          ? "“Dạ anh chị gọi lễ tân để kiểm tra phòng Deluxe tối thứ Sáu giúp em ạ.”"
          : "“Dạ em ghi yêu cầu Deluxe tối thứ Sáu, khách sạn kiểm tra phòng và nhắn xác nhận cho anh chị ạ.”",
    };
  }
  const n = Math.max(0, Math.min(v.suggestMax ?? 0, ALTERNATIVES.length));
  const alt = n ? ` Bên em còn ${ALTERNATIVES.slice(0, n).join(" và ")}.` : "";
  const end =
    v.mode === "answer"
      ? " Anh chị muốn đặt thì gọi lễ tân giúp em ạ."
      : " Em ghi yêu cầu, khách sạn sẽ nhắn xác nhận cho anh chị ạ.";
  return { context: "Khách muốn Deluxe T6 nhưng đã hết", quote: `“Dạ Deluxe tối thứ Sáu bên em hết rồi ạ.${alt}${end}”` };
}

export function Section03({ screen }) {
  const failFirst = screen === "error";
  const d = useDraft("03", {
    describe,
    mark: "ok",
    failFirst,
    init: failFirst
      ? (x) => {
          x.suggestMax = 3;
          return x;
        }
      : undefined,
  });
  const v = d.draft;
  const mobile = useIsMobile();
  const { context, quote } = quoteFor(v);

  const row = (first, extra) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
    padding: mobile ? "8px 16px" : "0 16px",
    borderTop: first ? 0 : "1px solid var(--bn-hairline-2)",
    ...extra,
  });

  const left = (
    <>
      <SectionHead eyebrow="§ 03 · CÀI ĐẶT" title="Đặt phòng" sub={summary(v)} />
      <Group label="CÁCH NHẬN ĐẶT · CHỌN MỘT">
        <div role="radiogroup" aria-label="Cách nhận đặt" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {v.modes.map((m) =>
            m.locked ? (
              <LockedOption key={m.id} title={m.title} sub={m.sub} />
            ) : (
              <RadioCard
                key={m.id}
                selected={v.mode === m.id}
                onSelect={() => d.update((x) => (x.mode = m.id))}
                title={m.title}
                sub={m.sub}
              />
            )
          )}
        </div>
      </Group>
      <Card>
        <div style={row(true)}>
          <span style={{ fontSize: 14.5 }}>Bonia kiểm tra phòng trống theo Lịch phòng</span>
          <Toggle
            on={v.checkCalendar}
            label="Bonia kiểm tra phòng trống theo Lịch phòng"
            onChange={(on) => d.update((x) => (x.checkCalendar = on))}
          />
        </div>
        <div style={row(false, { flexWrap: mobile ? "wrap" : "nowrap" })}>
          <span style={{ fontSize: 14.5 }}>Hết loại khách muốn thì gợi ý tối đa</span>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <NumBox
              label="Số phòng khác gợi ý tối đa"
              money={false}
              center
              height={36}
              width={52}
              value={v.suggestMax}
              onChange={(n) => d.update((x) => (x.suggestMax = n == null ? null : Math.min(n, 9)))}
            />
            phòng khác
          </span>
        </div>
        <div style={row(false, { flexWrap: mobile ? "wrap" : "nowrap" })}>
          <span style={{ fontSize: 14.5 }}>
            Đoàn trên{" "}
            <InlineInput
              label="Số người của một đoàn"
              inputMode="numeric"
              value={v.groupOver ?? ""}
              onChange={(t) => d.update((x) => (x.groupOver = t.replace(/\D/g, "") ? Number(t.replace(/\D/g, "")) : null))}
            />{" "}
            người
          </span>
          <span style={{ fontSize: 13.5, color: "var(--bn-ink-2)" }}>Ghi lại để chủ gọi lại</span>
        </div>
      </Card>
      <Group label="THÔNG TIN CẦN HỎI KHI ĐẶT">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {v.askFields.map((f, i) => (
            <Chip
              key={f.id}
              variant="choice"
              selected={f.on}
              onClick={() => d.update((x) => (x.askFields[i].on = !x.askFields[i].on))}
            >
              {f.label}
            </Chip>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--bn-muted)" }}>Số điện thoại lấy từ số gọi đến, không hỏi.</div>
      </Group>
      <Card>
        <div style={row(true)}>
          <span style={{ fontSize: 14.5 }}>Nhận phòng sớm / trả phòng trễ · nhận yêu cầu</span>
          <Toggle
            on={v.earlyLate}
            label="Nhận phòng sớm / trả phòng trễ"
            onChange={(on) => d.update((x) => (x.earlyLate = on))}
          />
        </div>
        <div aria-disabled="true" style={row(false, { background: "var(--bn-cream-2)", color: "var(--bn-muted)" })}>
          <span style={{ fontSize: 14.5 }}>Tự hứa nhận sớm, trả trễ</span>
          <LockedTag color="inherit" />
        </div>
        <div style={row(false, { color: v.earlyLate ? undefined : "var(--bn-muted)", borderRadius: "0 0 12px 12px" })}>
          <span style={{ fontSize: 14.5 }}>Phí</span>
          <span style={{ display: "flex", alignItems: "center", fontFamily: "var(--bn-mono)", fontSize: 14 }}>
            <InlineInput
              label="Phí nhận sớm, trả trễ mỗi giờ"
              inputMode="numeric"
              value={groupVnd(v.earlyLateFee)}
              onChange={(t) => d.update((x) => (x.earlyLateFee = t.replace(/\D/g, "") ? Number(t.replace(/\D/g, "")) : null))}
              style={{ textAlign: "right" }}
            />
            &nbsp;đ/giờ
          </span>
        </div>
      </Card>
    </>
  );

  const right = (
    <>
      <BoniaSays context={context} quote={quote} />
      <div
        style={{
          padding: "14px 16px",
          border: "1px solid var(--bn-hairline)",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--bn-ink-2)",
        }}
      >
        <span style={{ fontFamily: "var(--bn-mono)", fontSize: 9.5, letterSpacing: "0.18em", color: "var(--bn-muted)" }}>LUÔN KHÓA</span>
        Bonia không bao giờ nói “đã đặt xong”.
      </div>
    </>
  );

  return (
    <SectionPage d={d}>
      <TwoCol left={left} right={right} leftGap={20} />
    </SectionPage>
  );
}

function summary(v) {
  const mode = v.mode === "answer" ? "Chỉ trả lời thông tin" : "Ghi yêu cầu, khách sạn xác nhận";
  const sug = v.suggestMax > 0 ? `gợi ý tối đa ${v.suggestMax} phòng khác` : "không gợi ý phòng khác";
  return `${mode} · ${sug}`;
}
