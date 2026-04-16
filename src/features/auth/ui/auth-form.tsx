"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { authSchema } from "@/shared/lib/validation/schemas";
import { Input } from "@/shared/ui/input/input";
import { useAuth } from "@/shared/lib/auth/auth-context";
import { useI18n } from "@/shared/lib/i18n/i18n-context";
import { EyeIcon, EyeSlashIcon } from "@/shared/ui/icons/visibility-icons";
import styles from "./auth-form.module.css";

type AuthValues = {
  email: string;
  password: string;
};

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { login, register } = useAuth();
  const { t } = useI18n();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register: bind,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      if (mode === "login") {
        await login(values.email, values.password);
      } else {
        await register(values.email, values.password);
      }

      router.replace("/dashboard");
    } catch (error) {
      if (error instanceof FirebaseError) {
        const firebaseMessageByCode: Record<string, string> = {
          "auth/email-already-in-use": "Цей email вже використовується.",
          "auth/invalid-email": "Некоректний email.",
          "auth/operation-not-allowed":
            "У Firebase не увімкнено Email/Password авторизацію.",
          "auth/weak-password": "Пароль занадто слабкий.",
          "auth/user-not-found": "Користувача з таким email не знайдено.",
          "auth/wrong-password": "Неправильний пароль.",
          "auth/invalid-credential": "Невірний email або пароль.",
          "auth/too-many-requests": "Забагато спроб. Спробуйте пізніше.",
        };
        setSubmitError(firebaseMessageByCode[error.code] ?? `${t("auth.failed")} (${error.code})`);
        return;
      }

      setSubmitError(t("auth.failed"));
    }
  });

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <h1>{mode === "login" ? t("auth.login") : t("auth.register")}</h1>
      <Input label={t("auth.email")} type="email" {...bind("email")} error={errors.email?.message} />
      <Input
        label={t("auth.password")}
        {...bind("password")}
        type={showPassword ? "text" : "password"}
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        error={errors.password?.message}
        endAdornment={
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
            title={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
          >
            {showPassword ? <EyeSlashIcon className={styles.passwordToggleIcon} /> : <EyeIcon className={styles.passwordToggleIcon} />}
          </button>
        }
      />
      {submitError ? <p className={styles.error}>{submitError}</p> : null}
      <button className="btn-tab btn-tab--on" disabled={isSubmitting} type="submit">
        {mode === "login" ? t("auth.submitLogin") : t("auth.submitRegister")}
      </button>
    </form>
  );
}
