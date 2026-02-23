"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface SyncStatusState {
  isSyncing: boolean;
  startSync: (fullBackfill?: boolean, purge?: boolean) => void;
}

const SyncStatusContext = createContext<SyncStatusState>({
  isSyncing: false,
  startSync: () => {},
});

export function SyncStatusProvider({ children }: { children: ReactNode }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const runningRef = useRef(false);

  const startSync = useCallback((fullBackfill = false, purge = false) => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsSyncing(true);

    (async () => {
      let isFullBackfill = fullBackfill;
      let isPurge = purge;
      let complete = false;

      while (!complete) {
        try {
          const res = await fetch("/api/sync/whoop", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fullBackfill: isFullBackfill,
              purge: isPurge,
            }),
          });
          const json = await res.json();
          complete = json.complete === true;
          isFullBackfill = false;
          isPurge = false;
        } catch (err) {
          console.error("Sync batch error:", err);
          break;
        }
      }

      runningRef.current = false;
      setIsSyncing(false);
    })();
  }, []);

  return (
    <SyncStatusContext.Provider value={{ isSyncing, startSync }}>
      {children}
    </SyncStatusContext.Provider>
  );
}

export function useSyncStatus() {
  return useContext(SyncStatusContext);
}
