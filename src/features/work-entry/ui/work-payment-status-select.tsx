"use client";

import { useState } from "react";
import { WorkPaymentStatus, WORK_PAYMENT_STATUSES } from "@/entities/work/model/types";
import { updateWorkPaymentStatus } from "@/entities/work/model/work-service";
import { useI18n } from "@/shared/lib/i18n/i18n-context";
import { WorkPaymentStatusBadge } from "./work-payment-status-badge";
import styles from "./work-payment-status-select.module.css";

interface Props {
  workId: string;
  status: WorkPaymentStatus;
  onUpdated: () => Promise<void>;
  compact?: boolean;
}

export function WorkPaymentStatusSelect({ workId, status, onUpdated, compact }: Props) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);

  const onChange = async (next: WorkPaymentStatus) => {
    if (next === status || saving) {
      return;
    }
    setSaving(true);
    try {
      await updateWorkPaymentStatus(workId, next);
      await onUpdated();
    } catch {
      // badge stays on previous value until reload
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={compact ? styles.compact : styles.wrap}>
      <select
        className={styles.select}
        value={status}
        disabled={saving}
        aria-label={t("workPayment.sectionTitle")}
        onChange={(e) => void onChange(e.target.value as WorkPaymentStatus)}
        onClick={(e) => e.stopPropagation()}
      >
        {WORK_PAYMENT_STATUSES.map((value) => (
          <option key={value} value={value}>
            {t(
              value === "pending"
                ? "workPayment.pending"
                : value === "submitted"
                  ? "workPayment.submitted"
                  : "workPayment.paid",
            )}
          </option>
        ))}
      </select>
      {!compact ? <WorkPaymentStatusBadge status={status} /> : null}
    </div>
  );
}
