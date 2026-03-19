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
import { amountSchema, categorySchema, salaryPayoutSchema } from "@/shared/lib/validation/schemas";
import styles from "./admin-tools.module.css";

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

  const filteredPayouts = useMemo(() => {
    return selectedEmail ? salaryPayouts.filter((payout) => payout.userEmail === selectedEmail) : salaryPayouts;
  }, [salaryPayouts, selectedEmail]);

  const summary = useMemo(() => {
    const earned = filteredWorks.reduce((acc, work) => acc + work.amount, 0);
    const paid = filteredPayouts.reduce((acc, payout) => acc + payout.amount, 0);
    const balance = earned - paid;
    return { earned, paid, balance };
  }, [filteredPayouts, filteredWorks]);

  const onSalarySubmit = handleSalarySubmit(async (values) => {
    setSalaryError(null);
    if (!selectedEmail) {
      setSalaryError("Оберіть працівника для виплати");
      return;
    }

    const userId = workerIdByEmail.get(selectedEmail);
    if (!userId) {
      setSalaryError("Не вдалося визначити працівника");
      return;
    }

    try {
      await createSalaryPayout({
        userId,
        userEmail: selectedEmail,
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
          <Button disabled={isSalarySubmitting || !selectedEmail} type="submit">
            Зберегти виплату
          </Button>
        </form>

        <div className={styles.rows}>
          {filteredWorks.map((work) => (
            <AmountRow key={work.id} work={work} onDataChanged={onDataChanged} />
          ))}
        </div>
        {filteredWorks.length === 0 ? <p className={styles.meta}>Немає робіт для обраного працівника</p> : null}
        <div className={styles.rows}>
          <h3>Історія виплат</h3>
          {salaryLoading ? <p className={styles.meta}>Завантаження виплат...</p> : null}
          {!salaryLoading &&
            filteredPayouts.map((payout) => (
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
