/* The three sectors the page speaks to (spa removed 2026-10-01, founder) (handoff v5 `SECTORS`, the fields the
 * page shows). The selected sector drives the call-demo tile highlight, the
 * business in §01's phone, the §02 settings example and the form's Lĩnh vực.
 *
 * Sales deep-link a sector with ?nganh=<key>; an unknown or missing value
 * falls back to Phòng khám. Clicking a call-demo tile selects its sector and
 * rewrites ?nganh= in place (history.replaceState, no new history entry). */

export const SECTOR_KEYS = ["phong-kham", "khach-san", "nha-hang"];
export const DEFAULT_SECTOR = "phong-kham";

export const SECTORS = {
  "phong-kham": {
    label: "Phòng khám",
    field: "Phòng khám", // the form's Lĩnh vực chip
    biz: "Nha khoa Hoa Ngà",
    bizPhone: "0900 000 101",
    firstCaller: "0900 000 102",
    greet: "Dạ Nha khoa Hoa Ngà xin nghe ạ.",
    placeholder: "Nha khoa Hoa Ngà", // the form's Tên doanh nghiệp placeholder
    closeB: "Lịch hẹn luôn chờ lễ tân xác nhận.",
    close: "Tin nhắn xác nhận gửi từ số phòng khám, sau khi lễ tân duyệt.",
  },
  "khach-san": {
    label: "Khách sạn",
    field: "Khách sạn/Homestay",
    biz: "Homestay Nhà Sò Điệp",
    bizPhone: "0900 000 200",
    firstCaller: "0900 000 201",
    greet: "Dạ Nhà Sò Điệp xin nghe ạ.",
    placeholder: "Homestay Nhà Sò Điệp",
    closeB: "Đặt phòng luôn chờ lễ tân xác nhận.",
    close: "Thông tin cọc gửi từ số của cơ sở, sau khi lễ tân duyệt.",
  },
  "nha-hang": {
    label: "Nhà hàng",
    field: "Nhà hàng",
    biz: "Nhà hàng Bếp Sen",
    bizPhone: "0900 000 400",
    firstCaller: "0900 000 401",
    greet: "Dạ Bếp Sen xin nghe ạ.",
    placeholder: "Nhà hàng Bếp Sen",
    closeB: "Đặt bàn luôn chờ lễ tân xác nhận.",
    close: "Tin nhắn xác nhận gửi từ số của nhà hàng, sau khi lễ tân duyệt.",
  },
};

// Phone numbers keep their spaces on one line.
export const nb = (s) => s.replace(/ /g, " ");

export function readSector() {
  try {
    const q = new URLSearchParams(window.location.search).get("nganh");
    return SECTORS[q] ? q : DEFAULT_SECTOR;
  } catch (e) {
    return DEFAULT_SECTOR;
  }
}

export function writeSector(k) {
  try {
    const u = new URL(window.location.href);
    u.searchParams.set("nganh", k);
    window.history.replaceState(window.history.state, "", u.toString());
  } catch (e) {
    // An unwritable URL (sandboxed preview) keeps the sector in state only.
  }
}
