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
import styles from "./dashboard-page.module.css";

const PAGE_SIZE = 8;

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
  const [page, setPage] = useState(1);

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

  const filteredWorks = useMemo(() => {
    return works.filter((item) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        item.description.toLowerCase().includes(search) ||
        item.workDate.includes(searchTerm) ||
        item.categoryName.toLowerCase().includes(search);
      const matchesCategory = categoryFilter ? item.categoryId === categoryFilter : true;

      return matchesSearch && matchesCategory;
    });
  }, [works, searchTerm, categoryFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredWorks.length / PAGE_SIZE));
  const paginatedWorks = useMemo(() => {
    const from = (page - 1) * PAGE_SIZE;
    return filteredWorks.slice(from, from + PAGE_SIZE);
  }, [filteredWorks, page]);

  const columns: TableColumn<WorkEntry>[] = [
    { key: "date", title: t("dashboard.dateLabel"), render: (row) => row.workDate },
    { key: "description", title: t("dashboard.descriptionLabel"), render: (row) => row.description },
    { key: "category", title: t("dashboard.categoryLabel"), render: (row) => row.categoryName },
    { key: "amount", title: t("dashboard.amountLabel"), render: (row) => row.amount.toFixed(2) },
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
        </div>

        {!dataLoading && filteredWorks.length === 0 ? <p>{t("dashboard.noWorks")}</p> : null}
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
