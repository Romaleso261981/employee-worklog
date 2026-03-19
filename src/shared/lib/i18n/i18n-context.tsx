"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { Locale, translations, TranslationPath } from "./translations";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: TranslationPath) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getByPath(locale: Locale, path: TranslationPath): string {
  const [group, key] = path.split(".") as [keyof typeof translations.uk, string];
  return (translations[locale][group] as Record<string, string>)[key];
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return "uk";
    }

    const saved = window.localStorage.getItem("locale");
    return saved === "uk" || saved === "en" ? saved : "uk";
  });

  const value = useMemo(
    () => ({
      locale,
      setLocale: (nextLocale: Locale) => {
        setLocale(nextLocale);
        window.localStorage.setItem("locale", nextLocale);
      },
      t: (path: TranslationPath) => getByPath(locale, path),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
