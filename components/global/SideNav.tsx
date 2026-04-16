"use client";

import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui_primitives/sheet";
import {
    Activity,
    Apple,
    ClipboardPlus,
    Clock3,
    Dumbbell,
    MenuIcon,
    MessageSquareWarning,
    Pill,
    Scale,
    Settings,
    TestTube,
    UserPen,
    Users,
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

const collections = [
    { href: "/gymsessions", icon: Dumbbell, label: "Gym Sessions" },
    { href: "/meals", icon: Apple, label: "Meals Logged" },
    { href: "/meds", icon: ClipboardPlus, label: "Medication & Supplements" },
    { href: "/activities", icon: Clock3, label: "Habits & Activities" },
    { href: "/bodymeasurements", icon: Scale, label: "Body Measurements", placeholder: true },
    { href: "/biometrics", icon: Activity, label: "Biometrics", placeholder: true },
];

const dashboards = [
    { href: "/gymgraphs", icon: Dumbbell, label: "Fitness" },
    { href: "/nutrientgraphs", icon: Apple, label: "Nutrient Intake" },
    { href: "/supplementgraphs", icon: Pill, label: "Medications & Supplements" },
    { href: "/bodygraphs", icon: Scale, label: "Body Measurements", placeholder: true },
    { href: "/labs", icon: TestTube, label: "Lab Results" },
];

const social = [
    { href: "/friends", icon: Users, label: "Friends" },
];

const admin = [
    { href: "/settings", icon: Settings, label: "Settings" },
    // { href: "/support", icon: MessageSquareWarning, label: "Support" },
    // { href: "/feedback", icon: UserPen, label: "Feedback" },
];

function NavItem({ href, icon: Icon, label, placeholder }: {
    href: string;
    icon: React.ElementType;
    label: string;
    placeholder?: boolean;
}) {
    return (
        <SheetClose asChild>
            <Link
                href={placeholder ? "" : href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors active:bg-white/[0.08]"
            >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
                    <Icon className="h-4 w-4 text-green-400" />
                </span>
                <span className={`text-sm font-light ${placeholder ? "text-white/30" : "text-white/80"}`}>
                    {placeholder ? label + " - Coming Soon" : label}
                </span>
            </Link>
        </SheetClose>
    );
}

export function SideNav() {
    const { user } = useUser();

    return (
        <Sheet>
            <SheetTrigger>
                <MenuIcon className="h-5 w-5 text-white/80" />
            </SheetTrigger>
            <SheetContent
                side="left"
                className="w-full border-none bg-black/40 p-6 backdrop-blur-[60px] backdrop-saturate-[180%]"
            >
                <SheetHeader>
                    <SignedIn>
                        <SheetTitle className="text-left text-base font-normal text-white/90">
                            {`Hi, ${user?.firstName}`}
                        </SheetTitle>
                        <SheetDescription className="text-left text-xs font-light italic text-white/40">
                            Where would you like to go?
                        </SheetDescription>
                    </SignedIn>
                    <SignedOut>
                        <SheetTitle className="text-base font-normal">
                            <SignInButton />
                        </SheetTitle>
                    </SignedOut>
                </SheetHeader>

                <nav className="flex h-full flex-col gap-6 overflow-y-auto pt-6">
                    <div>
                        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-white/40">
                            Collections
                        </p>
                        {collections.map((item) => (
                            <NavItem key={item.href} {...item} />
                        ))}
                    </div>

                    <div>
                        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-white/40">
                            Social
                        </p>
                        {social.map((item) => (
                            <NavItem key={item.href} {...item} />
                        ))}
                    </div>

                    <div>
                        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-white/40">
                            Dashboards
                        </p>
                        {dashboards.filter((item) => !item.placeholder).map((item) => (
                            <NavItem key={item.href} {...item} />
                        ))}
                        <p className="text-xs px-3 italic font-light text-white/40">Coming Soon</p>
                        {dashboards.filter((item) => item.placeholder).map((item) => (
                            <NavItem key={item.href} {...item} />
                        ))}
                    </div>

                    <div className="absolute bottom-8 left-0 w-full px-6">
                        <div className="flex items-center justify-center gap-2 rounded-[22px] bg-white/[0.04] px-4 py-3">
                            {admin.map(({ href, icon: Icon, label }, i) => (
                                <SheetClose asChild key={href}>
                                    <Link
                                        href={href}
                                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-light text-white/50 transition-colors active:bg-white/[0.08]"
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {label}
                                    </Link>
                                </SheetClose>
                            ))}
                        </div>
                    </div>
                </nav>
            </SheetContent>
        </Sheet>
    );
}
