"use client";

import { useContext } from "react";
import { MobileHeaderContext } from "@/context/MobileHeaderContext";

export default function MobileHeader() {
    const { headerComponentRight, headerComponentLeft, mobileHeading } = useContext(MobileHeaderContext);

    return (
        <header className="fixed md:hidden z-10 w-full grid grid-cols-5  px-6 py-2 bg-gradient-to-br from-slate-950 via-neutral-950/60 to-black/60 backdrop-blur">
            <div className="col-span-1 w-full flex flex-row items-center justify-start">
                {headerComponentLeft}
            </div>
            {mobileHeading === "generic"?
            <p className="col-span-3 font-bold text-4xl tracking-wider text-transparent text-center bg-gradient-to-br from-black via-blue-800 to-green-500 to-90% bg-clip-text">Apexion</p>
            :
            <p className="col-span-3 mt-2 font-medium text-xl tracking-wider text-neutral-200 text-center">{mobileHeading}</p>
            }
            <div className="col-span-1 flex flex-row items-center justify-end">
                {headerComponentRight}
            </div>
            </header>
        )
}