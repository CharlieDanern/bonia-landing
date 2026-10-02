import React from "react";

// Activity / history row (README): grid 56–76px 120–150px 1fr:
// time mono muted · device (iPhone quầy, Máy tính quầy, Bonia) · action.
// `urgent` colours the action (escalations "Đã báo thêm …").
export function ActivityRow({ t, d, a, urgent = false, columns = "76px 120px minmax(0,1fr)", first = false, fontSize = 13.5, padding = "10px 0", style }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: 10,
        fontSize,
        padding,
        borderTop: first ? 0 : "1px solid var(--bn-hairline-3)",
        ...style,
      }}
    >
      <span style={{ fontFamily: "var(--bn-mono)", color: "var(--bn-muted)" }}>{t}</span>
      <span style={{ color: "var(--bn-ink-2)" }}>{d}</span>
      <span style={{ color: urgent ? "var(--bn-urgent)" : "var(--bn-ink)" }}>{a}</span>
    </div>
  );
}

export function ActivityList({ rows = [], columns, fontSize, padding, style }) {
  return (
    <div style={style}>
      {rows.map((r, i) => (
        <ActivityRow key={`${r.t}-${i}`} {...r} first={i === 0} columns={columns} fontSize={fontSize} padding={padding} />
      ))}
    </div>
  );
}
