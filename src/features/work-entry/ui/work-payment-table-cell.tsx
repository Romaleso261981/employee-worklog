"use client";

import { WorkPaymentStatus } from "@/entities/work/model/types";
import { WorkPaymentStatusBadge } from "./work-payment-status-badge";
import { WorkPaymentStatusSelect } from "./work-payment-status-select";
import styles from "./work-payment-table-cell.module.css";

interface Props {
  workId: string;
  status: WorkPaymentStatus;
  canEdit: boolean;
  onUpdated: () => Promise<void>;
}

export function WorkPaymentTableCell({ workId, status, canEdit, onUpdated }: Props) {
  if (!canEdit) {
    return <WorkPaymentStatusBadge status={status} />;
  }

  return (
    <div className={styles.cell}>
      <WorkPaymentStatusBadge status={status} />
      <WorkPaymentStatusSelect workId={workId} status={status} onUpdated={onUpdated} compact />
    </div>
  );
}
