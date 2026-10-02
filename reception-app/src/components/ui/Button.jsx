import React from "react";
import { useLocation } from "wouter";

// Pill buttons (README "Primary / Secondary button").
// size → height · horizontal padding · font size, as drawn in the frames:
//   lg 52 (login, onboarding) · md 48 (detail action bars) · sm 44 (cards,
//   dialogs, save bar) · xs 40 (header actions) · mini 32 (Đúng / Sửa / Bỏ)
const SIZES = {
  lg: { height: 52, padding: "0 22px", fontSize: 15 },
  md: { height: 48, padding: "0 22px", fontSize: 15 },
  sm: { height: 44, padding: "0 20px", fontSize: 14 },
  xs: { height: 40, padding: "0 18px", fontSize: 14 },
  mini: { height: 32, padding: "0 12px", fontSize: 13 },
};

export function Spinner({ size = 16, tone = "light", style }) {
  return (
    <span
      className={`tt-spinner${tone === "clay" ? " tt-spinner--clay" : ""}`}
      style={{ width: size, height: size, ...style }}
      aria-hidden="true"
    />
  );
}

/**
 * variant: primary | secondary | danger | link
 * `href` renders an <a> (sms:, tel:, external); `to` navigates in-app.
 * `block` stretches to the container width (form buttons).
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  block = false,
  href,
  to,
  onClick,
  type = "button",
  children,
  style,
  className = "",
  ...rest
}) {
  const [, navigate] = useLocation();
  const s = SIZES[size] || SIZES.md;
  const isDisabled = disabled && !loading;
  const cls = [
    "tt-btn",
    `tt-btn--${variant}`,
    isDisabled && variant !== "link" ? "tt-btn--disabled" : "",
    loading ? "tt-btn--loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const css = {
    height: s.height,
    padding: s.padding,
    fontSize: s.fontSize,
    width: block ? "100%" : undefined,
    ...style,
  };
  const content = (
    <>
      {loading && <Spinner size={size === "lg" || size === "md" ? 16 : 14} tone={variant === "secondary" ? "clay" : "light"} />}
      {children}
    </>
  );

  const handle = (e) => {
    if (isDisabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
    if (to && !e.defaultPrevented) navigate(to);
  };

  if (href) {
    return (
      <a
        className={cls}
        style={css}
        href={isDisabled ? undefined : href}
        aria-disabled={isDisabled || loading || undefined}
        onClick={handle}
        {...rest}
      >
        {content}
      </a>
    );
  }
  return (
    <button
      type={type}
      className={cls}
      style={css}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onClick={handle}
      {...rest}
    >
      {content}
    </button>
  );
}
