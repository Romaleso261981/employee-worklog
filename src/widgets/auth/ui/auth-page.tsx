"use client";

import Link from "next/link";
import { AuthForm } from "@/features/auth/ui/auth-form";
import { useI18n } from "@/shared/lib/i18n/i18n-context";
import { LanguageSwitcher } from "@/shared/ui/language-switcher/language-switcher";
import styles from "./auth-page.module.css";

interface Props {
  mode: "login" | "register";
}

export function AuthPage({ mode }: Props) {
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <div className={styles.switcher}>
        <LanguageSwitcher />
      </div>
      <AuthForm mode={mode} />
      <p className={styles.text}>
        {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
        <Link href={mode === "login" ? "/register" : "/login"}>
          {mode === "login" ? t("auth.register") : t("auth.login")}
        </Link>
      </p>
    </main>
  );
}
