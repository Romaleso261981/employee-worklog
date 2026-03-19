"use client";

import { AuthProvider } from "@/shared/lib/auth/auth-context";
import { I18nProvider } from "@/shared/lib/i18n/i18n-context";
import { ToastProvider } from "@/shared/ui/toast/toast-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
