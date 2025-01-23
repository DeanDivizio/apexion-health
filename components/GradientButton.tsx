"use client";
import Link from "next/link";

export default function GradientButton({text, link, onClick, trigger}:{text:string; link?:string; onClick?:Function, trigger?:boolean}) {
    return(
    <div className="rounded bg-gradient-to-r from-green-500 to-green-700 p-px flex items-center justify-center transition hover:scale-105 ease-in-out duration-300 mb-4">
        {link? <Link className="bg-black w-full text-center px-12 sm:px-16 py-2 rounded text-xl font-thin text-neutral-300" href={link}>
            {text}
        </Link> : null}
        {onClick ? <button className="bg-black px-12 sm:px-16 py-2 rounded-xl text-xl font-thin" onClick={()=> onClick}>
            {text}
        </button> : null}
        {trigger ? <div className="bg-black px-12 sm:px-16 py-2 rounded-xl text-xl font-thin">
            {text}
        </div> : null}
    </div>
    )
}