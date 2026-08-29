import React, { useState, useEffect } from "react";
import HuongDan from "./HuongDan";
import { LangProvider, useLang, LangToggle } from "./lang.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// Real store URLs (live as of 2026-05-06: iOS Build 22, Play Console v3).
const APP_STORE_URL = "https://apps.apple.com/vn/app/bonia/id6761518423";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=net.bonia.app&pcampaignid=web_share";

// Design tokens (clay accent, softened navy CTA)
// ─────────────────────────────────────────────────────────────────────────────
const ACC = "#7B4A2D"; // clay (primary)
const ACC2_WARM = "#9C6D4E"; // muted amber (CTA accent)
const BG = "#F2EEE6";

// ─────────────────────────────────────────────────────────────────────────────
// Inline icons (1.5px stroke, currentColor)
// ─────────────────────────────────────────────────────────────────────────────
const Icon = ({
  d,
  size = 16,
  className = "",
  stroke = 1.5,
  fill = "none",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const IconArrow = (p) => <Icon {...p} d="M5 12h14M13 6l6 6-6 6" />;
const IconShield = (p) => (
  <Icon {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
);
const IconQuote = (p) => (
  <Icon
    {...p}
    d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h2c1 0 1 0 1 1v1c0 1-1 2-2 2H3v4ZM15 21c3 0 7-1 7-8V5c0-1.25-.757-2-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h2c1 0 1 0 1 1v1c0 1-1 2-2 2h-2v4Z"
  />
);
const IconCheck = (p) => <Icon {...p} d="M20 6 9 17l-5-5" />;
const IconX = (p) => <Icon {...p} d="M18 6 6 18M6 6l12 12" />;

// ─────────────────────────────────────────────────────────────────────────────
// Vietnamese copy (preserved verbatim from design)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Hero transcript scenes (5 cycling)
// ─────────────────────────────────────────────────────────────────────────────
const TRANSCRIPTS = [
  {
    label: "Shipper · 14:32",
    tag: "Quan trọng",
    lines: [
      { who: "b", text: "Dạ alo, mình gọi có việc gì ạ?" },
      {
        who: "t",
        text: "Em là shipper Giao Hàng Tiết Kiệm, đang ở dưới nhà chị.",
      },
      {
        who: "b",
        text: "Dạ chị Nhiên đang dở tay xíu. Đơn này bao nhiêu vậy ạ?",
      },
      { who: "t", text: "Đơn 198 nghìn, chị xuống lấy liền giùm em nha." },
      { who: "b", text: "Dạ rồi, để em báo chị Nhiên xuống lấy liền nha." },
    ],
  },
  {
    label: "Nhân sự · 10:15",
    tag: "Cần gọi lại",
    lines: [
      { who: "b", text: "Dạ alo, mình gọi có việc gì ạ?" },
      {
        who: "t",
        text: "Tôi là Linh, phòng nhân sự công ty XYZ. Muốn hẹn anh phỏng vấn.",
      },
      {
        who: "b",
        text: "Dạ anh Duy đang dở tay xíu, chị đề xuất thời gian nào em báo lại cho ạ?",
      },
      { who: "t", text: "Thứ Sáu này, 9 giờ sáng, văn phòng quận 1." },
      { who: "b", text: "Dạ em ghi nhận rồi ạ, lát em báo lại anh Duy ngay." },
    ],
  },
  {
    label: "Tiếp thị · 16:48",
    tag: "Đã chặn",
    lines: [
      { who: "b", text: "Dạ alo, mình gọi có việc gì ạ?" },
      {
        who: "t",
        text: "Em chào anh, em bên bảo hiểm nhân thọ ABC, em muốn giới thiệu…",
      },
      { who: "b", text: "À dạ bên em không có nhu cầu nha, em cảm ơn." },
      { who: "t", text: "Dạ vâng, cảm ơn anh." },
      { who: "b", text: "Dạ chào anh." },
    ],
  },
  {
    label: "Cô giáo · 09:02",
    tag: "Quan trọng",
    lines: [
      { who: "b", text: "Dạ alo, mình gọi có việc gì ạ?" },
      {
        who: "t",
        text: "Em là cô giáo lớp Tiếng Anh của bé Vân. Bé để quên cặp ở lớp.",
      },
      {
        who: "b",
        text: "Dạ chị Nhiên đang dở tay xíu. Con cần lấy ngay bây giờ hay để hôm sau ạ?",
      },
      { who: "t", text: "Cô giữ ở văn phòng, lúc nào tiện thì sang lấy." },
      {
        who: "b",
        text: "Dạ em ghi nhận rồi á, lát em báo chị Nhiên gọi lại cô nha.",
      },
    ],
  },
  {
    label: "Số lạ · 20:11",
    tag: "Đã chặn",
    lines: [
      { who: "b", text: "Dạ alo, mình tìm ai ạ?" },
      { who: "t", text: "…" },
      { who: "b", text: "Ủa alo, mình gọi có việc gì không ạ?" },
      { who: "t", text: "(không trả lời)" },
      { who: "b", text: "Dạ em xin phép tắt máy nha." },
    ],
  },
];

function useSceneCycle(intervalMs = 5800) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setI((x) => (x + 1) % TRANSCRIPTS.length),
      intervalMs,
    );
    return () => clearInterval(t);
  }, [intervalMs]);
  return [i, setI];
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable pieces
// ─────────────────────────────────────────────────────────────────────────────
function SceneDots({ active, accent = ACC }) {
  return (
    <div className="flex items-center gap-1.5">
      {TRANSCRIPTS.map((_, i) => (
        <span
          key={i}
          className="scene-dot"
          style={{ background: i === active ? accent : "#D9D0BF" }}
        />
      ))}
    </div>
  );
}

