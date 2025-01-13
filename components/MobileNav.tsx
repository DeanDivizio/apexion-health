"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { House, Syringe, Plus, Dumbbell, Heart  } from "lucide-react";
import HRTDrawer from "./HRTDrawer";

export default function MobileNav() {

    return(
        <nav className="w-full h-20 flex items-center justify-around pb-2 fixed bottom-0 md:hidden bg-slate-950/45 backdrop-blur-xl">
            <Link href="/" className="flex justify-center"><House /></Link>
            <Link href="/labs" className="flex justify-center"><Syringe /></Link>
            <HRTDrawer asChild ><div className="h-14 w-14 mb-6 flex justify-center items-center bg-green-500 rounded-full"><Plus className="w-8 h-8" /></div></HRTDrawer>
            <Link href="/logworkout" className="flex justify-center"><Dumbbell /></Link>
            <Link href="/" className="flex justify-center"><Heart /></Link>
        </nav>
    )
}