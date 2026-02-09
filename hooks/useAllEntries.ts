import { useState, useEffect, useCallback } from "react";
import { useDB } from "@/db/DatabaseProvider";
import { useDataContext } from "@/providers/DataProvider";
import * as entryRepository from "@/db/repositories/entryRepository";
import type { DayEntry } from "@/types";

export function useAllEntries(pageSize = 15) {
  const db = useDB();
  const { invalidationKey } = useDataContext();
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchPage = useCallback(
    async (pageOffset: number, append: boolean) => {
      try {
        const data = await entryRepository.getAll(db, {
          limit: pageSize,
          offset: pageOffset,
        });

        if (data.length < pageSize) {
          setHasMore(false);
        }

        setEntries((prev) => (append ? [...prev, ...data] : data));
      } catch (e) {
        console.error("Failed to fetch entries:", e);
      }
    },
    [db, pageSize]
  );

  // Initial load + re-fetch on invalidation
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    setIsLoading(true);
    fetchPage(0, false).finally(() => setIsLoading(false));
  }, [fetchPage, invalidationKey]);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    const nextOffset = offset + pageSize;
    setIsLoadingMore(true);
    setOffset(nextOffset);
    fetchPage(nextOffset, true).finally(() => setIsLoadingMore(false));
  }, [isLoadingMore, hasMore, offset, pageSize, fetchPage]);

  const refetch = useCallback(() => {
    setOffset(0);
    setHasMore(true);
    setIsLoading(true);
    fetchPage(0, false).finally(() => setIsLoading(false));
  }, [fetchPage]);

  return { entries, isLoading, isLoadingMore, hasMore, loadMore, refetch };
}
