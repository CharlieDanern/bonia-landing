// Cài đặt: the hotel profile in the schema of data/hotelSchema.js.
//   values  { fieldKey: { v, st, src, alts } }   (see hotelValue)
//   rooms   [{ ...ROOM_FIELDS values, daily, overnight, hourly, monthly, st, src }]
// Sample: Khách sạn Sân Nhài (fictional), with a few values the "AI" found and
// the owner hasn't confirmed yet, so the review mode shows.

import { FIELDS, SECTIONS, hotelValue as V, isEmpty } from "./hotelSchema.js";

export { FIELDS, SECTIONS };
export const VOICE_COUNT = 6; // Giọng 1…6 (the engine's own names stay hidden; 6 = cedar, founder 2026-10-05)

const site = { t: "site", url: "https://sannhai.example" };
const booking = { t: "booking", url: "https://www.booking.com/hotel/vn/san-nhai.html" };
const gmaps = { t: "site" };
const N = (v, src = site) => V(v, "new", src);

const room = (o) => ({
  aliases: [], count: "", bed: "", maxAdults: "", maxChildren: "", size: "", view: "", bath: "Riêng", floor: "", extras: [], extraBed: "",
  daily: { on: true, wd: "", we: "" }, overnight: { on: false, price: "", from: "22:00", to: "12:00" }, hourly: { on: false, h2: "", hn: "" }, monthly: { on: false, price: "" },
  st: "ok", ...o,
});

