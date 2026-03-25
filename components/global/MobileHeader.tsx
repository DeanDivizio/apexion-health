"use client";

import { useContext } from "react";
import { MobileHeaderContext } from "@/context/MobileHeaderContext";
import { useSyncStatus } from "@/context/SyncStatusContext";
import { SideNav } from "@/components/global/SideNav";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from "next/image";

export default function MobileHeader() {
  const { headerInnerLeft, headerInnerRight } =
    useContext(MobileHeaderContext);
  const { isSyncing } = useSyncStatus();

  return (
    <header className="fixed z-10 flex w-full items-center justify-between gap-3 px-4 pt-2 md:hidden">
      <div className="flex items-center gap-2">
        <div className="liquid-glass flex items-center justify-center rounded-full p-2.5 backdrop-blur-md">
          <SideNav />
        </div>
        {headerInnerLeft && (
          <div className="liquid-glass flex items-center justify-center rounded-full p-1 backdrop-blur-md">
            {headerInnerLeft}
          </div>
        )}
      </div>

      <div className="liquid-glass flex min-h-[44px] w-fit flex-col items-center justify-center rounded-[22px] px-4 py-2 backdrop-blur-md">
        <span className="relative z-[1] flex flex-col items-center">
          <div className="flex items-center gap-4">
            <Image src="/logo.webp" width={24} height={24} alt="logo" />
            <p className="text-md mt-0.5 font-mono font-thin uppercase tracking-wider text-neutral-400">
              Preview
            </p>
          </div>
          {isSyncing && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
              <span className="text-[10px] text-blue-400">
                Syncing External Data
              </span>
            </div>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {headerInnerRight && (
          <div className="liquid-glass flex items-center justify-center rounded-full p-1 backdrop-blur-md">
            {headerInnerRight}
          </div>
        )}
        <div className="liquid-glass flex items-center justify-center rounded-full p-1 backdrop-blur-md">
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton />
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
