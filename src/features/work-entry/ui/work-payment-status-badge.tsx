"use client";

import { WorkPaymentStatus } from "@/entities/work/model/types";
import { useI18n } from "@/shared/lib/i18n/i18n-context";
import styles from "./work-payment-status.module.css";

const STATUS_I18N: Record<WorkPaymentStatus, "workPayment.pending" | "workPayment.submitted" | "workPayment.paid"> = {
  pending: "workPayment.pending",
  submitted: "workPayment.submitted",
  paid: "workPayment.paid",
};

export function WorkPaymentStatusBadge({
  status,
  selected,
  onClick,
}: {
  status: WorkPaymentStatus;
  selected?: boolean;
  onClick?: () => void;
}) {
  const { t } = useI18n();
  const className = [
    styles.badge,
    styles[`badge_${status}`],
    onClick ? styles.badgeInteractive : "",
    selected ? styles.badgeSelected : "",
  ]
    .filter(Boolean)
    .join(" ");
  const label = t(STATUS_I18N[status]);

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} aria-pressed={Boolean(selected)} title={label}>
        {label}
      </button>
    );
  }

  return <span className={className}>{label}</span>;
}
