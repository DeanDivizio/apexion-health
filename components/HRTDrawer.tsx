"use client";
import { Drawer, DrawerTrigger, DrawerContent, DrawerTitle, DrawerHeader, } from "@/components/ui/drawer";
import HRTForm from "@/components/HRTForm";
import React, {use, useState} from "react";



export default function HRTDrawer() {

    const [open, setOpen] = useState(false)

    function handleSuccess() {
        setOpen(false);
    }

    return(
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger className="rounded bg-gradient-to-r from-green-500 to-green-700 font-thin hover:font-light p-px flex items-center justify-center transition-all ease-in-out duration-300"><span className="bg-black px-8 sm:px-12 py-2 rounded text-2xl">Log Hormone Treatment</span></DrawerTrigger>
            <DrawerContent className="flex flex-col items-center justify-center pb-12">
            <DrawerTitle className="pt-6">Add Hormone Treatment</DrawerTitle>
                <HRTForm onSuccess={handleSuccess}/>
            </DrawerContent>
        </Drawer>
    )
}