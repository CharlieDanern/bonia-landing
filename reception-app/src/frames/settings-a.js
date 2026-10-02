// Frames owned by the settings-a screens: { "<frameId>": "<path>?<query>" }.
// frameId = PNG basename in design/frames ("3.3_B", "TV_A"); path is
// relative to the app base (no /reception/app prefix). Screens read
// ?f=<frameId> to open the exact state drawn in that frame, e.g.
//   "3.3_B": "/yeu-cau/kevin?f=3.3_B"
export default {
  "3.6_A": "/cai-dat",
  "3.6_B": "/cai-dat/01",
  // Superior with its hourly price edited 220.000 → 240.000, not saved yet.
  "3.6_C": "/cai-dat/02?loai=superior&f=3.6_C",
  "3.6_D": "/cai-dat/03",
  "3.6_E": "/cai-dat/04",
  // Invite card for anh Tư open over the staff list.
  "3.6_F": "/cai-dat/05?f=3.6_F",
  // Same page scrolled to its second half (deadlines, transfer, emergencies).
  "3.6_G": "/cai-dat/05?f=3.6_G",
};
