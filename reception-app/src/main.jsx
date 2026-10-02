import React from "react";
import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import { StoreProvider } from "./store/index.jsx";
import App from "./App.jsx";
import "./styles/tokens.css";
import "./styles/base.css";
import "./components/ui/ui.css";

// Router base matches vite.config.js `base` (bonia.vn/reception/app/).
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <StoreProvider>
      <Router base={BASE}>
        <App />
      </Router>
    </StoreProvider>
  </React.StrictMode>
);
