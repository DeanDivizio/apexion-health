"use client";
import { EarIcon, Handshake } from "lucide-react"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarHeader } from "@/components/ui/sidebar"
import Link from "next/link"
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import GradientButton from "./GradientButton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useSubNavContext } from "@/context/SubNavOpenContext";

function LogButton({ open, setOpen }: { open: any, setOpen: any }) {
    function handleNavClick(state: boolean) {
        setTimeout(() => { setOpen(state) }, 60)
    }
    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild >
                <div className="rounded bg-gradient-to-r from-green-500 to-blue-700 data-[state=open]:from-neutral-800 data-[state=open]:to-neutral-900 p-px flex items-center justify-center transition-all ease-in-out duration-300 mb-4 text-neutral-300 hover:text-neutral-50 data-[state=open]:text-neutral-600">
                    <div className="bg-black px-12 sm:px-16 py-2 rounded text-xl w-full text-center font-thin hover:cursor-default"> {open ? "close menu" : "Log..."}
                    </div>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" className="px-8 py-4 rounded-xl bg-gradient-to-br from-green-950/10 to-black -translate-y-8 shadow-xl">
                <DropdownMenuLabel className="text-2xl font-light w-full text-center mb-4">Log a...</DropdownMenuLabel>
                <DropdownMenuItem className="p-px bg-gradient-to-r from-green-500 to-blue-600 flex flex-col items-center justify-center mb-8 rounded" onClick={() => handleNavClick(false)}>
                    <Link className="bg-black w-full text-center px-12 sm:px-16 py-2 rounded text-xl font-thin text-neutral-300" href={"/loghrt"}>Hormone Treatment</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-px bg-gradient-to-r from-green-500 to-blue-600 flex flex-col items-center justify-center mb-8 rounded" onClick={() => handleNavClick(false)}>
                    <Link className="bg-black w-full text-center px-12 sm:px-16 py-2 rounded text-xl font-thin text-neutral-300" href={"/logmeal"}>Meal</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-px bg-gradient-to-r from-green-500 to-blue-600 flex flex-col items-center justify-center mb-8 rounded" onClick={() => handleNavClick(false)}>
                    <Link className="bg-black w-full text-center px-12 sm:px-16 py-2 rounded text-xl font-thin text-neutral-300" href={"/logworkout"}>Workout</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-px bg-gradient-to-r from-green-500 to-blue-600 flex flex-col items-center justify-center mb-8 rounded" onClick={() => handleNavClick(false)}>
                    <Link className="bg-black w-full text-center px-12 sm:px-16 py-2 rounded text-xl font-thin text-neutral-300" href={"/logbody"}>Body Measurment</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export function AppSidebar() {
    //@ts-ignore
    const { open, setOpen } = useSubNavContext();
    const { user } = useUser();

    return (
        <Sidebar>
            <SidebarHeader className="bg-neutral-950 pb-4 lg:pb-12">
                <p className="w-full pt-4 text-center font-bold text-4xl tracking-wider text-transparent bg-gradient-to-r from-blue-800 to-green-500 bg-clip-text">Apexion</p>
            </SidebarHeader>
            <SidebarContent className="bg-neutral-950 flex flex-col justify-between">
                <SidebarGroup className="">
                    <SidebarGroupLabel className="text-neutral-600 text-sm">Go To:</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <hr className="mb-4 border-neutral-600"></hr>
                            <Link href={"/"} className="text-lg lg:text-2xl text-neutral-300 font-medium lg:font-semibold ml-2 mb-4 transition hover:text-blue-500">Home</Link>
                            <Link href="/labs" className="text-lg lg:text-2xl text-neutral-300 font-medium lg:font-semibold ml-2 mb-2 transition hover:text-blue-500">Clinical Records</Link>
                            <Link href="" className="text-lg lg:text-2xl text-neutral-300 font-medium lg:font-semibold ml-2 mb-2 transition hover:text-blue-500">Fitness</Link>
                            <Link href="" className="text-lg lg:text-2xl text-neutral-300 font-medium lg:font-semibold ml-2 mb-2 transition hover:text-blue-500">Nutrition</Link>
                            <Link href="" className="text-lg lg:text-2xl text-neutral-300 font-medium lg:font-semibold ml-2 mb-2 transition hover:text-blue-500">Body Measurements</Link>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup className="xl:hidden">
                    <SidebarGroupContent>
                        <SidebarMenu className="h-full">
                            <LogButton open={open} setOpen={setOpen} />
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup className="hidden xl:inline">
                    <SidebarGroupContent>
                        <SidebarMenu className="h-full">
                            <GradientButton link={"/loghrt"} text="Log HRT" />
                            <GradientButton link={"/logworkout"} text="Log Workout" />
                            <GradientButton link={"/logmeal"} text="Log Meal" />
                            <GradientButton link={"/logbody"} text="Log Body Measurement" />
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupContent >
                        <SidebarMenu className="mb-2">
                            <Link href="" className="text-sm lg:text-lg text-neutral-300 font-semibold ml-2 mb-2 transition hover:text-blue-500 flex items-center gap-2"><Handshake className="h-5 w-5 lg:h-6 lg:w-6" />Support</Link>
                            <Link href="" className="text-sm lg:text-lg text-neutral-300 font-semibold ml-2 mb-2 transition hover:text-blue-500 flex items-center gap-2"><EarIcon className="h-5 w-5 lg:h-6 lg:w-6" />Feedback</Link>
                        </SidebarMenu>
                        <div className="flex gap-2 items-center pl-1 pb-1">
                            <SignedOut>
                                <SignInButton />
                            </SignedOut>
                            <SignedIn>
                                <UserButton />
                            </SignedIn>
                            <p className="text-left font-thin italic text-md">{`Welcome back, ${user?.firstName}`}</p>
                        </div>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
