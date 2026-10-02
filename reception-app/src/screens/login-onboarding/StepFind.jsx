import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button, SourceChip, TextInput } from "../../components/ui/index.js";
import { AI_SOURCES, MATCHES, SEARCH_PROGRESS, SEARCH_TIMELINE } from "../../data/onboarding.js";
import { setOnb } from "./state.js";
import { totals } from "./review.js";
import { Eyebrow, FieldLabel, MONO, RadioDot, SERIF, Title } from "./ui.jsx";

// Step 1 · Tìm: 3.1 A (AI question) · B (form) · C (same names) ·
// D (not found) · E (searching: sources stream in, big counter, no % bar).

const SEARCH_END = SEARCH_TIMELINE[SEARCH_TIMELINE.length - 1].end;
// Shown once a source is read (the frame only draws the first three).
const DONE_DETAIL = { facebook: "lễ tân 24/7", traveloka: "2 loại phòng" };

export function StepFind({ s, frame }) {
  const [, navigate] = useLocation();
  const manual = () => {
    setOnb({ mode: "manual", phase: "form" });
    navigate("/bat-dau/xem-lai");
  };
  const startSearch = () => setOnb({ phase: "searching", searchStartedAt: Date.now(), searchFrozenT: null });

  if (!s.mode) return <AskAi onYes={() => setOnb({ mode: "ai", phase: "form" })} onManual={manual} />;
  if (s.phase === "matches") return <Matches s={s} frame={frame} onPick={startSearch} />;
  if (s.phase === "notfound") return <NotFound frame={frame} onManual={manual} onSearch={startSearch} />;
  if (s.phase === "searching") return <Searching s={s} />;
  return <SearchForm s={s} frame={frame} onManual={manual} />;
}

// 3.1 A ─────────────────────────────────────────────────────────────────
function AskAi({ onYes, onManual }) {
  return (
    <div className="lo-scrim">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lo-ask-title"
        className="lo-ask"
        style={{
          width: 580,
          maxWidth: "calc(100vw - 32px)",
          background: "#fff",
          borderRadius: 20,
          padding: "40px 40px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <Eyebrow>Bắt đầu</Eyebrow>
        <h2
          id="lo-ask-title"
          style={{ margin: 0, fontFamily: SERIF, fontWeight: 400, fontSize: 34, lineHeight: 1.15, letterSpacing: "-0.02em" }}
        >
          Để Bonia tự tìm thông tin khách sạn của bạn trên mạng?
        </h2>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "var(--bn-ink-2)" }}>
          Bonia đọc trang web, Google Maps, Booking.com, Agoda… rồi điền sẵn. Bạn xem lại trước khi Bonia dùng. Bonia chỉ đọc thông tin
          công khai.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["TRANG WEB", "GOOGLE MAPS", "BOOKING.COM", "AGODA", "TRAVELOKA", "FACEBOOK"].map((c) => (
            <SourceChip key={c} style={{ fontSize: 10, padding: "3px 7px" }}>
              {c}
            </SourceChip>
          ))}
        </div>
        <div className="lo-actions" style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Button size="lg" onClick={onYes} style={{ flex: 1.3, padding: 0 }}>
            Có, tìm giúp tôi
          </Button>
          <Button size="lg" variant="secondary" onClick={onManual} style={{ flex: 1, padding: 0 }}>
            Tôi tự điền
          </Button>
        </div>
      </div>
    </div>
  );
}

