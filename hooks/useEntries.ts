import { useState, useEffect, useCallback } from "react";
import { useDB } from "@/db/DatabaseProvider";
import { useDataContext } from "@/providers/DataProvider";
import * as entryRepository from "@/db/repositories/entryRepository";
import type { DayEntry } from "@/types";

export function useEntries(year: number) {
  const db = useDB();
  const { invalidationKey } = useDataContext();
  const [entriesMap, setEntriesMap] = useState<Map<string, DayEntry[]>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await entryRepository.getByYearGrouped(db, year);
      setEntriesMap(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [db, year]);

  useEffect(() => {
    refetch();
  }, [refetch, invalidationKey]);

  return { entriesMap, isLoading, error, refetch };
}
