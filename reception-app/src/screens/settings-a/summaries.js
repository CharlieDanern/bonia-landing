// One-line summaries for the settings list (3.6 A), computed from the saved
// §01–§05 values so the cards follow every save. §06–§11 keep the stored text.

export function staffOf(state) {
  return state.settings["05"].staff ?? state.staff;
}

/** §05 needs setup while somebody has not been invited yet. */
export function mark05(staff) {
  return staff.some((p) => p.invite === "none") ? "setup" : "ok";
}

export function summaryFor(state, n) {
  const s = state.settings;
  switch (n) {
    case "01": {
      const v = s["01"];
      return `${state.hotel.shortName} · khu Quận 3 cũ · nhận ${v.checkIn}, trả ${v.checkOut} · lễ tân ${v.frontDesk}`;
    }
    case "02": {
      const v = s["02"];
      const count = v.rooms.reduce((a, r) => a + (r.count || 0), 0);
      const modes = [
        v.rooms.some((r) => r.hourly) && "theo giờ",
        v.rooms.some((r) => r.overnight) && "qua đêm",
        v.rooms.some((r) => r.daily) && "theo ngày",
        v.monthly && "theo tháng",
      ].filter(Boolean);
      return `${count} phòng · ${v.rooms.length} loại · ${modes.join(", ")}`;
    }
    case "03": {
      const v = s["03"];
      const mode = v.mode === "answer" ? "Chỉ trả lời thông tin" : "Ghi yêu cầu, khách sạn xác nhận";
      const sug = v.suggestMax > 0 ? `gợi ý tối đa ${v.suggestMax} phòng khác` : "không gợi ý phòng khác";
      return `${mode} · ${sug}`;
    }
    case "04": {
      const t = s["04"].tasks;
      return `${t.length} loại việc · ${t.filter((x) => x.notify).length} báo ngay`;
    }
    case "05":
      return `${staffOf(state).length} người nhận báo · ${s["05"].emergencies.length} tình huống khẩn cấp`;
    default:
      return state.sections.find((x) => x.n === n)?.summary ?? "";
  }
}
