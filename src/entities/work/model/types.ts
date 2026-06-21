import type { WorkPaymentStatus } from "./payment-status";
import { normalizeWorkPaymentStatus } from "./payment-status";

export type { WorkPaymentStatus } from "./payment-status";
export { WORK_PAYMENT_STATUSES, normalizeWorkPaymentStatus } from "./payment-status";

export interface WorkEntry {
  id: string;
  userId: string;
  userEmail: string;
  workDate: string;
  description: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  /** pending — ще не подано; submitted — подано на оплату; paid — оплачено */
  paymentStatus: WorkPaymentStatus;
}

export interface CreateWorkEntryPayload {
  userId: string;
  userEmail: string;
  workDate: string;
  description: string;
  categoryId: string;
  categoryName: string;
  amount?: number;
}

export interface SalaryPayout {
  id: string;
  userId: string;
  userEmail: string;
  payoutDate: string;
  description: string;
  amount: number;
}

export interface CreateSalaryPayoutPayload {
  userId: string;
  userEmail: string;
  payoutDate: string;
  description: string;
  amount: number;
}