function TranscriptCard({ idx }) {
  const t = TRANSCRIPTS[idx];
  const [shown, setShown] = useState(t.lines.length);
  useEffect(() => {
    setShown(0);
    let n = 0;
    let timer;
    const tick = () => {
      n += 1;
      setShown(n);
      if (n < t.lines.length) timer = setTimeout(tick, 600);
    };
    timer = setTimeout(tick, 300);
    return () => clearTimeout(timer);
  }, [idx]);
  const tagColor = t.tag === "Đã chặn" ? "#7A6F62" : ACC;
  return (
    <div
      className="bg-white border w-full max-w-md"
      style={{ borderColor: "#D9D0BF" }}
    >
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: "#EFE9DD" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: tagColor }}
          />
          <span className="text-[12px] ff-mono" style={{ color: "#4A4239" }}>
            {t.label}
          </span>
        </div>
        <span
          className="text-[10px] uppercase tracking-[0.2em]"
          style={{ color: tagColor }}
        >
          {t.tag}
        </span>
      </div>
      <div className="p-5 space-y-2.5 min-h-[360px] sm:min-h-[300px]">
        {t.lines.slice(0, shown).map((l, i) => (
          <div
            key={i}
            className={`flex ${l.who === "b" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[78%] px-3.5 py-2 text-[14px] leading-snug ${
                l.who === "b" ? "bubble-you" : "bubble-them"
              }`}
            >
              {l.text}
            </div>
          </div>
        ))}
        {shown < t.lines.length && (
          <div className="flex justify-end">
            <div className="bubble-you px-3.5 py-2.5 inline-flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
              <span
                className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          </div>
        )}
      </div>
      <div
        className="px-5 py-3 border-t flex items-center justify-between text-[11px]"
        style={{ borderColor: "#EFE9DD", color: "#7A6F62" }}
      >
        <span className="uppercase tracking-[0.18em]">Bản ghi tự động</span>
        <span className="ff-mono">2:14</span>
      </div>
    </div>
  );
}

