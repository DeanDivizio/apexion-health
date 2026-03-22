"use client";

import { useContext } from "react";
import { MobileHeaderContext } from "@/context/MobileHeaderContext";
import { useSyncStatus } from "@/context/SyncStatusContext";
import { SideNav } from "@/components/global/SideNav";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from "next/image";

export default function MobileHeader() {
    const { headerComponentRight, headerComponentLeft, mobileHeading } = useContext(MobileHeaderContext);
    const { isSyncing } = useSyncStatus();

    return (
        <header className="fixed z-10 flex w-full items-center justify-between gap-3 px-4 pt-2 md:hidden">
            <div className="liquid-glass backdrop-blur-md flex items-center justify-center rounded-full p-2.5">
                    {headerComponentLeft ?? <SideNav />}
            </div>

            <div className="liquid-glass backdrop-blur-md flex min-h-[44px] w-fit flex-col items-center justify-center rounded-[22px] px-4 py-2">
                <span className="relative z-[1] flex flex-col items-center">
                    {mobileHeading === "generic" ? (
                        <div className="flex gap-4 items-center">
                            <Image src="/logo.webp" width={24} height={24} alt="logo"/>
                        <p className="text-neutral-400 text-md font-mono font-thin uppercase tracking-wider mt-0.5">
                            Preview
                        </p>
                        </div>
                    ) : (
                        <p className="text-center text-base font-medium tracking-wide text-white/90">
                            {mobileHeading}
                        </p>
                    )}
                    {isSyncing && (
                        <div className="flex items-center gap-1.5">
                            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                            <span className="text-[10px] text-blue-400">Syncing External Data</span>
                        </div>
                    )}
                </span>
            </div>

            <div className="liquid-glass backdrop-blur-md flex items-center justify-center rounded-full p-1">
                    {headerComponentRight ?? (
                        <>
                            <SignedIn>
                                <UserButton />
                            </SignedIn>
                            <SignedOut>
                                <SignInButton />
                            </SignedOut>
                        </>
                    )}
            </div>
        </header>
    );
}
