// Frames owned by the settings-b screens: { "<frameId>": "<path>?<query>" }.
// frameId = PNG basename in design/frames ("3.3_B", "TV_A"); path is
// relative to the app base (no /reception/app prefix). Screens read
// ?f=<frameId> to open the exact state drawn in that frame, e.g.
//   "3.3_B": "/yeu-cau/kevin?f=3.3_B"
//
// 3.6 O is the /cai-dat list in its empty state, drawn by settings-a's
// List.jsx (?state=empty); registered here because 3.6 H–Q are one group.
export default {
  "3.6_H": "/cai-dat/06?f=3.6_H",
  "3.6_I": "/cai-dat/07?f=3.6_I",
  "3.6_J": "/cai-dat/08?f=3.6_J",
  "3.6_K": "/cai-dat/09?f=3.6_K",
  "3.6_L": "/cai-dat/11?f=3.6_L",
  "3.6_M": "/tai-khoan?f=3.6_M",
  "3.6_N": "/tro-giup?f=3.6_N",
  "3.6_O": "/cai-dat?state=empty&f=3.6_O",
  "3.6_P": "/cai-dat/06?state=loading&f=3.6_P",
  "3.6_Q": "/cai-dat/06?state=error&f=3.6_Q",
  TV_A: "/viec?f=TV_A",
  TV_B: "/viec?f=TV_B",
};
