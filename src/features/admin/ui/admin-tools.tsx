"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addCategory } from "@/entities/category/model/category-service";
import { createSalaryPayout, listAllSalaryPayouts, updateWorkAmount } from "@/entities/work/model/work-service";
import { SalaryPayout, WorkEntry } from "@/entities/work/model/types";
import { Button } from "@/shared/ui/button/button";
import { Input } from "@/shared/ui/input/input";
import { type DateFilterPreset, matchesDateString } from "@/shared/lib/date-filter";
import { amountSchema, categorySchema, salaryPayoutSchema } from "@/shared/lib/validation/schemas";
import styles from "./admin-tools.module.css";

const WORK_ROWS_PER_PAGE = 3;

interface Props {
  adminUid: string;
  works: WorkEntry[];
  onDataChanged: () => Promise<void>;
}

export function AdminTools({ adminUid, works, onDataChanged }: Props) {
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [salaryError, setSalaryError] = useState<string | null>(null);
  const [salaryLoading, setSalaryLoading] = useState(true);
  const [salaryPayouts, setSalaryPayouts] = useState<SalaryPayout[]>([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [payoutRecipientEmail, setPayoutRecipientEmail] = useState("");
  const [worksPage, setWorksPage] = useState(1);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [payoutDatePreset, setPayoutDatePreset] = useState<DateFilterPreset>("all");
  const [payoutDateYear, setPayoutDateYear] = useState(() => String(new Date().getFullYear()));
  const [payoutDateMonth, setPayoutDateMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [payoutDateFrom, setPayoutDateFrom] = useState("");
  const [payoutDateTo, setPayoutDateTo] = useState("");
  type CategoryFormValues = z.output<typeof categorySchema>;
  type SalaryPayoutFormValues = z.output<typeof salaryPayoutSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });
  const {
    register: registerSalary,
    handleSubmit: handleSalarySubmit,
    reset: resetSalaryForm,
    formState: { errors: salaryErrors, isSubmitting: isSalarySubmitting },
  } = useForm<z.input<typeof salaryPayoutSchema>, unknown, SalaryPayoutFormValues>({
    resolver: zodResolver(salaryPayoutSchema),
  });

  const onCategorySubmit = handleSubmit(async (values) => {
    setCategoryError(null);

    try {
      await addCategory(values.name, adminUid);
      reset({ name: "" });
      await onDataChanged();
    } catch {
      setCategoryError("Не вдалося додати категорію");
    }
  });

  const loadSalaryPayouts = async () => {
    setSalaryLoading(true);
    try {
      const payouts = await listAllSalaryPayouts();
      setSalaryPayouts(payouts);
    } catch {
      setSalaryError("Не вдалося завантажити виплати");
    } finally {
      setSalaryLoading(false);
    }
  };

  useEffect(() => {
    void loadSalaryPayouts();
  }, []);

  const workerEmails = useMemo(() => {
    return [...new Set([...works.map((work) => work.userEmail), ...salaryPayouts.map((payout) => payout.userEmail)])].sort((a, b) =>
      a.localeCompare(b),
    );
  }, [works, salaryPayouts]);

  useEffect(() => {
    if (selectedEmail) {
      setPayoutRecipientEmail(selectedEmail);
      return;
    }

    if (!payoutRecipientEmail && workerEmails.length > 0) {
      setPayoutRecipientEmail(workerEmails[0]);
    }
  }, [selectedEmail, payoutRecipientEmail, workerEmails]);

  const workerIdByEmail = useMemo(() => {
    const map = new Map<string, string>();
    works.forEach((work) => {
      map.set(work.userEmail, work.userId);
    });
    salaryPayouts.forEach((payout) => {
      map.set(payout.userEmail, payout.userId);
    });
    return map;
  }, [works, salaryPayouts]);

  const filteredWorks = useMemo(() => {
    return selectedEmail ? works.filter((work) => work.userEmail === selectedEmail) : works;
  }, [selectedEmail, works]);

  const worksPageCount = Math.max(1, Math.ceil(filteredWorks.length / WORK_ROWS_PER_PAGE));

  const paginatedWorksForEdit = useMemo(() => {
    const from = (worksPage - 1) * WORK_ROWS_PER_PAGE;
    return filteredWorks.slice(from, from + WORK_ROWS_PER_PAGE);
  }, [filteredWorks, worksPage]);

  const filteredPayouts = useMemo(() => {
    return selectedEmail ? salaryPayouts.filter((payout) => payout.userEmail === selectedEmail) : salaryPayouts;
  }, [salaryPayouts, selectedEmail]);

  const dateFilteredPayouts = useMemo(() => {
    return filteredPayouts.filter((payout) =>
      matchesDateString(payout.payoutDate, payoutDatePreset, payoutDateYear, payoutDateMonth, payoutDateFrom, payoutDateTo),
    );
  }, [filteredPayouts, payoutDatePreset, payoutDateYear, payoutDateMonth, payoutDateFrom, payoutDateTo]);

  const payoutsPageCount = Math.max(1, Math.ceil(dateFilteredPayouts.length / WORK_ROWS_PER_PAGE));

  const paginatedPayouts = useMemo(() => {
    const from = (payoutsPage - 1) * WORK_ROWS_PER_PAGE;
    return dateFilteredPayouts.slice(from, from + WORK_ROWS_PER_PAGE);
  }, [dateFilteredPayouts, payoutsPage]);

  const payoutHistoryPaidTotal = useMemo(() => {
    return dateFilteredPayouts.reduce((acc, p) => acc + p.amount, 0);
  }, [dateFilteredPayouts]);

  useEffect(() => {
    setWorksPage(1);
    setPayoutsPage(1);
  }, [selectedEmail]);

  useEffect(() => {
    setWorksPage((prev) => Math.min(prev, worksPageCount));
  }, [filteredWorks.length, worksPageCount]);

  useEffect(() => {
    setPayoutsPage((prev) => Math.min(prev, payoutsPageCount));
  }, [dateFilteredPayouts.length, payoutsPageCount]);

  useEffect(() => {
    setPayoutsPage(1);
  }, [payoutDatePreset, payoutDateYear, payoutDateMonth, payoutDateFrom, payoutDateTo]);

  const summary = useMemo(() => {
    const earned = filteredWorks.reduce((acc, work) => acc + work.amount, 0);
    const paid = filteredPayouts.reduce((acc, payout) => acc + payout.amount, 0);
    const balance = earned - paid;
    return { earned, paid, balance };
  }, [filteredPayouts, filteredWorks]);

  const onSalarySubmit = handleSalarySubmit(async (values) => {
    setSalaryError(null);
    if (!payoutRecipientEmail) {
      setSalaryError("Оберіть отримувача виплати");
      return;
    }

    const userId = workerIdByEmail.get(payoutRecipientEmail);
    if (!userId) {
      setSalaryError("Не вдалося визначити працівника");
      return;
    }

    try {
      await createSalaryPayout({
        userId,
        userEmail: payoutRecipientEmail,
        payoutDate: values.payoutDate,
        description: values.description,
        amount: values.amount,
      });
      resetSalaryForm({ payoutDate: "", description: "", amount: 0 });
      await loadSalaryPayouts();
    } catch {
      setSalaryError("Не вдалося зберегти виплату");
    }
  });

  const exportCsv = () => {
    const escapeCsv = (value: string | number) => {
      const normalized = String(value).replaceAll('"', '""');
      return `"${normalized}"`;
    };

    const lines: string[] = [];
    lines.push([
      "Працівник",
      "Заробіток",
      "Виплачено",
      "Залишок",
    ].map(escapeCsv).join(","));
    lines.push([
      selectedEmail || "Усі працівники",
      summary.earned.toFixed(2),
      summary.paid.toFixed(2),
      summary.balance.toFixed(2),
    ].map(escapeCsv).join(","));
    lines.push("");

    lines.push(["Тип", "Email", "Дата", "Опис", "Категорія", "Сума"].map(escapeCsv).join(","));
    filteredWorks.forEach((work) => {
      lines.push(
        ["Робота", work.userEmail, work.workDate, work.description, work.categoryName, work.amount.toFixed(2)]
          .map(escapeCsv)
          .join(","),
      );
    });
    filteredPayouts.forEach((payout) => {
      lines.push(
        ["Виплата", payout.userEmail, payout.payoutDate, payout.description, "-", `-${payout.amount.toFixed(2)}`]
          .map(escapeCsv)
          .join(","),
      );
    });

    const csv = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeEmail = (selectedEmail || "all-workers").replaceAll(/[^a-z0-9@._-]/gi, "_");
    link.href = url;
    link.download = `salary-report-${safeEmail}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className={styles.container}>
      <form className={styles.form} onSubmit={onCategorySubmit}>
        <h2>Адмін: Категорії</h2>
        <Input label="Назва категорії" {...register("name")} error={errors.name?.message} />
        {categoryError ? <p className={styles.error}>{categoryError}</p> : null}
        <Button disabled={isSubmitting} type="submit">
          Додати категорію
        </Button>
      </form>

      <div className={styles.form}>
        <h2>Адмін: Редагування суми</h2>
        <div className={styles.filterGroup}>
          <label htmlFor="worker-email-filter">Працівник</label>
          <select
            id="worker-email-filter"
            className={styles.select}
            value={selectedEmail}
            onChange={(event) => setSelectedEmail(event.target.value)}
          >
            <option value="">Усі працівники</option>
            {workerEmails.map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <p className={styles.meta}>Загальна сума заробітку</p>
            <p className={styles.summaryValue}>{summary.earned.toFixed(2)}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.meta}>Загальна сума виплат</p>
            <p className={styles.summaryValue}>{summary.paid.toFixed(2)}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.meta}>Залишок</p>
            <p className={`${styles.summaryValue} ${summary.balance >= 0 ? styles.positive : styles.negative}`}>
              {summary.balance.toFixed(2)}
            </p>
          </div>
        </div>
        <div className={styles.actionsRow}>
          <Button type="button" variant="ghost" onClick={exportCsv}>
            Експорт у CSV
          </Button>
        </div>

        <form className={styles.salaryForm} onSubmit={onSalarySubmit}>
          <h3>Видача зарплати</h3>
          <label className={styles.filterGroup}>
            <span>Кому видано</span>
            <select
              className={styles.select}
              value={payoutRecipientEmail}
              onChange={(event) => setPayoutRecipientEmail(event.target.value)}
            >
              {workerEmails.length === 0 ? <option value="">Немає працівників</option> : null}
              {workerEmails.map((email) => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
            </select>
          </label>
          <Input label="Дата видачі" type="date" {...registerSalary("payoutDate")} error={salaryErrors.payoutDate?.message} />
          <label className={styles.filterGroup}>
            <span>Опис</span>
            <textarea className={styles.textarea} rows={2} {...registerSalary("description")} />
            {salaryErrors.description ? <small className={styles.error}>{salaryErrors.description.message}</small> : null}
          </label>
          <Input
            label="Сума"
            type="number"
            min={0}
            step="0.01"
            {...registerSalary("amount")}
            error={salaryErrors.amount?.message}
          />
          {salaryError ? <p className={styles.error}>{salaryError}</p> : null}
          <Button disabled={isSalarySubmitting || !payoutRecipientEmail} type="submit">
            Зберегти виплату
          </Button>
        </form>

        <div className={styles.rows}>
          <h3>Роботи</h3>
          {filteredWorks.length > 0 ? (
            <div className={styles.worksTotalBanner} role="status">
              <span className={styles.worksTotalLabel}>Разом зароблено (за фільтром)</span>
              <strong className={styles.worksTotalValue}>{summary.earned.toFixed(2)}</strong>
            </div>
          ) : null}
          {paginatedWorksForEdit.map((work) => (
            <AmountRow key={work.id} work={work} onDataChanged={onDataChanged} />
          ))}
        </div>
        {filteredWorks.length === 0 ? <p className={styles.meta}>Немає робіт для обраного працівника</p> : null}
        {filteredWorks.length > WORK_ROWS_PER_PAGE ? (
          <div className={styles.pagination}>
            <Button
              variant="ghost"
              type="button"
              disabled={worksPage === 1}
              onClick={() => setWorksPage((prev) => Math.max(1, prev - 1))}
            >
              Назад
            </Button>
            <span className={styles.paginationInfo}>
              Сторінка {worksPage}/{worksPageCount}
            </span>
            <Button
              variant="ghost"
              type="button"
              disabled={worksPage === worksPageCount}
              onClick={() => setWorksPage((prev) => Math.min(worksPageCount, prev + 1))}
            >
              Далі
            </Button>
          </div>
        ) : null}
        <div className={styles.rows}>
          <h3>Історія виплат</h3>
          {!salaryLoading ? (
            <div className={styles.payoutDateFilters}>
              <label className={styles.payoutDateFilterLabel}>
                <span>Фільтр дат</span>
                <select
                  className={styles.select}
                  value={payoutDatePreset}
                  onChange={(event) => setPayoutDatePreset(event.target.value as DateFilterPreset)}
                >
                  <option value="all">Усі дати</option>
                  <option value="year">За рік</option>
                  <option value="month">За місяць</option>
                  <option value="range">Період</option>
                </select>
              </label>
              {payoutDatePreset === "year" ? (
                <label className={styles.payoutDateFilterLabel}>
                  <span>Рік</span>
                  <input
                    className={styles.dateInput}
                    type="number"
                    min={2000}
                    max={2100}
                    value={payoutDateYear}
                    onChange={(event) => setPayoutDateYear(event.target.value)}
                  />
                </label>
              ) : null}
              {payoutDatePreset === "month" ? (
                <label className={styles.payoutDateFilterLabel}>
                  <span>Місяць</span>
                  <input
                    className={styles.dateInput}
                    type="month"
                    value={payoutDateMonth}
                    onChange={(event) => setPayoutDateMonth(event.target.value)}
                  />
                </label>
              ) : null}
              {payoutDatePreset === "range" ? (
                <>
                  <label className={styles.payoutDateFilterLabel}>
                    <span>Від</span>
                    <input
                      className={styles.dateInput}
                      type="date"
                      value={payoutDateFrom}
                      onChange={(event) => setPayoutDateFrom(event.target.value)}
                    />
                  </label>
                  <label className={styles.payoutDateFilterLabel}>
                    <span>До</span>
                    <input
                      className={styles.dateInput}
                      type="date"
                      value={payoutDateTo}
                      onChange={(event) => setPayoutDateTo(event.target.value)}
                    />
                  </label>
                </>
              ) : null}
            </div>
          ) : null}
          {salaryLoading ? <p className={styles.meta}>Завантаження виплат...</p> : null}
          {!salaryLoading && dateFilteredPayouts.length > 0 ? (
            <div className={styles.payoutsTotalBanner} role="status">
              <span className={styles.payoutsTotalLabel}>Разом виплачено (за фільтром)</span>
              <strong className={styles.payoutsTotalValue}>{payoutHistoryPaidTotal.toFixed(2)}</strong>
            </div>
          ) : null}
          {!salaryLoading &&
            paginatedPayouts.map((payout) => (
              <div className={styles.row} key={payout.id}>
                <div className={styles.info}>
                  <p className={styles.description}>{payout.userEmail}</p>
                  <p className={styles.meta}>{payout.payoutDate}</p>
                  <p className={styles.workDescription}>{payout.description}</p>
                </div>
                <p className={`${styles.summaryValue} ${styles.negative}`}>-{payout.amount.toFixed(2)}</p>
              </div>
            ))}
          {!salaryLoading && filteredPayouts.length === 0 ? <p className={styles.meta}>Немає виплат</p> : null}
          {!salaryLoading && filteredPayouts.length > 0 && dateFilteredPayouts.length === 0 ? (
            <p className={styles.meta}>Немає виплат за обраний період</p>
          ) : null}
          {!salaryLoading && dateFilteredPayouts.length > WORK_ROWS_PER_PAGE ? (
            <div className={styles.pagination}>
              <Button
                variant="ghost"
                type="button"
                disabled={payoutsPage === 1}
                onClick={() => setPayoutsPage((prev) => Math.max(1, prev - 1))}
              >
                Назад
              </Button>
              <span className={styles.paginationInfo}>
                Сторінка {payoutsPage}/{payoutsPageCount}
              </span>
              <Button
                variant="ghost"
                type="button"
                disabled={payoutsPage === payoutsPageCount}
                onClick={() => setPayoutsPage((prev) => Math.min(payoutsPageCount, prev + 1))}
              >
                Далі
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function AmountRow({ work, onDataChanged }: { work: WorkEntry; onDataChanged: () => Promise<void> }) {
  type AmountFormValues = z.output<typeof amountSchema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof amountSchema>, unknown, AmountFormValues>({
    resolver: zodResolver(amountSchema),
    defaultValues: { amount: work.amount },
  });

  const onSubmit = handleSubmit(async (values) => {
    await updateWorkAmount(work.id, values.amount);
    await onDataChanged();
  });

  return (
    <form className={styles.row} onSubmit={onSubmit}>
      <div className={styles.info}>
        <p className={styles.description}>{work.userEmail}</p>
        <p className={styles.meta}>
          {work.workDate} - {work.categoryName}
        </p>
        <p className={styles.workDescription}>{work.description}</p>
      </div>
      <div className={styles.amountGroup}>
        <input className={styles.amountInput} type="number" min={0} step="0.01" {...register("amount")} />
        <Button disabled={isSubmitting} type="submit">
          Оновити
        </Button>
      </div>
      {errors.amount ? <small className={styles.error}>{errors.amount.message}</small> : null}
    </form>
  );
}
