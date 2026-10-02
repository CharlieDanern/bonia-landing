// Người nhận báo (brief §6, frames 3.3 G, 3.6 F, Trang việc).
// Owner: settings-a (§05). Read by requests (Giao cho …) and the task page.
// Nobody here logs in: they only receive pushes and tap "Xong".

export const STAFF_GROUPS = [
  { id: "don-phong", label: "Dọn phòng" },
  { id: "le-tan", label: "Lễ tân" },
  { id: "ky-thuat", label: "Kỹ thuật" },
  { id: "chu", label: "Chủ" },
];

// invite: on = ĐANG NHẬN BÁO · invited = ĐÃ GỬI MỜI · none = CHƯA MỜI
export const STAFF = [
  {
    id: "chi-diep",
    name: "Chị Diệp",
    short: "chị Diệp",
    group: "chu",
    phone: "0900 000 301",
    role: "Khiếu nại, gấp ban đêm",
    shift: "",
    onShift: false,
    invite: "on",
  },
  {
    id: "tam",
    name: "Tâm",
    short: "Tâm",
    group: "le-tan",
    phone: "0900 000 302",
    role: "07:00–15:00",
    shift: "07:00–15:00 · đang trực",
    onShift: true,
    invite: "on",
  },
  {
    id: "nhu",
    name: "Như",
    short: "Như",
    group: "le-tan",
    phone: "0900 000 303",
    role: "15:00–23:00",
    shift: "15:00–23:00",
    onShift: false,
    invite: "on",
  },
  {
    id: "anh-phong",
    name: "Anh Phong",
    short: "anh Phong",
    group: "le-tan",
    phone: "0900 000 304",
    role: "Đêm 19:00–07:00",
    shift: "Đêm 19:00–07:00",
    onShift: false,
    invite: "invited",
  },
  {
    id: "co-hai",
    name: "Cô Hai",
    short: "cô Hai",
    group: "don-phong",
    phone: "0900 000 305",
    role: "Ca ngày",
    shift: "Đang trực",
    onShift: true,
    invite: "on",
  },
  {
    id: "chi-lan",
    name: "Chị Lan",
    short: "chị Lan",
    group: "don-phong",
    phone: "0900 000 306",
    role: "Ca ngày",
    shift: "Đang trực",
    onShift: true,
    invite: "on",
  },
  {
    id: "anh-tu",
    name: "Anh Tư",
    short: "anh Tư",
    group: "ky-thuat",
    phone: "0900 000 307",
    role: "Gọi khi cần",
    shift: "Gọi khi cần",
    onShift: false,
    invite: "none",
    inviteLink: "bonia.vn/r/7F3K-tu",
  },
];

export const STAFF_BY_ID = Object.fromEntries(STAFF.map((s) => [s.id, s]));

// Order of the §05 table and the Giao cho … sheet (frames differ: the
// sheet starts with Dọn phòng, §05 with Chủ).
export const SETTINGS_ORDER = ["chi-diep", "tam", "nhu", "anh-phong", "co-hai", "chi-lan", "anh-tu"];
export const ASSIGN_ORDER = ["co-hai", "chi-lan", "tam", "nhu", "anh-phong", "anh-tu", "chi-diep"];

export const INVITE_LABELS = {
  on: "ĐANG NHẬN BÁO",
  invited: "ĐÃ GỬI MỜI",
  none: "CHƯA MỜI",
};

// Trang việc (TV A/B): what one staff member sees from a push. Only the
// task: no guest name or number, no access to the hotel app.
export const TASK_PAGE = {
  requestId: "302",
  hotel: "Sân Nhài",
  staffId: "anh-tu",
  room: "302",
  task: "Máy lạnh không lạnh",
  note: "Khách nói bật 18 độ vẫn nóng.",
  urgent: true,
  reportedAt: "13:58",
  dueAt: "14:13",
  pushTime: "14:13",
  pushDate: "Thứ Năm, 8 tháng 10",
  doneAt: "14:16",
  linkHours: 24,
};
