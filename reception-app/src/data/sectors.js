// Lĩnh vực (design brief §3.0b, founder 2026-10-02): chosen right after the
// first login, before anything else, so restaurants and later sectors plug
// into the same app. The sector sets the app's words and its settings set.
// Only Lưu trú is built; the others show "Sớm ra mắt" and can't be picked.
export const SECTORS = [
  {
    key: "luu-tru",
    label: "Lưu trú",
    desc: "Khách sạn, khách sạn mini, homestay, căn hộ dịch vụ",
    ready: true,
    words: { calendar: "Lịch phòng", booking: "đặt phòng", unit: "phòng" },
  },
  {
    key: "fnb",
    label: "F&B",
    desc: "Nhà hàng, quán ăn, cà phê",
    ready: false,
    words: { calendar: "Lịch bàn", booking: "đặt bàn", unit: "bàn" },
  },
  {
    key: "beauty",
    label: "Beauty",
    desc: "Spa, salon tóc, nail, thẩm mỹ",
    ready: false,
    words: { calendar: "Lịch hẹn", booking: "đặt lịch", unit: "lịch hẹn" },
  },
  {
    key: "khac",
    label: "Khác",
    desc: "Các ngành khác",
    ready: false,
    words: { calendar: "Lịch hẹn", booking: "đặt lịch", unit: "lịch hẹn" },
  },
];

/** The sector for a key ("luu-tru"); unknown keys fall back to Lưu trú. */
export function sectorBy(key) {
  return SECTORS.find((s) => s.key === key) || SECTORS[0];
}

// A new account started from a sales link (/start/:code?nganh=…) or ?moi=1:
// login then goes to the sector choice (or straight to setup when the link
// names a ready sector) instead of Hôm nay. Kept for this browser session.
const NEW_KEY = "tt-new-account";

export function markNewAccount({ code = null, sector = null } = {}) {
  try {
    sessionStorage.setItem(NEW_KEY, JSON.stringify({ code, sector }));
  } catch {
    // private mode: the flow still works, the login just lands on Hôm nay
  }
}

export function newAccount() {
  try {
    const raw = sessionStorage.getItem(NEW_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setNewAccountSector(sector) {
  const cur = newAccount() || {};
  markNewAccount({ ...cur, sector });
}
