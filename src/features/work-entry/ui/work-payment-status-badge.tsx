"use client";

import { WorkPaymentStatus } from "@/entities/work/model/types";
import { useI18n } from "@/shared/lib/i18n/i18n-context";
import styles from "./work-payment-status.module.css";

const STATUS_I18N: Record<WorkPaymentStatus, "workPayment.pending" | "workPayment.submitted" | "workPayment.paid"> = {
  pending: "workPayment.pending",
  submitted: "workPayment.submitted",
  paid: "workPayment.paid",
};

export function WorkPaymentStatusBadge({ status }: { status: WorkPaymentStatus }) {
  const { t } = useI18n();
  return (
    <span className={`${styles.badge} ${styles[`badge_${status}`]}`}>{t(STATUS_I18N[status])}</span>
  );
}
