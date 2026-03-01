"use client";

import Link from "next/link";
import { House, Plus, Dumbbell, Pill, Apple  } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui_primitives/dropdown-menu"
import { useState } from "react";
import LogHydrationDialog from "@/components/hydration/LogHydrationDialog";



function LogButton({open, setOpen, onHydrationClick }:{open:any, setOpen:any, onHydrationClick: () => void}){
 
    function handleNavClick(state:boolean){
        setTimeout(()=>{setOpen(state)},60)
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-black transition duration-300 data-[state=open]:translate-y-3 data-[state=open]:rotate-45 data-[state=open]:bg-neutral-900">
                    <Plus className="h-8 w-8" color={open ? "rgb(163 163 163)" : "white"} />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[calc(100vw-2rem)] max-w-[400px] rounded-xl border border-white/10 bg-gradient-to-b from-blue-950/20 to-blue-950/5 px-8 py-8 shadow-lg backdrop-blur-xl data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
                <DropdownMenuLabel className="text-2xl font-light w-full text-center mb-4">Log...</DropdownMenuLabel>
                <DropdownMenuItem className="mb-8 flex flex-col items-center justify-center rounded bg-gradient-to-r from-green-500 to-blue-600 p-px" onClick={()=>handleNavClick(false)}>
                    <Link className="w-full rounded bg-black px-12 py-2 text-center text-xl font-thin text-neutral-300 sm:px-16" href={"/logmeal"}>Meal</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="mb-8 flex flex-col items-center justify-center rounded bg-gradient-to-r from-green-500 to-blue-600 p-px" onClick={()=>handleNavClick(false)}>
                    <Link className="w-full rounded bg-black px-12 py-2 text-center text-xl font-thin text-neutral-300 sm:px-16" href={"/logmedication"}>Meds/Supplements</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="mb-8 flex flex-col items-center justify-center rounded bg-gradient-to-r from-green-500 to-blue-600 p-px" onClick={()=>handleNavClick(false)}>
                    <Link className="w-full rounded bg-black px-12 py-2 text-center text-xl font-thin text-neutral-300 sm:px-16" href={"/logworkout"}>Workout</Link>
                </DropdownMenuItem>
                <p className="text-sm font-thin italic mb-2">Quick Log</p>
                <hr className="border-white/10 mb-4" />
                <DropdownMenuItem className="mb-0 flex flex-col items-center justify-center rounded bg-gradient-to-r from-green-500 to-blue-600 p-px" onClick={() => { handleNavClick(false); onHydrationClick(); }}>
                    <span className="w-full rounded bg-black px-12 py-2 text-center text-xl font-thin text-neutral-300 sm:px-16">Water</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function MobileNav() {

    const [open, setOpen] = useState(false);
    const [hydrationOpen, setHydrationOpen] = useState(false);

    return(
        <>
        <nav className="fixed bottom-0 z-10 flex h-20 w-full items-center justify-around border-t border-white/10 bg-gradient-to-b from-blue-950/20 to-blue-950/5 pb-2 backdrop-blur-xl md:hidden">
            <Link href="/" className="flex justify-center"><House /></Link>
            <Link href="/meals" className="flex justify-center"><Apple /></Link>
            <LogButton open={open} setOpen={setOpen} onHydrationClick={() => setHydrationOpen(true)} />
            <Link href="/gymsessions" className="flex justify-center"><Dumbbell /></Link>
            <Link href="/meds" className="flex justify-center"><Pill /></Link>
            <div className={`${open ? "bg-black/80 backdrop-blur-sm":"bg-transparent backdrop-blur-none"} pointer-events-none fixed left-0 top-0 z-10 h-[100vh] w-[100vw] -translate-y-full transition duration-500`}></div>
        </nav>
        <LogHydrationDialog open={hydrationOpen} onOpenChange={setHydrationOpen} />
        </>
    )
}