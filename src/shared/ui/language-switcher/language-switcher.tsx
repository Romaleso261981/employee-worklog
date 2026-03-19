"use client";

import { useI18n } from "@/shared/lib/i18n/i18n-context";
import styles from "./language-switcher.module.css";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <label className={styles.wrapper}>
      <span>{t("common.language")}</span>
      <select value={locale} onChange={(event) => setLocale(event.target.value as "uk" | "en")}> 
        <option value="uk">UA</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}
