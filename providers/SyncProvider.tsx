import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useDB } from "@/db/DatabaseProvider";
import { useDataContext } from "@/providers/DataProvider";
import { sync } from "@/services/syncService";
import { processPendingImageUploads } from "@/services/imageUploadQueue";

interface SyncContextValue {
  triggerSync: () => void;
  isSyncing: boolean;
}

const SyncContext = createContext<SyncContextValue>({
  triggerSync: () => {},
  isSyncing: false,
});

export function useSyncContext(): SyncContextValue {
  return use(SyncContext);
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const db = useDB();
  const { isSignedIn, userId, getToken } = useAuth();
  const { invalidate } = useDataContext();
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInProgress = useRef(false);

  const triggerSync = useCallback(async () => {
    if (!isSignedIn || syncInProgress.current) return;

    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      // Process pending image uploads before syncing
      if (userId) {
        const uploaded = await processPendingImageUploads(db, getToken, userId);
        if (uploaded > 0) {
          console.log(`[Sync] Uploaded ${uploaded} pending image(s)`);
          invalidate();
        }
      }

      const result = await sync(db, getToken);
      if (result.pulled > 0) {
        invalidate();
      }
      if (result.pushed > 0 || result.pulled > 0) {
        console.log(`[Sync] pushed=${result.pushed} pulled=${result.pulled}`);
      }
    } catch (error) {
      console.warn("[Sync] Failed:", error instanceof Error ? error.message : error);
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  }, [db, isSignedIn, userId, getToken, invalidate]);

  // Sync on mount (when signed in)
  useEffect(() => {
    if (isSignedIn) {
      triggerSync();
    }
  }, [isSignedIn]);

  // Sync when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && isSignedIn) {
        triggerSync();
      }
    });

    return () => subscription.remove();
  }, [isSignedIn, triggerSync]);

  return (
    <SyncContext value={{ triggerSync, isSyncing }}>
      {children}
    </SyncContext>
  );
}
