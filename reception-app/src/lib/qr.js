import QRCode from "qrcode";

// Real QR matrices (README: mocks are placeholders, generate real codes).
// Returns { size, cells: Uint8Array } so components can draw the same
// span grid the frames use. Short payloads land on version 2 (25 × 25),
// the size every mock shows.
const cache = new Map();

export function qrMatrix(text) {
  const key = String(text ?? "");
  if (cache.has(key)) return cache.get(key);
  let qr;
  try {
    qr = QRCode.create(key || " ", { errorCorrectionLevel: "L" });
  } catch {
    qr = QRCode.create(" ", { errorCorrectionLevel: "L" });
  }
  const out = { size: qr.modules.size, cells: qr.modules.data };
  cache.set(key, out);
  return out;
}
