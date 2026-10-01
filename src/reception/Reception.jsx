import { useCallback, useRef, useState } from "react";
import { C } from "./tokens.js";
import { readSector, writeSector } from "./sectors.js";
import Nav from "./Nav.jsx";
import Hero from "./Hero.jsx";
import CallDemo from "./CallDemo.jsx";
import NoSetup from "./NoSetup.jsx";
import Settings from "./Settings.jsx";
import Price from "./Price.jsx";
import Start from "./Start.jsx";
import Footer from "./Footer.jsx";

/* bonia.vn/reception — Bonia Tiếp tân, the AI phone receptionist for
 * clinics, hotels & homestays and restaurants. Design handoff v5
 * (2026-09-28, hero redone 2026-09-30): full-screen hero, § 00 call demo,
 * §01 no new number, §02 easy settings, §03 price, §04 contact form, footer. The contact form is the page's only
 * call to action; the receptionist app will live at /reception/app.
 *
 * `sector` (from ?nganh=, else Phòng khám) is the one piece of shared state:
 * picking a call-demo tile selects its sector, and §01's phone, §02's example
 * and the form's Lĩnh vực follow it. `initSector` is the load-time sector;
 * it fixes the tile order (that sector's tile first) for the whole visit. */
export default function Reception() {
  const [sector, setSector] = useState(readSector);
  const initSector = useRef(sector).current;
  const pickSector = useCallback((k) => {
    setSector(k);
    writeSector(k);
  }, []);
  return (
    <div style={{ containerType: "inline-size", minHeight: "100vh", background: C.ground, overflowX: "clip" }}>
      <Nav />
      <main>
        <Hero />
        <CallDemo sector={sector} initSector={initSector} onSector={pickSector} />
        <NoSetup sector={sector} />
        <Settings sector={sector} />
        <Price />
        <Start sector={sector} />
      </main>
      <Footer />
    </div>
  );
}
