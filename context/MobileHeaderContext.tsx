"use client";

import {
  createContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

interface MobileHeaderContextValue {
  mobileHeading: string;
  setMobileHeading: Dispatch<SetStateAction<string>>;
  headerInnerLeft: ReactNode | null;
  setHeaderInnerLeft: Dispatch<SetStateAction<ReactNode | null>>;
  headerInnerRight: ReactNode | null;
  setHeaderInnerRight: Dispatch<SetStateAction<ReactNode | null>>;
}

export const MobileHeaderContext = createContext<MobileHeaderContextValue>({
  mobileHeading: "generic",
  setMobileHeading: () => {},
  headerInnerLeft: null,
  setHeaderInnerLeft: () => {},
  headerInnerRight: null,
  setHeaderInnerRight: () => {},
});

export function MobileHeaderProvider({ children }: { children: ReactNode }) {
  const [mobileHeading, setMobileHeading] = useState("generic");
  const [headerInnerLeft, setHeaderInnerLeft] = useState<ReactNode | null>(null);
  const [headerInnerRight, setHeaderInnerRight] = useState<ReactNode | null>(null);

  return (
    <MobileHeaderContext.Provider
      value={{
        mobileHeading,
        setMobileHeading,
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
