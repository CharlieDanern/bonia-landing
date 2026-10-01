import { useRef } from "react";
import { C } from "./tokens.js";
import { useScrollReveal } from "./reveal.js";
import Nav from "./Nav.jsx";
import Hero from "./Hero.jsx";
import Problem from "./Problem.jsx";
import Features from "./Features.jsx";
import Steps from "./Steps.jsx";
import Price from "./Price.jsx";
import Trust from "./Trust.jsx";
import Faq from "./Faq.jsx";
import Download from "./Download.jsx";
import Footer from "./Footer.jsx";

/* bonia.vn/retail — Bonia Cá nhân, the consumer call-screening app (the old
 * bonia.vn content, restyled). Design handoff "Bonia Retail.dc.html"
 * (2026-10-01, with the founder's edits), in the /reception visual language:
 * sticky nav, hero with the orb, §01 Vấn đề, §02 Giải pháp (#tinhnang),
 * §03 Cách dùng (#cachdung), §04 Chi phí "0 VNĐ", §05 Riêng tư & tin cậy,
 * §06 Câu hỏi (#cauhoi), Tải app (#taiapp), footer. Numbered from §01 (founder
 * 2026-10-01); the design's §01 Ví dụ was dropped. */
export default function Retail() {
  const root = useRef(null);
  useScrollReveal(root);
  return (
    <div ref={root} style={{ minHeight: "100vh", background: C.ground, overflowX: "clip" }}>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Features />
        <Steps />
        <Price />
        <Trust />
        <Faq />
        <Download />
      </main>
      <Footer />
    </div>
  );
}