export function defaultSettings() {
  const values = {
    // 01
    name: V("Khách sạn Sân Nhài"),
    aliases: V(["Sân Nhài", "khách sạn hồ Con Rùa"]),
    type: V("Khách sạn mini"),
    languages: V(["Tiếng Việt", "Tiếng Anh"]),
    hotline: V("0900 000 300"),
    legal: V("Công ty TNHH Sân Nhài · 0300 000 300"),
    deskHours: V({ allDay: true, from: "", to: "" }),
    afterHours: N("Sau 0:30 kéo nửa cửa cuốn; khách tới khuya bấm chuông hoặc gọi hotline, lễ tân đêm ra mở."),
    // 02
    address: N("27 đường Sân Nhài, phường Xuân Hòa, TP.HCM", booking),
    addressOld: V("Phường 6, Quận 3"),
    landmark: N("Gần Hồ Con Rùa, đối diện quán cà phê Sân Vườn", gmaps),
    directions: N("Hẻm ô tô vào tới cửa"),
    parking: V("Xe máy gửi miễn phí trong sảnh. Ô tô gửi bãi đầu hẻm, 40.000đ một lượt."),
    sights: N([["Hồ Con Rùa", "500 m"], ["Bảo tàng Chứng tích Chiến tranh", "1 km"], ["Dinh Độc Lập", "1,5 km"], ["Nhà thờ Tân Định", "1,8 km"]], booking),
    transport: V([["Sân bay Tân Sơn Nhất", "6 km, khoảng 25 phút"], ["Ga Sài Gòn", "2,5 km"]]),
    howToGet: V("Taxi, Grab, Xanh SM tới thẳng cửa."),
    nearby: V([["Cơm tấm, phở, bánh mì", "đầu hẻm"], ["Cửa hàng tiện lợi 24h", "50 m"], ["Nhà thuốc, ATM", "100 m"]]),
    // 03
    checkin: V(null, "conflict", null, [{ v: "13:00", src: site }, { v: "14:00", src: booking }]),
    checkout: V("12:00"),
    earlyLate: V("50.000đ/giờ; nhận trước 07:00 hoặc trả sau 16:00 tính thêm một đêm. Khách sạn xác nhận."),
    idDocs: V(["CCCD", "VNeID", "Hộ chiếu"]),
    minAge: V("Từ 18 tuổi; trẻ dưới 18 đi cùng bố mẹ hoặc người giám hộ."),
    checkinDeposit: V(""),
    luggage: V(true),
    // 04
    roomAmenities: V(["Máy lạnh", "Wifi", "Nước nóng", "TV", "Tủ lạnh", "Ấm siêu tốc", "Nước suối"]),
    priceBasis: V("Theo phòng"),
    priceTax: N("Giá đã gồm thuế, phí", booking),
    priceIncludes: V([]),
    weekendNights: V(["Thứ Sáu", "Thứ Bảy"]),
    extraPerson: V([["Bé dưới 6 tuổi ngủ chung", "Miễn phí, 1 bé/phòng"], ["Trẻ 6–11 tuổi", "100.000đ/đêm"], ["Từ 12 tuổi", "Tính như người lớn"], ["Giường phụ (chỉ Deluxe)", "150.000đ/đêm"]]),
    minNights: V("Tết: tối thiểu 2 đêm"),
    holidays: V([["30/4–2/5/2027, 2/9/2026", "Tăng 25%"], ["Tết: 5/2–11/2/2027", "Tăng 50%, trả trước, không hoàn"]]),
    promos: V([]),
    // 05
    children: N("Bé dưới 6 tuổi ngủ chung miễn phí"),
    pets: V(null, "new"),
    smoking: V("Không hút trong phòng"),
    houseRules: V("Giữ yên lặng sau 22:00. Không tổ chức tiệc trong phòng."),
    deposit: N("Cọc 1 đêm khi đặt qua điện thoại, chuyển khoản trong 24 giờ; khách sạn nhắn thông tin chuyển khoản từ số của khách sạn."),
    changeDate: V("Đổi ngày miễn phí nếu báo trước 24 giờ, tùy phòng trống."),
    cancel: N("Hủy miễn phí trước 24 giờ, hoàn cọc qua chuyển khoản trong 3 ngày. Không đến thì mất cọc. Lễ Tết không hoàn."),
    payment: V(["Tiền mặt", "Chuyển khoản"]),
    vat: V(true),
    // 06
    amenities: N(["Thang máy", "Giặt ủi", "Đưa đón sân bay", "Thuê xe máy"], booking),
    wifi: V("Miễn phí, mọi phòng và sảnh"),
    housekeeping: V("Dọn phòng mỗi ngày 9:00–15:00, hoặc khi khách yêu cầu"),
    breakfast: V("Không gồm trong giá; quán cà phê đối diện, khoảng 60.000đ"),
    dining: V(""),
    activities: V([]),
    services: V([["Đưa đón sân bay, xe 4 chỗ", "380.000đ; 22:00–05:00 thêm 150.000đ"], ["Thuê xe máy", "120.000đ/ngày xe số, 180.000đ tay ga"], ["Giặt ủi", "35.000đ/kg, tối thiểu 2 kg"]]),
    dayVisit: V(""),
    groups: V("Đoàn từ 10 người: chủ gọi lại báo giá"),
    // 07
    askFor: V(["Tên", "Ngày nhận phòng", "Số đêm", "Số người lớn", "Trẻ em và tuổi", "Giờ tới"]),
    groupSize: V("10"),
    channels: V([["Gọi điện", "0900 000 300"], ["Booking.com", ""], ["Agoda", ""]]),
    // 08
    greeting: V("Dạ khách sạn Sân Nhài xin nghe ạ."),
    voice: V(1),
    english: V(true),
    quote: V("Giá từng đêm"),
    disclose: V(false),
    upsell: V(false),
    wifiPass: V(false),
    // 09
    extra: V(""),
    faq: V([]),
    fixes: V([]),
  };
  const rooms = [
    room({ name: "Standard", aliases: ["phòng thường", "phòng tiêu chuẩn"], count: "4", bed: "1 giường đôi", maxAdults: "2", maxChildren: "1", size: "18", view: "Cửa sổ trong",
      daily: { on: true, wd: 450000, we: 550000 }, overnight: { on: true, price: 380000, from: "22:00", to: "12:00" }, hourly: { on: true, h2: 200000, hn: 50000 } }),
    room({ name: "Superior", aliases: ["phòng có cửa sổ"], count: "4", bed: "1 giường đôi hoặc 2 giường đơn", maxAdults: "2", maxChildren: "1", size: "22", view: "Cửa sổ",
      daily: { on: true, wd: 520000, we: 620000 }, overnight: { on: true, price: 450000, from: "22:00", to: "12:00" }, hourly: { on: true, h2: 250000, hn: 60000 }, st: "new", src: booking }),
    room({ name: "Deluxe ban công", aliases: ["phòng ban công", "deluxe"], count: "3", bed: "1 giường đôi lớn", maxAdults: "2", maxChildren: "1", size: "28", view: "Ban công hướng phố", extras: ["Bồn tắm", "Ban công"], extraBed: "Có, 150.000đ/đêm",
      daily: { on: true, wd: 750000, we: 850000 }, overnight: { on: true, price: 550000, from: "22:00", to: "12:00" }, st: "new", src: booking }),
    room({ name: "Family", aliases: ["phòng gia đình"], count: "2", bed: "2 giường đôi", maxAdults: "4", maxChildren: "2", size: "34", view: "Cửa sổ hướng phố",
      daily: { on: true, wd: 950000, we: 1100000 }, st: "new", src: booking }),
    room({ name: "Suite", count: "1", bed: "1 giường king", maxAdults: "3", maxChildren: "1", size: "45", view: "Ban công góc", extras: ["Bồn tắm", "Sofa"],
      daily: { on: true, wd: 1400000, we: 1600000 } }),
  ];
  return { values, rooms };
}

/** Plain { key: value } view of the profile, for screens and the demo engine. */
export const flat = (s) => Object.fromEntries(Object.entries(s.values).map(([k, x]) => [k, x.v]));

/** What still waits for the owner, in page order: [sectionKey, fieldKey | "room:i"]. */
export function pendingList({ values, rooms }) {
  const out = [];
  SECTIONS.forEach((sec) => {
    sec.cards.forEach(([, keys]) => keys.forEach((k) => { if (values[k] && values[k].st !== "ok") out.push([sec.key, k]); }));
    if (sec.rooms) rooms.forEach((r, i) => { if (r.st !== "ok") out.push([sec.key, `room:${i}`]); });
  });
  return out;
}

/** "Cần bạn điền": nothing found, nothing typed. */
export const needsFill = (x) => !!x && x.st === "new" && isEmpty(x.v);
