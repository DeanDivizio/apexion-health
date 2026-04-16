"use client";

import { useContext, useEffect } from "react";
import { MobileHeaderContext } from "@/context/MobileHeaderContext";
import BackButton from "@/components/global/BackButton";
import { SettingsNav } from "@/components/settings/SettingsNav";

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
    <main className="flex flex-col items-center w-full min-h-screen md:min-h-0 md:h-full md:overflow-hidden pt-24 md:pt-6 pb-24 md:pb-0 px-4 bg-gradient-to-br from-blue-950/20 to-neutral-950">
      <h1 className="mb-4 text-2xl font-medium tracking-wide text-neutral-100 md:hidden w-full shrink-0">
        Settings
      </h1>
      <div className="flex w-full md:flex-1 md:min-h-0">
        <div className="hidden md:flex md:items-center md:justify-start md:pl-6 md:w-[calc(50vw-14rem)]">
          <SettingsNav />
        </div>
        <div className="w-full max-w-lg mx-auto md:max-w-none md:mx-0 md:flex md:w-[50vw] md:items-center md:overflow-y-auto">
          <div className="w-full md:px-6 md:pr-10">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
