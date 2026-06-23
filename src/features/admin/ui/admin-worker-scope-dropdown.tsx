"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { isAllWorkersSelected } from "@/shared/lib/admin-worker-scope";
import { useI18n } from "@/shared/lib/i18n/i18n-context";
import styles from "./admin-worker-scope-dropdown.module.css";

interface Props {
  allWorkerEmails: string[];
  selectedEmails: string[] | null;
  onToggle: (email: string) => void;
  onSelectAll: () => void;
}

export function AdminWorkerScopeDropdown({ allWorkerEmails, selectedEmails, onToggle, onSelectAll }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selectedCount = selectedEmails?.length ?? 0;
  const allSelected = useMemo(
    () => isAllWorkersSelected(allWorkerEmails, selectedEmails),
    [allWorkerEmails, selectedEmails],
  );

  const triggerLabel = useMemo(() => {
    const base = t("dashboard.adminScopeWorkersButton");
    if (allWorkerEmails.length === 0) {
      return base;
    }
    if (allSelected) {
      return base;
    }
    return `${base} (${selectedCount})`;
  }, [allSelected, allWorkerEmails.length, selectedCount, t]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{triggerLabel}</span>
        <svg className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M7 10l5 5 5-5H7z" />
        </svg>
      </button>

      {open ? (
        <div className={styles.panel} role="presentation">
          <div className={styles.panelToolbar}>
            <button
              type="button"
              className={styles.selectAllButton}
              onClick={() => {
                onSelectAll();
              }}
            >
              {t("dashboard.adminScopeSelectAll")}
            </button>
          </div>
          <div id={listId} className={styles.list} role="listbox" aria-multiselectable="true" aria-label={t("dashboard.adminScopeWorkersButton")}>
            {allWorkerEmails.map((email) => {
              const checked = selectedEmails?.includes(email) ?? false;
              return (
                <label key={email} className={styles.option} role="option" aria-selected={checked}>
                  <input type="checkbox" checked={checked} onChange={() => onToggle(email)} />
                  <span>{email}</span>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
