// Cài đặt (handoff 13, "Bonia Cai Dat v3"): what Bonia knows about the hotel.
// f = field values, ok = confirmed by the owner (AI-found values start
// unconfirmed: dashed border), rooms = room types with their three ways of
// selling (Theo giờ · Qua đêm · Theo ngày), each switched on or off.

export const AMENITIES = ["Wi-Fi miễn phí", "Máy lạnh", "Lễ tân 24 giờ", "Thang máy", "Gửi xe máy miễn phí", "Bãi ô tô gần", "Bữa sáng", "Đưa đón sân bay", "Giặt ủi", "Gửi hành lý", "Hồ bơi", "Phòng gym"];

/** Field kinds: text · mono · area · chips (one) · multi · toggle · conflict · voice. */
export const FIELDS = {
  name: { l: "Tên khách sạn", k: "text" },
  type: { l: "Loại chỗ nghỉ", k: "chips", o: ["Khách sạn", "Nhà nghỉ", "Homestay", "Căn hộ dịch vụ"] },
  phone: { l: "Số điện thoại lễ tân", k: "mono" },
  address: { l: "Địa chỉ", k: "text" },
  directions: { l: "Đường vào", k: "text" },
  checkin: { l: "Nhận phòng từ", k: "conflict", o: [["13:00", "trang web"], ["14:00", "Booking.com"]] },
  checkout: { l: "Trả phòng trước", k: "mono" },
  rec24: { l: "Lễ tân", k: "toggle", t: "Có người ở quầy 24 giờ" },
  early: { l: "Nhận sớm, trả trễ", k: "chips", o: ["Hỏi lễ tân rồi báo lại", "Không nhận"], note: "Bonia không tự hứa nhận sớm, trả trễ" },
  children: { l: "Trẻ em", k: "text" },
  pets: { l: "Thú cưng", k: "chips", o: ["Không nhận", "Nhận, có phụ phí", "Nhận miễn phí"] },
  smoking: { l: "Hút thuốc", k: "chips", o: ["Không hút thuốc trong phòng", "Có phòng hút thuốc"] },
  deposit: { l: "Đặt cọc", k: "text", note: "Bonia không đọc số tài khoản, không nói đã nhận tiền" },
  cancel: { l: "Huỷ phòng", k: "text" },
  amen: { l: "Có ở khách sạn", k: "multi", o: AMENITIES },
  greeting: { l: "Khi nhấc máy", k: "text" },
  closing: { l: "Khi kết thúc", k: "text" },
  voice: { l: "Giọng", k: "voice" },
  english: { l: "Tiếng Anh", k: "toggle", t: "Khách nói tiếng Anh thì Bonia trả lời bằng tiếng Anh" },
  extra: { l: "Điều khác Bonia nên biết", k: "area" },
};

/** Section → cards → field keys. §02 (rooms) has its own layout. */
export const CARDS = {
  s1: [["Thông tin cơ bản", ["name", "type", "phone", "address", "directions"]], ["Nhận & trả phòng", ["checkin", "checkout", "rec24", "early"]], ["Chính sách", ["children", "pets", "smoking", "deposit", "cancel"]], ["Tiện nghi", ["amen"]]],
  s3: [["Lời chào", ["greeting", "closing"]], ["Giọng", ["voice", "english"]]],
  s4: [["Thông tin khác", ["extra"]]],
};

// Tài khoản & thanh toán has its own page (/tai-khoan) since 2026-10-04.
export const SECTIONS = [["s1", "01", "Khách sạn"], ["s2", "02", "Phòng & giá"], ["s3", "03", "Cách nghe máy"], ["s4", "04", "Thông tin khác"]];

/** Bonia's voices, shown as Giọng 1…5 (the engine's own names stay hidden). */
export const VOICE_COUNT = 5;

const room = (name, count, size, bed, max, view, hOn, h2, hn, nOn, night, nFrom, nTo, dOn, wd, we, ok) =>
  ({ name, count, size, bed, max, view, hOn, h2, hn, nOn, night, nFrom, nTo, dOn, wd, we, ok });

export function defaultSettings() {
  const f = {
    name: "Khách sạn Sân Nhài", type: "Khách sạn", phone: "0900 000 300",
    address: "27 đường Sân Nhài, phường Xuân Hòa, TP.HCM",
    directions: "Hẻm ô tô vào tới cửa. Ô tô gửi ở bãi đầu hẻm, 40.000đ một lượt.",
    checkin: null, checkout: "12:00", rec24: true, early: "Hỏi lễ tân rồi báo lại",
    children: "Bé dưới 6 tuổi ngủ chung miễn phí", pets: null, smoking: "Không hút thuốc trong phòng",
    deposit: "Cọc 30% khi đặt, chuyển khoản", cancel: "Huỷ miễn phí trước 24 giờ",
    amen: ["Wi-Fi miễn phí", "Máy lạnh", "Lễ tân 24 giờ", "Thang máy", "Gửi xe máy miễn phí", "Bãi ô tô gần", "Đưa đón sân bay", "Giặt ủi", "Gửi hành lý"],
    quote: true,
    greeting: "Dạ khách sạn Sân Nhài xin nghe ạ.", closing: "Dạ em cảm ơn mình, chúc mình một ngày vui ạ.",
    voice: 1, english: true, extra: "",
  };
  const ok = { name: true, type: true, phone: true, address: false, directions: false, checkin: false, checkout: false, rec24: true, early: true, children: false, pets: false, smoking: true, deposit: false, cancel: false, amen: false, greeting: true, closing: true, voice: true, english: true, extra: true };
  const rooms = [
    room("Standard", "4", "18", "1 giường đôi", "2", "cửa sổ trong", true, 200000, 50000, true, 380000, "22:00", "12:00", true, 450000, 550000, true),
    room("Superior", "4", "22", "1 giường đôi hoặc 2 đơn", "2", "cửa sổ", true, 250000, 60000, true, 450000, "22:00", "12:00", true, 520000, 620000, false),
    room("Deluxe ban công", "3", "28", "1 giường đôi lớn", "2", "ban công hướng phố", false, "", "", true, 550000, "22:00", "12:00", true, 750000, 850000, false),
    room("Family", "2", "34", "2 giường đôi", "4", "cửa sổ hướng phố", false, "", "", false, "", "22:00", "12:00", true, 950000, 1100000, false),
    room("Suite", "1", "45", "1 giường king", "3", "ban công góc", false, "", "", false, "", "22:00", "12:00", true, 1400000, 1600000, true),
  ];
  return { f, ok, rooms };
}

/** Keys still waiting for the owner, in page order: [section, fieldKey]. */
export function pendingList({ ok, rooms }) {
  const out = [];
  ["s1", "s3", "s4"].forEach((sec) => CARDS[sec].forEach(([, keys]) => keys.forEach((k) => { if (!ok[k]) out.push([sec, k]); })));
  rooms.forEach((r, i) => { if (!r.ok) out.push(["s2", `room:${i}`]); });
  return out;
}
