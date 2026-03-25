"use client";

import { useContext, useEffect } from "react";
import { MobileHeaderContext } from "@/context/MobileHeaderContext";
import BackButton from "@/components/global/BackButton";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setHeaderInnerLeft } = useContext(MobileHeaderContext);

  useEffect(() => {
    setHeaderInnerLeft(<BackButton />);
    return () => {
      setHeaderInnerLeft(null);
    };
  }, [setHeaderInnerLeft]);

  return (
    <main className="flex flex-col items-center w-full min-h-screen pt-24 md:pt-4 pb-24 px-4 bg-gradient-to-br from-blue-950/20 to-neutral-950">
      <div className="w-full max-w-lg">
        <h1 className="mb-4 text-2xl font-medium tracking-wide text-neutral-100 md:hidden">Settings</h1>
        {children}
      </div>
    </main>
  );
}
