import React, { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { AiReviewRow, BoniaSays, Button, Chip, ConflictRow, LockedOption, PriceConfirmRow } from "../../components/ui/index.js";
import {
  REVIEW_01,
  REVIEW_01_MORE,
  REVIEW_02_ASK,
  REVIEW_02_PRICES,
  REVIEW_CARDS,
  REVIEW_SECTIONS,
  ROOM_SAY,
} from "../../data/onboarding.js";
import { setAnswer, setOnb, setPrice, setRow } from "./state.js";
import { confirmAll, sectionStats, spokenPrice, totals } from "./review.js";
import { Eyebrow, MONO, Title } from "./ui.jsx";

// Step 2 · Xem lại: 3.1 F (five cards that add up to 41) → one card at a
// time (?muc=01 → 3.1 G, ?muc=02 → 3.1 H; §03–§05 use the same pattern).
// Dashed = Bonia found it, not confirmed yet; solid = confirmed.

export function StepReview({ s, frame }) {
  const q = new URLSearchParams(useSearch());
  const muc = q.get("muc") || (frame === "3.1_G" ? "01" : frame === "3.1_H" ? "02" : null);
  if (muc === "01") return <Section01 s={s} />;
  if (muc === "02") return <Section02 s={s} frame={frame} />;
  if (REVIEW_SECTIONS[muc]) return <SectionN s={s} n={muc} />;
  return <Overview s={s} />;
}

const manualChip = (s, source) => (s.mode === "manual" ? "VÍ DỤ" : source);

// 3.1 F ─────────────────────────────────────────────────────────────────
function Overview({ s }) {
  const [, navigate] = useLocation();
  const { need, found } = totals(s);
  const manual = s.mode === "manual";
  return (
    <div className="lo-grid" style={{ display: "flex", flexDirection: "column", gap: 28, padding: "56px 140px 40px" }}>
      <div className="lo-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Eyebrow>
            {manual ? `Bước 2 · Xem lại · ví dụ sẵn · ${need} cần bạn điền` : `Bước 2 · Xem lại · ${found} thông tin · ${need} cần bạn điền`}
          </Eyebrow>
          <Title>{manual ? "Sửa ví dụ cho đúng khách sạn của bạn." : "Đây là những gì Bonia tìm được."}</Title>
        </div>
        <div style={{ fontSize: 14, color: "var(--bn-ink-2)" }}>Bonia chưa dùng thông tin nào cho tới khi bạn xem lại.</div>
      </div>
      <div className="lo-cards" style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--bn-hairline)" }}>
        {REVIEW_CARDS.map((c) => {
          const st = sectionStats(s, c.n);
          return (
            <Link
              key={c.n}
              href={`/bat-dau/xem-lai?muc=${c.n}`}
              className="lo-row-link"
              style={{
                display: "grid",
                gridTemplateColumns: "64px 1fr 220px 180px 24px",
                alignItems: "center",
                gap: 20,
                minHeight: 92,
                borderBottom: "1px solid var(--bn-hairline)",
                color: "var(--bn-ink)",
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.12em", color: "var(--bn-muted)" }}>§ {c.n}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                <span style={{ fontFamily: "var(--bn-serif)", fontSize: 24 }}>{c.title}</span>
                <span style={{ fontSize: 14, color: "var(--bn-ink-2)" }}>{c.sum}</span>
              </div>
              <span className="lo-hide-m" style={{ fontFamily: MONO, fontSize: 12, letterSpacing: "0.1em" }}>
                {c.found} THÔNG TIN
              </span>
              <CardPill st={st} />
              <span className="lo-hide-m" style={{ color: "var(--bn-muted)" }}>
                ›
              </span>
            </Link>
          );
        })}
      </div>
      <div className="lo-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Button size="lg" disabled={need > 0} onClick={() => navigate("/bat-dau/nghe-may")} style={{ width: 200 }}>
          {need > 0 ? `Tiếp · còn ${need} mục` : "Tiếp"}
        </Button>
      </div>
    </div>
  );
}

function CardPill({ st }) {
  let text = "CẦN XEM LẠI";
  let look = { background: "var(--bn-processing-bg)", color: "var(--bn-ink-2)" };
  if (st.need) {
    text = `${st.need} CẦN BẠN ĐIỀN`;
    look = { background: "var(--bn-urgent-bg)", color: "var(--bn-urgent)" };
  } else if (!st.open) {
    text = "✓ ĐÃ XEM";
    look = { boxShadow: "inset 0 0 0 1px var(--bn-hairline)", color: "var(--bn-ok)" };
  }
  return (
    <span
      style={{
        justifySelf: "start",
        fontFamily: MONO,
        fontSize: 10.5,
        letterSpacing: "0.12em",
        padding: "5px 9px",
        borderRadius: 12,
        whiteSpace: "nowrap",
        ...look,
      }}
    >
      {text}
    </span>
  );
}

// Shared section frame (3.1 G / H) ──────────────────────────────────────
function SectionLayout({ n, st, title, bulk, children, say, note }) {
  const card = REVIEW_CARDS.find((c) => c.n === n);
  return (
    <div
      className="lo-grid"
      style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 380px", gap: 48, padding: "40px 80px 40px" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
        <div className="lo-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Eyebrow>
              <Link href="/bat-dau/xem-lai" style={{ color: "inherit" }}>
                ‹ Xem lại
              </Link>{" "}
              · § {n} · {card.found} thông tin · {st.need} cần bạn điền
            </Eyebrow>
            <Title size={36}>{title}</Title>
          </div>
          {bulk}
        </div>
        {children}
        {!st.open && (
          <div className="lo-actions lo-in" style={{ display: "flex", justifyContent: "flex-end", paddingTop: 6 }}>
            <Button size="lg" to="/bat-dau/xem-lai" style={{ width: 240 }}>
              Xong · về Xem lại
            </Button>
          </div>
        )}
      </div>
      <div className="lo-side" style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 68 }}>
        <BoniaSays quote={say} size={19} padding="20px 22px" />
        <div style={{ fontSize: 13, lineHeight: 1.55, color: "var(--bn-muted)", padding: "0 4px" }}>{note}</div>
      </div>
    </div>
  );
}

