import { useState, useEffect, useCallback } from "react";
import { useDB } from "@/db/DatabaseProvider";
import { useDataContext } from "@/providers/DataProvider";
import * as entryRepository from "@/db/repositories/entryRepository";
import type { DayEntry } from "@/types";

export function useDayEntries(date: string) {
  const db = useDB();
  const { invalidationKey } = useDataContext();
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await entryRepository.getByDate(db, date);
      setEntries(data);
    } catch (e) {
      console.error("Failed to fetch entries:", e);
    } finally {
      setIsLoading(false);
    }
  }, [db, date]);

  useEffect(() => {
    refetch();
  }, [refetch, invalidationKey]);

  return { entries, isLoading, refetch };
}
