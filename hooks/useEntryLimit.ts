import { useEffect, useState } from "react";
import { useDB } from "@/db/DatabaseProvider";
import { useDataContext } from "@/providers/DataProvider";
import { useRevenueCat } from "@/providers/RevenueCatProvider";
import * as entryRepository from "@/db/repositories/entryRepository";

const FREE_LIMIT = 30;

export function useEntryLimit() {
  const db = useDB();
  const { invalidationKey } = useDataContext();
  const { isPro } = useRevenueCat();
  const [totalEntries, setTotalEntries] = useState(0);

  useEffect(() => {
    entryRepository.getTotalCount(db).then(setTotalEntries);
  }, [db, invalidationKey]);

  return {
    totalEntries,
    canCreateEntry: isPro || totalEntries < FREE_LIMIT,
    isPro,
    FREE_LIMIT,
    remaining: Math.max(0, FREE_LIMIT - totalEntries),
  };
}
