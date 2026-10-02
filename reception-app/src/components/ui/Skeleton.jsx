import React from "react";

// Loading blocks (#EBE5D9 with #DDD5C6 / #E4DCCB bars), as in the K/E/P frames.
export function Skeleton({ width = "100%", height = 58, radius = 10, style, children }) {
  return (
    <div className="tt-skeleton" style={{ width, height, borderRadius: radius, ...style }}>
      {children}
    </div>
  );
}

/** One list-row placeholder: a title bar and a shorter second line. */
export function SkeletonRow({ titleWidth = "55%", height = 58, style }) {
  return (
    <Skeleton
      height={height}
      style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 8, padding: "0 12px", ...style }}
    >
      <span style={{ width: titleWidth, height: 11, borderRadius: 3, background: "var(--bn-skeleton-3)" }} />
      <span style={{ width: "70%", height: 9, borderRadius: 3, background: "var(--bn-skeleton-2)" }} />
    </Skeleton>
  );
}

export function SkeletonBar({ width = "60%", height = 11, tone = 3, style }) {
  return (
    <span
      style={{
        display: "block",
        width,
        height,
        borderRadius: 3,
        background: tone === 3 ? "var(--bn-skeleton-3)" : "var(--bn-skeleton-2)",
        ...style,
      }}
    />
  );
}
