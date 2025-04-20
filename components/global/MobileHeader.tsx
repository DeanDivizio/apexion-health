"use client";

import { SignIn, SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import {SideNav} from "@/components/global/SideNav";

export default function MobileHeader() {

    return (
        <header className="fixed md:hidden z-10 w-full grid grid-cols-5  px-6 py-2 bg-gradient-to-br from-slate-950 via-neutral-950/60 to-black/60 backdrop-blur">
            <SideNav />
            <p className="col-span-3 font-bold text-4xl tracking-wider text-transparent text-center bg-gradient-to-br from-black via-blue-800 to-green-500 to-90% bg-clip-text">Apexion</p>
            <div className="col-span-1 flex flex-row items-center justify-end">
            <SignedIn>
                <UserButton />
            </SignedIn>
            <SignedOut>
                <SignInButton />
            </SignedOut>
            </div>
        </header>
    )
}