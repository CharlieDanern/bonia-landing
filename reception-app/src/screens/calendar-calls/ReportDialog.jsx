import React, { useEffect, useState } from "react";
import { Button, Dialog } from "../../components/ui/index.js";
import { REPORT_REASONS } from "../../data/calls.js";
import { useIsMobile } from "../../lib/hooks.js";
import { SheetClose } from "./parts.jsx";

// 3.5 B "Cuộc gọi này có vấn đề gì?": 5 reasons, optional note. Nothing to
// attach: the Bonia team already sees the recording, transcript and actions.
const mono = { fontFamily: "var(--bn-mono)" };

export function ReportDialog({ open, call, initial, onClose, onSend }) {
  const mobile = useIsMobile();
  const [reason, setReason] = useState(initial?.reason || "");
  const [note, setNote] = useState(initial?.note || "");
  useEffect(() => {
    if (open) {
      setReason(initial?.reason || "");
      setNote(initial?.note || "");
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onClose={onClose} bare width={560} label="Báo cuộc gọi này có vấn đề">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (reason) onSend(reason, note.trim());
        }}
        style={{ padding: mobile ? "24px 16px" : "28px 30px", display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ ...mono, fontSize: 11, letterSpacing: "0.2em", color: "var(--bn-muted)", textTransform: "uppercase" }}>
            {call.who} · {call.time}
          </span>
          <SheetClose onClick={onClose} />
        </div>
        <div style={{ fontFamily: "var(--bn-serif)", fontSize: 28 }}>Cuộc gọi này có vấn đề gì?</div>
        <div role="radiogroup" aria-label="Vấn đề" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {REPORT_REASONS.map((r) => {
            const on = r === reason;
            return (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setReason(r)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  height: 48,
                  padding: "0 14px",
                  borderRadius: 10,
                  border: on ? "2px solid var(--bn-clay)" : "1px solid var(--bn-hairline-2)",
                  whiteSpace: "nowrap",
                  flex: "none",
                  textAlign: "left",
                  background: "#fff",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ width: 18, height: 18, borderRadius: 9, border: on ? "5px solid var(--bn-clay)" : "1px solid var(--bn-dashed)", flex: "none" }}
                />
                <span style={{ fontSize: 15 }}>{r}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="cc-report-note" style={{ fontSize: 13.5, fontWeight: 500 }}>
            Ghi chú <span style={{ fontWeight: 400, color: "var(--bn-muted)" }}>· không bắt buộc</span>
          </label>
          <textarea
            id="cc-report-note"
            className="cc-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ height: 84, padding: "12px 14px", fontSize: 14.5, resize: "none", lineHeight: "normal", fontFamily: "var(--bn-sans)" }}
          />
        </div>
        <div style={{ fontSize: 13, color: "var(--bn-muted)" }}>Đội Bonia tự thấy ghi âm, lời thoại và mọi việc Bonia đã làm.</div>
        <Button type="submit" size="md" block disabled={!reason} style={{ height: 50 }}>
          Gửi cho Bonia
        </Button>
      </form>
    </Dialog>
  );
}
