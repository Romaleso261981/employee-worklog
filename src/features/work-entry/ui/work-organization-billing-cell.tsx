"use client";

import { useEffect, useState } from "react";
import { updateWorkOrganizationBilling } from "@/entities/work/model/work-service";
import { useI18n } from "@/shared/lib/i18n/i18n-context";
import styles from "./work-organization-billing-cell.module.css";

interface Props {
  workId: string;
  organizationAmount: number;
  organizationPaid: boolean;
  onUpdated: () => Promise<void>;
}

function parseAmount(raw: string): number {
  const normalized = raw.replace(",", ".").trim();
  if (normalized === "") {
    return 0;
  }
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function WorkOrganizationBillingCell({ workId, organizationAmount, organizationPaid, onUpdated }: Props) {
  const { t } = useI18n();
  const [amountText, setAmountText] = useState(organizationAmount.toFixed(2));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAmountText(organizationAmount.toFixed(2));
  }, [organizationAmount]);

  const persist = async (nextAmount: number, nextPaid: boolean) => {
    if (saving) {
      return;
    }
    setSaving(true);
    try {
      await updateWorkOrganizationBilling(workId, {
        organizationAmount: nextAmount,
        organizationPaid: nextPaid,
      });
      await onUpdated();
    } catch {
      setAmountText(organizationAmount.toFixed(2));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.cell}>
      <input
        className={styles.amountInput}
        type="text"
        inputMode="decimal"
        disabled={saving}
        aria-label={t("workOrganization.amountLabel")}
        value={amountText}
        onChange={(event) => setAmountText(event.target.value)}
        onBlur={() => {
          const next = parseAmount(amountText);
          setAmountText(next.toFixed(2));
          if (next !== organizationAmount) {
            void persist(next, organizationPaid);
          }
        }}
        onClick={(event) => event.stopPropagation()}
      />
      <label className={styles.paidToggle}>
        <input
          type="checkbox"
          checked={organizationPaid}
          disabled={saving}
          onChange={(event) => void persist(organizationAmount, event.target.checked)}
          onClick={(event) => event.stopPropagation()}
        />
        <span>{organizationPaid ? t("workOrganization.paidShort") : t("workOrganization.unpaidShort")}</span>
      </label>
    </div>
  );
}
