"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listCategories } from "@/entities/category/model/category-service";
import { Category } from "@/entities/category/model/types";
import { listAllSalaryPayouts, listAllWorkEntries, listUserSalaryPayouts, listUserWorkEntries } from "@/entities/work/model/work-service";
import { SalaryPayout, WorkEntry } from "@/entities/work/model/types";
import { CreateWorkForm } from "@/features/work-entry/ui/create-work-form";
import { AdminTools } from "@/features/admin/ui/admin-tools";
import { useAuth } from "@/shared/lib/auth/auth-context";
import { useI18n } from "@/shared/lib/i18n/i18n-context";
import { CenteredLoader } from "@/shared/ui/centered-loader/centered-loader";
import { LanguageSwitcher } from "@/shared/ui/language-switcher/language-switcher";
import { Modal } from "@/shared/ui/modal/modal";
import { Table, TableColumn } from "@/shared/ui/table/table";
import { useToast } from "@/shared/ui/toast/toast-provider";
import { type DateFilterPreset, matchesDateString } from "@/shared/lib/date-filter";
import styles from "./dashboard-page.module.css";

const PAGE_SIZE = 8;

function FilterSortIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" d="M4 6h16M6 12h12M9 18h6" />
    </svg>
  );
}

type FinanceTotals = { earned: number; paid: number; balance: number };

