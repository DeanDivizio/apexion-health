"use client";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui_primitives/sheet";
import { Activity, Apple, ClipboardPlus, Dumbbell, MenuIcon, MessageSquareWarning, Pill, Scale, Settings, Syringe, TestTube, UserPen } from "lucide-react";
import Link from "next/link";
import { SignIn, useUser } from "@clerk/nextjs";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
export function SideNav() {
    const { user } = useUser();
    return (
        <Sheet >
            <SheetTrigger>
                <MenuIcon />
            </SheetTrigger>
            <SheetContent side="left" className="w-full bg-neutral-900/30 backdrop-blur-lg">
                <SheetHeader>
                    <SignedIn>
                        <SheetTitle className="text-base font-regular">{`Hi, ${user?.firstName}`}</SheetTitle>
                        <SheetDescription className="text-xs font-thin italic">{`Where would you like to go?`}</SheetDescription>
                    </SignedIn>
                    <SignedOut>
                        <SheetTitle className="text-base font-regular"><SignInButton /></SheetTitle>
                    </SignedOut>
                </SheetHeader>
                <nav className="flex flex-col gap-4 pt-6 h-full overflow-y-scroll">
                    <div id="side-nav-collections" className="flex flex-col text-sm font-light">
                        <h3 className="text-lg font-bold mb-0">Collections</h3>
                        <p className="text-xs font-thin italic mb-4">Your personal databases, orgnaized by day. Clear, accurate, editable.</p>
                        <SheetClose asChild><Link href="/gymsessions" className="flex items-center gap-2 mb-4 "><Dumbbell className="w-4 h-4" />Gym Sessions</Link></SheetClose>
                        <SheetClose asChild><Link href="/nutrientrecords" className="flex items-center gap-2 mb-4"><Apple className="w-4 h-4" />Nutrient Records</Link></SheetClose>
                        <SheetClose asChild><Link href="/meds" className="flex items-center gap-2 mb-4"><ClipboardPlus className="w-4 h-4" />Medication & Supplement Logs</Link></SheetClose>
                        <SheetClose asChild><Link href="/hrtrecords" className="flex items-center gap-2 mb-4"><Syringe className="w-4 h-4" />HRT Records</Link></SheetClose>
                        <SheetClose asChild><Link href="/bodymeasurements" className="flex items-center gap-2 mb-4"><Scale className="w-4 h-4" />Body Measurements</Link></SheetClose>
                        <SheetClose asChild><Link href="/biometrics" className="flex items-center gap-2 mb-4"><Activity className="w-4 h-4" />Biometrics</Link></SheetClose>
                    </div>
                    <div id="side-nav-graphs" className="flex flex-col text-sm font-light">
                        <h3 className="text-lg font-bold mb-0">Dashboards</h3>
                        <p className="text-xs font-thin italic mb-4">Your data - visualized. Actionable graphs to help you track your wellness.</p>
                        <SheetClose asChild><Link href="/gymgraphs" className="flex items-center gap-2 mb-4"><Dumbbell className="w-4 h-4" />Fitness</Link></SheetClose>
                        <SheetClose asChild><Link href="/nutrientgraphs" className="flex items-center gap-2 mb-4"><Apple className="w-4 h-4" />Nutrient Intake</Link></SheetClose>
                        <SheetClose asChild><Link href="/supplementgraphs" className="flex items-center gap-2 mb-4"><Pill className="w-4 h-4" />Supplement Use</Link></SheetClose>
                        <SheetClose asChild><Link href="/medicationgraphs" className="flex items-center gap-2 mb-4"><ClipboardPlus className="w-4 h-4" />Medications Taken</Link></SheetClose>
                        <SheetClose asChild><Link href="/hrtgraphs" className="flex items-center gap-2 mb-4"><Syringe className="w-4 h-4" />HRT Treatments</Link></SheetClose>
                        <SheetClose asChild><Link href="/bodygraphs" className="flex items-center gap-2 mb-4"><Scale className="w-4 h-4" />Body Measurements</Link></SheetClose>
                        <SheetClose asChild><Link href="/labs" className="flex items-center gap-2 mb-4"><TestTube className="w-4 h-4" />Lab Results</Link></SheetClose>
                    </div>
                    <div id="side-nav-admin" className="absolute left-0 bottom-8 flex flex-col text-sm font-light w-full">
                        {/* <h3 className="text-base font-regular mb-2">Admin</h3> */}
                        <div className="flex gap-6 justify-center w-full">
                            <SheetClose asChild><Link href="/settings" className="flex items-center gap-2 mb-2"><Settings className="w-4 h-4" />Settings</Link></SheetClose>
                            <p>|</p>
                            <SheetClose asChild><Link href="/support" className="flex items-center gap-2 mb-2"><MessageSquareWarning className="w-4 h-4" />Support</Link></SheetClose>
                            <p>|</p>
                            <SheetClose asChild><Link href="/feedback" className="flex items-center gap-2 mb-2"><UserPen className="w-4 h-4" />Feedback</Link></SheetClose>
                        </div>
                    </div>
                </nav>
            </SheetContent>
        </Sheet>
    )
}