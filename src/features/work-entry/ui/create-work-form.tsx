"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createWorkSchema } from "@/shared/lib/validation/schemas";
import { Input } from "@/shared/ui/input/input";
import { Button } from "@/shared/ui/button/button";
import { Category } from "@/entities/category/model/types";
import { createWorkEntry } from "@/entities/work/model/work-service";
import { useAuth } from "@/shared/lib/auth/auth-context";
import { useI18n } from "@/shared/lib/i18n/i18n-context";
import styles from "./create-work-form.module.css";

type WorkValuesInput = z.input<typeof createWorkSchema>;
type WorkValuesOutput = z.output<typeof createWorkSchema>;

interface Props {
  categories: Category[];
  onCreated: () => Promise<void>;
  onSuccess?: () => void;
}

export function CreateWorkForm({ categories, onCreated, onSuccess }: Props) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkValuesInput, unknown, WorkValuesOutput>({
    resolver: zodResolver(createWorkSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!user) {
      return;
    }

    const selectedCategory = categories.find((item) => item.id === values.categoryId);

    if (!selectedCategory) {
      setSubmitError(t("workForm.categoryMissing"));
      return;
    }

    try {
      await createWorkEntry({
        userId: user.uid,
        userEmail: user.email,
        workDate: values.workDate,
        description: values.description,
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        amount: values.amount,
      });
      reset({ workDate: "", description: "", categoryId: "", amount: 0 });
      await onCreated();
      onSuccess?.();
    } catch {
      setSubmitError(t("workForm.failed"));
    }
  });

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <h2>{t("workForm.title")}</h2>
      <Input label={t("workForm.date")} type="date" {...register("workDate")} error={errors.workDate?.message} />
      <label className={styles.wrapper}>
        <span>{t("workForm.description")}</span>
        <textarea className={styles.textarea} rows={3} {...register("description")} />
        {errors.description ? <small className={styles.error}>{errors.description.message}</small> : null}
      </label>
      <label className={styles.wrapper}>
        <span>{t("workForm.category")}</span>
        <select className={styles.select} {...register("categoryId")}>
          <option value="">{t("workForm.selectCategory")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId ? <small className={styles.error}>{errors.categoryId.message}</small> : null}
      </label>
      <Input label={t("workForm.amountOptional")} type="number" min={0} step="0.01" {...register("amount")} error={errors.amount?.message} />
      {submitError ? <p className={styles.error}>{submitError}</p> : null}
      <Button disabled={isSubmitting} type="submit">
        {t("workForm.saveWork")}
      </Button>
    </form>
  );
}
