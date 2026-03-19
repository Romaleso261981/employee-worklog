"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addCategory } from "@/entities/category/model/category-service";
import { updateWorkAmount } from "@/entities/work/model/work-service";
import { WorkEntry } from "@/entities/work/model/types";
import { Button } from "@/shared/ui/button/button";
import { Input } from "@/shared/ui/input/input";
import { amountSchema, categorySchema } from "@/shared/lib/validation/schemas";
import styles from "./admin-tools.module.css";

interface Props {
  adminUid: string;
  works: WorkEntry[];
  onDataChanged: () => Promise<void>;
}

export function AdminTools({ adminUid, works, onDataChanged }: Props) {
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState("");
  type CategoryFormValues = z.output<typeof categorySchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
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

  const workerEmails = useMemo(() => {
    return [...new Set(works.map((work) => work.userEmail))].sort((a, b) => a.localeCompare(b));
  }, [works]);

  const filteredWorks = useMemo(() => {
    return selectedEmail ? works.filter((work) => work.userEmail === selectedEmail) : works;
  }, [selectedEmail, works]);

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
        <div className={styles.rows}>
          {filteredWorks.map((work) => (
            <AmountRow key={work.id} work={work} onDataChanged={onDataChanged} />
          ))}
        </div>
        {filteredWorks.length === 0 ? <p className={styles.meta}>Немає робіт для обраного працівника</p> : null}
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
