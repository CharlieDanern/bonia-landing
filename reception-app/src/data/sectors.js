// Lĩnh vực (founder 2026-10-02): chosen right after the first login so other
// sectors plug into the same app. Only Lưu trú is built; the others show
// "Sớm ra mắt" and can't be picked. Handoff 13 drew Khách sạn / Nhà hàng /
// Spa / Phòng khám; the founder's list is the one below.
export const SECTORS = [
  { key: "luu-tru", label: "Lưu trú", desc: "Khách sạn, nhà nghỉ, homestay, căn hộ", ready: true },
  { key: "fnb", label: "F&B", desc: "Sớm ra mắt", ready: false },
  { key: "beauty", label: "Beauty", desc: "Sớm ra mắt", ready: false },
  { key: "khac", label: "Khác", desc: "Sớm ra mắt", ready: false },
];

/** The sector for a key; unknown keys fall back to Lưu trú. */
export function sectorBy(key) {
  return SECTORS.find((s) => s.key === key) || SECTORS[0];
}