function CallListPhone({ accent = ACC }) {
  const calls = [
    {
      name: "Linh — NS XYZ",
      desc: "Hẹn phỏng vấn thứ Sáu 9:00",
      time: "10:15",
      tag: "Quan trọng",
    },
    {
      name: "Shipper GHTK",
      desc: "Đơn 198k, đang dưới nhà",
      time: "14:32",
      tag: "Quan trọng",
    },
    {
      name: "Cô giáo lớp con",
      desc: "Con quên cặp ở lớp",
      time: "09:02",
      tag: "Quan trọng",
    },
    {
      name: "+84 28 xxx xxx",
      desc: "Tiếp thị bảo hiểm ABC",
      time: "16:48",
      tag: "Đã chặn",
    },
    {
      name: "+84 9x xxx xxx",
      desc: "Robocall — không rõ",
      time: "20:11",
      tag: "Đã chặn",
    },
    {
      name: "Anh Tuấn — đối tác",
      desc: "Hỏi về hợp đồng tháng 6",
      time: "Hôm qua",
      tag: "Cần gọi lại",
    },
  ];
  return (
    <div className="iphone">
      <div className="iphone-screen" style={{ background: "#FAF7F2" }}>
        <div className="iphone-notch" />
        <div
          className="absolute top-0 left-0 right-0 px-7 pt-4 flex justify-between text-[11px] font-medium z-20"
          style={{ color: "#1F1B16" }}
        >
          <span>9:41</span>
          <span>5G ●●●●</span>
        </div>
        <div className="pt-12 px-4 h-full flex flex-col">
          <div
            className="flex items-center justify-between pb-3 border-b"
            style={{ borderColor: "#E5DDCC" }}
          >
            <span
              className="text-[18px] font-semibold ff-serif"
              style={{ color: "#1F1B16" }}
            >
              Hôm nay
            </span>
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs"
              style={{ background: accent }}
            >
              B
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            {calls.map((c, i) => (
              <div
                key={i}
                className="py-2.5 border-b flex gap-2.5 items-start"
                style={{ borderColor: "#EFE9DD" }}
              >
                <span
                  className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: c.tag === "Đã chặn" ? "#C9C0AE" : accent,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className="text-[12px] font-medium truncate"
                      style={{ color: "#1F1B16" }}
                    >
                      {c.name}
                    </span>
                    <span className="text-[10px]" style={{ color: "#7A6F62" }}>
                      {c.time}
                    </span>
                  </div>
                  <div
                    className="text-[11px] truncate"
                    style={{ color: "#4A4239" }}
                  >
                    {c.desc}
                  </div>
                  <div
                    className="text-[9px] uppercase tracking-wider mt-0.5"
                    style={{ color: c.tag === "Đã chặn" ? "#7A6F62" : accent }}
                  >
                    {c.tag}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopNav({ accent = ACC }) {
  const { copy: COPY, chrome } = useLang();
  return (
    <nav
      className="flex items-center justify-between py-6 px-6 sm:px-12 border-b"
      style={{ borderColor: "#D9D0BF" }}
    >
      <a href="#hero" className="flex items-center gap-2.5 group">
        <img src="/logo-mark.png" alt="Bonia" className="h-9 w-auto" />
        <span
          className="text-[22px] font-medium tracking-tight ff-serif"
          style={{ color: "#1F1B16" }}
        >
          Bonia
        </span>
        <span
          className="text-[11px] uppercase tracking-[0.22em] ml-1 hidden sm:inline"
          style={{ color: "#4A4239" }}
        >
          {chrome.navTag}
        </span>
      </a>
      <div className="hidden md:flex items-center gap-8">
        {COPY.nav.map((n, i) => (
          <a
            key={i}
            href={i === 0 ? "#solution" : i === 1 ? "#huong-dan" : "#faq"}
            className="text-[14px] transition-colors hover:opacity-100"
            style={{ color: "#4A4239" }}
          >
            {n}
          </a>
        ))}
        {/* Unlike the others this leaves the page, so it is a real href rather
            than a hash anchor. Kept in the tab row (not styled as a CTA) so it
            does not compete with "Tải app". */}
        <a
          href="/business"
          className="text-[14px] transition-colors hover:opacity-100"
          style={{ color: "#4A4239" }}
        >
          {chrome.navBusiness}
        </a>
        <a
          href="#cta"
          className="text-[14px] font-medium flex items-center gap-1.5"
          style={{ color: accent }}
        >
          {chrome.navCta} <IconArrow size={12} />
        </a>
        <LangToggle accent={accent} />
      </div>
      <div className="md:hidden flex items-center gap-3">
        <LangToggle accent={accent} />
        {/* Short label here: the full "Bonia Business" pushes this row past the
            viewport on a 360px phone once the toggle and CTA are counted. */}
        <a
          href="/business"
          className="text-[14px] whitespace-nowrap"
          style={{ color: "#4A4239" }}
        >
          {chrome.navBusinessShort}
        </a>
        <a
          href="#cta"
          className="text-[14px] font-medium flex items-center gap-1.5"
          style={{ color: accent }}
        >
          {chrome.navCta} <IconArrow size={12} />
        </a>
      </div>
    </nav>
  );
}

function SectionHead({
  eyebrow,
  title,
  sub,
  accent = ACC,
  kicker,
  align = "left",
}) {
  const isCenter = align === "center";
  return (
    <header className={`max-w-3xl ${isCenter ? "mx-auto text-center" : ""}`}>
      <div
        className={`flex items-baseline gap-3 mb-6 ${isCenter ? "justify-center" : ""}`}
      >
        {kicker && (
          <span className="text-[12px] ff-mono" style={{ color: accent }}>
            {kicker}
          </span>
        )}
        <span
          className="text-[11px] uppercase tracking-[0.22em]"
          style={{ color: "#7A6F62" }}
        >
          {eyebrow}
        </span>
      </div>
      <h2
        className="text-[36px] sm:text-[44px] md:text-[52px] leading-[1.05] tracking-tight ff-serif"
        style={{ color: "#1F1B16", fontWeight: 400 }}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={`mt-5 text-[17px] sm:text-[18px] leading-relaxed max-w-2xl ${isCenter ? "mx-auto" : ""}`}
          style={{ color: "#4A4239" }}
        >
          {sub}
        </p>
      )}
    </header>
  );
}

// Store badges — editorial style matching the cream/serif aesthetic instead of
// using Apple/Google's plastic stock badges. Two visual variants:
//   "light" — cream paper, dark ink (use over BG sections, e.g. hero)
//   "dark"  — translucent surface, light ink (use over the navy CTA gradient)
function StoreBadges({ variant = "light", size = "md" }) {
  const { chrome } = useLang();
  const isDark = variant === "dark";
  const surface = isDark
    ? "bg-white/[0.06] border border-white/15 hover:bg-white/[0.10]"
    : "bg-white border border-[#D9D0BF] hover:border-[#1F1B16]/40";
  const ink = isDark ? "text-white" : "text-[#1F1B16]";
  const sub = isDark ? "text-white/55" : "text-[#7A6F62]";
  const pad = size === "sm" ? "px-4 py-2.5" : "px-5 py-3";
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener"
        aria-label="Tải Bonia trên App Store"
        className={`group flex items-center gap-3 ${pad} ${surface} transition-colors`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className={ink}>
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
        <div className="flex flex-col items-start leading-none">
          <span className={`text-[10px] uppercase tracking-[0.18em] ${sub}`}>{chrome.storeBadgeLead}</span>
          <span className={`text-[16px] ff-serif mt-0.5 ${ink}`} style={{ fontWeight: 500 }}>
            App Store
          </span>
        </div>
      </a>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener"
        aria-label="Tải Bonia trên Google Play"
        className={`group flex items-center gap-3 ${pad} ${surface} transition-colors`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" className={ink}>
          <path
            d="M3.6 2.3c-.4.3-.6.7-.6 1.3v17c0 .5.2 1 .6 1.3l9.6-9.9-9.6-9.7zM14.4 13.2l2.6 2.7-11.5 6.5 8.9-9.2zM14.4 11l-8.9-9.2 11.5 6.6-2.6 2.6zM18.5 9.7l3.1 1.8c.7.4.7 1.4 0 1.8l-3.1 1.8-2.9-3 2.9-2.4z"
            fill="currentColor"
          />
        </svg>
        <div className="flex flex-col items-start leading-none">
          <span className={`text-[10px] uppercase tracking-[0.18em] ${sub}`}>{chrome.storeBadgeLead}</span>
          <span className={`text-[16px] ff-serif mt-0.5 ${ink}`} style={{ fontWeight: 500 }}>
            Google Play
          </span>
        </div>
      </a>
    </div>
  );
}

function FAQList({ items, accent = ACC, columns = 2 }) {
  const half = Math.ceil(items.length / columns);
  const cols = Array.from({ length: columns }, (_, c) =>
    items.slice(c * half, c * half + half),
  );
  return (
    <div
      className={`grid grid-cols-1 ${columns === 2 ? "md:grid-cols-2" : ""} gap-x-12 gap-y-0`}
    >
      {cols.map((col, ci) => (
        <div key={ci}>
          {col.map((it, i) => (
            <details
              key={i}
              className="border-b py-5"
              style={{ borderColor: "#D9D0BF" }}
            >
              <summary className="flex items-baseline gap-4 group">
                <span
                  className="text-[12px] ff-mono mt-1"
                  style={{ color: "#7A6F62" }}
                >
                  {String(ci * half + i + 1).padStart(2, "0")}
                </span>
                <span
                  className="flex-1 text-[16px] sm:text-[17px] leading-snug ff-serif"
                  style={{ color: "#1F1B16" }}
                >
                  {it.q}
                </span>
                <span
                  className="text-base mt-1 transition-transform group-open:rotate-45"
                  style={{ color: accent }}
                >
                  +
                </span>
              </summary>
              <p
                className="ml-10 mt-3 text-[14px] sm:text-[15px] leading-relaxed"
                style={{ color: "#4A4239" }}
              >
                {it.a}
              </p>
            </details>
          ))}
        </div>
      ))}
    </div>
  );
}

function PageFooter({ accent = ACC }) {
  const { copy: COPY, chrome } = useLang();
  return (
    <footer
      className="border-t px-6 sm:px-12 py-10"
      style={{ borderColor: "#D9D0BF" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Brand block: logo + legal identity, nothing else (layout per
            product 2026-08-04 — the link list grew, so the links split
            into two columns on the right). */}
        <div className="md:col-span-6">
          <div className="flex items-center gap-2.5 mb-4">
            <img src="/logo-mark.png" alt="Bonia" className="h-8 w-auto" />
            <span
              className="text-[18px] font-medium ff-serif"
              style={{ color: "#1F1B16" }}
            >
              Bonia
            </span>
          </div>
          <div
            className="text-[13px] leading-relaxed max-w-sm"
            style={{ color: "#4A4239" }}
          >
            <div>{COPY.footer.company}</div>
            <div>{COPY.footer.addr}</div>
            <div className="mt-1 ff-mono text-[12px]">{COPY.footer.mst}</div>
          </div>
        </div>
        <div className="md:col-span-6">
          <div
            className="text-[11px] uppercase tracking-[0.18em] mb-3"
            style={{ color: "#7A6F62" }}
          >
            {chrome.footerLinksLabel}
          </div>
          <div className="grid grid-cols-2 gap-x-8">
            <ul
              className="text-[13px] leading-[1.9]"
              style={{ color: "#4A4239" }}
            >
              <li>
                <a href="/privacy.html" className="hover:underline">
                  {chrome.links.privacy}
                </a>
              </li>
              <li>
                <a href="/terms.html" className="hover:underline">
                  {chrome.links.terms}
                </a>
              </li>
              <li>
                <a href="/so-chinh-thuc.html" className="hover:underline">
                  {chrome.links.officialNumbers}
                </a>
              </li>
            </ul>
            <ul
              className="text-[13px] leading-[1.9]"
              style={{ color: "#4A4239" }}
            >
              <li>
                <a href="/support.html" className="hover:underline">
                  {chrome.links.support}
                </a>
              </li>
              <li>
                <a href="/delete-account.html" className="hover:underline">
                  {chrome.links.deleteAccount}
                </a>
              </li>
              <li>
                <a href="mailto:duynguyen@bonia.net" className="hover:underline">
                  {chrome.links.contact}
                </a>
              </li>
              {/* Bonia Business — the partner portal has its own privacy
                  policy and terms, because reps are a different audience
                  with different obligations from app users. */}
              <li className="pt-2">
                <a href="/app" className="hover:underline font-medium">
                  {chrome.links.business}
                </a>
              </li>
              <li>
                <a href="/privacy-business.html" className="hover:underline">
                  {chrome.links.businessPrivacy}
                </a>
              </li>
              <li>
                <a href="/terms-business.html" className="hover:underline">
                  {chrome.links.businessTerms}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div
        className="mt-8 pt-5 border-t text-[12px]"
        style={{ borderColor: "#D9D0BF", color: "#7A6F62" }}
      >
        {COPY.footer.rights}
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sections
// ─────────────────────────────────────────────────────────────────────────────
function Hero() {
  const { copy: COPY } = useLang();
  const [i] = useSceneCycle(5800);
  return (
    <section id="hero" style={{ background: BG }}>
      <TopNav accent={ACC} />
      <div className="px-6 sm:px-12 pt-12 sm:pt-16 pb-20 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-7 lg:pt-8">
            <div className="mb-7">
              <span
                className="text-[11px] uppercase tracking-[0.22em]"
                style={{ color: "#7A6F62" }}
              >
                {COPY.hero.eyebrow}
              </span>
            </div>
            <h1
              className="text-[40px] sm:text-[52px] lg:text-[64px] xl:text-[72px] leading-[1.05] tracking-tight ff-serif"
              style={{ color: "#1F1B16", fontWeight: 400 }}
            >
              <span className="block">{COPY.hero.title}</span>
              <span
                className="block mt-2"
                style={{ color: ACC, fontStyle: "italic", fontWeight: 380 }}
              >
                {COPY.hero.titleAccent}
              </span>
            </h1>
            <p
              className="mt-7 text-[17px] sm:text-[18px] leading-[1.65] max-w-md"
              style={{ color: "#4A4239" }}
            >
              {COPY.hero.sub}
            </p>
            <div className="mt-9">
              <StoreBadges variant="light" />
              <div
                className="mt-4 flex items-center gap-2 text-[13px]"
                style={{ color: "#7A6F62" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: ACC }}
                />
                <span>{COPY.hero.storesNote}</span>
              </div>
            </div>
            <div
              className="mt-12 pt-5 border-t flex items-center justify-between max-w-sm"
              style={{ borderColor: "#D9D0BF" }}
            >
              <span
                className="text-[11px] uppercase tracking-[0.2em]"
                style={{ color: "#7A6F62" }}
              >
                Cuộc thoại {String(i + 1).padStart(2, "0")} / 05
              </span>
              <SceneDots active={i} accent={ACC} />
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <TranscriptCard idx={i} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  const { copy: COPY, chrome } = useLang();
  return (
    <section
      id="problem"
      className="px-6 sm:px-12 py-20 sm:py-24"
      style={{ background: "#fff" }}
    >
      <SectionHead
        eyebrow={COPY.problem.eyebrow}
        title={COPY.problem.title}
        sub={COPY.problem.sub}
        accent={ACC}
        kicker="№ 02"
      />
      <div className="mt-14 sm:mt-16 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="relative pt-8">
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "#D9D0BF" }}
          />
          <div className="flex items-baseline gap-3 mb-6">
            <span
              className="text-[11px] ff-mono uppercase tracking-[0.2em]"
              style={{ color: "#7A6F62" }}
            >
              {chrome.colA}
            </span>
            <span
              className="text-[14px] sm:text-[15px] uppercase tracking-[0.18em]"
              style={{ color: "#7A6F62" }}
            >
              {COPY.problem.spam.label}
            </span>
          </div>
          <ul className="space-y-0">
            {COPY.problem.spam.items.map((it, i) => (
              <li
                key={i}
                className="flex items-baseline gap-4 py-4 border-b"
                style={{ borderColor: "#EFE9DD" }}
              >
                <IconX size={14} className="opacity-50 mt-0.5" />
                <span
                  className="text-[17px] sm:text-[19px] ff-serif"
                  style={{ color: "#4A4239", fontWeight: 380 }}
                >
                  {it}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative pt-8">
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: ACC }}
          />
          <div className="flex items-baseline gap-3 mb-6">
            <span
              className="text-[11px] ff-mono uppercase tracking-[0.2em]"
              style={{ color: ACC }}
            >
              {chrome.colB}
            </span>
            <span
              className="text-[14px] sm:text-[15px] uppercase tracking-[0.18em]"
              style={{ color: ACC }}
            >
              {COPY.problem.important.label}
            </span>
          </div>
          <ul className="space-y-0">
            {COPY.problem.important.items.map((it, i) => (
              <li
                key={i}
                className="flex items-baseline gap-4 py-4 border-b"
                style={{ borderColor: "#EFE9DD" }}
              >
                <IconCheck
                  size={14}
                  style={{ color: ACC }}
                  className="mt-0.5"
                />
                <span
                  className="text-[17px] sm:text-[19px] ff-serif"
                  style={{ color: "#1F1B16", fontWeight: 400 }}
                >
                  {it}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p
        className="mt-12 sm:mt-14 max-w-2xl text-[15px] sm:text-[16px] leading-relaxed italic ff-serif"
        style={{ color: "#4A4239" }}
      >
        {chrome.problemQuote}
      </p>
    </section>
  );
}

function Solution() {
  const { copy: COPY } = useLang();
  return (
    <section
      id="solution"
      className="px-6 sm:px-12 py-20 sm:py-24"
      style={{ background: BG }}
    >
      <SectionHead
        eyebrow={COPY.solution.eyebrow}
        title={COPY.solution.title}
        sub={COPY.solution.sub}
        accent={ACC}
        kicker="№ 03"
      />
      <div className="mt-14 sm:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        <div className="lg:col-span-7">
          <ol className="space-y-0">
            {COPY.solution.features.map((f, i) => (
              <li
                key={i}
                className="grid grid-cols-12 gap-4 sm:gap-6 py-6 sm:py-7 border-b"
                style={{ borderColor: "#D9D0BF" }}
              >
                <span
                  className="col-span-2 sm:col-span-1 ff-mono text-[13px] mt-1"
                  style={{ color: ACC }}
                >
                  0{i + 1}
                </span>
                <div className="col-span-10 sm:col-span-11">
                  <h3
                    className="text-[20px] sm:text-[22px] leading-tight ff-serif"
                    style={{ color: "#1F1B16", fontWeight: 500 }}
                  >
                    {f.title}
                  </h3>
                  <p
                    className="mt-2 text-[15px] sm:text-[16px] leading-relaxed max-w-xl"
                    style={{ color: "#4A4239" }}
                  >
                    {f.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="lg:col-span-5 flex justify-center lg:sticky lg:top-8">
          <div className="relative">
            <CallListPhone accent={ACC} />
            <div
              className="absolute -bottom-8 left-0 right-0 text-center text-[11px] uppercase tracking-[0.22em]"
              style={{ color: "#7A6F62" }}
            >
              Danh sách cuộc gọi — Bonia
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { copy: COPY } = useLang();
  return (
    <section
      id="how"
      className="px-6 sm:px-12 py-20 sm:py-24"
      style={{ background: "#fff" }}
    >
      <SectionHead
        eyebrow={COPY.how.eyebrow}
        title={COPY.how.title}
        accent={ACC}
        kicker="№ 04"
      />
      <div className="mt-14 sm:mt-16 relative">
        {/* Horizontal hairline connecting the 3 circles (desktop only) */}
        <div
          className="hidden md:block absolute top-7 left-[16.66%] right-[16.66%] h-px"
          style={{ background: "#D9D0BF" }}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {COPY.how.steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-[15px] ff-mono mb-6 relative z-10"
                style={{
                  background: "#fff",
                  color: ACC,
                  border: "1px solid #D9D0BF",
                }}
              >
                {s.n}
              </div>
              <h3
                className="text-[22px] sm:text-[24px] leading-snug ff-serif"
                style={{ color: "#1F1B16", fontWeight: 500 }}
              >
                {s.title}
              </h3>
              <p
                className="mt-3 text-[15px] sm:text-[16px] leading-relaxed max-w-xs"
                style={{ color: "#4A4239" }}
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Examples() {
  const { copy: COPY } = useLang();
  // Per-card accent color, chosen as muted earth tones to fit the editorial palette
  const COLORS = {
    Telesales: "#A04545", // muted rust — call rejected
    Shipper: "#7B4A2D", // clay — urgent action
    "Nhà tuyển dụng": "#3B5269", // muted blue — important
  };
  return (
    <section
      id="examples"
      className="px-6 sm:px-12 py-20 sm:py-24"
      style={{ background: BG }}
    >
      <SectionHead
        eyebrow={COPY.examples.eyebrow}
        title={COPY.examples.title}
        accent={ACC}
        kicker="№ 05"
      />
      <div className="mt-12 sm:mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {COPY.examples.cards.map((c, i) => {
          const cardColor = COLORS[c.kind] || ACC;
          return (
            <figure
              key={i}
              className="bg-white border p-6 flex flex-col relative overflow-hidden"
              style={{ borderColor: "#D9D0BF" }}
            >
              {/* Top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ background: cardColor }}
              />
              <div
                className="flex items-center justify-between pb-4 mb-4 border-b"
                style={{ borderColor: "#EFE9DD" }}
              >
                <span
                  className="text-[11px] uppercase tracking-[0.18em] font-medium"
                  style={{ color: cardColor }}
                >
                  {c.kind}
                </span>
                <span
                  className="text-[11px] ff-mono"
                  style={{ color: "#7A6F62" }}
                >
                  {c.time}
                </span>
              </div>
              <div className="mb-3" style={{ color: cardColor }}>
                <IconQuote size={20} />
              </div>
              <blockquote
                className="flex-1 text-[17px] sm:text-[18px] leading-[1.5] ff-serif"
                style={{ color: "#1F1B16", fontWeight: 380 }}
              >
                "{c.quote}"
              </blockquote>
              <figcaption
                className="mt-5 pt-4 border-t text-[12px] flex items-center gap-2"
                style={{ borderColor: "#EFE9DD", color: "#7A6F62" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: cardColor }}
                />
                {c.meta}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

function FAQSection() {
  const { copy: COPY, chrome } = useLang();
  return (
    <section
      id="faq"
      className="px-6 sm:px-12 py-20 sm:py-24"
      style={{ background: "#fff" }}
    >
      <SectionHead
        eyebrow={COPY.concerns.eyebrow}
        title={COPY.concerns.title}
        accent={ACC}
        kicker="№ 06"
        align="center"
      />

      {/* Top 3 concerns — exposed as cards with answers visible */}
      <div className="mt-14 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
        {COPY.concerns.items.map((it, i) => (
          <article
            key={i}
            className="bg-white border p-7 flex flex-col"
            style={{ borderColor: "#D9D0BF" }}
          >
            <div
              className="text-[11px] ff-mono uppercase tracking-[0.2em] mb-4"
              style={{ color: ACC }}
            >
              {chrome.concernWord} {String(i + 1).padStart(2, "0")}
            </div>
            <h3
              className="text-[20px] sm:text-[22px] leading-snug ff-serif"
              style={{ color: "#1F1B16", fontWeight: 500 }}
            >
              {it.q}
            </h3>
            <p
              className="mt-4 text-[14px] sm:text-[15px] leading-relaxed flex-1"
              style={{ color: "#4A4239" }}
            >
              {it.a}
            </p>
          </article>
        ))}
      </div>

      {/* Privacy preamble — two commitments, balanced 2-col */}
      <div className="mt-20 sm:mt-24 max-w-5xl mx-auto">
        <div
          className="text-center text-[11px] uppercase tracking-[0.22em] mb-8"
          style={{ color: "#7A6F62" }}
        >
          {chrome.privacyTag}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {COPY.privacy.items.map((p, i) => (
            <div
              key={i}
              className="border-t-2 pt-5 text-center flex flex-col items-center"
              style={{ borderColor: ACC }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <IconShield size={14} style={{ color: ACC }} />
                <span
                  className="text-[11px] uppercase tracking-[0.18em]"
                  style={{ color: ACC }}
                >
                  {i === 0 ? chrome.privacyWord : chrome.trustWord}
                </span>
              </div>
              <h4
                className="text-[17px] sm:text-[18px] ff-serif leading-snug max-w-xs"
                style={{ color: "#1F1B16", fontWeight: 500 }}
              >
                {p.title}
              </h4>
              <p
                className="mt-2 text-[14px] leading-relaxed max-w-sm"
                style={{ color: "#4A4239" }}
              >
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Full FAQ list */}
      <div className="mt-20 sm:mt-24 max-w-6xl mx-auto">
        <div className="flex items-baseline gap-3 justify-center mb-10">
          <span className="text-[12px] ff-mono" style={{ color: ACC }}>
            № 06.2
          </span>
          <span
            className="text-[11px] uppercase tracking-[0.22em]"
            style={{ color: "#7A6F62" }}
          >
            {COPY.faq.eyebrow}
          </span>
        </div>
        <FAQList items={COPY.faq.items} accent={ACC} columns={2} />
      </div>
    </section>
  );
}

function FinalCTA() {
  const { copy: COPY } = useLang();
  return (
    <section
      id="cta"
      className="px-6 sm:px-12 py-20 sm:py-24 relative overflow-hidden navy-grad"
    >
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(transparent 95%, rgba(255,255,255,0.4) 95%), linear-gradient(90deg, transparent 95%, rgba(255,255,255,0.4) 95%)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="relative max-w-5xl mx-auto text-center">
        <span className="text-[11px] uppercase tracking-[0.22em] text-white/55">
          № 07 — {COPY.cta.eyebrow}
        </span>
        <h2
          className="mt-5 text-[40px] sm:text-[52px] lg:text-[72px] leading-[1.04] tracking-tight text-white ff-serif"
          style={{ fontWeight: 400 }}
        >
          {COPY.cta.titleLead}
          <br className="sm:hidden" />{" "}
          <span
            style={{ color: ACC2_WARM, fontStyle: "italic", fontWeight: 380 }}
          >
            {COPY.cta.titleAccent}
          </span>
        </h2>
        <p className="mt-7 text-[16px] sm:text-[18px] leading-[1.6] max-w-xl mx-auto text-white/75">
          {COPY.cta.sub}
        </p>
        <div className="mt-12 flex justify-center">
          <StoreBadges variant="dark" />
        </div>
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
          {[COPY.cta.stat1, COPY.cta.stat2, COPY.cta.stat3].map((s, idx) => (
            <div key={idx} className="border-t pt-4 border-white/15">
              <div className="text-[20px] sm:text-[22px] font-medium text-white ff-serif">
                {s.value}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-white/55 mt-1.5">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  return (
    <LangProvider>
    <div className="font-sans" style={{ background: BG, color: "#1F1B16" }}>
      <Hero />
      <Problem />
      <Solution />
      <HuongDan />
      <Examples />
      <FAQSection />
      <FinalCTA />
      <div style={{ background: BG }}>
        <PageFooter accent={ACC} />
      </div>
    </div>
    </LangProvider>
  );
}

export default App;
