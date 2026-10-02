import React, { useState } from "react";
import { Chip } from "./Chip.jsx";

// "Cần bạn điền" (README): #FBF8F2, 1px dashed urgent, radius 10; tag
// CẦN BẠN ĐIỀN; 36px answer chips (selected = clay outline + clay text);
// "Tự viết…" dashed opens a free-text field.
export function NeedFill({
  question,
  tag = "CẦN BẠN ĐIỀN",
  options = [],
  selected = null,
  onSelect, // (index | null, customText?) → void
  allowCustom = true,
  customLabel = "Tự viết…",
  note,
  gap = 12,
  style,
}) {
  const [custom, setCustom] = useState(false);
  const [text, setText] = useState("");
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap,
        padding: "14px 16px",
        background: "var(--bn-urgent-wash)",
        border: "1px dashed var(--bn-urgent)",
        borderRadius: 10,
        ...style,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 500 }}>{question}</span>
        <span
          style={{
            fontFamily: "var(--bn-mono)",
            fontSize: 10,
            letterSpacing: "0.14em",
            color: "var(--bn-urgent)",
            background: "var(--bn-urgent-bg)",
            padding: "4px 8px",
            borderRadius: 10,
            whiteSpace: "nowrap",
          }}
        >
          {tag}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map((o, i) => (
          <Chip
            key={o}
            variant="answer"
            selected={selected === i && !custom}
            onClick={() => {
              setCustom(false);
              onSelect?.(i);
            }}
          >
            {o}
          </Chip>
        ))}
        {allowCustom && !custom && (
          <Chip variant="custom" onClick={() => setCustom(true)}>
            {customLabel}
          </Chip>
        )}
      </div>
      {custom && (
        <input
          autoFocus
          value={text}
          placeholder="Viết câu trả lời"
          onChange={(e) => setText(e.target.value)}
          onBlur={() => text && onSelect?.(null, text)}
          onKeyDown={(e) => e.key === "Enter" && text && onSelect?.(null, text)}
          style={{
            height: 44,
            border: "2px solid var(--bn-clay)",
            borderRadius: 10,
            padding: "0 13px",
            fontSize: 14,
            outline: 0,
            background: "#fff",
          }}
        />
      )}
      {note && <div style={{ fontSize: 13, color: "var(--bn-muted)" }}>{note}</div>}
    </div>
  );
}
