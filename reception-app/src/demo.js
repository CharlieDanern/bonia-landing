// Demo mode (?demo=1, kept for the browser session; on by default in `vite dev`):
// sample data, the call simulations, no backend. ?demo=0 turns it off.
function readSession(key, d) {
  try {
    const v = sessionStorage.getItem(key);
    return v === null ? d : JSON.parse(v);
  } catch {
    return d;
  }
}

function writeSession(key, v) {
  try {
    sessionStorage.setItem(key, JSON.stringify(v));
  } catch {
    // private mode: the choice lasts until reload
  }
}

export function isDemo() {
  const q = new URLSearchParams(window.location.search).get("demo");
  if (q === "0") writeSession("tt3.demo", false);
  if (q === "1") writeSession("tt3.demo", true);
  return readSession("tt3.demo", import.meta.env.DEV);
}
