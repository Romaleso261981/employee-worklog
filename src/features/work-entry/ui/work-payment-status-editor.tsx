"use client";

import { useState } from "react";
import { WorkPaymentStatus, WORK_PAYMENT_STATUSES } from "@/entities/work/model/types";
import { updateWorkPaymentStatus } from "@/entities/work/model/work-service";
import { useI18n } from "@/shared/lib/i18n/i18n-context";
import { WorkPaymentStatusBadge } from "./work-payment-status-badge";
import styles from "./work-payment-status-editor.module.css";

interface Props {
  workId: string;
  status: WorkPaymentStatus;
  onUpdated: () => Promise<void>;
}

export function WorkPaymentStatusEditor({ workId, status, onUpdated }: Props) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setStatus = async (next: WorkPaymentStatus) => {
    if (next === status || saving) {
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateWorkPaymentStatus(workId, next);
      await onUpdated();
    } catch {
      setError(t("workPayment.updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <p className={styles.heading}>{t("workPayment.sectionTitle")}</p>
      <p className={styles.hint}>{t("workPayment.sectionHint")}</p>
      <div className={styles.options} role="radiogroup" aria-label={t("workPayment.sectionTitle")}>
        {WORK_PAYMENT_STATUSES.map((value) => (
          <label key={value} className={`${styles.option} ${status === value ? styles.optionActive : ""}`}>
            <input
              type="radio"
              name={`payment-${workId}`}
              value={value}
              checked={status === value}
              disabled={saving}
              onChange={() => void setStatus(value)}
            />
            <WorkPaymentStatusBadge status={value} />
          </label>
        ))}
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
