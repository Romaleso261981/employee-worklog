import type { ReactNode } from "react";
import styles from "./table.module.css";

export type TableSortDirection = "asc" | "desc";

export interface TableSortState {
  field: string;
  direction: TableSortDirection;
}

export interface TableColumn<T> {
  key: string;
  title: ReactNode;
  render: (row: T) => ReactNode;
  /** When set with `onSort`, header becomes a sort control for this field */
  sortKey?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Optional footer row(s), e.g. totals — use <tr><td colSpan={…}>…</td></tr> */
  footer?: ReactNode;
  sort?: TableSortState;
  onSort?: (field: string) => void;
}

function SortArrow({ direction }: { direction: TableSortDirection }) {
  return (
    <svg className={styles.sortArrow} width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      {direction === "asc" ? (
        <path fill="currentColor" d="M12 5l6 8H6l6-8z" />
      ) : (
        <path fill="currentColor" d="M12 19l-6-8h12l-6 8z" />
      )}
    </svg>
  );
}

export function Table<T>({ columns, rows, rowKey, footer, sort, onSort }: TableProps<T>) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => {
              const sortable = Boolean(column.sortKey && onSort);
              const isActive = sortable && sort?.field === column.sortKey;

              if (!sortable) {
                return <th key={column.key}>{column.title}</th>;
              }

              const ariaSort = isActive
                ? sort!.direction === "asc"
                  ? "ascending"
                  : "descending"
                : "none";

              return (
                <th key={column.key} scope="col" aria-sort={ariaSort}>
                  <button
                    type="button"
                    className={`${styles.sortButton} ${isActive ? styles.sortButtonActive : ""}`}
                    onClick={() => onSort!(column.sortKey!)}
                  >
                    <span className={styles.sortButtonLabel}>{column.title}</span>
                    {isActive ? <SortArrow direction={sort!.direction} /> : null}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer ? <tfoot className={styles.tfoot}>{footer}</tfoot> : null}
      </table>
    </div>
  );
}
