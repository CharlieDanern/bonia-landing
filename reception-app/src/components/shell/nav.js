// The five main tabs (sidebar on desktop, bottom tab bar below 768px).
export const NAV_ITEMS = [
  { key: "hom-nay", label: "Hôm nay", to: "/hom-nay" },
  { key: "yeu-cau", label: "Yêu cầu", to: "/yeu-cau" },
  { key: "lich-phong", label: "Lịch phòng", to: "/lich" },
  { key: "cuoc-goi", label: "Cuộc gọi", to: "/cuoc-goi" },
  { key: "cai-dat", label: "Cài đặt", to: "/cai-dat" },
];

/** Which tab a path belongs to ("/cuoc-goi/ngan" → "cuoc-goi"). */
export function navKeyForPath(path) {
  if (path.startsWith("/yeu-cau")) return "yeu-cau";
  if (path.startsWith("/lich")) return "lich-phong";
  if (path.startsWith("/cuoc-goi")) return "cuoc-goi";
  if (path.startsWith("/cai-dat") || path.startsWith("/tai-khoan") || path.startsWith("/tro-giup")) return "cai-dat";
  if (path.startsWith("/hom-nay")) return "hom-nay";
  return "none";
}
