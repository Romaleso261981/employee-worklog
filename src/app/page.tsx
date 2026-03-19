"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/lib/auth/auth-context";
import { useI18n } from "@/shared/lib/i18n/i18n-context";
import { CenteredLoader } from "@/shared/ui/centered-loader/centered-loader";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (user) {
      router.replace("/dashboard");
      return;
    }

    router.replace("/login");
  }, [loading, router, user]);

  return <CenteredLoader label={t("common.loadingApp")} />;
}
