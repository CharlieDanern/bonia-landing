// Vietnam's public holidays for the "Ngày lễ, Tết" picker (founder 2026-10-05:
// we know the official holidays, the owner just picks them and sets a price).
//
// Bộ luật Lao động 2019, Điều 112, plus Ngày Văn hóa Việt Nam 24/11 (Nghị quyết
// of 24/4/2026, in force 1/7/2026): 12 paid days a year. Tết's exact days and
// Quốc khánh's adjacent day are set by the government each year: OFFICIAL holds
// the announced ones (2026–2027 approved 2/10/2026, VnExpress); other years get
// the law's default shape and the owner adjusts.
//
// Lunar dates: Hồ Ngọc Đức's algorithm (the standard for the Vietnamese lunar
// calendar), time zone UTC+7.

const TZ = 7;
const PI = Math.PI;

function jdFromDate(dd, mm, yy) {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  return jd;
}

function jdToDate(jd) {
  let b;
  let c;
  if (jd > 2299160) {
    const a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = b * 100 + d - 4800 + Math.floor(m / 10);
  return [day, month, year];
}

function newMoon(k) {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 -= 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat = T < -11
    ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return jd1 + C1 - deltat;
}

function sunLongitude(jdn) {
  const T = (jdn - 2451545.0) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L -= PI * 2 * Math.floor(L / (PI * 2));
  return L;
}

const sunSector = (dayNumber) => Math.floor((sunLongitude(dayNumber - 0.5 - TZ / 24) / PI) * 6);
const newMoonDay = (k) => Math.floor(newMoon(k) + 0.5 + TZ / 24);

function lunarMonth11(yy) {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  const nm = newMoonDay(k);
  return sunSector(nm) >= 9 ? newMoonDay(k - 1) : nm;
}

function leapMonthOffset(a11) {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last;
  let i = 1;
  let arc = sunSector(newMoonDay(k + i));
  do {
    last = arc;
    i += 1;
    arc = sunSector(newMoonDay(k + i));
  } while (arc !== last && i < 14);
  return i - 1;
}

/** A lunar date (not a leap month) as [day, month, year] of the solar calendar. */
export function lunarToSolar(lunarDay, lunarMonth, lunarYear) {
  let a11;
  let b11;
  if (lunarMonth < 11) {
    a11 = lunarMonth11(lunarYear - 1);
    b11 = lunarMonth11(lunarYear);
  } else {
    a11 = lunarMonth11(lunarYear);
    b11 = lunarMonth11(lunarYear + 1);
  }
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lunarMonth - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365 && off >= leapMonthOffset(a11)) off += 1;
  return jdToDate(newMoonDay(k + off) + lunarDay - 1);
}

const iso = ([d, m, y]) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const addDays = (isoDate, n) => {
  const t = new Date(`${isoDate}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};
const CAN_CHI = (y) => `${["Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ"][y % 10]} ${["Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"][y % 12]}`;

// the government's announced days (a range covers the weekend the holiday joins)
const OFFICIAL = {
  2027: { tet: ["2027-02-04", "2027-02-10"], national: ["2027-09-02", "2027-09-05"] },
};

/**
 * The year's holidays: { id, title, from, to, note, official }. Dates YYYY-MM-DD;
 * Tết is the lunar new year that starts in that solar year (it falls in Jan–Feb).
 */
export function holidaysOf(year) {
  const known = OFFICIAL[year] || {};
  const tet = iso(lunarToSolar(1, 1, year));
  const hung = iso(lunarToSolar(10, 3, year));
  const autumn = iso(lunarToSolar(15, 8, year));
  const list = [
    { id: "newyear", title: "Tết Dương lịch", from: `${year}-01-01`, to: `${year}-01-01`, official: true },
    {
      id: "tet", title: `Tết Nguyên đán ${CAN_CHI(year)}`, from: known.tet ? known.tet[0] : addDays(tet, -2), to: known.tet ? known.tet[1] : addDays(tet, 2),
      note: `mùng 1 Tết: ${dm(tet)}${known.tet ? " · lịch nghỉ chính thức" : " · lịch nghỉ chưa công bố, sửa lại khi có"}`, official: true,
    },
    { id: "hung", title: "Giỗ Tổ Hùng Vương", from: hung, to: hung, note: "10/3 âm lịch", official: true },
    { id: "may", title: "Lễ 30/4 – 1/5", from: `${year}-04-30`, to: `${year}-05-01`, official: true },
    {
      id: "national", title: "Quốc khánh 2/9", from: known.national ? known.national[0] : `${year}-09-01`, to: known.national ? known.national[1] : `${year}-09-02`,
      note: known.national ? "lịch nghỉ chính thức" : "nghỉ 2/9 và một ngày liền kề, sửa lại khi có lịch chính thức", official: true,
    },
    { id: "culture", title: "Ngày Văn hóa Việt Nam", from: `${year}-11-24`, to: `${year}-11-24`, official: true },
    // not days off, but busy nights for many hotels
    { id: "autumn", title: "Trung thu", from: autumn, to: autumn, note: "15/8 âm lịch", official: false },
    { id: "xmas", title: "Giáng sinh", from: `${year}-12-24`, to: `${year}-12-25`, official: false },
  ];
  // Ngày Văn hóa is a holiday from 2026
  return list.filter((h) => h.id !== "culture" || year >= 2026);
}

function dm(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return `${+d}/${+m}/${y}`;
}

/** Holidays not over yet, this year and next (Tết of next year falls early in it). */
export function upcomingHolidays(today) {
  const y = Number(today.slice(0, 4));
  return [...holidaysOf(y), ...holidaysOf(y + 1)].filter((h) => h.to >= today).sort((a, b) => a.from.localeCompare(b.from));
}
