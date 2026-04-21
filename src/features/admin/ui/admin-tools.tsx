"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addCategory } from "@/entities/category/model/category-service";
import { createSalaryPayout, listAllSalaryPayouts, updateWorkEntryAdmin } from "@/entities/work/model/work-service";
import { SalaryPayout, WorkEntry } from "@/entities/work/model/types";
import { Button } from "@/shared/ui/button/button";
import { Input } from "@/shared/ui/input/input";
import { type DateFilterPreset, matchesDateString } from "@/shared/lib/date-filter";
import { categorySchema, salaryPayoutSchema, workAdminEditSchema } from "@/shared/lib/validation/schemas";
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
  const [workDatePreset, setWorkDatePreset] = useState<DateFilterPreset>("all");
  const [workDateYear, setWorkDateYear] = useState(() => String(new Date().getFullYear()));
  const [workDateMonth, setWorkDateMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [workDateFrom, setWorkDateFrom] = useState("");
  const [workDateTo, setWorkDateTo] = useState("");
  const [workCategoryFilter, setWorkCategoryFilter] = useState("");
  const [workSearchTerm, setWorkSearchTerm] = useState("");
  const [workSortField, setWorkSortField] = useState<"date" | "category" | "amount">("date");
  const [workSortDirection, setWorkSortDirection] = useState<"asc" | "desc">("desc");
  const [payoutDatePreset, setPayoutDatePreset] = useState<DateFilterPreset>("all");
  const [payoutDateYear, setPayoutDateYear] = useState(() => String(new Date().getFullYear()));
  const [payoutDateMonth, setPayoutDateMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [payoutDateFrom, setPayoutDateFrom] = useState("");
  const [payoutDateTo, setPayoutDateTo] = useState("");
  const [activeTab, setActiveTab] = useState<"works" | "payouts">("works");
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx" | "pdf">("csv");
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
    const base = selectedEmail ? works.filter((work) => work.userEmail === selectedEmail) : works;
    const search = workSearchTerm.trim().toLowerCase();
    if (!search) {
      return base;
    }
    return base.filter((work) => {
      return (
        work.description.toLowerCase().includes(search) ||
        work.workDate.includes(workSearchTerm) ||
        work.categoryName.toLowerCase().includes(search)
      );
    });
  }, [selectedEmail, workSearchTerm, works]);

  const workCategoryOptions = useMemo(() => {
    return [...new Set(filteredWorks.map((w) => w.categoryName))].sort((a, b) => a.localeCompare(b));
  }, [filteredWorks]);

  const dateFilteredWorks = useMemo(() => {
    return filteredWorks.filter((work) => {
      const matchesDate = matchesDateString(work.workDate, workDatePreset, workDateYear, workDateMonth, workDateFrom, workDateTo);
      const normalizedCategoryFilter = workCategoryFilter.trim().toLowerCase();
      const matchesCategory = normalizedCategoryFilter ? work.categoryName.trim().toLowerCase() === normalizedCategoryFilter : true;
      return matchesDate && matchesCategory;
    });
  }, [filteredWorks, workDatePreset, workDateYear, workDateMonth, workDateFrom, workDateTo, workCategoryFilter]);

  const sortedDateFilteredWorks = useMemo(() => {
    const directionMultiplier = workSortDirection === "asc" ? 1 : -1;
    return [...dateFilteredWorks].sort((a, b) => {
      if (workSortField === "amount") {
        return (a.amount - b.amount) * directionMultiplier;
      }
      if (workSortField === "category") {
        return a.categoryName.localeCompare(b.categoryName) * directionMultiplier;
      }
      return a.workDate.localeCompare(b.workDate) * directionMultiplier;
    });
  }, [dateFilteredWorks, workSortDirection, workSortField]);

  const worksTabEarnedTotal = useMemo(() => {
    return dateFilteredWorks.reduce((acc, work) => acc + work.amount, 0);
  }, [dateFilteredWorks]);

  const worksPageCount = Math.max(1, Math.ceil(sortedDateFilteredWorks.length / WORK_ROWS_PER_PAGE));

  const paginatedWorksForEdit = useMemo(() => {
    const from = (worksPage - 1) * WORK_ROWS_PER_PAGE;
    return sortedDateFilteredWorks.slice(from, from + WORK_ROWS_PER_PAGE);
  }, [sortedDateFilteredWorks, worksPage]);

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
    setWorksPage(1);
  }, [workDatePreset, workDateYear, workDateMonth, workDateFrom, workDateTo, workCategoryFilter, workSearchTerm]);

  useEffect(() => {
    setWorksPage(1);
  }, [workSortField, workSortDirection]);

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

  const exportData = useMemo(() => {
    const earned = dateFilteredWorks.reduce((acc, work) => acc + work.amount, 0);
    const paid = dateFilteredPayouts.reduce((acc, payout) => acc + payout.amount, 0);
    const balance = earned - paid;

    return {
      works: sortedDateFilteredWorks,
      payouts: dateFilteredPayouts,
      summary: { earned, paid, balance },
    };
  }, [dateFilteredPayouts, dateFilteredWorks, sortedDateFilteredWorks]);

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
      exportData.summary.earned.toFixed(2),
      exportData.summary.paid.toFixed(2),
      exportData.summary.balance.toFixed(2),
    ].map(escapeCsv).join(","));
    lines.push("");

    lines.push(["Тип", "Email", "Дата", "Опис", "Категорія", "Сума"].map(escapeCsv).join(","));
    exportData.works.forEach((work) => {
      lines.push(
        ["Робота", work.userEmail, work.workDate, work.description, work.categoryName, work.amount.toFixed(2)]
          .map(escapeCsv)
          .join(","),
      );
    });
    exportData.payouts.forEach((payout) => {
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

  const exportXlsx = async () => {
    const XLSX = await import("xlsx");

    const wb = XLSX.utils.book_new();
    const safeEmail = (selectedEmail || "all-workers").replaceAll(/[^a-z0-9@._-]/gi, "_");

    const workPeriodLabel =
      workDatePreset === "all"
        ? "all"
        : workDatePreset === "year"
          ? `year:${workDateYear}`
          : workDatePreset === "month"
            ? `month:${workDateMonth}`
            : `range:${workDateFrom || "-"}..${workDateTo || "-"}`;
    const payoutPeriodLabel =
      payoutDatePreset === "all"
        ? "all"
        : payoutDatePreset === "year"
          ? `year:${payoutDateYear}`
          : payoutDatePreset === "month"
            ? `month:${payoutDateMonth}`
            : `range:${payoutDateFrom || "-"}..${payoutDateTo || "-"}`;

    // Put Works first so Excel opens the "data" tab by default.
    const wsWorks = XLSX.utils.aoa_to_sheet([
      ["Дата", "Хто робив", "Категорія", "Опис", "Вартість"],
      ...exportData.works.map((w) => [w.workDate, w.userEmail, w.categoryName, w.description, Number(w.amount.toFixed(2))]),
    ]);
    XLSX.utils.book_append_sheet(wb, wsWorks, "Works");

    const wsPayouts = XLSX.utils.aoa_to_sheet([
      ["Дата", "Хто", "Опис", "Сума (виплата)"],
      ...exportData.payouts.map((p) => [p.payoutDate, p.userEmail, p.description, Number(p.amount.toFixed(2))]),
    ]);
    XLSX.utils.book_append_sheet(wb, wsPayouts, "Payouts");

    const wsSummary = XLSX.utils.aoa_to_sheet([
      ["Працівник", "Період робіт", "Період виплат", "Зароблено", "Виплачено", "Залишок"],
      [
        selectedEmail || "Усі працівники",
        workPeriodLabel,
        payoutPeriodLabel,
        Number(exportData.summary.earned.toFixed(2)),
        Number(exportData.summary.paid.toFixed(2)),
        Number(exportData.summary.balance.toFixed(2)),
      ],
    ]);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    XLSX.writeFile(wb, `salary-report-${safeEmail}.xlsx`);
  };

  const exportPdf = async () => {
    if (!selectedEmail) {
      setSalaryError("Для PDF оберіть працівника (email) у фільтрі зверху");
      return;
    }

    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const pageMargin = 40;
    const lineHeight = 14;
    const fontSize = 11;
    const headingSize = 14;

    const wrapText = (text: string, maxChars: number) => {
      const words = text.split(/\s+/).filter(Boolean);
      const lines: string[] = [];
      let cur = "";
      for (const w of words) {
        const next = cur ? `${cur} ${w}` : w;
        if (next.length > maxChars) {
          if (cur) lines.push(cur);
          cur = w;
        } else {
          cur = next;
        }
      }
      if (cur) lines.push(cur);
      return lines;
    };

    const addPage = () => pdf.addPage([595.28, 841.89]); // A4
    let page = addPage();
    let y = page.getHeight() - pageMargin;

    const drawLine = (text: string, bold = false, color = rgb(0.09, 0.13, 0.2)) => {
      page.drawText(text, {
        x: pageMargin,
        y,
        size: bold ? headingSize : fontSize,
        font: bold ? fontBold : font,
        color,
      });
      y -= bold ? lineHeight + 4 : lineHeight;
      if (y < pageMargin + lineHeight * 2) {
        page = addPage();
        y = page.getHeight() - pageMargin;
      }
    };

    drawLine("Salary statement", true);
    drawLine(`Worker: ${selectedEmail}`);
    const workPeriodText =
      workDatePreset === "all"
        ? "Work period: all"
        : workDatePreset === "year"
          ? `Work period: year ${workDateYear}`
          : workDatePreset === "month"
            ? `Work period: month ${workDateMonth}`
            : `Work period: ${workDateFrom || "-"} .. ${workDateTo || "-"}`;
    const payoutPeriodText =
      payoutDatePreset === "all"
        ? "Payout period: all"
        : payoutDatePreset === "year"
          ? `Payout period: year ${payoutDateYear}`
          : payoutDatePreset === "month"
            ? `Payout period: month ${payoutDateMonth}`
            : `Payout period: ${payoutDateFrom || "-"} .. ${payoutDateTo || "-"}`;
    drawLine(workPeriodText);
    drawLine(payoutPeriodText);
    drawLine(`Earned: ${exportData.summary.earned.toFixed(2)}`);
    drawLine(`Paid: ${exportData.summary.paid.toFixed(2)}`);
    drawLine(
      `Balance: ${exportData.summary.balance.toFixed(2)}`,
      false,
      exportData.summary.balance >= 0 ? rgb(0.09, 0.61, 0.23) : rgb(0.81, 0.18, 0.18),
    );
    y -= 6;

    drawLine("Works", true);
    if (exportData.works.length === 0) {
      drawLine("No work entries.");
    } else {
      drawLine("Date | Category | Amount", false, rgb(0.35, 0.39, 0.46));
      for (const w of exportData.works) {
        drawLine(`${w.workDate} | ${w.categoryName} | ${w.amount.toFixed(2)}`);
        const descLines = wrapText(w.description, 90).slice(0, 4);
        for (const dl of descLines) {
          drawLine(`  ${dl}`);
        }
        y -= 4;
      }
    }

    drawLine("Payouts", true);
    if (exportData.payouts.length === 0) {
      drawLine("No payouts.");
    } else {
      drawLine("Date | Amount", false, rgb(0.35, 0.39, 0.46));
      for (const p of exportData.payouts) {
        drawLine(`${p.payoutDate} | -${p.amount.toFixed(2)}`);
        const descLines = wrapText(p.description, 95).slice(0, 4);
        for (const dl of descLines) {
          drawLine(`  ${dl}`);
        }
        y -= 4;
      }
    }

    const bytes = await pdf.save();
    const out = Uint8Array.from(bytes);
    const blob = new Blob([out], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeEmail = selectedEmail.replaceAll(/[^a-z0-9@._-]/gi, "_");
    link.href = url;
    link.download = `salary-statement-${safeEmail}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setSalaryError(null);
    if (exportFormat === "csv") {
      exportCsv();
      return;
    }
    if (exportFormat === "xlsx") {
      await exportXlsx();
      return;
    }
    await exportPdf();
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
          <select className={styles.select} value={exportFormat} onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}>
            <option value="csv">CSV</option>
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="pdf">PDF (statement)</option>
          </select>
          <Button type="button" variant="ghost" onClick={handleExport}>
            Експорт
          </Button>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "works" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("works")}
          >
            Роботи працівника
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "payouts" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("payouts")}
          >
            Видача та виплати
          </button>
        </div>

        {activeTab === "works" ? (
          <>
            <div className={styles.rows}>
              <h3>Роботи</h3>
              <div className={styles.payoutDateFilters}>
                <label className={styles.payoutDateFilterLabel}>
                  <span>Пошук</span>
                  <input
                    className={styles.dateInput}
                    value={workSearchTerm}
                    onChange={(event) => setWorkSearchTerm(event.target.value)}
                    placeholder="Опис / дата / категорія"
                  />
                </label>
              </div>
              <div className={styles.payoutDateFilters}>
                <label className={styles.payoutDateFilterLabel}>
                  <span>Фільтр дат</span>
                  <select
                    className={styles.select}
                    value={workDatePreset}
                    onChange={(event) => setWorkDatePreset(event.target.value as DateFilterPreset)}
                  >
                    <option value="all">Усі дати</option>
                    <option value="year">За рік</option>
                    <option value="month">За місяць</option>
                    <option value="range">Період</option>
                  </select>
                </label>
                {workDatePreset === "year" ? (
                  <label className={styles.payoutDateFilterLabel}>
                    <span>Рік</span>
                    <input
                      className={styles.dateInput}
                      type="number"
                      min={2000}
                      max={2100}
                      value={workDateYear}
                      onChange={(event) => setWorkDateYear(event.target.value)}
                    />
                  </label>
                ) : null}
                {workDatePreset === "month" ? (
                  <label className={styles.payoutDateFilterLabel}>
                    <span>Місяць</span>
                    <input
                      className={styles.dateInput}
                      type="month"
                      value={workDateMonth}
                      onChange={(event) => setWorkDateMonth(event.target.value)}
                    />
                  </label>
                ) : null}
                {workDatePreset === "range" ? (
                  <>
                    <label className={styles.payoutDateFilterLabel}>
                      <span>Від</span>
                      <input
                        className={styles.dateInput}
                        type="date"
                        value={workDateFrom}
                        onChange={(event) => setWorkDateFrom(event.target.value)}
                      />
                    </label>
                    <label className={styles.payoutDateFilterLabel}>
                      <span>До</span>
                      <input
                        className={styles.dateInput}
                        type="date"
                        value={workDateTo}
                        onChange={(event) => setWorkDateTo(event.target.value)}
                      />
                    </label>
                  </>
                ) : null}
              </div>
              <div className={styles.payoutDateFilters}>
                <label className={styles.payoutDateFilterLabel}>
                  <span>Категорія</span>
                  <select
                    className={styles.select}
                    value={workCategoryFilter}
                    onChange={(event) => setWorkCategoryFilter(event.target.value)}
                  >
                    <option value="">Усі категорії</option>
                    {workCategoryOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className={styles.payoutDateFilters}>
                <label className={styles.payoutDateFilterLabel}>
                  <span>Сортування</span>
                  <select className={styles.select} value={workSortField} onChange={(e) => setWorkSortField(e.target.value as typeof workSortField)}>
                    <option value="date">Дата</option>
                    <option value="category">Категорія</option>
                    <option value="amount">Сума</option>
                  </select>
                </label>
                <label className={styles.payoutDateFilterLabel}>
                  <span>Напрямок</span>
                  <select
                    className={styles.select}
                    value={workSortDirection}
                    onChange={(e) => setWorkSortDirection(e.target.value as typeof workSortDirection)}
                  >
                    <option value="desc">Спадання</option>
                    <option value="asc">Зростання</option>
                  </select>
                </label>
              </div>
              {filteredWorks.length > 0 ? (
                <div className={styles.worksTotalBanner} role="status">
                  <span className={styles.worksTotalLabel}>Разом зароблено (за фільтром)</span>
                  <strong className={styles.worksTotalValue}>{worksTabEarnedTotal.toFixed(2)}</strong>
                </div>
              ) : null}
              {paginatedWorksForEdit.map((work) => (
                <AmountRow key={`${work.id}:${work.description}:${work.amount}`} work={work} onDataChanged={onDataChanged} />
              ))}
            </div>
            {filteredWorks.length === 0 ? <p className={styles.meta}>Немає робіт для обраного працівника</p> : null}
            {filteredWorks.length > 0 && dateFilteredWorks.length === 0 ? <p className={styles.meta}>Немає робіт за обраний період</p> : null}
            {sortedDateFilteredWorks.length > WORK_ROWS_PER_PAGE ? (
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
          </>
        ) : null}

        {activeTab === "payouts" ? (
          <>
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
          </>
        ) : null}
      </div>
    </section>
  );
}

function AmountRow({ work, onDataChanged }: { work: WorkEntry; onDataChanged: () => Promise<void> }) {
  const [isEditingDescription, setEditingDescription] = useState(false);
  const [isEditingAmount, setEditingAmount] = useState(false);
  const [pending, setPending] = useState(false);
  const {
    register,
    getValues,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<{ amount: number; description: string }>({
    defaultValues: { amount: work.amount, description: work.description },
  });

  useEffect(() => {
    reset({ amount: work.amount, description: work.description });
  }, [reset, work.amount, work.description]);

  const handleDescriptionSave = async () => {
    const parsed = workAdminEditSchema.pick({ description: true }).safeParse({ description: getValues("description") });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Невірний опис";
      setError("description", { message: msg });
      return;
    }
    clearErrors("description");
    setPending(true);
    try {
      await updateWorkEntryAdmin(work.id, { amount: work.amount, description: parsed.data.description });
      await onDataChanged();
      setEditingDescription(false);
      reset({ amount: work.amount, description: parsed.data.description });
    } catch {
      setError("description", { message: "Не вдалося зберегти" });
    } finally {
      setPending(false);
    }
  };

  const handleAmountSave = async () => {
    const parsed = workAdminEditSchema.pick({ amount: true }).safeParse({ amount: getValues("amount") });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Невірна сума";
      setError("amount", { message: msg });
      return;
    }
    clearErrors("amount");
    setPending(true);
    try {
      await updateWorkEntryAdmin(work.id, { amount: parsed.data.amount, description: work.description });
      await onDataChanged();
      setEditingAmount(false);
      reset({ amount: parsed.data.amount, description: work.description });
    } catch {
      setError("amount", { message: "Не вдалося зберегти" });
    } finally {
      setPending(false);
    }
  };

  const amountLocked = isEditingDescription || !isEditingAmount;

  return (
    <div className={styles.row}>
      <div className={styles.info}>
        <p className={styles.description}>{work.userEmail}</p>
        <p className={styles.meta}>
          {work.workDate} - {work.categoryName}
        </p>
        <div className={styles.descriptionRow}>
          {!isEditingDescription ? (
            <>
              <p className={styles.workDescription}>{work.description}</p>
              <button
                type="button"
                className={styles.iconButton}
                aria-label="Редагувати опис"
                onClick={() => {
                  reset({ amount: work.amount, description: work.description });
                  setEditingAmount(false);
                  setEditingDescription(true);
                }}
              >
                ✎
              </button>
            </>
          ) : (
            <div className={styles.descriptionEditor}>
              <textarea className={styles.textarea} rows={2} {...register("description")} />
              {errors.description ? <small className={styles.error}>{errors.description.message}</small> : null}
              <div className={styles.editorActions}>
                <Button type="button" disabled={pending} onClick={() => void handleDescriptionSave()}>
                  Зберегти
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => {
                    reset({ amount: work.amount, description: work.description });
                    setEditingDescription(false);
                  }}
                >
                  Скасувати
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={styles.amountBlock}>
        <div className={styles.amountGroup}>
          {amountLocked ? (
            <>
              <span className={styles.amountReadonly}>{work.amount.toFixed(2)}</span>
              {!isEditingDescription ? (
                <button
                  type="button"
                  className={styles.iconButton}
                  aria-label="Редагувати суму"
                  disabled={pending}
                  onClick={() => {
                    reset({ amount: work.amount, description: work.description });
                    setEditingDescription(false);
                    setEditingAmount(true);
                  }}
                >
                  ✎
                </button>
              ) : null}
            </>
          ) : (
            <>
              <input className={styles.amountInput} type="number" min={0} step="0.01" {...register("amount")} />
              <Button type="button" disabled={pending} onClick={() => void handleAmountSave()}>
                Оновити
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  reset({ amount: work.amount, description: work.description });
                  setEditingAmount(false);
                }}
              >
                Скасувати
              </Button>
            </>
          )}
        </div>
        {!amountLocked && errors.amount ? <small className={styles.error}>{errors.amount.message}</small> : null}
      </div>
    </div>
  );
}
