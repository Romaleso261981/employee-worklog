export type DateFilterPreset = "all" | "year" | "month" | "range";

/** Поточна локальна дата у форматі YYYY-MM-DD (для `<input type="date">`). */
export function todayIsoDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** `isoDate` у форматі YYYY-MM-DD (як workDate / payoutDate у Firestore). */
export function matchesDateString(
  isoDate: string,
  preset: DateFilterPreset,
  yearStr: string,
  monthValue: string,
  from: string,
  to: string,
): boolean {
  if (preset === "all") {
    return true;
  }
  if (preset === "year") {
    const y = yearStr.trim();
    if (!y) {
      return true;
    }
    return isoDate.startsWith(`${y}-`);
  }
  if (preset === "month") {
    if (!monthValue) {
      return true;
    }
    return isoDate.startsWith(monthValue);
  }
  if (preset === "range") {
    if (from && isoDate < from) {
      return false;
    }
    if (to && isoDate > to) {
      return false;
    }
    return true;
  }
  return true;
}