function BulkButton({ s, n, count }) {
  if (!count) {
    return (
      <span style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.12em", color: "var(--bn-ok)", height: 40, display: "flex", alignItems: "center" }}>
        ✓ ĐÃ XEM HẾT
      </span>
    );
  }
  return (
    <button
      type="button"
      className="tt-chip"
      onClick={() => setOnb(confirmAll(s, n))}
      style={{
        height: 40,
        padding: "0 18px",
        borderRadius: 20,
        border: "1px solid var(--bn-clay)",
        color: "var(--bn-clay)",
        fontSize: 14,
        fontWeight: 500,
        background: "transparent",
      }}
    >
      Đúng hết · {count} mục
    </button>
  );
}

/** One fact: Đúng / Sửa / Bỏ, or a quiet line once removed. */
function FactRow({ s, row }) {
  const st = s.rows[row.id];
  if (st.removed) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 16px",
          border: "1px dashed var(--bn-hairline)",
          borderRadius: 10,
          fontSize: 13.5,
          color: "var(--bn-muted)",
        }}
      >
        <span>
          {row.label} · <s>{st.value}</s> · Bonia sẽ không nói
        </span>
        <button type="button" className="lo-link" style={{ fontSize: 13 }} onClick={() => setRow(row.id, { removed: false })}>
          Hoàn tác
        </button>
      </div>
    );
  }
  return (
    <AiReviewRow
      label={row.label}
      value={st.value}
      mono={row.mono}
      source={row.source ? manualChip(s, row.source) : null}
      confirmed={st.confirmed}
      onConfirm={() => setRow(row.id, { confirmed: true })}
      onEdit={(v) => setRow(row.id, { value: v, confirmed: true })}
      onRemove={() => setRow(row.id, { removed: true, confirmed: false })}
    />
  );
}

/** "Cần bạn điền": Bonia's suggestion is pre-selected; tapping any chip
 *  answers. Answered boxes turn solid with a green tag. */
