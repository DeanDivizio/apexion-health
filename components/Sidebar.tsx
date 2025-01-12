"use client";
import { EarIcon, Handshake } from "lucide-react"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar"
import Link from "next/link"
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import HRTDrawer from "./HRTDrawer";
import GradientButton from "./GradientButton";


export function AppSidebar() {

    const { user } = useUser();

    return (
        <Sidebar>
            <SidebarHeader className="bg-neutral-950 pb-12">
                <p className="w-full pt-4 text-center font-bold text-4xl tracking-wider text-transparent bg-gradient-to-r from-blue-800 to-green-500 bg-clip-text">Apexion</p>
            </SidebarHeader>
            <SidebarContent className="bg-neutral-950 flex flex-col justify-start">
                <SidebarGroup className="mb-[50%]">
                    <SidebarGroupLabel className="text-neutral-600 text-sm">Go To:</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <hr className="mb-4 border-neutral-600"></hr>
                            <Link href={"/"} className="text-2xl text-neutral-300 font-semibold ml-2 mb-4 transition hover:text-blue-500">Home</Link>
                            <Link href="/labs" className="text-2xl text-neutral-300 font-semibold ml-2 mb-2 transition hover:text-blue-500">Clinical Records</Link>
                            <Link href="" className="text-2xl text-neutral-300 font-semibold ml-2 mb-2 transition hover:text-blue-500">Fitness</Link>
                            <Link href="" className="text-2xl text-neutral-300 font-semibold ml-2 mb-2 transition hover:text-blue-500">Nutrition</Link>
                            <Link href="" className="text-2xl text-neutral-300 font-semibold ml-2 mb-2 transition hover:text-blue-500">Body Measurements</Link>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup >
                    {/* <SidebarGroupLabel className="text-neutral-600 text-sm">Log</SidebarGroupLabel> */}
                    <SidebarGroupContent>
                        <SidebarMenu className="h-full">
                            {/* <hr className="mb-4 border-neutral-600"></hr> */}
                            <HRTDrawer />
                            <GradientButton link={"/logworkout"} text="Log Workout" />
                            <GradientButton link={"/logmeal"} text="Log Meal" />
                            <GradientButton link={"/"} text="Log Body Measurement" />
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 bg-neutral-950 flex-col items-center justify-start gap-2">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <Link href="" className="text-lg text-neutral-300 font-semibold ml-2 mb-2 transition hover:text-blue-500 flex items-center gap-2"><Handshake />Support</Link>
                            <Link href="" className="text-lg text-neutral-300 font-semibold ml-2 mb-2 transition hover:text-blue-500 flex items-center gap-2"><EarIcon />Feedback</Link>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupContent className="flex gap-2 items-center">
                        <SignedOut>
                            <SignInButton />
                        </SignedOut>
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                        <p className="text-left font-thin italic text-md">{`Welcome back, ${user?.firstName}`}</p>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarFooter>
        </Sidebar>
    )
}