// 3.1 B ─────────────────────────────────────────────────────────────────
function SearchForm({ s, frame, onManual }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const form = s.form;
  const setForm = (patch) => setOnb((p) => ({ form: { ...p.form, ...patch } }));
  const setLink = (i, v) => setForm({ links: form.links.map((l, j) => (j === i ? v : l)) });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErr("Nhập tên khách sạn để Bonia tìm.");
      return;
    }
    setErr(null);
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      // Sample data knows one hotel; any other name has no result (3.1 D).
      const known = /s[aâ]n\s*nh[aà]i/i.test(form.name);
      setOnb({ phase: known ? "matches" : "notfound" });
    }, 900);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 72 }}>
      <form className="lo-col" onSubmit={submit} style={{ width: 640, display: "flex", flexDirection: "column", gap: 28, paddingBottom: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Eyebrow>Bước 1 · Tìm</Eyebrow>
          <Title className="lo-title">Khách sạn của bạn tên gì?</Title>
        </div>
        <TextInput
          label="Tên khách sạn"
          value={form.name}
          onChange={(v) => setForm({ name: v })}
          height={52}
          fontSize={16}
          error={err}
          style={{ gap: 8 }}
          fieldStyle={{ padding: "0 16px" }}
          autoComplete="organization"
        />
        <TextInput
          label="Địa chỉ hoặc khu vực"
          value={form.area}
          onChange={(v) => setForm({ area: v })}
          height={52}
          fontSize={16}
          focused={frame === "3.1_B"}
          style={{ gap: 8 }}
          fieldStyle={{ padding: "0 16px" }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <FieldLabel note="không bắt buộc">Đường dẫn trang web / Booking.com / Google Maps</FieldLabel>
          {form.links.map((l, i) => (
            <TextInput
              key={i}
              value={l}
              onChange={(v) => setLink(i, v)}
              mono
              height={52}
              fontSize={15}
              placeholder="Ví dụ: maps.app.goo.gl/…"
              aria-label={`Đường dẫn ${i + 1}`}
              inputStyle={{ letterSpacing: 0 }}
              fieldStyle={{ padding: "0 16px" }}
              suffix={
                <button
                  type="button"
                  onClick={() => setForm({ links: form.links.filter((_, j) => j !== i) })}
                  style={{ fontFamily: "var(--bn-sans)", fontSize: 13, color: "var(--bn-muted)" }}
                >
                  Bỏ
                </button>
              }
            />
          ))}
          <button
            type="button"
            className="lo-link"
            onClick={() => setForm({ links: [...form.links, ""] })}
            style={{ height: 36, display: "flex", alignItems: "center", alignSelf: "flex-start" }}
          >
            + Thêm đường dẫn
          </button>
        </div>
        <div className="lo-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          {s.mode === "ai" && !frame && (
            <button type="button" className="lo-link" onClick={onManual} style={{ marginRight: "auto" }}>
              Tôi tự điền
            </button>
          )}
          <Button type="submit" size="lg" loading={busy} style={{ width: 200 }}>
            {busy ? "Đang tìm…" : "Tìm"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// 3.1 C ─────────────────────────────────────────────────────────────────
function Matches({ s, onPick }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 72 }}>
      <div className="lo-col" style={{ width: 720, display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Eyebrow>Bước 1 · Tìm · {MATCHES.length} kết quả</Eyebrow>
          <Title className="lo-title">Khách sạn nào là của bạn?</Title>
        </div>
        <div role="radiogroup" aria-label="Kết quả tìm" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MATCHES.map((m, i) => {
            const on = s.match === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={on}
                className="lo-card-btn"
                onClick={() => setOnb({ match: m.id })}
                style={{
                  display: "flex",
                  gap: 18,
                  alignItems: "center",
                  padding: 16,
                  background: "#fff",
                  border: on ? "2px solid var(--bn-clay)" : "1px solid var(--bn-hairline)",
                  borderRadius: 14,
                }}
              >
                <RadioDot on={on} />
                <Photo kind={m.photo ? (i === 0 ? "label" : "plain") : "none"} />
                <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 14, color: "var(--bn-ink-2)" }}>{m.address}</div>
                  <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", color: "var(--bn-muted)" }}>{m.meta}</div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="lo-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button type="button" className="lo-link" onClick={() => setOnb({ phase: "notfound" })}>
            Không có khách sạn của tôi
          </button>
          <Button size="lg" onClick={onPick} style={{ width: 260 }}>
            Đúng khách sạn của tôi
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Striped placeholder for the hotel photo (README "Assets"). */
function Photo({ kind }) {
  const base = { width: 96, height: 72, borderRadius: 8, flex: "none", fontFamily: MONO, fontSize: 9, color: "var(--bn-muted)" };
  if (kind === "none") {
    return (
      <div style={{ ...base, border: "1px dashed var(--bn-dashed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        KHÔNG CÓ ẢNH
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      style={{
        ...base,
        background: "repeating-linear-gradient(135deg,#EFE9DD 0 8px,#E4DCCB 8px 16px)",
        display: "flex",
        alignItems: "flex-end",
        padding: 5,
      }}
    >
      {kind === "label" ? "ảnh mặt tiền" : null}
    </div>
  );
}

// 3.1 D ─────────────────────────────────────────────────────────────────
function NotFound({ frame, onManual, onSearch }) {
  const [link, setLink] = useState("");
  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 96 }}>
      <form
        className="lo-col"
        onSubmit={(e) => {
          e.preventDefault();
          if (link.trim()) {
            setOnb((p) => ({ form: { ...p.form, links: [...p.form.links.filter(Boolean), link.trim()] } }));
            onSearch();
          } else setOnb({ phase: "form" });
        }}
        style={{ width: 640, display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}
      >
        <Eyebrow>Bước 1 · Tìm · 0 kết quả</Eyebrow>
        <Title className="lo-title" lineHeight={1.15}>
          Bonia chưa tìm thấy khách sạn này.
        </Title>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "var(--bn-ink-2)" }}>
          Thêm đường dẫn, hoặc tự điền. Đường dẫn Google Maps hay Booking.com của khách sạn thường đủ để Bonia tìm.
        </p>
        <TextInput
          label="Đường dẫn"
          value={link}
          onChange={setLink}
          placeholder="Ví dụ: maps.app.goo.gl/…"
          height={52}
          fontSize={15}
          focused={frame === "3.1_D"}
          autoFocus={!frame}
          style={{ gap: 8 }}
          fieldStyle={{ padding: "0 16px" }}
          inputMode="url"
        />
        <div className="lo-actions" style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button size="lg" variant="secondary" onClick={onManual} style={{ width: 180, fontWeight: 400 }}>
            Tôi tự điền
          </Button>
          <Button type="submit" size="lg" style={{ width: 180 }}>
            Tìm lại
          </Button>
        </div>
      </form>
    </div>
  );
}

// 3.1 E ─────────────────────────────────────────────────────────────────
function useTicker(active, ms = 100) {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(() => setN((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [active, ms]);
}

function Searching({ s }) {
  const [, navigate] = useLocation();
  const frozen = s.searchFrozenT != null;
  const t = frozen ? s.searchFrozenT : (Date.now() - (s.searchStartedAt || Date.now())) / 1000;
  const finished = t >= SEARCH_END;
  useTicker(!frozen && !finished);

  // Facts found so far: each source adds its count while it is being read.
  let found = 0;
  let current = SEARCH_TIMELINE.length;
  SEARCH_TIMELINE.forEach((x, i) => {
    const p = Math.min(1, Math.max(0, (t - x.start) / (x.end - x.start)));
    found += Math.floor(x.count * p + 1e-9);
    if (t < x.end && current === SEARCH_TIMELINE.length) current = i;
  });
  const total = totals(s).found;

  const rows = AI_SOURCES.map((src, i) => {
    const tl = SEARCH_TIMELINE[i];
    let st = "waiting";
    if (t >= tl.end) st = tl.count ? "read" : "notFound";
    else if (t >= tl.start) st = "reading";
    return { ...src, st, detail: st === "read" ? src.detail || DONE_DETAIL[src.id] || "" : "" };
  }).filter((_, i) => i <= current + 1);

  return (
    <div
      className="lo-grid"
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, padding: "88px 140px 40px" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }} aria-live="polite">
        <Eyebrow>{finished ? `Đã tìm xong · ${total} thông tin` : `Đang tìm · ${SEARCH_PROGRESS.eta}`}</Eyebrow>
        <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 30, lineHeight: 1.2 }}>Bonia đã tìm được</div>
        <div
          className="lo-hero"
          style={{
            fontFamily: SERIF,
            fontWeight: 300,
            fontSize: 168,
            lineHeight: 0.9,
            letterSpacing: "-0.04em",
            color: "var(--bn-clay)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {found}
        </div>
        <div style={{ fontFamily: SERIF, fontWeight: 300, fontSize: 30 }}>thông tin</div>
        {finished ? (
          <div className="lo-in" style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 16, maxWidth: 420 }}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--bn-ink-2)" }}>
              Bonia chưa dùng thông tin nào cho tới khi bạn xem lại.
            </p>
            <Button size="lg" onClick={() => navigate("/bat-dau/xem-lai")} style={{ width: 240 }}>
              Xem lại {total} thông tin
            </Button>
          </div>
        ) : (
          <p style={{ margin: "16px 0 0", fontSize: 15, lineHeight: 1.6, color: "var(--bn-ink-2)", maxWidth: 420 }}>
            Bạn có thể làm việc khác rồi quay lại. Bonia giữ mọi thứ đã tìm được.
          </p>
        )}
      </div>
      <ul
        className="lo-sources"
        aria-label="Nguồn"
        style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", borderTop: "1px solid var(--bn-hairline)", alignSelf: "start" }}
      >
        {rows.map((r) => (
          <SourceRow key={r.id} r={r} animate={!frozen} />
        ))}
      </ul>
    </div>
  );
}