function AskBox({ id, text, options, s, tagSuffix = "", note }) {
  const a = s.answers[id];
  const [custom, setCustom] = useState(a.custom != null);
  const [draft, setDraft] = useState(a.custom || "");
  const answered = a.answered;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: note ? 10 : 12,
        padding: "14px 16px",
        background: answered ? "#fff" : "var(--bn-urgent-wash)",
        border: answered ? "1px solid var(--bn-hairline)" : "1px dashed var(--bn-urgent)",
        borderRadius: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 500 }}>{text}</span>
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: "0.14em",
            padding: "4px 8px",
            borderRadius: 10,
            whiteSpace: "nowrap",
            ...(answered ? { color: "var(--bn-ok)" } : { color: "var(--bn-urgent)", background: "var(--bn-urgent-bg)" }),
          }}
        >
          {answered ? "✓ ĐÃ ĐIỀN" : `CẦN BẠN ĐIỀN${tagSuffix}`}
        </span>
      </div>
      <div className="lo-wrap" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((o, i) => (
          <Chip
            key={o}
            variant="answer"
            selected={a.selected === i && a.custom == null}
            onClick={() => {
              setCustom(false);
              setAnswer(id, { selected: i, answered: true, custom: null });
            }}
          >
            {o}
          </Chip>
        ))}
        {!custom && (
          <Chip variant="custom" onClick={() => setCustom(true)}>
            Tự viết…
          </Chip>
        )}
      </div>
      {custom && (
        <input
          autoFocus
          value={draft}
          placeholder="Viết câu trả lời"
          aria-label={text}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => draft.trim() && setAnswer(id, { custom: draft.trim(), selected: -1, answered: true })}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          style={{ height: 44, border: "2px solid var(--bn-clay)", borderRadius: 10, padding: "0 13px", fontSize: 14, outline: 0, background: "#fff" }}
        />
      )}
      {note && <div style={{ fontSize: 13, color: "var(--bn-muted)" }}>{note}</div>}
    </div>
  );
}

const answerText = (s, id, options) => {
  const a = s.answers[id];
  return a.custom ?? options[a.selected] ?? options[0];
};

// 3.1 G · §01 Khách sạn ─────────────────────────────────────────────────
function Section01({ s }) {
  const [more, setMore] = useState(false);
  const st = sectionStats(s, "01");
  const conflict = REVIEW_01.rows.find((r) => r.conflict);
  const cf = s.answers["nhan-phong"];
  const checkIn = conflict.conflict[cf.selected]?.value || "14:00";
  const late = answerText(s, "khach-khuya", REVIEW_01.question.options);
  const lateSay = {
    "Bấm chuông hoặc gọi lễ tân": "bấm chuông hoặc gọi lễ tân",
    "Lễ tân mở cửa cả đêm": "lễ tân mở cửa cả đêm",
    "Báo trước giờ tới": "báo trước giờ tới giúp em",
  }[late] || late.charAt(0).toLowerCase() + late.slice(1);
  const out = s.rows["tra-phong"].value;
  const say = `“Dạ khách sạn nhận phòng từ ${spokenTime(checkIn)} và trả phòng trước ${spokenTime(out)} trưa ạ. Nếu anh chị tới khuya thì ${lateSay}, lễ tân trực ${s.rows["le-tan"].value} ạ.”`;

  return (
    <SectionLayout
      n="01"
      st={st}
      title="Khách sạn"
      bulk={<BulkButton s={s} n="01" count={st.bulk} />}
      say={say}
      note="Viền nét đứt: Bonia tìm được, bạn chưa xác nhận. Nét liền: đã xác nhận."
    >
      <div className="lo-rows" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {REVIEW_01.rows.map((r) =>
          r.conflict ? (
            <ConflictRow
              key={r.id}
              label={r.label}
              options={r.conflict.map((c) => ({ value: c.value, source: manualChip(s, c.source) }))}
              selected={cf.selected}
              onSelect={(i) => setAnswer("nhan-phong", { selected: i, answered: true })}
              style={cf.answered ? { border: "1px solid var(--bn-hairline)" } : undefined}
            />
          ) : (
            <FactRow key={r.id} s={s} row={r} />
          )
        )}
        <AskBox id="khach-khuya" s={s} text={REVIEW_01.question.text} options={REVIEW_01.question.options} />
        {more && REVIEW_01_MORE.map((r) => <FactRow key={r.id} s={s} row={r} />)}
        <button
          type="button"
          onClick={() => setMore((m) => !m)}
          aria-expanded={more}
          style={{ fontSize: 13.5, color: "var(--bn-muted)", padding: "6px 2px", textAlign: "left" }}
        >
          {more ? "Thu gọn 12 thông tin khác" : REVIEW_01.more}
        </button>
      </div>
    </SectionLayout>
  );
}

/** "14:00" → "14 giờ", "13:30" → "13 giờ 30" (how Bonia reads a time). */
function spokenTime(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return m ? `${h} giờ ${m}` : `${h} giờ`;
}

