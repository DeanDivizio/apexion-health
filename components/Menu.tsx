"use client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import AddDataDrawer from "./AddDataDrawer"
import Link from "next/link"
import { Menu as MenuIcon } from "lucide-react";
import {useState} from 'react';
  
  
export default function Menu() {

    const [open, setOpen] = useState(false);

    function handleLinkClick() {
        setTimeout(() => {setOpen(false)}, 200)
    }



    return(
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="text-md md:text-lg text-neutral-300 font-extralight hover:font-normal tracking-wide md:px-4 py-1 rounded duration-200 transition-all hover:text-neutral-50 hover:border-green-400"><MenuIcon size={25}/></SheetTrigger>
            <SheetContent side={"left"} className="flex flex-col justify-between pt-32 pb-6">
               <SheetTitle className="hidden">Menu</SheetTitle>
                <div className="flex flex-col mb-8">
                    <h3 className="text-3xl font-bold mb-4">View</h3>
                    <hr className="mb-4"></hr>
                    <Link href={"/"} onClick={handleLinkClick} className="text-2xl font-semibold ml-2 mb-2 transition hover:text-blue-500">Home</Link>
                    <Link href="/labs" onClick={handleLinkClick} className="text-2xl font-semibold ml-2 mb-2 transition hover:text-blue-500">Clinical Records</Link>
                    <p className="text-2xl font-semibold ml-2 mb-2 transition hover:text-blue-500">Fitness</p>
                    <p className="text-2xl font-semibold ml-2 mb-2 transition hover:text-blue-500">Nutrition</p>
                    <p className="text-2xl font-semibold ml-2 mb-2 transition hover:text-blue-500">Body Measurements</p>
                </div>
                <div>
                    <AddDataDrawer />
                    <p className="text-2xl font-semibold mb-8 transition hover:text-blue-500">Link External Source</p>
                </div>
                <p className="text-xl tracking-wide font-thin ml-2 mb-8 transition hover:text-blue-500">Settings</p>

            </SheetContent>
        </Sheet>
    )
}