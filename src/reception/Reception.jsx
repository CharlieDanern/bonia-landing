import { useCallback, useRef, useState } from "react";
import { C } from "./tokens.js";
import { readSector, writeSector } from "./sectors.js";
import Nav from "./Nav.jsx";
import Hero from "./Hero.jsx";
import CallDemo from "./CallDemo.jsx";
import NoSetup from "./NoSetup.jsx";
import Lookup from "./Lookup.jsx";
import Price from "./Price.jsx";
import Start from "./Start.jsx";
import Footer from "./Footer.jsx";

/* bonia.vn/reception — Bonia Tiếp tân, the AI phone receptionist for
 * clinics, hotels & homestays and restaurants. Design handoff v6
 * (2026-10-07, on v5 of 2026-09-28): hero (#nghe and #demo buttons), § 00
 * call demo (#nghe), §01 no new number, §02 the settings lookup demo
 * (#cai-dat), §03 price (#gia), §04 contact form (#demo), footer. Every
 * button leads to the contact form or the call demo; the receptionist app
 * lives at /reception/app and isn't linked from here.
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
        <Lookup sector={sector} />
        <Price />
        <Start sector={sector} />
      </main>
      <Footer />
    </div>
  );
}
