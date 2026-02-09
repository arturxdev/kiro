import { createContext, use, useState, useCallback, type ReactNode } from "react";

interface DataContextValue {
  invalidationKey: number;
  invalidate: () => void;
}

const DataContext = createContext<DataContextValue>({
  invalidationKey: 0,
  invalidate: () => {},
});

export function useDataContext(): DataContextValue {
  return use(DataContext);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [invalidationKey, setInvalidationKey] = useState(0);

  const invalidate = useCallback(() => {
    setInvalidationKey((k) => k + 1);
  }, []);

  return (
    <DataContext value={{ invalidationKey, invalidate }}>
      {children}
    </DataContext>
  );
}
