"use client";

import { useContext, useEffect } from "react";
import { MobileHeaderContext } from "@/context/MobileHeaderContext";
import BackButton from "@/components/global/BackButton";

export default function FriendsLayout({
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
        {children}
      </div>
    </main>
  );
}
