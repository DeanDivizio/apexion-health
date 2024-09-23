"use client";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "@/components/ui/sheet"
import AddDataDrawer from "./AddDataDrawer"
import Link from "next/link"
  
  
export default function Menu() {
    return(
        <Sheet>
            <SheetTrigger className="text-lg text-neutral-300 font-extralight hover:font-normal tracking-wide px-4 py-1 border border-neutral-500 rounded duration-200 transition-all hover:text-neutral-50 hover:border-green-400">Menu</SheetTrigger>
            <SheetContent side={"left"} className=" flex flex-col justify-between pt-32 pb-6">
                <div className="flex flex-col mb-8">
                    <h3 className="text-3xl font-bold mb-4">View</h3>
                    <hr className="mb-4"></hr>
                    <Link href={"/"} className="text-2xl font-semibold ml-2 mb-2 transition hover:text-blue-500">Home</Link>
                    <Link href="/labs" className="text-2xl font-semibold ml-2 mb-2 transition hover:text-blue-500">Clinical Records</Link>
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