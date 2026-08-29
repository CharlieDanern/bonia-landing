import React from "react";
import ReactDOM from "react-dom/client";
import gsap from "gsap";
import Business from "./Business.jsx";
import "./business.css";

// bonia-void.js is the handoff's custom element, ported verbatim; it reads
// window.gsap. Assign it from the npm package before the element loads so the
// prototype's cdnjs <script> tag is never needed.
window.gsap = gsap;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Business />
  </React.StrictMode>,
);
