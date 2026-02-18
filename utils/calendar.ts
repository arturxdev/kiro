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

// --- Photo Grid utilities ---

export interface PhotoGridDay {
  dateKey: string;
  dayNumber: number;
  dayOfWeek: number; // 0 = Sunday
  isToday: boolean;
}

export interface PhotoGridRow {
  id: string;
  cells: (PhotoGridDay | null)[]; // always length 3
}

const WEEKDAY_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function getWeekdayShort(dayOfWeek: number): string {
  return WEEKDAY_SHORT[dayOfWeek];
}

export function buildPhotoGridRows(
  year: number,
  month: number,
  todayKey: string
): PhotoGridRow[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: PhotoGridDay[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = formatDateKey(year, month, d);
    if (dateKey > todayKey) break;
    const jsDate = new Date(year, month, d);
    days.push({
      dateKey,
      dayNumber: d,
      dayOfWeek: jsDate.getDay(),
      isToday: dateKey === todayKey,
    });
  }

  const rows: PhotoGridRow[] = [];
  for (let i = 0; i < days.length; i += 3) {
    const chunk: (PhotoGridDay | null)[] = days.slice(i, i + 3);
    while (chunk.length < 3) chunk.push(null);
    rows.push({
      id: `${year}-${month}-row-${Math.floor(i / 3)}`,
      cells: chunk,
    });
  }
  return rows;
}