// 3.1 H · §02 Phòng & giá ───────────────────────────────────────────────
function Section02({ s, frame }) {
  const st = sectionStats(s, "02");
  const [focus, setFocus] = useState(frame === "3.1_H" ? "superior" : null);
  const shownId = focus || s.priceFocus;
  const room = REVIEW_02_PRICES.find((r) => r.id === shownId) || REVIEW_02_PRICES[1];
  const p = s.prices[room.id];
  const say = p.confirmed
    ? `“Dạ phòng ${room.name} ${ROOM_SAY[room.id]}, ngày thường giá ${spokenPrice(p.mine)} một đêm ạ.”`
    : `“Dạ phòng ${room.name} em chưa có giá, em ghi lại để lễ tân gọi lại báo giá cho anh chị ạ.”`;

  const open = REVIEW_02_ASK.filter((x) => !s.answers[x.id].answered);
  const current = open[0];
  const pos = REVIEW_02_ASK.length - open.length + 1;

  return (
    <SectionLayout n="02" st={st} title="Phòng & giá" say={say} note="Nút “Đúng hết” không áp dụng cho giá.">
      <div style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--bn-ink-2)" }}>
        Giá trên Booking.com thường cao hơn giá bạn bán trực tiếp. Mỗi loại phòng cần bạn xác nhận giá bán qua điện thoại · theo ngày, ngày
        thường.
      </div>
      <div className="lo-prices" style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--bn-hairline)" }}>
        {REVIEW_02_PRICES.map((r) => (
          <div
            key={r.id}
            onFocus={() => {
              setFocus(r.id);
              setOnb({ priceFocus: r.id });
            }}
            onBlur={() => setFocus(null)}
            onClick={(e) => {
              // "CHƯA XÁC NHẬN" (last cell) also confirms the price as written.
              const cell = e.target.closest("span");
              if (cell && cell === e.currentTarget.firstChild?.lastChild && s.prices[r.id].mine) {
                setPrice(r.id, { confirmed: true });
                setOnb({ priceFocus: r.id });
              }
            }}
          >
            <PriceConfirmRow
              name={r.name}
              meta={r.meta}
              source={manualChip(s, "BOOKING.COM")}
              otaPrice={s.mode === "manual" ? null : r.ota}
              value={s.prices[r.id].mine}
              confirmed={s.prices[r.id].confirmed}
              focused={frame === "3.1_H" && focus === r.id}
              onChange={(v) => setPrice(r.id, { mine: v, confirmed: false })}
              onConfirm={() => s.prices[r.id].mine && setPrice(r.id, { confirmed: true })}
            />
          </div>
        ))}
      </div>
      {current ? (
        <AskBox
          key={current.id}
          id={current.id}
          s={s}
          text={current.text}
          options={current.options}
          tagSuffix={` · ${pos}/${REVIEW_02_ASK.length}`}
          note={open.length > 1 ? `Còn: ${open.slice(1).map((x) => x.short).join(" · ")}` : "Câu cuối."}
        />
      ) : (
        <div
          className="lo-in"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            background: "#fff",
            border: "1px solid var(--bn-hairline)",
            borderRadius: 10,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          <span>
            {REVIEW_02_ASK.map((x) => `${capital(x.short)}: ${answerText(s, x.id, x.options)}`).join(" · ")}
          </span>
          <button
            type="button"
            className="lo-link"
            style={{ fontSize: 13, flex: "none" }}
            onClick={() => setOnb((p2) => ({ answers: { ...p2.answers, [REVIEW_02_ASK[0].id]: { ...p2.answers[REVIEW_02_ASK[0].id], answered: false } } }))}
          >
            Sửa
          </button>
        </div>
      )}
    </SectionLayout>
  );
}

const capital = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// §03–§05 (same pattern, not drawn) ─────────────────────────────────────
function SectionN({ s, n }) {
  const sec = REVIEW_SECTIONS[n];
  const card = REVIEW_CARDS.find((c) => c.n === n);
  const st = sectionStats(s, n);
  return (
    <SectionLayout
      n={n}
      st={st}
      title={card.title}
      bulk={<BulkButton s={s} n={n} count={st.bulk} />}
      say={sec.say}
      note="Viền nét đứt: Bonia tìm được, bạn chưa xác nhận. Nét liền: đã xác nhận."
    >
      {sec.lead && <div style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--bn-ink-2)" }}>{sec.lead}</div>}
      <div className="lo-rows" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sec.rows.map((r) => (
          <FactRow key={r.id} s={s} row={r} />
        ))}
        {sec.questions.map((q) => (
          <AskBox key={q.id} id={q.id} s={s} text={q.text} options={q.options} />
        ))}
        {sec.locked && <LockedOption variant="row" title={sec.locked} style={{ borderRadius: 10, border: "1px dashed var(--bn-dashed)" }} />}
      </div>
    </SectionLayout>
  );
}