function SourceRow({ r, animate }) {
  const muted = r.st === "notFound" || r.st === "waiting";
  const tag = { fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em" };
  return (
    <li
      className={animate ? "lo-in" : undefined}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        height: 64,
        borderBottom: r.st === "waiting" ? 0 : r.st === "reading" ? "1px dashed var(--bn-dashed)" : "1px solid var(--bn-hairline)",
        fontSize: 15,
        color: muted ? "var(--bn-muted)" : undefined,
        opacity: r.st === "waiting" ? 0.7 : 1,
      }}
    >
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {r.label}
        {r.detail && <span style={{ color: "var(--bn-muted)" }}> · {r.detail}</span>}
      </span>
      {r.st === "read" && <span style={{ ...tag, color: "var(--bn-ok)", whiteSpace: "nowrap" }}>✓ ĐÃ ĐỌC</span>}
      {r.st === "notFound" && <span style={{ ...tag, whiteSpace: "nowrap" }}>— KHÔNG TÌM THẤY</span>}
      {r.st === "waiting" && <span style={tag}>CHỜ</span>}
      {r.st === "reading" && (
        <span style={{ ...tag, display: "flex", alignItems: "center", gap: 8, color: "var(--bn-clay)", whiteSpace: "nowrap" }}>
          <span
            className="lo-spin"
            style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #E4DCCB", borderTopColor: "var(--bn-clay)", display: "block" }}
          />
          ĐANG ĐỌC
        </span>
      )}
    </li>
  );
}
