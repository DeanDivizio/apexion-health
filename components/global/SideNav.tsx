"use client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui_primitives/sheet";
import { Apple, ClipboardPlus, Dumbbell, MenuIcon, MessageSquareWarning, Pill, Scale, Settings, Syringe, TestTube, UserPen } from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
export function SideNav() {
    const { user } = useUser();
    return (
        <Sheet >
            <SheetTrigger>
                <MenuIcon />
            </SheetTrigger>
            <SheetContent side="left" className="w-full bg-black/30 backdrop-blur">
                <SheetHeader>
                    <SheetTitle className="text-base font-regular">{`Hi, ${user?.firstName}`}</SheetTitle>
                    <SheetDescription className="text-xs font-thin italic">{`Where would you like to go?`}</SheetDescription>
                </SheetHeader>
                <nav className="flex flex-col gap-4 pt-4">
                    <div id="side-nav-collections" className="flex flex-col text-sm font-light">
                        <h3 className="text-lg font-bold mb-0">Collections</h3>
                        <p className="text-xs font-thin italic mb-4">Your personal databases, orgnaized by day. Clear, accurate, editable.</p>
                        <Link href="/gymsessions" className="flex items-center gap-2 mb-4 "><Dumbbell className="w-4 h-4" />Gym Sessions</Link>
                        <Link href="/nutrientrecords" className="flex items-center gap-2 mb-4"><Apple className="w-4 h-4" />Nutrient Records</Link>
                        <Link href="/supplementrecords" className="flex items-center gap-2 mb-4"><Pill className="w-4 h-4" />Supplement Records</Link>
                        <Link href="/medicationrecords" className="flex items-center gap-2 mb-4"><ClipboardPlus className="w-4 h-4" />Medication Records</Link>
                        <Link href="/hrtrecords" className="flex items-center gap-2 mb-4"><Syringe className="w-4 h-4" />HRT Records</Link>
                        <Link href="/bodymeasurements" className="flex items-center gap-2 mb-4"><Scale className="w-4 h-4" />Body Measurements</Link>
                    </div>
                    <div id="side-nav-graphs" className="flex flex-col text-sm font-light">
                        <h3 className="text-lg font-bold mb-0">Dashboards</h3>
                        <p className="text-xs font-thin italic mb-4">Your data - visualized. Actionable graphs to help you track your wellness.</p>
                        <Link href="/gymgraphs" className="flex items-center gap-2 mb-4"><Dumbbell className="w-4 h-4" />Fitness</Link>
                        <Link href="/nutrientgraphs" className="flex items-center gap-2 mb-4"><Apple className="w-4 h-4" />Nutrient Intake</Link>
                        <Link href="/supplementgraphs" className="flex items-center gap-2 mb-4"><Pill className="w-4 h-4" />Supplement Use</Link>
                        <Link href="/medicationgraphs" className="flex items-center gap-2 mb-4"><ClipboardPlus className="w-4 h-4" />Medications Taken</Link>
                        <Link href="/hrtgraphs" className="flex items-center gap-2 mb-4"><Syringe className="w-4 h-4" />HRT Treatments</Link>
                        <Link href="/bodygraphs" className="flex items-center gap-2 mb-4"><Scale className="w-4 h-4" />Body Measurements</Link>
                        <Link href="/labs" className="flex items-center gap-2 mb-4"><TestTube className="w-4 h-4" />Lab Results</Link>
                    </div>
                    <div id="side-nav-admin" className="absolute bottom-6 flex flex-col text-sm font-light">
                        {/* <h3 className="text-base font-regular mb-2">Admin</h3> */}
                        <div className="flex gap-4">
                            <Link href="/settings" className="flex items-center gap-2 mb-2"><Settings className="w-4 h-4" />Settings</Link>
                            <p>|</p>
                            <Link href="/support" className="flex items-center gap-2 mb-2"><MessageSquareWarning className="w-4 h-4" />Support</Link>
                            <p>|</p>
                            <Link href="/feedback" className="flex items-center gap-2 mb-2"><UserPen className="w-4 h-4" />Feedback</Link>
                        </div>
                    </div>
                </nav>
            </SheetContent>
        </Sheet>
    )
}