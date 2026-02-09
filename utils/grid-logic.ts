import type { DayEntry, Category } from "@/types";
import { isToday, isFuture } from "./calendar";

export type CellStatus = "future" | "today" | "pastEmpty" | "filled";

export interface CellVisualState {
  dateKey: string;
  status: CellStatus;
  dominantColor: string | null;
  dotColors: string[];
}

export function getCellVisualState(
  dateKey: string,
  entries: DayEntry[] | undefined,
  categoriesMap: Map<string, Category>
): CellVisualState {
  let status: CellStatus;
  if (isToday(dateKey)) {
    status = entries && entries.length > 0 ? "filled" : "today";
  } else if (isFuture(dateKey)) {
    status = "future";
  } else {
    status = entries && entries.length > 0 ? "filled" : "pastEmpty";
  }

  const dominantColor =
    entries && entries.length > 0
      ? getDominantCategory(entries, categoriesMap)
      : null;

  const dotColors =
    entries && entries.length > 0
      ? getDotColors(entries, categoriesMap)
      : [];

  return { dateKey, status, dominantColor, dotColors };
}

function getDominantCategory(
  entries: DayEntry[],
  categoriesMap: Map<string, Category>
): string | null {
  const counts = new Map<string, { count: number; earliest: string }>();

  for (const entry of entries) {
    const cat = categoriesMap.get(entry.category_id);
    if (!cat) continue;
    const existing = counts.get(cat.id);
    if (existing) {
      existing.count++;
      if (entry.created_at < existing.earliest) {
        existing.earliest = entry.created_at;
      }
    } else {
      counts.set(cat.id, { count: 1, earliest: entry.created_at });
    }
  }

  let best: { id: string; count: number; earliest: string } | null = null;
  for (const [id, data] of counts) {
    if (
      !best ||
      data.count > best.count ||
      (data.count === best.count && data.earliest < best.earliest)
    ) {
      best = { id, ...data };
    }
  }

  return best ? categoriesMap.get(best.id)?.color ?? null : null;
}

function getDotColors(
  entries: DayEntry[],
  categoriesMap: Map<string, Category>
): string[] {
  const seen = new Set<string>();
  const colors: string[] = [];

  for (const entry of entries) {
    const cat = categoriesMap.get(entry.category_id);
    if (!cat || seen.has(cat.id)) continue;
    seen.add(cat.id);
    colors.push(cat.color);
    if (colors.length >= 4) break;
  }

  return colors;
}
