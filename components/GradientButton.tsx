"use client";
import Link from "next/link";

export default function GradientButton({text, link, onClick, trigger, color}:{text:string; link?:string; onClick?:Function, trigger?:boolean, color:string}) {
    return(
    <div className={`rounded bg-gradient-to-r from-${color}-500 to-${color}-700 p-px flex items-center justify-center transition ease-in-out duration-300 mb-4`}>
        {link? <Link className="bg-black w-full text-center px-12 sm:px-2 py-2 rounded text-lg font-thin hover:font-light text-neutral-300 hover:text-neutral-100" href={link}>
            {text}
        </Link> : null}
        {onClick ? <button className="bg-black px-12 sm:px-2 py-2 rounded-xl text-lg font-thin hover:font-light" onClick={()=> onClick}>
            {text}
        </button> : null}
        {trigger ? <div className="bg-black px-12 sm:px-2 py-2 rounded-xl text-lg font-thin hover:font-light">
            {text}
        </div> : null}
    </div>
    )
}