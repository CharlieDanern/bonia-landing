import React from "react";
import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import App from "./App.jsx";
import { LayoutProvider } from "./layout.jsx";
import { AppStateProvider } from "./state.jsx";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/app.css";

// Router base matches vite.config.js `base` (bonia.vn/reception/app/).
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppStateProvider>
      <LayoutProvider>
        <Router base={BASE}>
          <App />
        </Router>
      </LayoutProvider>
    </AppStateProvider>
  </React.StrictMode>
);
