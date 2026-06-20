"use client";

import { useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Category } from "@/entities/category/model/types";
import { WorkEntry } from "@/entities/work/model/types";
import { deleteWorkEntry, updateWorkEntry } from "@/entities/work/model/work-service";
import { useAuth } from "@/shared/lib/auth/auth-context";
import { useI18n } from "@/shared/lib/i18n/i18n-context";
import { createWorkSchema } from "@/shared/lib/validation/schemas";
import { Input } from "@/shared/ui/input/input";
import { Modal } from "@/shared/ui/modal/modal";
import { useToast } from "@/shared/ui/toast/toast-provider";
import styles from "./work-details-modal.module.css";

type EditValuesInput = z.input<typeof createWorkSchema>;
type EditValuesOutput = z.output<typeof createWorkSchema>;

interface Props {
  work: WorkEntry | null;
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onUpdated: () => Promise<void>;
}

export function WorkDetailsModal({ work, isOpen, categories, onClose, onUpdated }: Props) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = Boolean(
    work &&
      user &&
      (user.role === "admin" || user.uid === work.userId),
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditValuesInput, unknown, EditValuesOutput>({
    resolver: zodResolver(createWorkSchema),
    defaultValues: {
      workDate: work?.workDate ?? "",
      description: work?.description ?? "",
      categoryId: work?.categoryId ?? "",
      amount: work?.amount ?? 0,
    },
  });

  useEffect(() => {
    if (work) {
      reset({
        workDate: work.workDate,
        description: work.description,
        categoryId: work.categoryId,
        amount: work.amount,
      });
    }
    setIsEditing(false);
    setSubmitError(null);
    setConfirmDelete(false);
  }, [reset, work]);

  const handleClose = () => {
    setIsEditing(false);
    setSubmitError(null);
    setConfirmDelete(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!work) {
      return;
    }
    setSubmitError(null);
    setIsDeleting(true);
    try {
      await deleteWorkEntry(work.id);
      await onUpdated();
      showToast(t("workDetails.deleted"));
      handleClose();
    } catch (error) {
      console.error("Failed to delete work entry:", error);
      if (error instanceof FirebaseError && error.code === "permission-denied") {
        setSubmitError(t("workDetails.deleteFailedPermission"));
      } else {
        setSubmitError(t("workDetails.deleteFailed"));
      }
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!work) return;
    setSubmitError(null);

    const selectedCategory = categories.find((c) => c.id === values.categoryId);
    if (!selectedCategory) {
      setSubmitError(t("workForm.categoryMissing"));
      return;
    }

    try {
      await updateWorkEntry(work.id, {
        workDate: values.workDate,
        description: values.description,
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
      });
      await onUpdated();
      showToast(t("workDetails.updated"));
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error("Failed to update work entry:", error);
      setSubmitError(t("workDetails.updateFailed"));
    }
  });

  if (!work) {
    return null;
  }

  const title = isEditing ? t("workDetails.editTitle") : t("workDetails.title");

  return (
    <Modal isOpen={isOpen} title={title} onClose={handleClose}>
      {!isEditing ? (
        <div className={styles.details}>
          <div className={styles.field}>
            <span className={styles.label}>{t("dashboard.dateLabel")}</span>
            <span className={styles.value}>{work.workDate}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>{t("dashboard.categoryLabel")}</span>
            <span className={styles.value}>{work.categoryName}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.label}>{t("dashboard.descriptionLabel")}</span>
            <p className={styles.descriptionValue}>{work.description}</p>
          </div>
          {user?.role === "admin" ? (
            <div className={styles.field}>
              <span className={styles.label}>{t("dashboard.workerFilterLabel")}</span>
              <span className={styles.value}>{work.userEmail}</span>
            </div>
          ) : null}
          {user?.role === "admin" ? (
            <div className={styles.field}>
              <span className={styles.label}>{t("dashboard.amountLabel")}</span>
              <span className={styles.value}>{work.amount.toFixed(2)}</span>
            </div>
          ) : null}
          {confirmDelete ? (
            <p className={styles.confirmDeleteText}>{t("workDetails.deleteConfirm")}</p>
          ) : null}
          {submitError ? <p className={styles.error}>{submitError}</p> : null}
          <div className={styles.footer}>
            {canManage ? (
              <div className={styles.footerStart}>
                {!confirmDelete ? (
                  <button
                    type="button"
                    className={styles.dangerButton}
                    disabled={isDeleting}
                    onClick={() => setConfirmDelete(true)}
                  >
                    {t("workDetails.delete")}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      disabled={isDeleting}
                      onClick={() => void handleDelete()}
                    >
                      {t("workDetails.deleteConfirmAction")}
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      disabled={isDeleting}
                      onClick={() => setConfirmDelete(false)}
                    >
                      {t("workDetails.cancel")}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <span />
            )}
            <div className={styles.footerEnd}>
              <button type="button" className={styles.secondaryButton} onClick={handleClose}>
                {t("common.close")}
              </button>
              {canManage && !confirmDelete ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => setIsEditing(true)}
                >
                  {t("workDetails.edit")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <form className={styles.form} onSubmit={onSubmit}>
          <Input
            label={t("workForm.date")}
            type="date"
            {...register("workDate")}
            error={errors.workDate?.message}
          />
          <label className={styles.fieldGroup}>
            <span className={styles.label}>{t("workForm.category")}</span>
            <select className={styles.select} {...register("categoryId")}>
              <option value="">{t("workForm.selectCategory")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId ? (
              <small className={styles.error}>{errors.categoryId.message}</small>
            ) : null}
          </label>
          <label className={styles.fieldGroup}>
            <span className={styles.label}>{t("workForm.description")}</span>
            <textarea className={styles.textarea} rows={4} {...register("description")} />
            {errors.description ? (
              <small className={styles.error}>{errors.description.message}</small>
            ) : null}
          </label>
          {submitError ? <p className={styles.error}>{submitError}</p> : null}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={isSubmitting}
              onClick={() => {
                reset({
                  workDate: work.workDate,
                  description: work.description,
                  categoryId: work.categoryId,
                  amount: work.amount,
                });
                setIsEditing(false);
                setSubmitError(null);
              }}
            >
              {t("workDetails.cancel")}
            </button>
            <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
              {t("workDetails.save")}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