function DashboardFinanceBanner({
  financeMonth,
  onFinanceMonthChange,
  monthlyFinance,
  allTimeFinance,
}: {
  financeMonth: string;
  onFinanceMonthChange: (value: string) => void;
  monthlyFinance: FinanceTotals;
  allTimeFinance: FinanceTotals;
}) {
  const { t } = useI18n();

  return (
    <section
      className={styles.financeBanner}
      aria-label={`${t("dashboard.financeMonthBannerTitle")}, ${t("dashboard.financeAllTimeTitle")}`}
    >
      <div className={styles.financeBannerColumn}>
        <div className={styles.financeBannerHeader}>
          <h2 className={styles.financeBannerTitle}>{t("dashboard.financeMonthBannerTitle")}</h2>
          <label className={styles.financeMonthPicker}>
            <span className={styles.financeMonthLabel}>{t("dashboard.financeMonthPicker")}</span>
            <input
              className={styles.dateInput}
              type="month"
              value={financeMonth}
              onChange={(e) => onFinanceMonthChange(e.target.value)}
            />
          </label>
        </div>
        <div className={styles.financeBannerGrid}>
          <div className={styles.financeStat}>
            <p className={styles.financeStatLabel}>{t("dashboard.monthlyEarnedLabel")}</p>
            <p className={`${styles.financeStatValue} ${styles.financeStatEarned}`}>{monthlyFinance.earned.toFixed(2)}</p>
          </div>
          <div className={styles.financeStat}>
            <p className={styles.financeStatLabel}>{t("dashboard.monthlyPaidLabel")}</p>
            <p className={`${styles.financeStatValue} ${styles.financeStatPaid}`}>−{monthlyFinance.paid.toFixed(2)}</p>
          </div>
          <div className={styles.financeStat}>
            <p className={styles.financeStatLabel}>{t("dashboard.monthlyBalanceLabel")}</p>
            <p
              className={`${styles.financeStatValue} ${
                monthlyFinance.balance >= 0 ? styles.financeStatPositive : styles.financeStatNegative
              }`}
            >
              {monthlyFinance.balance >= 0 ? "+" : ""}
              {monthlyFinance.balance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.financeBannerDivider} aria-hidden />

      <div className={styles.financeBannerColumn}>
        <div className={styles.financeAllTimeHeader}>
          <h2 className={styles.financeBannerTitle}>{t("dashboard.financeAllTimeTitle")}</h2>
          <p className={styles.financeAllTimeHint}>{t("dashboard.financeAllTimeHint")}</p>
        </div>
        <div className={styles.financeBannerGrid}>
          <div className={styles.financeStat}>
            <p className={styles.financeStatLabel}>{t("dashboard.allTimeEarnedLabel")}</p>
            <p className={`${styles.financeStatValue} ${styles.financeStatEarned}`}>{allTimeFinance.earned.toFixed(2)}</p>
          </div>
          <div className={styles.financeStat}>
            <p className={styles.financeStatLabel}>{t("dashboard.allTimePaidLabel")}</p>
            <p className={`${styles.financeStatValue} ${styles.financeStatPaid}`}>−{allTimeFinance.paid.toFixed(2)}</p>
          </div>
          <div className={styles.financeStat}>
            <p className={styles.financeStatLabel}>{t("dashboard.allTimeBalanceLabel")}</p>
            <p
              className={`${styles.financeStatValue} ${
                allTimeFinance.balance >= 0 ? styles.financeStatPositive : styles.financeStatNegative
              }`}
            >
              {allTimeFinance.balance >= 0 ? "+" : ""}
              {allTimeFinance.balance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
type SortField = "date" | "description" | "category" | "amount";
type SortDirection = "desc" | "asc";
type PayoutSortField = "date" | "description" | "amount" | "worker";

export function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [works, setWorks] = useState<WorkEntry[]>([]);
  const [salaryPayouts, setSalaryPayouts] = useState<SalaryPayout[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [workerFilter, setWorkerFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [adminView, setAdminView] = useState<"works" | "payouts" | "admin">("works");
  const [employeeView, setEmployeeView] = useState<"main" | "works" | "waste">("main");
  const [dateFilterPreset, setDateFilterPreset] = useState<DateFilterPreset>("all");
  const [dateFilterYear, setDateFilterYear] = useState(() => String(new Date().getFullYear()));
  const [dateFilterMonth, setDateFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [dateRangeFrom, setDateRangeFrom] = useState("");
  const [dateRangeTo, setDateRangeTo] = useState("");
  const [payoutSearchTerm, setPayoutSearchTerm] = useState("");
  const [payoutWorkerFilter, setPayoutWorkerFilter] = useState("");
  const [payoutSortField, setPayoutSortField] = useState<PayoutSortField>("date");
  const [payoutSortDirection, setPayoutSortDirection] = useState<SortDirection>("desc");
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutDateFilterPreset, setPayoutDateFilterPreset] = useState<DateFilterPreset>("all");
  const [payoutDateFilterYear, setPayoutDateFilterYear] = useState(() => String(new Date().getFullYear()));
  const [payoutDateFilterMonth, setPayoutDateFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [payoutDateRangeFrom, setPayoutDateRangeFrom] = useState("");
  const [payoutDateRangeTo, setPayoutDateRangeTo] = useState("");
  const [financeMonth, setFinanceMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [worksFilterModalOpen, setWorksFilterModalOpen] = useState(false);
  const [payoutFilterModalOpen, setPayoutFilterModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) {
      return;
    }

    setDataLoading(true);
    try {
      const [nextCategories, nextWorks, nextSalaryPayouts] = await Promise.all([
        listCategories(),
        user.role === "admin" ? listAllWorkEntries() : listUserWorkEntries(user.uid),
        user.role === "admin" ? listAllSalaryPayouts() : listUserSalaryPayouts(user.uid),
      ]);

      setCategories(nextCategories);
      setWorks(nextWorks);
      setSalaryPayouts(nextSalaryPayouts);
    } catch (error) {
      console.error("Failed to load dashboard data from Firestore:", error);
      setCategories([]);
      setWorks([]);
      setSalaryPayouts([]);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }

    if (!loading && user) {
      const timeoutId = window.setTimeout(() => {
        void loadData();
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }
  }, [loadData, loading, router, user]);

  const workerEmails = useMemo(() => {
    return [...new Set(works.map((item) => item.userEmail))].sort((a, b) => a.localeCompare(b));
  }, [works]);
  const payoutWorkerEmails = useMemo(() => {
    return [...new Set(salaryPayouts.map((item) => item.userEmail))].sort((a, b) => a.localeCompare(b));
  }, [salaryPayouts]);

  const filteredWorks = useMemo(() => {
    return works.filter((item) => {
      const matchesCategory = categoryFilter ? item.categoryId === categoryFilter : true;
      const matchesWorker = workerFilter ? item.userEmail === workerFilter : true;
      const matchesDate = matchesDateString(
        item.workDate,
        dateFilterPreset,
        dateFilterYear,
        dateFilterMonth,
        dateRangeFrom,
        dateRangeTo,
      );

      return matchesCategory && matchesWorker && matchesDate;
    });
  }, [
    works,
    categoryFilter,
    workerFilter,
    dateFilterPreset,
    dateFilterYear,
    dateFilterMonth,
    dateRangeFrom,
    dateRangeTo,
  ]);

  const filteredAmountTotal = useMemo(() => {
    return filteredWorks.reduce((acc, item) => acc + item.amount, 0);
  }, [filteredWorks]);

  const worksFiltersActiveCount = useMemo(() => {
    let n = 0;
    if (categoryFilter) {
      n += 1;
    }
    if (workerFilter) {
      n += 1;
    }
    if (dateFilterPreset !== "all") {
      n += 1;
    }
    return n;
  }, [categoryFilter, workerFilter, dateFilterPreset]);

  const resetWorksFilters = useCallback(() => {
    const d = new Date();
    setCategoryFilter("");
    setWorkerFilter("");
    setDateFilterPreset("all");
    setDateFilterYear(String(d.getFullYear()));
    setDateFilterMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setDateRangeFrom("");
    setDateRangeTo("");
    setPage(1);
  }, []);

  const sortedWorks = useMemo(() => {
    return [...filteredWorks].sort((a, b) => {
      const directionMultiplier = sortDirection === "asc" ? 1 : -1;

      if (sortField === "amount") {
        return (a.amount - b.amount) * directionMultiplier;
      }

      if (sortField === "date") {
        return a.workDate.localeCompare(b.workDate) * directionMultiplier;
      }

      if (sortField === "category") {
        return a.categoryName.localeCompare(b.categoryName) * directionMultiplier;
      }

      return a.description.localeCompare(b.description) * directionMultiplier;
    });
  }, [filteredWorks, sortDirection, sortField]);

  const pageCount = Math.max(1, Math.ceil(sortedWorks.length / PAGE_SIZE));
  const paginatedWorks = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    return sortedWorks.slice(from, from + PAGE_SIZE);
  }, [sortedWorks, page]);

  const columns: TableColumn<WorkEntry>[] = [
    {
      key: "date",
      title: t("dashboard.dateLabel"),
      render: (row) => row.workDate,
    },
    {
      key: "description",
      title: t("dashboard.descriptionLabel"),
      render: (row) => row.description,
    },
    {
      key: "category",
      title: t("dashboard.categoryLabel"),
      render: (row) => row.categoryName,
    },
    {
      key: "amount",
      title: t("dashboard.amountLabel"),
      render: (row) => row.amount.toFixed(2),
    },
  ];

  const filteredPayoutsAdmin = useMemo(() => {
    return salaryPayouts.filter((item) => {
      const search = payoutSearchTerm.toLowerCase();
      const matchesSearch =
        item.description.toLowerCase().includes(search) ||
        item.payoutDate.includes(payoutSearchTerm) ||
        item.userEmail.toLowerCase().includes(search);
      const matchesWorker = payoutWorkerFilter ? item.userEmail === payoutWorkerFilter : true;
      const matchesDate = matchesDateString(
        item.payoutDate,
        payoutDateFilterPreset,
        payoutDateFilterYear,
        payoutDateFilterMonth,
        payoutDateRangeFrom,
        payoutDateRangeTo,
      );
      return matchesSearch && matchesWorker && matchesDate;
    });
  }, [
    salaryPayouts,
    payoutSearchTerm,
    payoutWorkerFilter,
    payoutDateFilterPreset,
    payoutDateFilterYear,
    payoutDateFilterMonth,
    payoutDateRangeFrom,
    payoutDateRangeTo,
  ]);

  const payoutFilteredTotal = useMemo(() => {
    return filteredPayoutsAdmin.reduce((acc, item) => acc + item.amount, 0);
  }, [filteredPayoutsAdmin]);

  const sortedPayoutsAdmin = useMemo(() => {
    return [...filteredPayoutsAdmin].sort((a, b) => {
      const directionMultiplier = payoutSortDirection === "asc" ? 1 : -1;

      if (payoutSortField === "amount") {
        return (a.amount - b.amount) * directionMultiplier;
      }
      if (payoutSortField === "date") {
        return a.payoutDate.localeCompare(b.payoutDate) * directionMultiplier;
      }
      if (payoutSortField === "worker") {
        return a.userEmail.localeCompare(b.userEmail) * directionMultiplier;
      }
      return a.description.localeCompare(b.description) * directionMultiplier;
    });
  }, [filteredPayoutsAdmin, payoutSortDirection, payoutSortField]);

  const payoutPageCount = Math.max(1, Math.ceil(sortedPayoutsAdmin.length / PAGE_SIZE));
  const paginatedPayoutsAdmin = useMemo(() => {
    const from = (payoutPage - 1) * PAGE_SIZE;
    return sortedPayoutsAdmin.slice(from, from + PAGE_SIZE);
  }, [sortedPayoutsAdmin, payoutPage]);

  const payoutFiltersActiveCount = useMemo(() => {
    let n = 0;
    if (payoutSearchTerm.trim()) {
      n += 1;
    }
    if (payoutWorkerFilter) {
      n += 1;
    }
    if (payoutDateFilterPreset !== "all") {
      n += 1;
    }
    return n;
  }, [payoutDateFilterPreset, payoutSearchTerm, payoutWorkerFilter]);

  const resetPayoutFilters = useCallback(() => {
    const d = new Date();
    setPayoutSearchTerm("");
    setPayoutWorkerFilter("");
    setPayoutDateFilterPreset("all");
    setPayoutDateFilterYear(String(d.getFullYear()));
    setPayoutDateFilterMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setPayoutDateRangeFrom("");
    setPayoutDateRangeTo("");
    setPayoutPage(1);
  }, []);

  const payoutColumns: TableColumn<SalaryPayout>[] = [
    {
      key: "date",
      title: t("dashboard.dateLabel"),
      render: (row) => row.payoutDate,
    },
    {
      key: "worker",
      title: t("dashboard.workerFilterLabel"),
      render: (row) => row.userEmail,
    },
    {
      key: "description",
      title: t("dashboard.descriptionLabel"),
      render: (row) => row.description,
    },
    {
      key: "amount",
      title: t("dashboard.amountLabel"),
      render: (row) => `-${row.amount.toFixed(2)}`,
    },
  ];

  const employeePayoutColumns: TableColumn<SalaryPayout>[] = [
    payoutColumns[0],
    payoutColumns[2],
    payoutColumns[3],
  ];

  /** Нараховано / виплачено / залишок за обраний календарний місяць (workDate / payoutDate = YYYY-MM-DD). */
  const monthlyFinance = useMemo(() => {
    const prefix = financeMonth;
    const earned = works.reduce((acc, work) => {
      return work.workDate.startsWith(prefix) ? acc + work.amount : acc;
    }, 0);
    const paid = salaryPayouts.reduce((acc, payout) => {
      return payout.payoutDate.startsWith(prefix) ? acc + payout.amount : acc;
    }, 0);
    return { earned, paid, balance: earned - paid };
  }, [financeMonth, salaryPayouts, works]);

  /** Усі дані в обліку (від початку користування / реєстрації в системі). */
  const allTimeFinance = useMemo(() => {
    const earned = works.reduce((acc, work) => acc + work.amount, 0);
    const paid = salaryPayouts.reduce((acc, payout) => acc + payout.amount, 0);
    return { earned, paid, balance: earned - paid };
  }, [salaryPayouts, works]);

  /** Скільки різних календарних місяців мають хоча б одну роботу або виплату. */
  const monthsOnRecord = useMemo(() => {
    const months = new Set<string>();
    works.forEach((w) => {
      if (w.workDate.length >= 7) {
        months.add(w.workDate.slice(0, 7));
      }
    });
    salaryPayouts.forEach((p) => {
      if (p.payoutDate.length >= 7) {
        months.add(p.payoutDate.slice(0, 7));
      }
    });
    return months.size;
  }, [salaryPayouts, works]);

  if (loading || !user) {
    return <CenteredLoader label={t("common.loadingProfile")} />;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>{t("dashboard.title")}</h1>
          <p>
            {user.email} ({user.role})
          </p>
        </div>
        <div className={styles.actions}>
          <LanguageSwitcher />
          <button
            type="button"
            className={styles.adminTabButton}
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            {t("common.logout")}
          </button>
        </div>
      </header>

      {user.role === "admin" ? (
        <DashboardFinanceBanner
          financeMonth={financeMonth}
          onFinanceMonthChange={setFinanceMonth}
          monthlyFinance={monthlyFinance}
          allTimeFinance={allTimeFinance}
        />
      ) : null}

      {user.role !== "admin" ? (
        <section className={styles.employeeTabBar}>
          <div className={styles.employeeTabs}>
            <button
              type="button"
              className={`${styles.adminTabButton} ${employeeView === "main" ? styles.adminTabButtonActive : ""}`}
              onClick={() => setEmployeeView("main")}
            >
              {t("dashboard.tabMain")}
            </button>
            <button
              type="button"
              className={`${styles.adminTabButton} ${employeeView === "works" ? styles.adminTabButtonActive : ""}`}
              onClick={() => setEmployeeView("works")}
            >
              {t("dashboard.tabWorks")}
            </button>
            <button
              type="button"
              className={`${styles.adminTabButton} ${employeeView === "waste" ? styles.adminTabButtonActive : ""}`}
              onClick={() => setEmployeeView("waste")}
            >
              {t("dashboard.tabExpenses")}
            </button>
          </div>
        </section>
      ) : null}

      {user.role !== "admin" && employeeView === "main" ? (
        <>
          <section className={styles.mainOverview}>
            <div className={styles.mainOverviewRow}>
              <p className={styles.monthsOnRecord}>
                <span>{t("dashboard.monthsOnRecord")}</span>
                <strong className={styles.monthsOnRecordValue}>{monthsOnRecord}</strong>
              </p>
              <button
                type="button"
                className={`${styles.adminTabButton} ${styles.adminTabButtonActive}`}
                onClick={() => setCreateModalOpen(true)}
              >
                {t("dashboard.addWork")}
              </button>
            </div>
          </section>
          <DashboardFinanceBanner
            financeMonth={financeMonth}
            onFinanceMonthChange={setFinanceMonth}
            monthlyFinance={monthlyFinance}
            allTimeFinance={allTimeFinance}
          />
        </>
      ) : null}

      {user.role === "admin" ? (
        <section className={styles.panel}>
          <div className={styles.adminTabs}>
            <button
              type="button"
              className={`${styles.adminTabButton} ${adminView === "works" ? styles.adminTabButtonActive : ""}`}
              onClick={() => setAdminView("works")}
            >
              Роботи
            </button>
            <button
              type="button"
              className={`${styles.adminTabButton} ${adminView === "payouts" ? styles.adminTabButtonActive : ""}`}
              onClick={() => setAdminView("payouts")}
            >
              Виплачені зарплати
            </button>
            <button
              type="button"
              className={`${styles.adminTabButton} ${adminView === "admin" ? styles.adminTabButtonActive : ""}`}
              onClick={() => setAdminView("admin")}
            >
              Адмін панель
            </button>
          </div>
        </section>
      ) : null}

      {(user.role === "admin" && adminView === "works") || (user.role !== "admin" && employeeView === "works") ? (
        <section className={styles.panel}>
        <div className={styles.panelHeaderWorks}>
          <h2 className={styles.panelHeaderWorksTitle}>{t("dashboard.works")}</h2>
          <div className={styles.worksPanelButtonRow}>
            <button
              type="button"
              className={`${styles.adminTabButton} ${styles.adminTabButtonInline} ${styles.worksPanelHalfButton}`}
              onClick={() => setWorksFilterModalOpen(true)}
              aria-expanded={worksFilterModalOpen}
              aria-haspopup="dialog"
            >
              <FilterSortIcon className={styles.adminTabButtonIcon} />
              <span className={styles.worksPanelButtonLabel}>{t("dashboard.filtersAndSort")}</span>
              {worksFiltersActiveCount > 0 ? (
                <span className={styles.filterActiveBadge}>{worksFiltersActiveCount}</span>
              ) : null}
            </button>
            <button
              type="button"
              className={`${styles.adminTabButton} ${styles.adminTabButtonActive} ${styles.worksPanelHalfButton}`}
              onClick={() => setCreateModalOpen(true)}
            >
              {t("dashboard.addWork")}
            </button>
          </div>
        </div>

        <Modal
          isOpen={worksFilterModalOpen}
          title={t("dashboard.filtersAndSort")}
          onClose={() => setWorksFilterModalOpen(false)}
        >
          <div className={styles.worksFilterModalScroll}>
            <div className={styles.worksFilterModalSection}>
              <h3 className={styles.worksFilterModalHeading}>{t("dashboard.filtersSection")}</h3>
              <label className={styles.worksFilterField}>
                <span>{t("dashboard.categoryLabel")}</span>
                <select
                  className={styles.select}
                  value={categoryFilter}
                  onChange={(event) => {
                    setCategoryFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">{t("common.allCategories")}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              {user.role === "admin" ? (
                <label className={styles.worksFilterField}>
                  <span>{t("dashboard.workerFilterLabel")}</span>
                  <select
                    className={styles.select}
                    value={workerFilter}
                    onChange={(event) => {
                      setWorkerFilter(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">{t("dashboard.allWorkers")}</option>
                    {workerEmails.map((email) => (
                      <option key={email} value={email}>
                        {email}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className={styles.worksFilterField}>
                <span>{t("dashboard.dateFilterMode")}</span>
                <select
                  className={styles.select}
                  value={dateFilterPreset}
                  onChange={(event) => {
                    setDateFilterPreset(event.target.value as DateFilterPreset);
                    setPage(1);
                  }}
                >
                  <option value="all">{t("dashboard.dateFilterAll")}</option>
                  <option value="year">{t("dashboard.dateFilterByYear")}</option>
                  <option value="month">{t("dashboard.dateFilterByMonth")}</option>
                  <option value="range">{t("dashboard.dateFilterByRange")}</option>
                </select>
              </label>
              {dateFilterPreset === "year" ? (
                <label className={styles.worksFilterField}>
                  <span>{t("dashboard.dateFilterYear")}</span>
                  <input
                    className={styles.dateInput}
                    type="number"
                    min={2000}
                    max={2100}
                    value={dateFilterYear}
                    onChange={(event) => {
                      setDateFilterYear(event.target.value);
                      setPage(1);
                    }}
                  />
                </label>
              ) : null}
              {dateFilterPreset === "month" ? (
                <label className={styles.worksFilterField}>
                  <span>{t("dashboard.dateFilterMonth")}</span>
                  <input
                    className={styles.dateInput}
                    type="month"
                    value={dateFilterMonth}
                    onChange={(event) => {
                      setDateFilterMonth(event.target.value);
                      setPage(1);
                    }}
                  />
                </label>
              ) : null}
              {dateFilterPreset === "range" ? (
                <>
                  <label className={styles.worksFilterField}>
                    <span>{t("dashboard.dateFilterFrom")}</span>
                    <input
                      className={styles.dateInput}
                      type="date"
                      value={dateRangeFrom}
                      onChange={(event) => {
                        setDateRangeFrom(event.target.value);
                        setPage(1);
                      }}
                    />
                  </label>
                  <label className={styles.worksFilterField}>
                    <span>{t("dashboard.dateFilterTo")}</span>
                    <input
                      className={styles.dateInput}
                      type="date"
                      value={dateRangeTo}
                      onChange={(event) => {
                        setDateRangeTo(event.target.value);
                        setPage(1);
                      }}
                    />
                  </label>
                </>
              ) : null}
            </div>

            <div className={styles.worksFilterModalSection}>
              <h3 className={styles.worksFilterModalHeading}>{t("dashboard.sortSection")}</h3>
              <label className={styles.worksFilterField}>
                <span>{t("dashboard.sortByLabel")}</span>
                <select
                  className={styles.select}
                  value={sortField}
                  onChange={(event) => {
                    const field = event.target.value as SortField;
                    setSortField(field);
                    setSortDirection(field === "amount" || field === "date" ? "desc" : "asc");
                    setPage(1);
                  }}
                >
                  <option value="date">{t("dashboard.dateLabel")}</option>
                  <option value="description">{t("dashboard.descriptionLabel")}</option>
                  <option value="category">{t("dashboard.categoryLabel")}</option>
                  <option value="amount">{t("dashboard.amountLabel")}</option>
                </select>
              </label>
              <label className={styles.worksFilterField}>
                <span>{t("dashboard.sortDirectionLabel")}</span>
                <select
                  className={styles.select}
                  value={sortDirection}
                  onChange={(event) => {
                    setSortDirection(event.target.value as SortDirection);
                    setPage(1);
                  }}
                >
                  <option value="desc">{t("dashboard.sortDirectionDesc")}</option>
                  <option value="asc">{t("dashboard.sortDirectionAsc")}</option>
                </select>
              </label>
            </div>
          </div>
          <div className={styles.worksFilterModalFooter}>
            <button type="button" className={styles.adminTabButton} onClick={resetWorksFilters}>
              {t("dashboard.resetFilters")}
            </button>
            <button type="button" className={`${styles.adminTabButton} ${styles.adminTabButtonActive}`} onClick={() => setWorksFilterModalOpen(false)}>
              {t("dashboard.done")}
            </button>
          </div>
        </Modal>

        {filteredWorks.length > 0 ? (
          <div className={styles.worksTotalBanner} role="status" aria-live="polite">
            <span className={styles.worksTotalLabel}>{t("dashboard.filteredTotalLabel")}</span>
            <strong className={styles.worksTotalValue}>{filteredAmountTotal.toFixed(2)}</strong>
          </div>
        ) : null}

        {!dataLoading && sortedWorks.length === 0 ? <p>{t("dashboard.noWorks")}</p> : null}
        <Table columns={columns} rows={paginatedWorks} rowKey={(row) => row.id} />

        <div className={styles.pagination}>
          <button type="button" className={styles.adminTabButton} disabled={page === 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
            {t("common.prev")}
          </button>
          <span>
            {t("common.page")} {page}/{pageCount}
          </span>
          <button
            type="button"
            className={styles.adminTabButton}
            disabled={page === pageCount}
            onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
          >
            {t("common.next")}
          </button>
        </div>
        </section>
      ) : null}

      {(user.role === "admin" && adminView === "payouts") || (user.role !== "admin" && employeeView === "waste") ? (
        <section className={styles.panel}>
          <div className={styles.panelHeaderWorks}>
            <h2 className={styles.panelHeaderWorksTitle}>
              {user.role === "admin" ? t("dashboard.salaryPayoutsSectionTitle") : t("dashboard.tabExpenses")}
            </h2>
            <div className={styles.worksPanelButtonRowSingle}>
              <button
                type="button"
                className={`${styles.adminTabButton} ${styles.adminTabButtonInline} ${styles.worksPanelHalfButton}`}
                onClick={() => setPayoutFilterModalOpen(true)}
                aria-expanded={payoutFilterModalOpen}
                aria-haspopup="dialog"
              >
                <FilterSortIcon className={styles.adminTabButtonIcon} />
                <span className={styles.worksPanelButtonLabel}>{t("dashboard.filtersAndSort")}</span>
                {payoutFiltersActiveCount > 0 ? (
                  <span className={styles.filterActiveBadge}>{payoutFiltersActiveCount}</span>
                ) : null}
              </button>
            </div>
          </div>

          <Modal
            isOpen={payoutFilterModalOpen}
            title={t("dashboard.filtersAndSort")}
            onClose={() => setPayoutFilterModalOpen(false)}
          >
            <div className={styles.worksFilterModalScroll}>
              <div className={styles.worksFilterModalSection}>
                <h3 className={styles.worksFilterModalHeading}>{t("dashboard.filtersSection")}</h3>
                <label className={styles.worksFilterField}>
                  <span>{t("common.search")}</span>
                  <input
                    className={styles.search}
                    value={payoutSearchTerm}
                    onChange={(event) => {
                      setPayoutSearchTerm(event.target.value);
                      setPayoutPage(1);
                    }}
                    placeholder={t("common.search")}
                  />
                </label>
                {user.role === "admin" ? (
                  <label className={styles.worksFilterField}>
                    <span>{t("dashboard.workerFilterLabel")}</span>
                    <select
                      className={styles.select}
                      value={payoutWorkerFilter}
                      onChange={(event) => {
                        setPayoutWorkerFilter(event.target.value);
                        setPayoutPage(1);
                      }}
                    >
                      <option value="">{t("dashboard.allWorkers")}</option>
                      {payoutWorkerEmails.map((email) => (
                        <option key={email} value={email}>
                          {email}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label className={styles.worksFilterField}>
                  <span>{t("dashboard.dateFilterMode")}</span>
                  <select
                    className={styles.select}
                    value={payoutDateFilterPreset}
                    onChange={(event) => {
                      setPayoutDateFilterPreset(event.target.value as DateFilterPreset);
                      setPayoutPage(1);
                    }}
                  >
                    <option value="all">{t("dashboard.dateFilterAll")}</option>
                    <option value="year">{t("dashboard.dateFilterByYear")}</option>
                    <option value="month">{t("dashboard.dateFilterByMonth")}</option>
                    <option value="range">{t("dashboard.dateFilterByRange")}</option>
                  </select>
                </label>
                {payoutDateFilterPreset === "year" ? (
                  <label className={styles.worksFilterField}>
                    <span>{t("dashboard.dateFilterYear")}</span>
                    <input
                      className={styles.dateInput}
                      type="number"
                      min={2000}
                      max={2100}
                      value={payoutDateFilterYear}
                      onChange={(event) => {
                        setPayoutDateFilterYear(event.target.value);
                        setPayoutPage(1);
                      }}
                    />
                  </label>
                ) : null}
                {payoutDateFilterPreset === "month" ? (
                  <label className={styles.worksFilterField}>
                    <span>{t("dashboard.dateFilterMonth")}</span>
                    <input
                      className={styles.dateInput}
                      type="month"
                      value={payoutDateFilterMonth}
                      onChange={(event) => {
                        setPayoutDateFilterMonth(event.target.value);
                        setPayoutPage(1);
                      }}
                    />
                  </label>
                ) : null}
                {payoutDateFilterPreset === "range" ? (
                  <>
                    <label className={styles.worksFilterField}>
                      <span>{t("dashboard.dateFilterFrom")}</span>
                      <input
                        className={styles.dateInput}
                        type="date"
                        value={payoutDateRangeFrom}
                        onChange={(event) => {
                          setPayoutDateRangeFrom(event.target.value);
                          setPayoutPage(1);
                        }}
                      />
                    </label>
                    <label className={styles.worksFilterField}>
                      <span>{t("dashboard.dateFilterTo")}</span>
                      <input
                        className={styles.dateInput}
                        type="date"
                        value={payoutDateRangeTo}
                        onChange={(event) => {
                          setPayoutDateRangeTo(event.target.value);
                          setPayoutPage(1);
                        }}
                      />
                    </label>
                  </>
                ) : null}
              </div>

              <div className={styles.worksFilterModalSection}>
                <h3 className={styles.worksFilterModalHeading}>{t("dashboard.sortSection")}</h3>
                <label className={styles.worksFilterField}>
                  <span>{t("dashboard.sortByLabel")}</span>
                  <select
                    className={styles.select}
                    value={payoutSortField}
                    onChange={(event) => {
                      const field = event.target.value as PayoutSortField;
                      setPayoutSortField(field);
                      setPayoutSortDirection(field === "amount" || field === "date" ? "desc" : "asc");
                      setPayoutPage(1);
                    }}
                  >
                    <option value="date">{t("dashboard.dateLabel")}</option>
                    {user.role === "admin" ? <option value="worker">{t("dashboard.workerFilterLabel")}</option> : null}
                    <option value="description">{t("dashboard.descriptionLabel")}</option>
                    <option value="amount">{t("dashboard.amountLabel")}</option>
                  </select>
                </label>
                <label className={styles.worksFilterField}>
                  <span>{t("dashboard.sortDirectionLabel")}</span>
                  <select
                    className={styles.select}
                    value={payoutSortDirection}
                    onChange={(event) => {
                      setPayoutSortDirection(event.target.value as SortDirection);
                      setPayoutPage(1);
                    }}
                  >
                    <option value="desc">{t("dashboard.sortDirectionDesc")}</option>
                    <option value="asc">{t("dashboard.sortDirectionAsc")}</option>
                  </select>
                </label>
              </div>
            </div>
            <div className={styles.worksFilterModalFooter}>
              <button type="button" className={styles.adminTabButton} onClick={resetPayoutFilters}>
                {t("dashboard.resetFilters")}
              </button>
              <button
                type="button"
                className={`${styles.adminTabButton} ${styles.adminTabButtonActive}`}
                onClick={() => setPayoutFilterModalOpen(false)}
              >
                {t("dashboard.done")}
              </button>
            </div>
          </Modal>

          {filteredPayoutsAdmin.length > 0 ? (
            <div className={styles.worksTotalBanner} role="status" aria-live="polite">
              <span className={styles.worksTotalLabel}>{t("dashboard.filteredTotalLabel")}</span>
              <strong
                className={user.role !== "admin" ? styles.wasteTotalValue : styles.worksTotalValue}
              >
                {payoutFilteredTotal.toFixed(2)}
              </strong>
            </div>
          ) : null}
          {!dataLoading && sortedPayoutsAdmin.length === 0 ? <p>{t("dashboard.noPayoutsMatchFilter")}</p> : null}
          <Table columns={user.role === "admin" ? payoutColumns : employeePayoutColumns} rows={paginatedPayoutsAdmin} rowKey={(row) => row.id} />

          <div className={styles.pagination}>
            <button type="button" className={styles.adminTabButton} disabled={payoutPage === 1} onClick={() => setPayoutPage((prev) => Math.max(1, prev - 1))}>
              {t("common.prev")}
            </button>
            <span>
              {t("common.page")} {payoutPage}/{payoutPageCount}
            </span>
            <button
              type="button"
              className={styles.adminTabButton}
              disabled={payoutPage === payoutPageCount}
              onClick={() => setPayoutPage((prev) => Math.min(payoutPageCount, prev + 1))}
            >
              {t("common.next")}
            </button>
          </div>
        </section>
      ) : null}

      {user.role === "admin" && adminView === "admin" ? <AdminTools adminUid={user.uid} works={works} onDataChanged={loadData} /> : null}

      <Modal isOpen={isCreateModalOpen} title={t("dashboard.addWork")} onClose={() => setCreateModalOpen(false)}>
        <CreateWorkForm
          categories={categories}
          onCreated={loadData}
          onSuccess={() => {
            showToast(t("dashboard.workAdded"));
            setCreateModalOpen(false);
          }}
        />
      </Modal>
    </main>
  );
}
