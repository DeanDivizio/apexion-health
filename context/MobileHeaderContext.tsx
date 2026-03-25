"use client";

import {
  createContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

interface MobileHeaderContextValue {
  headerInnerLeft: ReactNode | null;
  setHeaderInnerLeft: Dispatch<SetStateAction<ReactNode | null>>;
  headerInnerRight: ReactNode | null;
  setHeaderInnerRight: Dispatch<SetStateAction<ReactNode | null>>;
}

export const MobileHeaderContext = createContext<MobileHeaderContextValue>({
  headerInnerLeft: null,
  setHeaderInnerLeft: () => {},
  headerInnerRight: null,
  setHeaderInnerRight: () => {},
});

export function MobileHeaderProvider({ children }: { children: ReactNode }) {
  const [headerInnerLeft, setHeaderInnerLeft] = useState<ReactNode | null>(null);
  const [headerInnerRight, setHeaderInnerRight] = useState<ReactNode | null>(null);

  return (
    <MobileHeaderContext.Provider
      value={{
        headerInnerLeft,
        setHeaderInnerLeft,
        headerInnerRight,
        setHeaderInnerRight,
      }}
    >
      {children}
    </MobileHeaderContext.Provider>
  );
}
