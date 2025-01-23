"use client";
import { useSubNavContext } from "@/context/SubNavOpenContext";

export default function Defocuser() {
    // @ts-ignore
    const {open} = useSubNavContext()
    return(
        <div id="defocuser" className={`fixed xl:hidden ${open? "bg-gradient-to-r from-transparent to-black/85 backdrop-blur-sm" : ""} top-0 r-0 z-10 w-[67%] h-screen transition duration-300 pointer-events-none`}></div>
    )
}