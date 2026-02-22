"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface SyncStatusState {
  isSyncing: boolean;
  setSyncing: (syncing: boolean) => void;
}

const SyncStatusContext = createContext<SyncStatusState>({
  isSyncing: false,
  setSyncing: () => {},
});

export function SyncStatusProvider({ children }: { children: ReactNode }) {
  const [isSyncing, setSyncing] = useState(false);

  return (
    <SyncStatusContext.Provider value={{ isSyncing, setSyncing }}>
      {children}
    </SyncStatusContext.Provider>
  );
}

export function useSyncStatus() {
  return useContext(SyncStatusContext);
}
