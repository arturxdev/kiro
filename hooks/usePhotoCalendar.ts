import { useState, useEffect, useCallback, useRef } from "react";
import { useDB } from "@/db/DatabaseProvider";
import { useDataContext } from "@/providers/DataProvider";
import * as entryRepository from "@/db/repositories/entryRepository";
import type { DayEntry } from "@/types";

const INITIAL_MONTH_COUNT = 4;

export interface MonthDescriptor {
  year: number;
  month: number; // 0-indexed
  key: string; // "YYYY-MM"
}

function buildInitialMonths(year: number, month: number, count: number): MonthDescriptor[] {
  const result: MonthDescriptor[] = [];
  let y = year;
  let m = month;
  for (let i = 0; i < count; i++) {
    result.push({
      year: y,
      month: m,
      key: `${y}-${String(m + 1).padStart(2, "0")}`,
    });
    m--;
    if (m < 0) {
      m = 11;
      y--;
    }
  }
  return result;
}

function getPreviousMonth(descriptor: MonthDescriptor): MonthDescriptor {
  let { year, month } = descriptor;
  month--;
  if (month < 0) {
    month = 11;
    year--;
  }
  return {
    year,
    month,
    key: `${year}-${String(month + 1).padStart(2, "0")}`,
  };
}

function mergeMaps(
  existing: Map<string, DayEntry[]>,
  incoming: Map<string, DayEntry[]>
): Map<string, DayEntry[]> {
  const merged = new Map(existing);
  for (const [key, value] of incoming) {
    merged.set(key, value);
  }
  return merged;
}

export function usePhotoCalendar() {
  const db = useDB();
  const { invalidationKey } = useDataContext();

  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();

  const [months, setMonths] = useState<MonthDescriptor[]>(() =>
    buildInitialMonths(todayYear, todayMonth, INITIAL_MONTH_COUNT)
  );
  const [entriesMap, setEntriesMap] = useState<Map<string, DayEntry[]>>(new Map());
  const [earliestAllowedKey, setEarliestAllowedKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);

  const oldestLoaded = months[months.length - 1];
  const oldestLoadedKey = `${oldestLoaded.year}-${String(oldestLoaded.month + 1).padStart(2, "0")}`;
  const canLoadMore =
    earliestAllowedKey === null || oldestLoadedKey > earliestAllowedKey.slice(0, 7);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      setIsLoading(true);
      try {
        const earliest = await entryRepository.getEarliestEntryDate(db);
        if (cancelled) return;
        setEarliestAllowedKey(earliest);

        const initialMonths = buildInitialMonths(todayYear, todayMonth, INITIAL_MONTH_COUNT);
        setMonths(initialMonths);

        const oldest = initialMonths[initialMonths.length - 1];
        const newest = initialMonths[0];
        const startDate = `${oldest.year}-${String(oldest.month + 1).padStart(2, "0")}-01`;
        const endDate = `${newest.year}-${String(newest.month + 1).padStart(2, "0")}-31`;
        const data = await entryRepository.getByDateRangeGrouped(db, startDate, endDate);

        if (cancelled) return;
        setEntriesMap(data);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    initialize();
    return () => {
      cancelled = true;
    };
  }, [db, invalidationKey, todayYear, todayMonth]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !canLoadMore) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const nextMonth = getPreviousMonth(oldestLoaded);
      const startDate = `${nextMonth.year}-${String(nextMonth.month + 1).padStart(2, "0")}-01`;
      const endDate = `${nextMonth.year}-${String(nextMonth.month + 1).padStart(2, "0")}-31`;
      const newData = await entryRepository.getByDateRangeGrouped(db, startDate, endDate);

      setMonths((prev) => [...prev, nextMonth]);
      setEntriesMap((prev) => mergeMaps(prev, newData));
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [canLoadMore, oldestLoaded, db]);

  return { months, entriesMap, isLoading, isLoadingMore, canLoadMore, loadMore };
}
