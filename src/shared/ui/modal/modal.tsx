"use client";

import { ReactNode } from "react";
import { Button } from "@/shared/ui/button/button";
import { useI18n } from "@/shared/lib/i18n/i18n-context";
import styles from "./modal.module.css";

interface Props {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ isOpen, title, onClose, children }: Props) {
  const { t } = useI18n();

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <h2>{title}</h2>
          <Button variant="ghost" type="button" onClick={onClose}>
            {t("common.close")}
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
