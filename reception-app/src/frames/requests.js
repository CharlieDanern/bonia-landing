// Frames owned by the requests screens: { "<frameId>": "<path>?<query>" }.
// frameId = PNG basename in design/frames ("3.3_B", "TV_A"); path is
// relative to the app base (no /reception/app prefix). Screens read
// ?f=<frameId> to open the exact state drawn in that frame.
export default {
  "3.3_A": "/yeu-cau/kevin?f=3.3_A",
  "3.3_B": "/yeu-cau/kevin?f=3.3_B", // decision written, message sheet open (desktop: copy + QR)
  "3.3_C": "/yeu-cau/kevin?f=3.3_C", // back from the sheet: "Bạn đã gửi tin…?"
  "3.3_D": "/yeu-cau/long?f=3.3_D",
  "3.3_E": "/yeu-cau/ngan?f=3.3_E", // after Kevin took the last Deluxe: confirm asks again
  "3.3_F": "/yeu-cau/302?f=3.3_F",
  "3.3_G": "/yeu-cau/205?f=3.3_G", // Giao cho … sheet
  "3.3_H": "/yeu-cau/huong?f=3.3_H",
  "3.3_I": "/yeu-cau/thu?f=3.3_I",
  "3.3_J": "/yeu-cau?state=empty&f=3.3_J",
  "3.3_K": "/yeu-cau?state=loading&f=3.3_K",
  "3.3_L": "/yeu-cau/kevin?f=3.3_L", // decision did not save
};
