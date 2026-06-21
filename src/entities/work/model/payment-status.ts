export type WorkPaymentStatus = "pending" | "submitted" | "paid";

export const WORK_PAYMENT_STATUSES: WorkPaymentStatus[] = ["pending", "submitted", "paid"];

export function normalizeWorkPaymentStatus(value: unknown): WorkPaymentStatus {
  if (value === "submitted" || value === "paid" || value === "pending") {
    return value;
  }
  return "pending";
}
