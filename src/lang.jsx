import React, { createContext, useContext, useEffect, useState } from "react";
import {
  COPY_VI,
  COPY_EN,
  HUONGDAN_VI,
  HUONGDAN_EN,
  CHROME_VI,
  CHROME_EN,
} from "./copy.js";

// Language switch for the SPA only. Static pages (privacy/terms/support/
// so-chinh-thuc) stay Vietnamese — their audience is Vietnamese users and
// regulators; the EN toggle exists for investors skimming the landing page.
const STORAGE_KEY = "bonia_lang";

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved === "en" ? "en" : "vi";
    } catch {
      return "vi";
    }
  });

  const setLang = (next) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private-mode Safari etc. — the toggle still works for the session.
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = {
    lang,
    setLang,
    copy: lang === "en" ? COPY_EN : COPY_VI,
    guide: lang === "en" ? HUONGDAN_EN : HUONGDAN_VI,
    chrome: lang === "en" ? CHROME_EN : CHROME_VI,
  };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error("useLang must be used inside <LangProvider>");
  }
  return ctx;
}

/** The VI · EN pill. Compact enough for the mobile nav row. */
export function LangToggle({ accent = "#7B4A2D" }) {
  const { lang, setLang } = useLang();
  const opt = (code, label) => (
    <button
      type="button"
      onClick={() => setLang(code)}
      className="px-2 py-0.5 text-[11px] uppercase tracking-[0.14em] rounded-full transition-colors"
      style={
        lang === code
          ? { background: accent, color: "#fff" }
          : { color: "#7A6F62" }
      }
      aria-pressed={lang === code}
    >
      {label}
    </button>
  );
  return (
    <div
      className="flex items-center gap-0.5 p-0.5 rounded-full border"
      style={{ borderColor: "#D9D0BF", background: "#EFE9DD" }}
      role="group"
      aria-label="Language"
    >
      {opt("vi", "VI")}
      {opt("en", "EN")}
    </div>
  );
}
