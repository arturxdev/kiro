import { useState, useEffect, useCallback } from "react";
import { useDB } from "@/db/DatabaseProvider";
import * as categoryRepository from "@/db/repositories/categoryRepository";
import type { Category } from "@/types";

export function useCategories() {
  const db = useDB();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Map<string, Category>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await categoryRepository.getAll(db);
      setCategories(data);
      setCategoriesMap(new Map(data.map((c) => [c.id, c])));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { categories, categoriesMap, isLoading, error, refetch };
}
