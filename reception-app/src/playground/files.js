// A file the partner drops on "Thông tin cho Bonia" (phase 2), made ready for the backend to read (POST
// /reception/web/playground/read): a spreadsheet or a text file as its text (read here); a photo made smaller (a
// phone photo is 3–8 MB, the menu reads as well at 2000 px); a PDF or a Word file as it is. The backend takes up to
// 6 MB of file.

export const MAX_BYTES = 6 * 1024 * 1024;
export const ACCEPT = ".pdf,.docx,.png,.jpg,.jpeg,.webp,.gif,.heic,.xlsx,.xls,.csv,.txt,.md";
const SHEET = /\.(xlsx|xls|csv)$/i;
const TEXT = /\.(txt|md)$/i;
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const base64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

/** A photo, at most 2000 px on its long side, as JPEG. */
async function shrink(file) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  const g = c.getContext("2d");
  g.fillStyle = "#fff";
  g.fillRect(0, 0, c.width, c.height);
  g.drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
  return base64(await blob.arrayBuffer());
}

/** Every sheet's rows as lines, cells joined by " | ". */
async function sheetText(file) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false, raw: false });
  return wb.SheetNames.map((n) => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: "", blankrows: false });
    const lines = rows.map((r) => r.map((x) => String(x).trim()).filter(Boolean).join(" | ")).filter(Boolean);
    return lines.length ? `${wb.SheetNames.length > 1 ? `# ${n}\n` : ""}${lines.join("\n")}` : "";
  }).filter(Boolean).join("\n\n");
}

/** The body to read this file, or throws { error: "type" | "too_large" | "empty" }. */
export async function readBody(file) {
  const name = file.name || "tệp";
  if (SHEET.test(name)) {
    const text = await sheetText(file);
    if (!text.trim()) throw { error: "empty" };
    return { name, text: text.slice(0, 200_000) };
  }
  if (TEXT.test(name) || file.type === "text/plain") {
    const text = await file.text();
    if (!text.trim()) throw { error: "empty" };
    return { name, text: text.slice(0, 200_000) };
  }
  if (file.type.startsWith("image/") || /\.heic$/i.test(name)) {
    try {
      return { name, mime: "image/jpeg", data: await shrink(file) };
    } catch {
      throw { error: "type" }; // a format this browser can't open (HEIC outside Safari)
    }
  }
  const mime = file.type === "application/pdf" || /\.pdf$/i.test(name) ? "application/pdf" : file.type === DOCX || /\.docx$/i.test(name) ? DOCX : null;
  if (!mime) throw { error: "type" };
  if (file.size > MAX_BYTES) throw { error: "too_large" };
  return { name, mime, data: base64(await file.arrayBuffer()) };
}
