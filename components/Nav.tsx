"use client"
import { SignInButton, UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Menu from "./Menu";
import { Suspense } from "react";

export default function Nav() {

    return (
        <div className="fixed md:hidden top-0 z-50 grid grid-cols-4 lg:grid-cols-3 w-full justify-between items-center px-8 py-4 lg:py-6 bg-black bg-opacity-25 backdrop-blur-xl">
            <div className="order-1">
               <Menu />
            </div>
            <div className="text-center order-2 lg:order-2 col-span-2 lg:col-span-1 lg:mt-0">
                <h2 className="text-4xl md:text4xl font-medium pb-2">Apexion</h2>
            </div>
            <div className="text-right order-3 lg:order-3">
                    <SignedOut>
                        <SignInButton />
                    </SignedOut>
                 
                
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                 
            </div>
        </div>
    )
}