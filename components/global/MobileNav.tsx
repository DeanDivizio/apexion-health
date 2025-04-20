"use client";

import Link from "next/link";
import { House, Syringe, Plus, Dumbbell, Heart  } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui_primitives/dropdown-menu"
import { useState } from "react";



function LogButton({open, setOpen }:{open:any, setOpen:any}){
 
    function handleNavClick(state:boolean){
        setTimeout(()=>{setOpen(state)},60)
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild >
                <div className="h-14 w-14 mb-6 flex justify-center items-center bg-green-500 transition duration-300 rounded-full shadow-lg shadow-black data-[state=open]:bg-neutral-900 data-[state=open]:translate-y-3 data-[state=open]:rotate-45" ><Plus className="w-8 h-8 " color={open? "grey":"white"} /></div> 
            </DropdownMenuTrigger>
            <DropdownMenuContent className="px-8 py-4 rounded-xl bg-gradient-to-br from-green-950/10 to-black">
                <DropdownMenuLabel className="text-2xl font-light w-full text-center mb-4">Log a...</DropdownMenuLabel>
                <DropdownMenuItem className="p-px bg-gradient-to-r from-green-500 to-blue-600 flex flex-col items-center justify-center mb-8 rounded" onClick={()=>handleNavClick(false)}>
                    <Link className="bg-black w-full text-center px-12 sm:px-16 py-2 rounded text-xl font-thin text-neutral-300" href={"/logmeal"}>Meal</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-px bg-gradient-to-r from-green-500 to-blue-600 flex flex-col items-center justify-center mb-8 rounded" onClick={()=>handleNavClick(false)}>
                    <Link className="bg-black w-full text-center px-12 sm:px-16 py-2 rounded text-xl font-thin text-neutral-300" href={"/logmedication"}>Medication</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-px bg-gradient-to-r from-green-500 to-blue-600 flex flex-col items-center justify-center mb-8 rounded" onClick={()=>handleNavClick(false)}>
                    <Link className="bg-black w-full text-center px-12 sm:px-16 py-2 rounded text-xl font-thin text-neutral-300" href={"/logsupplement"}>Supplement</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-px bg-gradient-to-r from-green-500 to-blue-600 flex flex-col items-center justify-center mb-8 rounded" onClick={()=>handleNavClick(false)}>
                    <Link className="bg-black w-full text-center px-12 sm:px-16 py-2 rounded text-xl font-thin text-neutral-300" href={"/logworkout"}>Workout</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-px bg-gradient-to-r from-green-500 to-blue-600 flex flex-col items-center justify-center mb-8 rounded" onClick={()=>handleNavClick(false)}>
                    <Link className="bg-black w-full text-center px-12 sm:px-16 py-2 rounded text-xl font-thin text-neutral-300" href={"/loghrt"}>Hormone Treatment</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-px bg-gradient-to-r from-green-500 to-blue-600 flex flex-col items-center justify-center mb-8 rounded" onClick={()=>handleNavClick(false)}>
                    <Link className="bg-black w-full text-center px-12 sm:px-16 py-2 rounded text-xl font-thin text-neutral-300" href={"/logbody"}>Body Measurment</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function MobileNav() {

    const [open, setOpen] = useState(false);

    

    return(
        <nav className="w-full h-20 flex items-center justify-around pb-2 fixed z-10 bottom-0 md:hidden bg-slate-950/45 backdrop-blur-xl">
            <Link href="/" className="flex justify-center"><House /></Link>
            <Link href="/labs" className="flex justify-center"><Syringe /></Link>
            <LogButton open={open} setOpen={setOpen} />
            <Link href="/gymsessions" className="flex justify-center"><Dumbbell /></Link>
            <Link href="/" className="flex justify-center"><Heart /></Link>
            <div className={`${open ? "bg-black/20 backdrop-blur-lg":"bg-transparent backdrop-blur-none"} fixed z-10 w-[100vw] h-[100vh] -translate-y-full top-0 left-0 transition duration-1500 pointer-events-none`}></div>
        </nav>
    )
}