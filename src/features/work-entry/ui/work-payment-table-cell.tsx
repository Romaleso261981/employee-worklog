"use client";

import { useState } from "react";
import { WorkPaymentStatus } from "@/entities/work/model/types";
import { WorkPaymentStatusBadge } from "./work-payment-status-badge";
import { WorkPaymentStatusSelect } from "./work-payment-status-select";

interface Props {
  workId: string;
  status: WorkPaymentStatus;
  canEdit: boolean;
  onUpdated: () => Promise<void>;
}

export function WorkPaymentTableCell({ workId, status, canEdit, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);

  if (!canEdit) {
    return <WorkPaymentStatusBadge status={status} />;
  }

  if (!editing) {
    return <WorkPaymentStatusBadge status={status} onClick={() => setEditing(true)} />;
  }

  return (
    <WorkPaymentStatusSelect
      workId={workId}
      status={status}
      compact
      selectOnly
      autoFocus
      onUpdated={async () => {
        await onUpdated();
        setEditing(false);
      }}
      onClose={() => setEditing(false)}
    />
  );
}
