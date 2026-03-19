"use client";

import { useState } from "react";
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
        <div className={styles.rows}>
          {works.map((work) => (
            <AmountRow key={work.id} work={work} onDataChanged={onDataChanged} />
          ))}
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
      <div>
        <p className={styles.description}>{work.userEmail}</p>
        <p>{work.workDate} - {work.categoryName}</p>
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
