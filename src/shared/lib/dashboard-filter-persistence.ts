import type { WorkPaymentStatus } from "@/entities/work/model/types";
import { WORK_PAYMENT_STATUSES } from "@/entities/work/model/types";
import type { DateFilterPreset } from "@/shared/lib/date-filter";

const STORAGE_VERSION = 1;
const storageKey = (userId: string) => `tasktrackpro.dashboardFilters.v${STORAGE_VERSION}.${userId}`;

type SortField = "date" | "description" | "category" | "amount" | "worker";
type SortDirection = "desc" | "asc";
type PayoutSortField = "date" | "description" | "amount" | "worker";

export interface DashboardPersistedFilters {
  categoryFilterIds: string[];
  paymentStatusFilter: "" | WorkPaymentStatus;
  dateFilterPreset: DateFilterPreset;
  dateFilterYear: string;
  dateFilterMonth: string;
  dateRangeFrom: string;
  dateRangeTo: string;
  workerFilter: string;
  sortField: SortField;
  sortDirection: SortDirection;
  payoutSearchTerm: string;
  payoutWorkerFilter: string;
  payoutDateFilterPreset: DateFilterPreset;
  payoutDateFilterYear: string;
  payoutDateFilterMonth: string;
  payoutDateRangeFrom: string;
  payoutDateRangeTo: string;
  payoutSortField: PayoutSortField;
  payoutSortDirection: SortDirection;
  financeMonth: string;
  adminView: "works" | "payouts" | "admin";
  employeeView: "main" | "works" | "waste";
  adminSelectedWorkerEmails: string[] | null;
}

const DATE_PRESETS: DateFilterPreset[] = ["all", "year", "month", "range"];
const SORT_FIELDS: SortField[] = ["date", "description", "category", "amount", "worker"];
const PAYOUT_SORT_FIELDS: PayoutSortField[] = ["date", "description", "amount", "worker"];
const SORT_DIRECTIONS: SortDirection[] = ["desc", "asc"];
const ADMIN_VIEWS = ["works", "payouts", "admin"] as const;
const EMPLOYEE_VIEWS = ["main", "works", "waste"] as const;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function parsePaymentStatus(value: unknown): "" | WorkPaymentStatus {
  if (value === "") {
    return "";
  }
  if (typeof value === "string" && (WORK_PAYMENT_STATUSES as readonly string[]).includes(value)) {
    return value as WorkPaymentStatus;
  }
  return "";
}

export function loadDashboardFilters(userId: string): DashboardPersistedFilters | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) {
      return null;
    }
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (data.v !== STORAGE_VERSION) {
      return null;
    }

    let adminSelectedWorkerEmails: string[] | null = null;
    if (data.adminSelectedWorkerEmails === null) {
      adminSelectedWorkerEmails = null;
    } else if (isStringArray(data.adminSelectedWorkerEmails)) {
      adminSelectedWorkerEmails = data.adminSelectedWorkerEmails;
    }

    return {
      categoryFilterIds: isStringArray(data.categoryFilterIds) ? data.categoryFilterIds : [],
      paymentStatusFilter: parsePaymentStatus(data.paymentStatusFilter),
      dateFilterPreset: pickEnum(data.dateFilterPreset, DATE_PRESETS, "all"),
      dateFilterYear: typeof data.dateFilterYear === "string" ? data.dateFilterYear : String(new Date().getFullYear()),
      dateFilterMonth: typeof data.dateFilterMonth === "string" ? data.dateFilterMonth : "",
      dateRangeFrom: typeof data.dateRangeFrom === "string" ? data.dateRangeFrom : "",
      dateRangeTo: typeof data.dateRangeTo === "string" ? data.dateRangeTo : "",
      workerFilter: typeof data.workerFilter === "string" ? data.workerFilter : "",
      sortField: pickEnum(data.sortField, SORT_FIELDS, "date"),
      sortDirection: pickEnum(data.sortDirection, SORT_DIRECTIONS, "desc"),
      payoutSearchTerm: typeof data.payoutSearchTerm === "string" ? data.payoutSearchTerm : "",
      payoutWorkerFilter: typeof data.payoutWorkerFilter === "string" ? data.payoutWorkerFilter : "",
      payoutDateFilterPreset: pickEnum(data.payoutDateFilterPreset, DATE_PRESETS, "all"),
      payoutDateFilterYear: typeof data.payoutDateFilterYear === "string" ? data.payoutDateFilterYear : String(new Date().getFullYear()),
      payoutDateFilterMonth: typeof data.payoutDateFilterMonth === "string" ? data.payoutDateFilterMonth : "",
      payoutDateRangeFrom: typeof data.payoutDateRangeFrom === "string" ? data.payoutDateRangeFrom : "",
      payoutDateRangeTo: typeof data.payoutDateRangeTo === "string" ? data.payoutDateRangeTo : "",
      payoutSortField: pickEnum(data.payoutSortField, PAYOUT_SORT_FIELDS, "date"),
      payoutSortDirection: pickEnum(data.payoutSortDirection, SORT_DIRECTIONS, "desc"),
      financeMonth: typeof data.financeMonth === "string" ? data.financeMonth : "",
      adminView: pickEnum(data.adminView, ADMIN_VIEWS, "works"),
      employeeView: pickEnum(data.employeeView, EMPLOYEE_VIEWS, "main"),
      adminSelectedWorkerEmails,
    };
  } catch {
    return null;
  }
}

export function saveDashboardFilters(userId: string, filters: DashboardPersistedFilters): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      storageKey(userId),
      JSON.stringify({
        v: STORAGE_VERSION,
        ...filters,
      }),
    );
  } catch {
    // quota / private mode
  }
}
