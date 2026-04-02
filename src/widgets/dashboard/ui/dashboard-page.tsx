"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listCategories } from "@/entities/category/model/category-service";
import { Category } from "@/entities/category/model/types";
import { listAllWorkEntries, listUserSalaryPayouts, listUserWorkEntries } from "@/entities/work/model/work-service";
import { SalaryPayout, WorkEntry } from "@/entities/work/model/types";
import { CreateWorkForm } from "@/features/work-entry/ui/create-work-form";
import { AdminTools } from "@/features/admin/ui/admin-tools";
import { useAuth } from "@/shared/lib/auth/auth-context";
import { useI18n } from "@/shared/lib/i18n/i18n-context";
import { Button } from "@/shared/ui/button/button";
import { CenteredLoader } from "@/shared/ui/centered-loader/centered-loader";
import { LanguageSwitcher } from "@/shared/ui/language-switcher/language-switcher";
import { Modal } from "@/shared/ui/modal/modal";
import { Table, TableColumn } from "@/shared/ui/table/table";
import { useToast } from "@/shared/ui/toast/toast-provider";
import { type DateFilterPreset, matchesDateString } from "@/shared/lib/date-filter";
import styles from "./dashboard-page.module.css";

const PAGE_SIZE = 8;
type SortField = "date" | "description" | "category" | "amount";
type SortDirection = "desc" | "asc";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [workerFilter, setWorkerFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [dateFilterPreset, setDateFilterPreset] = useState<DateFilterPreset>("all");
  const [dateFilterYear, setDateFilterYear] = useState(() => String(new Date().getFullYear()));
  const [dateFilterMonth, setDateFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [dateRangeFrom, setDateRangeFrom] = useState("");
  const [dateRangeTo, setDateRangeTo] = useState("");

  const loadData = useCallback(async () => {
    if (!user) {
      return;
    }

    setDataLoading(true);
    try {
      const [nextCategories, nextWorks, nextSalaryPayouts] = await Promise.all([
        listCategories(),
        user.role === "admin" ? listAllWorkEntries() : listUserWorkEntries(user.uid),
        user.role === "admin" ? Promise.resolve([]) : listUserSalaryPayouts(user.uid),
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

  const filteredWorks = useMemo(() => {
    return works.filter((item) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        item.description.toLowerCase().includes(search) ||
        item.workDate.includes(searchTerm) ||
        item.categoryName.toLowerCase().includes(search);
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

      return matchesSearch && matchesCategory && matchesWorker && matchesDate;
    });
  }, [
    works,
    searchTerm,
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

  const toggleSort = (field: SortField) => {
    setPage(1);
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection(field === "amount" || field === "date" ? "desc" : "asc");
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return "";
    }
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const pageCount = Math.max(1, Math.ceil(sortedWorks.length / PAGE_SIZE));
  const paginatedWorks = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    return sortedWorks.slice(from, from + PAGE_SIZE);
  }, [sortedWorks, page]);

  const columns: TableColumn<WorkEntry>[] = [
    {
      key: "date",
      title: (
        <button type="button" className={styles.sortHeader} onClick={() => toggleSort("date")}>
          {t("dashboard.dateLabel")}
          {getSortIcon("date") ? ` ${getSortIcon("date")}` : ""}
        </button>
      ),
      render: (row) => row.workDate,
    },
    {
      key: "description",
      title: (
        <button type="button" className={styles.sortHeader} onClick={() => toggleSort("description")}>
          {t("dashboard.descriptionLabel")}
          {getSortIcon("description") ? ` ${getSortIcon("description")}` : ""}
        </button>
      ),
      render: (row) => row.description,
    },
    {
      key: "category",
      title: (
        <button type="button" className={styles.sortHeader} onClick={() => toggleSort("category")}>
          {t("dashboard.categoryLabel")}
          {getSortIcon("category") ? ` ${getSortIcon("category")}` : ""}
        </button>
      ),
      render: (row) => row.categoryName,
    },
    {
      key: "amount",
      title: (
        <button type="button" className={styles.sortHeader} onClick={() => toggleSort("amount")}>
          {t("dashboard.amountLabel")}
          {getSortIcon("amount") ? ` ${getSortIcon("amount")}` : ""}
        </button>
      ),
      render: (row) => row.amount.toFixed(2),
    },
  ];

  const salarySummary = useMemo(() => {
    const earned = works.reduce((acc, work) => acc + work.amount, 0);
    const paid = salaryPayouts.reduce((acc, payout) => acc + payout.amount, 0);
    const balance = earned - paid;
    return { earned, paid, balance };
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
          <Button type="button" onClick={() => setCreateModalOpen(true)}>
            {t("dashboard.addWork")}
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            {t("common.logout")}
          </Button>
        </div>
      </header>

      <section className={styles.panel}>
        <h2>{t("dashboard.works")}</h2>
        <div className={styles.filters}>
          <input
            className={styles.search}
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setPage(1);
            }}
            placeholder={t("common.search")}
          />
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
          {user.role === "admin" ? (
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
          ) : null}
        </div>

        <div className={styles.dateFilters}>
          <label className={styles.dateFilterLabel}>
            <span className={styles.dateFilterSpan}>{t("dashboard.dateFilterMode")}</span>
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
            <label className={styles.dateFilterLabel}>
              <span className={styles.dateFilterSpan}>{t("dashboard.dateFilterYear")}</span>
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
            <label className={styles.dateFilterLabel}>
              <span className={styles.dateFilterSpan}>{t("dashboard.dateFilterMonth")}</span>
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
              <label className={styles.dateFilterLabel}>
                <span className={styles.dateFilterSpan}>{t("dashboard.dateFilterFrom")}</span>
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
              <label className={styles.dateFilterLabel}>
                <span className={styles.dateFilterSpan}>{t("dashboard.dateFilterTo")}</span>
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

        {filteredWorks.length > 0 ? (
          <div className={styles.worksTotalBanner} role="status" aria-live="polite">
            <span className={styles.worksTotalLabel}>{t("dashboard.filteredTotalLabel")}</span>
            <strong className={styles.worksTotalValue}>{filteredAmountTotal.toFixed(2)}</strong>
          </div>
        ) : null}

        {!dataLoading && sortedWorks.length === 0 ? <p>{t("dashboard.noWorks")}</p> : null}
        <Table columns={columns} rows={paginatedWorks} rowKey={(row) => row.id} />

        <div className={styles.pagination}>
          <Button variant="ghost" type="button" disabled={page === 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
            {t("common.prev")}
          </Button>
          <span>
            {t("common.page")} {page}/{pageCount}
          </span>
          <Button
            variant="ghost"
            type="button"
            disabled={page === pageCount}
            onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
          >
            {t("common.next")}
          </Button>
        </div>
      </section>

      {user.role !== "admin" ? (
        <section className={styles.panel}>
          <h2>{t("dashboard.salarySummaryTitle")}</h2>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <p className={styles.meta}>{t("dashboard.totalEarned")}</p>
              <p className={styles.summaryValue}>{salarySummary.earned.toFixed(2)}</p>
            </div>
            <div className={styles.summaryCard}>
              <p className={styles.meta}>{t("dashboard.totalPaid")}</p>
              <p className={styles.summaryValue}>{salarySummary.paid.toFixed(2)}</p>
            </div>
            <div className={styles.summaryCard}>
              <p className={styles.meta}>{t("dashboard.balance")}</p>
              <p className={`${styles.summaryValue} ${salarySummary.balance >= 0 ? styles.positive : styles.negative}`}>
                {salarySummary.balance.toFixed(2)}
              </p>
            </div>
          </div>
          <h3>{t("dashboard.payoutHistoryTitle")}</h3>
          {salaryPayouts.length === 0 ? <p>{t("dashboard.noPayouts")}</p> : null}
          <div className={styles.rows}>
            {salaryPayouts.map((payout) => (
              <div key={payout.id} className={styles.payoutRow}>
                <div>
                  <p className={styles.meta}>{payout.payoutDate}</p>
                  <p>{payout.description}</p>
                </div>
                <p className={styles.negative}>-{payout.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {user.role === "admin" ? <AdminTools adminUid={user.uid} works={works} onDataChanged={loadData} /> : null}

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
