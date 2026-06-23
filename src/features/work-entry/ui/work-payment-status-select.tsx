"use client";

import { useEffect, useRef, useState } from "react";
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
  selectOnly?: boolean;
  autoFocus?: boolean;
  onClose?: () => void;
}

export function WorkPaymentStatusSelect({
  workId,
  status,
  onUpdated,
  compact,
  selectOnly,
  autoFocus,
  onClose,
}: Props) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (!autoFocus) {
      return;
    }
    const el = selectRef.current;
    if (!el) {
      return;
    }
    el.focus();
    try {
      el.showPicker?.();
    } catch {
      // showPicker not supported or blocked
    }
  }, [autoFocus]);

  const onChange = async (next: WorkPaymentStatus) => {
    if (next === status || saving) {
      onClose?.();
      return;
    }
    setSaving(true);
    try {
      await updateWorkPaymentStatus(workId, next);
      await onUpdated();
    } catch {
      // badge stays on previous value until reload
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const select = (
    <select
      ref={selectRef}
      className={styles.select}
      value={status}
      disabled={saving}
      aria-label={t("workPayment.sectionTitle")}
      onChange={(e) => void onChange(e.target.value as WorkPaymentStatus)}
      onBlur={() => onClose?.()}
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
  );

  if (selectOnly) {
    return <div className={compact ? styles.compact : styles.wrap}>{select}</div>;
  }

  return (
    <div className={compact ? styles.compact : styles.wrap}>
      {select}
      {!compact ? <WorkPaymentStatusBadge status={status} /> : null}
    </div>
  );
}
