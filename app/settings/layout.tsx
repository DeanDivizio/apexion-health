"use client";

import { useContext, useEffect } from "react";
import { MobileHeaderContext } from "@/context/MobileHeaderContext";
import BackButton from "@/components/global/BackButton";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setHeaderInnerLeft, setMobileHeading } =
    useContext(MobileHeaderContext);

  useEffect(() => {
    setHeaderInnerLeft(<BackButton />);
    setMobileHeading("Settings");
    return () => {
      setHeaderInnerLeft(null);
      setMobileHeading("generic");
    };
  }, [setHeaderInnerLeft, setMobileHeading]);

  return (
    <main className="flex flex-col items-center w-full min-h-screen pt-24 md:pt-4 pb-24 px-4 bg-gradient-to-br from-blue-950/20 to-neutral-950">
      {children}
    </main>
  );
}
