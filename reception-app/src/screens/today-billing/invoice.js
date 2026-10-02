// Invoice maths, from the plan rather than typed totals:
// 999.000 + 12,5 × 4.000 = 50.000 → 1.049.000; VAT 10% 104.900 → 1.153.900đ.

export function invoiceLines(invoice, plan) {
  const overMinutes = invoice.overMinutes ?? 12.5;
  const base = plan.price;
  const over = Math.round(overMinutes * plan.overagePerMinute);
  const vat = Math.round((base + over) * plan.vatRate);
  const total = base + over + vat;
  const month = invoice.month.split("/")[0];
  const fmtMin = String(overMinutes).replace(".", ",");
  const fmtRate = plan.overagePerMinute.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const lines = [
    { label: `Gói tháng ${month} · ${plan.includedMinutes} phút`, amount: base },
    { label: `Phút vượt · ${fmtMin} phút × ${fmtRate}đ`, amount: over },
    { label: `VAT ${Math.round(plan.vatRate * 100)}%`, amount: vat },
  ];
  if (import.meta.env?.DEV && invoice.total != null && invoice.total !== total) {
    console.warn(`Invoice total ${invoice.total} ≠ computed ${total}`);
  }
  return { lines, total };
}
