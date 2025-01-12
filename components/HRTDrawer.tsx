"use client";
import { Drawer, DrawerTrigger, DrawerContent, DrawerTitle, DrawerHeader, } from "@/components/ui/drawer";
import HRTForm from "@/components/HRTForm";
import React, {useState} from "react";

export default function HRTDrawer({asChild, children}: {asChild?:boolean, children?:React.ReactNode}) {
    const [open, setOpen] = useState(false)
    function handleSuccess() {
        setOpen(false);
    }
    return(
        <Drawer open={open} onOpenChange={setOpen}>
            {asChild ? (
                <DrawerTrigger>{children}</DrawerTrigger>
                ) : (
                <DrawerTrigger className="rounded bg-gradient-to-r from-blue-500 to-green-700 font-thin hover:font-light p-px flex items-center justify-center transition-all ease-in-out duration-300 mb-4">
                    <span className="bg-black w-full px-8 sm:px-10 py-2 rounded text-xl text-neutral-300">Log HRT</span>
                    </DrawerTrigger>
                )
            }
            <DrawerContent className="flex flex-col items-center justify-center pb-12">
            <DrawerTitle className="pt-6">Add Hormone Treatment</DrawerTitle>
                <HRTForm onSuccess={handleSuccess}/>
            </DrawerContent>
        </Drawer>
    )
}