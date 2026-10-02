import React, { useId } from "react";

// Text input (README): h 52–54, radius 10, 1px hairline, white.
// Focus 2px clay · error 1px urgent + 14px helper below · numbers in mono.
// `unconfirmed` draws the dashed AI border; `suffix` adds "đ" etc.
export function TextInput({
  label,
  labelStyle,
  value,
  onChange,
  placeholder,
  mono = false,
  error,
  helper,
  suffix,
  prefix,
  height = 54,
  fontSize,
  unconfirmed = false,
  disabled = false,
  readOnly = false,
  focused = false, // force the focus look (frames)
  inputMode,
  type = "text",
  autoFocus,
  multiline = false,
  rows = 3,
  id,
  style,
  fieldStyle,
  inputStyle,
  onBlur,
  onFocus,
  onKeyDown,
  ...rest
}) {
  const autoId = useId();
  const inputId = id || autoId;
  const hasError = !!error;
  const cls = [
    "tt-field",
    hasError ? "tt-field--error" : "",
    unconfirmed && !hasError ? "tt-field--unconfirmed" : "",
    disabled ? "tt-field--disabled" : "",
    focused && !hasError ? "tt-field--focus" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const fs = fontSize ?? (mono ? 18 : 15);
  const Control = multiline ? "textarea" : "input";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, ...style }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{ fontSize: 14, fontWeight: 500, color: disabled ? "var(--bn-muted)" : "var(--bn-ink)", ...labelStyle }}
        >
          {label}
        </label>
      )}
      <div
        className={cls}
        style={{
          height: multiline ? "auto" : height,
          padding: multiline ? "12px 16px" : undefined,
          alignItems: multiline ? "flex-start" : "center",
          ...fieldStyle,
        }}
      >
        {prefix && <span style={{ color: "var(--bn-muted)", fontSize: 13 }}>{prefix}</span>}
        <Control
          id={inputId}
          type={multiline ? undefined : type}
          rows={multiline ? rows : undefined}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value, e)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          inputMode={inputMode}
          autoFocus={autoFocus}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError || helper ? `${inputId}-help` : undefined}
          onBlur={onBlur}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          style={{
            fontFamily: mono ? "var(--bn-mono)" : "var(--bn-sans)",
            fontSize: fs,
            letterSpacing: mono ? "0.04em" : undefined,
            resize: multiline ? "vertical" : undefined,
            lineHeight: multiline ? 1.5 : undefined,
            ...inputStyle,
          }}
          {...rest}
        />
        {suffix && <span style={{ color: "var(--bn-muted)", fontSize: 13, flex: "none" }}>{suffix}</span>}
      </div>
      {(hasError || helper) && (
        <div
          id={`${inputId}-help`}
          style={{
            fontSize: hasError ? 14 : 13.5,
            lineHeight: 1.5,
            color: hasError ? "var(--bn-urgent)" : "var(--bn-muted)",
          }}
        >
          {hasError && typeof error === "string" ? error : helper}
        </div>
      )}
    </div>
  );
}
