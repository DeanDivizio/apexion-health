"use client";

import { SignIn, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function MobileHeader() {

    return (
        <header className="fixed md:hidden z-10 w-full flex flex-row justify-between px-6 py-4 bg-gradient-to-br from-blue-900/20 to-neutral-950/20 backdrop-blur">
            <p className=" font-bold text-4xl tracking-wider text-transparent bg-gradient-to-br from-black via-blue-800 to-green-500 to-90% bg-clip-text">Apexion</p>
            <SignedIn>
                <UserButton />
            </SignedIn>
            <SignedOut>
                <SignIn />
            </SignedOut>
        </header>
    )
}