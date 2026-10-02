import React from "react";
import { Link, useLocation } from "wouter";
import { AppLayout } from "../../components/shell/index.js";
import { SettingsCard, SettingsMark, Toggle, Button, Skeleton, Banner } from "../../components/ui/index.js";
import { useStore, useActions } from "../../store/index.jsx";
import { useIsMobile } from "../../lib/hooks.js";
import { decimal, groupVnd } from "../../lib/format.js";
import { EMPTY_SECTIONS } from "../../data/settings.js";
import { summaryFor } from "./summaries.js";
import "./settings-a.css";

// 3.6 A: every section as one card with a one-line summary and its mark.
// 3.6 O (?state=empty): manual setup, every card shows an example.

const btn40 = {
  height: 40,
  padding: "0 16px",
  borderRadius: 20,
  border: "1px solid var(--bn-hairline)",
  background: "#fff",
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  whiteSpace: "nowrap",
  flex: "none",
};

export function SettingsList({ state: screen }) {
  const state = useStore();
  const { saveSettings } = useActions();
  const mobile = useIsMobile();
  const [, navigate] = useLocation();
  const empty = screen === "empty";
  const web = state.settings["07"].webSearch;
  const webOn = empty ? false : web.on;
  const known = empty ? 6 : state.knowledge.known;

  const setWeb = (on) => saveSettings("07", { webSearch: { ...web, on } });

  const header = (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: mobile ? "flex-start" : "flex-end",
        flexDirection: mobile ? "column" : "row",
        gap: mobile ? 14 : 24,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div
          style={{
            fontFamily: "var(--bn-mono)",
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: empty ? "var(--bn-urgent)" : "var(--bn-muted)",
          }}
        >
          Bonia đã biết {known}/{state.knowledge.total} điều khách hay hỏi
        </div>
        <h2 className="tt-page-title" style={{ fontSize: mobile ? 32 : 40 }}>
          Cài đặt
        </h2>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, whiteSpace: "nowrap", cursor: "pointer" }}>
          Cho Bonia tìm thông tin trên mạng
          <Toggle on={webOn} onChange={setWeb} label="Cho Bonia tìm thông tin trên mạng" />
        </label>
        {!empty && (
          <button
            type="button"
            className="sa-card-link"
            disabled={!webOn}
            onClick={() => navigate("/bat-dau/tim")}
            style={{ ...btn40, color: webOn ? "var(--bn-ink)" : "var(--bn-muted)", minHeight: mobile ? 44 : undefined }}
          >
            Tìm lại trên mạng
          </button>
        )}
      </div>
    </div>
  );

  const cards = state.sections.map((s) => {
    const e = empty ? EMPTY_SECTIONS.find((x) => x.n === s.n) : null;
    return {
      n: s.n,
      title: s.title,
      summary: e ? e.summary : summaryFor(state, s.n),
      mark: e ? e.mark : s.mark,
      to: `/cai-dat/${s.n}`,
    };
  });

  return (
    <AppLayout active="cai-dat">
      <div style={{ padding: mobile ? "20px 16px 28px" : "32px 40px", display: "flex", flexDirection: "column", gap: 20 }}>
        {header}
        {screen === "error" && (
          <Banner tone="error" tag="Lỗi">
            Chưa tải được cài đặt. Bonia vẫn nghe máy bình thường với cài đặt đã lưu.
          </Banner>
        )}
        {empty && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: mobile ? "stretch" : "center",
              flexDirection: mobile ? "column" : "row",
              gap: mobile ? 12 : 20,
              padding: "16px 20px",
              background: "#fff",
              border: "1px dashed var(--bn-clay)",
              borderRadius: 12,
            }}
          >
            <span style={{ fontSize: 14.5, lineHeight: 1.5 }}>
              Mỗi phần đã có ví dụ và lựa chọn mặc định, không phải form trống. Hoặc để Bonia tìm giúp trong khoảng 1 phút.
            </span>
            <Button size="sm" to="/bat-dau/tim">
              Tìm giúp tôi
            </Button>
          </div>
        )}
        {screen === "loading" ? (
          <div aria-busy="true" style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 10 }}>
            {Array.from({ length: 11 }, (_, i) => (
              <Skeleton key={i} height={72} radius={12} />
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap: 10 }}>
            {cards.map((c) =>
              empty ? (
                <ExampleCard key={c.n} {...c} />
              ) : (
                <SettingsCard key={c.n} n={c.n} title={c.title} summary={c.summary} mark={c.mark} to={c.to} />
              )
            )}
          </div>
        )}
        {!empty && screen !== "loading" && <AccountLinks mobile={mobile} />}
      </div>
    </AppLayout>
  );
}

/** 3.6 O card: like SettingsCard, muted example line, min-height 66. */
function ExampleCard({ n, title, summary, mark, to }) {
  return (
    <Link
      href={to}
      className="sa-card-link"
      style={{
        display: "grid",
        gridTemplateColumns: "40px minmax(0,1fr) auto",
        gap: 12,
        alignItems: "center",
        padding: "14px 16px",
        background: "#fff",
        border: "1px solid var(--bn-hairline)",
        borderRadius: 12,
        minHeight: 66,
        color: "var(--bn-ink)",
      }}
    >
      <span style={{ fontFamily: "var(--bn-mono)", fontSize: 11, color: "var(--bn-muted)" }}>§ {n}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: 12.5, color: "var(--bn-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {summary}
        </span>
      </div>
      <SettingsMark mark={mark} />
    </Link>
  );
}

function AccountLinks({ mobile }) {
  const state = useStore();
  const plan = state.billing.plan;
  const items = [
    {
      to: "/tai-khoan",
      title: "Tài khoản",
      sub: `${state.hotel.phone} · ${state.devices.length} máy đang đăng nhập · Hoạt động`,
    },
    {
      to: "/thanh-toan",
      title: "Thanh toán",
      sub: `${groupVnd(plan?.price ?? 999000)}đ/tháng · ${decimal(state.minutes.used)} / ${state.minutes.included} phút`,
    },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
        gap: 10,
        borderTop: "1px solid var(--bn-hairline)",
        paddingTop: 14,
      }}
    >
      {items.map((it) => (
        <Link
          key={it.to}
          href={it.to}
          className="sa-card-link"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            border: "1px solid var(--bn-hairline)",
            borderRadius: 12,
            color: "var(--bn-ink)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{it.title}</span>
            <span style={{ fontSize: 12.5, color: "var(--bn-ink-2)" }}>{it.sub}</span>
          </div>
          <span style={{ color: "var(--bn-muted)" }}>›</span>
        </Link>
      ))}
    </div>
  );
}
