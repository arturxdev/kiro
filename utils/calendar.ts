export interface MonthData {
  month: number; // 0-indexed
  name: string;
  days: number;
  startDayOfWeek: number; // 0 = Sunday
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function generateYearMonths(year: number): MonthData[] {
  return Array.from({ length: 12 }, (_, i) => ({
    month: i,
    name: MONTH_NAMES[i],
    days: new Date(year, i + 1, 0).getDate(),
    startDayOfWeek: new Date(year, i, 1).getDay(),
  }));
}

export function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function getTodayKey(): string {
  const now = new Date();
  return formatDateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isToday(dateKey: string): boolean {
  return dateKey === getTodayKey();
}

export function isFuture(dateKey: string): boolean {
  return dateKey > getTodayKey();
}

export function isPast(dateKey: string): boolean {
  return dateKey < getTodayKey();
}
